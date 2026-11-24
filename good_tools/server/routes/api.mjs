import express from 'express';
import dns from 'node:dns/promises';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import Parser from 'rss-parser';
import * as cheerio from 'cheerio';
import { assertSafePublicUrl } from '../utils/ssrf.mjs';
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
      reader.cancel();
      throw new Error(`응답 크기가 제한(${Math.round(maxBytes / 1024 / 1024)}MB)을 초과했습니다.`);
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString('utf8');
}

export function createApiRouter({ dataDir, allowNetworkTools = true, allowLanTools = true, defaultTheme = 'system', appVersion = '1.1.0' }) {
  const router = express.Router();
  const feedsFile = path.join(dataDir, 'feeds.json');
  const clipboardFile = path.join(dataDir, 'clipboard.json');
  const prefsFile = path.join(dataDir, 'prefs.json');
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

  async function readJsonFile(filePath, fallback) {
    try {
      const raw = await fs.readFile(filePath, 'utf8');
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  async function writeJsonFile(filePath, data) {
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  }

  async function loadFeeds() {
    const parsed = await readJsonFile(feedsFile, null);
    return Array.isArray(parsed) ? parsed : DEFAULT_FEEDS;
  }

  async function saveFeeds(feeds) {
    await writeJsonFile(feedsFile, feeds);
  }

  // Health & runtime config
  router.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      version: appVersion,
      allowNetworkTools,
      allowLanTools,
      defaultTheme,
      timestamp: new Date().toISOString(),
    });
  });

  // 1. URL Unshortener (longUrl)
  router.post('/unshorten', requireNetworkEnabled, async (req, res) => {
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
        const safeUrl = await assertSafePublicUrl(currentUrl);
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

        let response;
        try {
          response = await fetch(safeUrl.toString(), {
            method: 'GET',
            redirect: 'manual',
            signal: controller.signal,
            headers: { 'User-Agent': USER_AGENT },
          });
        } finally {
          clearTimeout(timer);
        }

        const location = response.headers.get('location');
        // Cancel body immediately so we don't download full pages
        try { await response.body?.cancel(); } catch {}

        chain.push({
          hop: hop + 1,
          url: safeUrl.toString(),
          status: response.status,
          statusText: response.statusText,
        });

        if (response.status >= 300 && response.status < 400 && location) {
          currentUrl = new URL(location, safeUrl).toString();
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
  });

  // 2. Public IP & Client Info (ipconfig)
  router.get('/ipinfo', requireNetworkEnabled, async (req, res) => {
    const clientIp =
      req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
      req.headers['x-real-ip']?.toString() ||
      req.socket?.remoteAddress ||
      'unknown';

    let publicInfo = null;
    const providers = [
      async () => {
        const r = await fetch('https://ipwho.is/', { signal: AbortSignal.timeout(6000) });
        if (!r.ok) throw new Error('ipwho.is failed');
        const d = await r.json();
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
        const r = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(5000) });
        if (!r.ok) throw new Error('ipify failed');
        const d = await r.json();
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
  });

  // 3. DNS Lookup (ipconfig)
  router.post('/dns', requireNetworkEnabled, async (req, res) => {
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
  });

  // 4. Remote HTML Source Viewer (htmlViewer)
  router.post('/fetch-html', requireNetworkEnabled, async (req, res) => {
    const { url } = req.body || {};
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: '가져올 URL을 입력해 주세요.' });
    }

    try {
      let target = url.trim();
      if (!/^https?:\/\//i.test(target)) target = `https://${target}`;
      const safeUrl = await assertSafePublicUrl(target);

      const response = await fetch(safeUrl.toString(), {
        method: 'GET',
        redirect: 'follow',
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml,text/plain,*/*' },
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
        url: response.url || safeUrl.toString(),
        status: response.status,
        headers,
        meta,
        size: Buffer.byteLength(html, 'utf8'),
        html,
      });
    } catch (err) {
      return res.status(400).json({ error: err.message || 'HTML을 가져오는 중 오류가 발생했습니다.' });
    }
  });

  // 5. RSS/Atom Feed Reader (scrapper)
  router.post('/rss', requireNetworkEnabled, async (req, res) => {
    const { url } = req.body || {};
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'RSS/Atom 피드 URL을 입력해 주세요.' });
    }

    try {
      let target = url.trim();
      if (!/^https?:\/\//i.test(target)) target = `https://${target}`;
      const safeUrl = await assertSafePublicUrl(target);

      const response = await fetch(safeUrl.toString(), {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*' },
      });
      if (!response.ok) {
        throw new Error(`피드 서버 응답 오류 (HTTP ${response.status})`);
      }

      const xml = await readTextLimited(response, MAX_RESPONSE_BYTES);
      const feed = await rssParser.parseString(xml);

      return res.json({
        title: feed.title || safeUrl.hostname,
        description: feed.description || '',
        link: feed.link || safeUrl.toString(),
        items: (feed.items || []).slice(0, 50).map((item) => ({
          title: item.title || '(제목 없음)',
          link: item.link || '',
          pubDate: item.isoDate || item.pubDate || '',
          author: item.creator || item.author || '',
          snippet: (item.contentSnippet || item.summary || '').slice(0, 400),
          categories: Array.isArray(item.categories) ? item.categories.slice(0, 5) : [],
        })),
      });
    } catch (err) {
      return res.status(400).json({ error: err.message || 'RSS 피드 파싱 중 오류가 발생했습니다.' });
    }
  });

  // Saved RSS Feeds CRUD
  router.get('/feeds', async (_req, res) => {
    const feeds = await loadFeeds();
    res.json({ feeds });
  });

  router.post('/feeds', async (req, res) => {
    const { name, url } = req.body || {};
    if (!name || !url || typeof name !== 'string' || typeof url !== 'string') {
      return res.status(400).json({ error: '피드 이름과 URL을 모두 입력해 주세요.' });
    }
    try {
      const parsed = new URL(url.trim());
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error('http:// 또는 https:// URL만 저장할 수 있습니다.');
      }
      const feeds = await loadFeeds();
      const newFeed = {
        id: crypto.randomUUID().slice(0, 8),
        name: name.trim().slice(0, 80),
        url: parsed.toString(),
      };
      feeds.push(newFeed);
      await saveFeeds(feeds);
      return res.status(201).json({ feed: newFeed, feeds });
    } catch (err) {
      return res.status(400).json({ error: err.message || '피드 저장 실패' });
    }
  });

  router.delete('/feeds/:id', async (req, res) => {
    const { id } = req.params;
    const feeds = await loadFeeds();
    const filtered = feeds.filter((f) => f.id !== id);
    await saveFeeds(filtered);
    res.json({ feeds: filtered });
  });

  // 6. User Preferences Sync (/data/prefs.json)
  const VALID_THEMES = new Set(['system', 'light', 'dark', 'ha-blue', 'ocean', 'forest', 'sunset', 'lavender', 'rose-dark']);

  router.get('/prefs', async (_req, res) => {
    const prefs = await readJsonFile(prefsFile, { favorites: [], hiddenTools: [], lang: 'ko', theme: defaultTheme });
    res.json({
      favorites: Array.isArray(prefs.favorites) ? prefs.favorites : [],
      hiddenTools: Array.isArray(prefs.hiddenTools) ? prefs.hiddenTools : [],
      lang: prefs.lang === 'en' ? 'en' : 'ko',
      theme: VALID_THEMES.has(prefs.theme) ? prefs.theme : defaultTheme,
    });
  });

  router.put('/prefs', async (req, res) => {
    const current = await readJsonFile(prefsFile, { favorites: [], hiddenTools: [], lang: 'ko', theme: defaultTheme });
    const { favorites, hiddenTools, lang, theme } = req.body || {};
    const next = {
      favorites: Array.isArray(favorites) ? favorites.filter((x) => typeof x === 'string').slice(0, 100) : current.favorites || [],
      hiddenTools: Array.isArray(hiddenTools) ? hiddenTools.filter((x) => typeof x === 'string').slice(0, 100) : current.hiddenTools || [],
      lang: lang === 'en' || lang === 'ko' ? lang : current.lang || 'ko',
      theme: VALID_THEMES.has(theme) ? theme : (VALID_THEMES.has(current.theme) ? current.theme : defaultTheme),
    };
    await writeJsonFile(prefsFile, next);
    res.json(next);
  });

  // 7. Shared Family Clipboard (/data/clipboard.json)
  router.get('/clipboard', async (_req, res) => {
    const items = await readJsonFile(clipboardFile, []);
    res.json({ items: Array.isArray(items) ? items : [] });
  });

  router.post('/clipboard', async (req, res) => {
    const { title = '', content = '', tag = '' } = req.body || {};
    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: '저장할 내용을 입력해 주세요.' });
    }
    if (content.length > 20000) {
      return res.status(400).json({ error: '한 항목당 최대 20,000자까지 저장할 수 있습니다.' });
    }
    const items = await readJsonFile(clipboardFile, []);
    const list = Array.isArray(items) ? items : [];
    const newItem = {
      id: crypto.randomUUID().slice(0, 8),
      title: String(title || '').trim().slice(0, 100),
      content: content.trim(),
      tag: String(tag || '').trim().slice(0, 30),
      pinned: false,
      createdAt: new Date().toISOString(),
    };
    const next = [newItem, ...list].slice(0, 50);
    await writeJsonFile(clipboardFile, next);
    res.status(201).json({ item: newItem, items: next });
  });

  router.patch('/clipboard/:id', async (req, res) => {
    const { id } = req.params;
    const { pinned } = req.body || {};
    const items = await readJsonFile(clipboardFile, []);
    const list = (Array.isArray(items) ? items : []).map((it) =>
      it.id === id ? { ...it, pinned: typeof pinned === 'boolean' ? pinned : !it.pinned } : it
    );
    list.sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)));
    await writeJsonFile(clipboardFile, list);
    res.json({ items: list });
  });

  router.delete('/clipboard/:id', async (req, res) => {
    const { id } = req.params;
    const items = await readJsonFile(clipboardFile, []);
    const next = (Array.isArray(items) ? items : []).filter((it) => it.id !== id);
    await writeJsonFile(clipboardFile, next);
    res.json({ items: next });
  });

  // 8. Wake-on-LAN (LAN tools)
  router.post('/wol', requireLanEnabled, async (req, res) => {
    const { mac, broadcastIp = '255.255.255.255', port = 9 } = req.body || {};
    try {
      const result = await sendWakeOnLan(mac, broadcastIp, port);
      res.json({ ok: true, ...result });
    } catch (err) {
      res.status(400).json({ error: err.message || 'WoL 패킷 전송 실패' });
    }
  });

  // 9. LAN / Host TCP Port Check (LAN tools)
  router.post('/port-check', requireLanEnabled, async (req, res) => {
    const { host, port, timeoutMs = 2500 } = req.body || {};
    try {
      const safeTimeout = Math.min(5000, Math.max(500, Number(timeoutMs) || 2500));
      const result = await checkTcpPort(host, port, safeTimeout);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message || '포트 점검 오류' });
    }
  });

  // 10. SSL Certificate & Security Headers Inspector
  router.post('/ssl-check', requireNetworkEnabled, async (req, res) => {
    const { host, port = 443 } = req.body || {};
    try {
      const result = await inspectSsl(host, port);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message || 'SSL 진단 중 오류가 발생했습니다.' });
    }
  });

  return router;
}
