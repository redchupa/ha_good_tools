import express from 'express';
import dns from 'node:dns/promises';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import Parser from 'rss-parser';
import * as cheerio from 'cheerio';
import { resolvePublicTarget, requestPublic } from '../utils/ssrf.mjs';
import { sendWakeOnLan, checkTcpPort, inspectSsl } from '../utils/lan.mjs';

const MAX_RESPONSE_BYTES = 2 * 1024 * 1024; // 2MB
const FETCH_TIMEOUT_MS = 10000;
const USER_AGENT = 'HA-Good-Tools/1.0 (+https://github.com/redchupa/ha_good_tools)';

const DEFAULT_FEEDS = [
  { id: 'ha-blog', name: 'Home Assistant Blog', url: 'https://www.home-assistant.io/atom.xml' },
  { id: 'geeknews', name: 'GeekNews (한국어)', url: 'https://news.hada.io/rss/news' },
  { id: 'hn-front', name: 'Hacker News', url: 'https://hnrss.org/frontpage' },
];

async function readTextLimited(response, maxBytes = MAX_RESPONSE_BYTES) {
  const reader = response.body?.getReader();
  if (!reader) return await response.text();
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new Error(`응답 크기가 제한(${Math.round(maxBytes / 1024 / 1024)}MB)을 초과했습니다.`);
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function safeFetchPublic(rawUrl, headers = {}, maxHops = 5) {
  let current = rawUrl.trim();
  if (!/^https?:\/\//i.test(current)) current = `https://${current}`;

  for (let hop = 0; hop <= maxHops; hop++) {
    const target = await resolvePublicTarget(current);
    const response = await requestPublic(target, {
      method: 'GET',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { 'User-Agent': USER_AGENT, ...headers },
    });

    if (response.status >= 300 && response.status < 400) {
      const loc = response.headers.get('location');
      if (!loc) return { response, finalUrl: target.url.toString() };
      await response.body?.cancel();
      if (hop === maxHops) throw new Error('리다이렉트 횟수 제한을 초과했습니다.');
      current = new URL(loc, target.url).toString();
      continue;
    }

    return { response, finalUrl: target.url.toString() };
  }
  throw new Error('요청을 처리할 수 없습니다.');
}

function publicLink(value, base) {
  if (!value) return '';
  try {
    const url = new URL(value, base);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

const asyncRoute = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export function createApiRouter({ dataDir, allowNetworkTools = true, allowLanTools = false, defaultTheme = 'system', appVersion = '1.5.1' }) {
  const router = express.Router();
  const feedsFile = path.join(dataDir, 'feeds.json');
  const clipboardFile = path.join(dataDir, 'clipboard.json');
  const prefsFile = path.join(dataDir, 'prefs.json');
  const writeQueues = new Map();
  const rssParser = new Parser({
    timeout: FETCH_TIMEOUT_MS,
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml' },
  });

  function requireNetworkEnabled(req, res, next) {
    if (!allowNetworkTools) {
      return res.status(403).json({
        error: '네트워크 프록시 도구가 HA 애드온 설정(allow_network_tools)에서 비활성화되어 있습니다.',
      });
    }
    next();
  }

  function requireLanEnabled(req, res, next) {
    if (!allowLanTools) {
      return res.status(403).json({
        error: 'LAN 도구(WoL/포트 점검)가 HA 애드온 설정(allow_lan_tools)에서 비활성화되어 있습니다.',
      });
    }
    next();
  }

  // Per-instance budgets also apply to disconnected callers until their work finishes.
  const lanBudget = { active: 0, max: 4, starts: [], perMinute: 30 };
  const publicBudget = { active: 0, max: 8, starts: [], perMinute: 90 };
  function boundedRoute(budget, fn) {
    return asyncRoute(async (req, res) => {
      const now = Date.now();
      budget.starts = budget.starts.filter(start => now - start < 60000);
      if (budget.active >= budget.max || budget.starts.length >= budget.perMinute) {
        return res.status(429).json({ error: '요청이 많습니다. 잠시 후 다시 시도해 주세요.' });
      }
      budget.active++;
      budget.starts.push(now);
      try {
        await fn(req, res);
      } finally {
        budget.active--;
      }
    });
  }

  // Files whose unreadable content was moved aside since start-up (reported by /health).
  const recovered = new Set();
  const isList = Array.isArray;
  const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const SHAPES = new Map([[feedsFile, isList], [clipboardFile, isList], [prefsFile, isRecord]]);

  // Keep the unreadable original next to the data file, then continue with the fallback.
  async function quarantine(filePath, reason) {
    const target = `${filePath}.corrupt-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    try {
      await fs.rename(filePath, target);
      recovered.add(path.basename(filePath, '.json'));
      console.error(`[Good Tools] ${path.basename(filePath)} could not be used (${reason}); kept as ${path.basename(target)}`);
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }
  }

  async function readJsonFile(filePath, fallback) {
    let raw;
    try {
      raw = await fs.readFile(filePath, 'utf8');
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
      return structuredClone(fallback);
    }
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      await quarantine(filePath, 'invalid JSON');
      return structuredClone(fallback);
    }
    const valid = SHAPES.get(filePath);
    if (valid && !valid(data)) {
      await quarantine(filePath, 'unexpected shape');
      return structuredClone(fallback);
    }
    return data;
  }

  function mutateFile(filePath, fallback, update) {
    const prev = writeQueues.get(filePath) || Promise.resolve();
    const next = prev.catch(() => {}).then(async () => {
      const current = await readJsonFile(filePath, fallback);
      const data = update(current);
      await fs.mkdir(dataDir, { recursive: true });
      const tmp = filePath + '.' + crypto.randomUUID() + '.tmp';
      try {
        await fs.writeFile(tmp, JSON.stringify(data, null, 2), { mode: 0o600 });
        await fs.rename(tmp, filePath);
      } finally {
        await fs.rm(tmp, { force: true });
      }
      return data;
    });
    writeQueues.set(filePath, next);
    return next;
  }

  // Reads share the per-file queue so a recovery never races a write that just replaced the file.
  function readQueued(filePath, fallback) {
    const prev = writeQueues.get(filePath) || Promise.resolve();
    const next = prev.catch(() => {}).then(() => readJsonFile(filePath, fallback));
    writeQueues.set(filePath, next);
    return next;
  }

  function loadFeeds() {
    return readQueued(feedsFile, DEFAULT_FEEDS);
  }

  // Health & runtime config
  router.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      version: appVersion,
      allowNetworkTools,
      allowLanTools,
      defaultTheme,
      recovered: [...recovered],
      timestamp: new Date().toISOString(),
    });
  });

  // 1. URL Unshortener (longUrl)
  router.post('/unshorten', requireNetworkEnabled, boundedRoute(publicBudget, async (req, res) => {
    const { url } = req.body || {};
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: '변환할 URL을 입력해 주세요.' });
    }

    try {
      const chain = [];
      let currentUrl = url.trim();
      if (!/^https?:\/\//i.test(currentUrl)) {
        currentUrl = `https://${currentUrl}`;
      }

      const maxHops = 10;
      for (let hop = 0; hop < maxHops; hop++) {
        const target = await resolvePublicTarget(currentUrl);
        const response = await requestPublic(target, {
          method: 'GET',
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
          headers: { 'User-Agent': USER_AGENT },
        });
        const location = response.headers.get('location');
        // Cancel body immediately so we don't download full pages
        try { await response.body?.cancel(); } catch {}

        chain.push({
          hop: hop + 1,
          url: target.url.toString(),
          status: response.status,
          statusText: response.statusText,
        });

        if (response.status >= 300 && response.status < 400 && location) {
          if (hop + 1 === maxHops) throw new Error('리다이렉트 횟수 제한을 초과했습니다.');
          currentUrl = new URL(location, target.url).toString();
        } else {
          break;
        }
      }

      return res.json({
        originalUrl: url.trim(),
        finalUrl: chain[chain.length - 1]?.url || currentUrl,
        hops: chain.length,
        chain,
      });
    } catch (err) {
      return res.status(400).json({ error: err.message || 'URL 추적 중 오류가 발생했습니다.' });
    }
  }));

  // 2. Public IP & Client Info (ipconfig)
  router.get('/ipinfo', requireNetworkEnabled, boundedRoute(publicBudget, async (req, res) => {
    const clientIp =
      req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
      req.headers['x-real-ip']?.toString() ||
      req.socket?.remoteAddress ||
      'unknown';

    let publicInfo = null;
    const providers = [
      async () => {
        const { response: r } = await safeFetchPublic('https://ipwho.is/', {}, 0);
        if (!r.ok) { await r.body?.cancel(); throw new Error('ipwho.is failed'); }
        const d = JSON.parse(await readTextLimited(r, 65536));
        if (d.success === false) throw new Error(d.message || 'ipwho.is error');
        return {
          ip: d.ip,
          type: d.type,
          country: d.country,
          countryCode: d.country_code,
          region: d.region,
          city: d.city,
          isp: d.connection?.isp || d.connection?.org || '',
          asn: d.connection?.asn ? `AS${d.connection.asn}` : '',
          timezone: d.timezone?.id || '',
          latitude: d.latitude,
          longitude: d.longitude,
        };
      },
      async () => {
        const { response: r } = await safeFetchPublic('https://api.ipify.org?format=json', {}, 0);
        if (!r.ok) { await r.body?.cancel(); throw new Error('ipify failed'); }
        const d = JSON.parse(await readTextLimited(r, 65536));
        return { ip: d.ip, country: '', city: '', isp: '', timezone: '' };
      },
    ];

    for (const provider of providers) {
      try {
        publicInfo = await provider();
        break;
      } catch {
        // try next
      }
    }

    return res.json({
      clientIp,
      userAgent: req.headers['user-agent'] || '',
      publicInfo,
      fetchedAt: new Date().toISOString(),
    });
  }));

  router.get('/exchange-rates', requireNetworkEnabled, boundedRoute(publicBudget, async (_req, res) => {
    try {
      const { response } = await safeFetchPublic('https://api.frankfurter.dev/v1/latest?base=KRW');
      if (!response.ok) { await response.body?.cancel(); throw Error(); }
      const { base, date, rates } = JSON.parse(await readTextLimited(response, 16384));
      if (base !== 'KRW' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !rates?.USD) throw Error();
      res.json({ date, rates, source: 'Frankfurter / ECB' });
    } catch { res.status(502).json({ error: '환율 조회 실패 / Could not refresh rates.' }); }
  }));

  // 3. DNS Lookup (ipconfig)
  router.post('/dns', requireNetworkEnabled, boundedRoute(publicBudget, async (req, res) => {
    const { domain } = req.body || {};
    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({ error: '조회할 도메인을 입력해 주세요.' });
    }
    const cleanDomain = domain.trim().replace(/^https?:\/\//i, '').split('/')[0].toLowerCase();
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(cleanDomain)) {
      return res.status(400).json({ error: '올바른 도메인 형식이 아닙니다.' });
    }

    const safeResolve = async (fn) => {
      try {
        return await fn();
      } catch {
        return [];
      }
    };

    const [a, aaaa, mx, txt, cname, ns] = await Promise.all([
      safeResolve(() => dns.resolve4(cleanDomain)),
      safeResolve(() => dns.resolve6(cleanDomain)),
      safeResolve(() => dns.resolveMx(cleanDomain)),
      safeResolve(() => dns.resolveTxt(cleanDomain).then((r) => r.map((chunks) => chunks.join('')))),
      safeResolve(() => dns.resolveCname(cleanDomain)),
      safeResolve(() => dns.resolveNs(cleanDomain)),
    ]);

    return res.json({
      domain: cleanDomain,
      records: { A: a, AAAA: aaaa, MX: mx, TXT: txt, CNAME: cname, NS: ns },
    });
  }));

  // 4. Remote HTML Source Viewer (htmlViewer)
  router.post('/fetch-html', requireNetworkEnabled, boundedRoute(publicBudget, async (req, res) => {
    const { url } = req.body || {};
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: '가져올 URL을 입력해 주세요.' });
    }

    try {
      const { response, finalUrl } = await safeFetchPublic(url, {
        Accept: 'text/html,application/xhtml+xml,text/plain,*/*',
      });

      const html = await readTextLimited(response, MAX_RESPONSE_BYTES);
      const $ = cheerio.load(html);
      const meta = {
        title: $('title').first().text().trim(),
        description: $('meta[name="description"]').attr('content') || '',
        ogTitle: $('meta[property="og:title"]').attr('content') || '',
        ogDescription: $('meta[property="og:description"]').attr('content') || '',
        ogImage: $('meta[property="og:image"]').attr('content') || '',
        canonical: $('link[rel="canonical"]').attr('href') || '',
      };

      const headers = {};
      for (const key of ['content-type', 'server', 'cache-control', 'content-length', 'x-powered-by']) {
        const v = response.headers.get(key);
        if (v) headers[key] = v;
      }

      return res.json({
        url: finalUrl,
        status: response.status,
        headers,
        meta,
        size: Buffer.byteLength(html, 'utf8'),
        html,
      });
    } catch (err) {
      return res.status(400).json({ error: err.message || 'HTML을 가져오는 중 오류가 발생했습니다.' });
    }
  }));

  // 5. RSS/Atom Feed Reader (scrapper)
  router.post('/rss', requireNetworkEnabled, boundedRoute(publicBudget, async (req, res) => {
    const { url } = req.body || {};
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'RSS/Atom 피드 URL을 입력해 주세요.' });
    }

    try {
      const { response, finalUrl } = await safeFetchPublic(url, {
        Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
      });
      if (!response.ok) {
        await response.body?.cancel();
        throw new Error(`피드 서버 응답 오류 (HTTP ${response.status})`);
      }

      const xml = await readTextLimited(response, MAX_RESPONSE_BYTES);
      const feed = await rssParser.parseString(xml);
      const parsedFinal = new URL(finalUrl);

      return res.json({
        title: feed.title || parsedFinal.hostname,
        description: feed.description || '',
        link: feed.link || finalUrl,
        items: (feed.items || []).slice(0, 50).map((item) => ({
          title: item.title || '(제목 없음)',
          link: publicLink(item.link, finalUrl),
          pubDate: item.isoDate || item.pubDate || '',
          author: item.creator || item.author || '',
          snippet: (item.contentSnippet || item.summary || '').slice(0, 400),
          categories: Array.isArray(item.categories) ? item.categories.slice(0, 5) : [],
        })),
      });
    } catch (err) {
      return res.status(400).json({ error: err.message || 'RSS 피드 파싱 중 오류가 발생했습니다.' });
    }
  }));

  // Saved RSS Feeds CRUD
  router.get('/feeds', asyncRoute(async (_req, res) => {
    const feeds = await loadFeeds();
    res.json({ feeds });
  }));

  router.post('/feeds', asyncRoute(async (req, res) => {
    const { name, url } = req.body || {};
    if (!name || !url || typeof name !== 'string' || typeof url !== 'string') {
      return res.status(400).json({ error: '피드 이름과 URL을 모두 입력해 주세요.' });
    }
    try {
      const parsed = new URL(url.trim());
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error('http:// 또는 https:// URL만 저장할 수 있습니다.');
      }
      const newFeed = {
        id: crypto.randomUUID().slice(0, 8),
        name: name.trim().slice(0, 80),
        url: parsed.toString(),
      };
      if (newFeed.url.length > 4096 || !newFeed.name) throw new Error('이름과 URL 길이를 확인해 주세요.');
      const feeds = await mutateFile(feedsFile, DEFAULT_FEEDS, list => {
        if (list.length >= 200) throw new Error('피드는 최대 200개까지 저장할 수 있습니다.');
        return [...list, newFeed];
      });
      return res.status(201).json({ feed: newFeed, feeds });
    } catch (err) {
      return res.status(400).json({ error: err.message || '피드 저장 실패' });
    }
  }));

  router.delete('/feeds/:id', asyncRoute(async (req, res) => {
    const { id } = req.params;
    const filtered = await mutateFile(feedsFile, DEFAULT_FEEDS, list => list.filter(f => f.id !== id));
    res.json({ feeds: filtered });
  }));

  // 6. User Preferences Sync (/data/prefs.json)
  const VALID_THEMES = new Set([
    'system', 'light', 'dark', 'ha-blue', 'sunset', 'lavender',
    'peach-cute', 'mint-cream', 'sakura',
    'ocean', 'forest', 'rose-dark', 'aurora', 'cyberpunk', 'mecha-bot',
  ]);

  const toolIds = value => Array.isArray(value)
    ? [...new Set(value.filter(x => typeof x === 'string' && x.length <= 64))].slice(0, 100)
    : [];
  function normalizePrefs(prefs = {}) {
    return {
      favorites: toolIds(prefs.favorites),
      hiddenTools: toolIds(prefs.hiddenTools),
      lang: prefs.lang === 'en' ? 'en' : 'ko',
      theme: VALID_THEMES.has(prefs.theme) ? prefs.theme : defaultTheme,
      rev: Number.isInteger(prefs.rev) && prefs.rev >= 0 ? prefs.rev : 0,
    };
  }
  // Apply {add, remove} so changes from different devices merge instead of replacing each other.
  function applyListChange(list, change, prepend) {
    if (!change || typeof change !== 'object') return list;
    const add = toolIds(change.add);
    const remove = new Set(toolIds(change.remove));
    const kept = list.filter(id => !remove.has(id) && !add.includes(id));
    return toolIds(prepend ? [...add, ...kept] : [...kept, ...add]);
  }

  router.get('/prefs', asyncRoute(async (_req, res) => {
    res.json(normalizePrefs(await readQueued(prefsFile, {})));
  }));

  // Whole-list replacement, kept for pages loaded from earlier versions.
  router.put('/prefs', asyncRoute(async (req, res) => {
    const { favorites, hiddenTools, lang, theme } = req.body || {};
    const next = await mutateFile(prefsFile, {}, stored => {
      const current = normalizePrefs(stored);
      return {
        favorites: Array.isArray(favorites) ? toolIds(favorites) : current.favorites,
        hiddenTools: Array.isArray(hiddenTools) ? toolIds(hiddenTools) : current.hiddenTools,
        lang: lang === 'en' || lang === 'ko' ? lang : current.lang,
        theme: VALID_THEMES.has(theme) ? theme : current.theme,
        rev: current.rev + 1,
      };
    });
    res.json(next);
  }));

  router.patch('/prefs', asyncRoute(async (req, res) => {
    const { favorites, hiddenTools, lang, theme } = req.body || {};
    const next = await mutateFile(prefsFile, {}, stored => {
      const current = normalizePrefs(stored);
      return {
        favorites: applyListChange(current.favorites, favorites, true),
        hiddenTools: applyListChange(current.hiddenTools, hiddenTools, false),
        lang: lang === 'en' || lang === 'ko' ? lang : current.lang,
        theme: VALID_THEMES.has(theme) ? theme : current.theme,
        rev: current.rev + 1,
      };
    });
    res.json(next);
  }));

  // 7. Shared Family Clipboard (/data/clipboard.json)
  const MAX_PINNED = 20;
  const MAX_UNPINNED = 50;
  const clipError = (status, error, extra = {}) => Object.assign(new Error(error), { status, extra });
  // Pinned notes stay first and are never evicted. MAX_PINNED only limits new pins, so lists
  // from earlier versions that already hold more pinned notes keep all of them.
  function normalizeClips(list) {
    const items = list
      .filter(it => it && typeof it === 'object' && typeof it.id === 'string' && typeof it.content === 'string')
      .map(it => ({ ...it, pinned: Boolean(it.pinned), rev: Number.isInteger(it.rev) ? it.rev : 0 }));
    return [
      ...items.filter(it => it.pinned),
      ...items.filter(it => !it.pinned).slice(0, MAX_UNPINNED),
    ];
  }
  function clipText(body, current = {}) {
    const pick = (key, max) => (typeof body[key] === 'string' ? body[key].trim().slice(0, max) : current[key] ?? '');
    const content = typeof body.content === 'string' ? body.content.trim() : current.content;
    if (!content) throw clipError(400, '저장할 내용을 입력해 주세요.');
    if (content.length > 20000) throw clipError(400, '한 항목당 최대 20,000자까지 저장할 수 있습니다.');
    return { title: pick('title', 100), content, tag: pick('tag', 30) };
  }
  function sendClipError(res, err) {
    if (!err.status) throw err;
    return res.status(err.status).json({ error: err.message, ...err.extra });
  }

  router.get('/clipboard', asyncRoute(async (_req, res) => {
    res.json({ items: normalizeClips(await readQueued(clipboardFile, [])) });
  }));

  router.post('/clipboard', asyncRoute(async (req, res) => {
    const body = req.body || {};
    if (typeof body.content !== 'string') return res.status(400).json({ error: '저장할 내용을 입력해 주세요.' });
    try {
      const now = new Date().toISOString();
      const newItem = { id: crypto.randomUUID().slice(0, 8), ...clipText(body), pinned: false, rev: 0, createdAt: now, updatedAt: now };
      const next = await mutateFile(clipboardFile, [], list => normalizeClips([newItem, ...normalizeClips(list)]));
      res.status(201).json({ item: newItem, items: next });
    } catch (err) { return sendClipError(res, err); }
  }));

  // Pin toggles always apply; text edits require the revision the editor started from.
  router.patch('/clipboard/:id', asyncRoute(async (req, res) => {
    const { id } = req.params;
    const body = req.body || {};
    const editing = ['title', 'content', 'tag'].some(key => key in body);
    try {
      let updated;
      const list = await mutateFile(clipboardFile, [], stored => {
        const items = normalizeClips(stored);
        const index = items.findIndex(it => it.id === id);
        if (index < 0) throw clipError(404, '다른 기기에서 삭제된 메모입니다. / This note was deleted on another device.', { items });
        const current = items[index];
        if (editing && body.rev !== current.rev) {
          throw clipError(409, '다른 기기에서 먼저 수정했습니다. / Changed on another device.', { item: current, items });
        }
        const pinned = typeof body.pinned === 'boolean' ? body.pinned : (editing ? current.pinned : !current.pinned);
        if (pinned && !current.pinned && items.filter(it => it.pinned).length >= MAX_PINNED) {
          throw clipError(400, `고정 메모는 최대 ${MAX_PINNED}개입니다. / Up to ${MAX_PINNED} pinned notes.`, { items });
        }
        updated = { ...current, ...(editing ? clipText(body, current) : {}), pinned, rev: current.rev + 1, updatedAt: new Date().toISOString() };
        items[index] = updated;
        return normalizeClips(items);
      });
      res.json({ item: updated, items: list });
    } catch (err) { return sendClipError(res, err); }
  }));

  router.delete('/clipboard/:id', asyncRoute(async (req, res) => {
    const { id } = req.params;
    const next = await mutateFile(clipboardFile, [], items => normalizeClips(items).filter(it => it.id !== id));
    res.json({ items: next });
  }));

  // 8. Wake-on-LAN (LAN tools)
  router.post('/wol', requireLanEnabled, boundedRoute(lanBudget, async (req, res) => {
    const { mac, broadcastIp = '255.255.255.255', port = 9 } = req.body || {};
    try {
      const result = await sendWakeOnLan(mac, broadcastIp, port);
      res.json({ ok: true, ...result });
    } catch (err) {
      res.status(400).json({ error: err.message || 'WoL 패킷 전송 실패' });
    }
  }));

  // 9. LAN / Host TCP Port Check (LAN tools)
  router.post('/port-check', requireLanEnabled, boundedRoute(lanBudget, async (req, res) => {
    const { host, port, timeoutMs = 2500 } = req.body || {};
    try {
      const safeTimeout = Math.min(5000, Math.max(500, Number(timeoutMs) || 2500));
      const result = await checkTcpPort(host, port, safeTimeout);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message || '포트 점검 오류' });
    }
  }));

  // 10. SSL Certificate & Security Headers Inspector
  router.post('/ssl-check', requireNetworkEnabled, boundedRoute(publicBudget, async (req, res) => {
    const { host, port = 443 } = req.body || {};
    try {
      const result = await inspectSsl(host, port);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message || 'SSL 진단 중 오류가 발생했습니다.' });
    }
  }));

  return router;
}
