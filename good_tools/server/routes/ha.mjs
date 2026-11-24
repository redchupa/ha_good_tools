import express from 'express';

const searchTemplate = "{% set ns = namespace(ids=[]) %}{% for s in states if ns.ids|length < 25 %}{% if needle in s.entity_id or needle in s.name|lower %}{% set ns.ids = ns.ids + [s.entity_id] %}{% endif %}{% endfor %}{{ ns.ids|to_json }}";

export function haRouter({
  users = (process.env.HA_USER_IDS || '').trim().split(/\s+/).filter(Boolean),
  token = process.env.SUPERVISOR_TOKEN,
  templates = process.env.ALLOW_TEMPLATE_EVAL === 'true',
  notify = process.env.HA_NOTIFY_SERVICE || '',
  request = fetch,
} = {}) {
  const router = express.Router();
  const canNotify = /^notify\.mobile_app_[a-z0-9_]+$/.test(notify);
  router.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (req.socket.remoteAddress !== '172.30.32.2' || !token || !users.includes(req.get('X-Remote-User-Id'))) {
      return res.status(403).json({ error: 'HA 연동 접근 권한이 없습니다. / HA access is disabled.' });
    }
    next();
  });
  router.get('/capabilities', (_req, res) => res.json({ templates, notify: canNotify }));
  let active = 0;
  let starts = [];
  function operation(handler) {
    return async (req, res) => {
      starts = starts.filter(t => Date.now() - t < 60000);
      if (active >= 2 || starts.length >= 24) return res.status(429).json({ error: '잠시 후 다시 시도하세요. / Try again shortly.' });
      starts.push(Date.now()); active++;
      try { await handler(req, res); }
      catch { res.status(502).json({ error: 'HA 응답을 확인해 주세요. / Check HA connectivity and input.' }); }
      finally { active--; }
    };
  }
  async function core(path, body) {
    const r = await request('http://supervisor/core/api/' + path, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(5000),
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!r.ok) { await r.body?.cancel(); throw Error(); }
    let bytes = 0;
    const chunks = [];
    for await (const chunk of r.body) {
      bytes += chunk.length;
      if (bytes > 65536) throw Error();
      chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString('utf8');
  }
  router.get('/entities', operation(async (req, res) => {
    const q = String(req.query.q || '').trim().toLowerCase();
    if (q.length < 2 || q.length > 80) return res.status(400).json({ error: '2–80 characters' });
    const ids = JSON.parse(await core('template', { template: searchTemplate, variables: { needle: q } }));
    res.json({ ids: ids.filter(id => typeof id === 'string').slice(0,25) });
  }));
  router.post('/template', operation(async (req, res) => {
    if (!templates) return res.sendStatus(403);
    const text = req.body?.template;
    if (typeof text !== 'string' || !text.trim() || text.length > 2048) return res.sendStatus(400);
    res.json({ result: await core('template', { template: text }) });
  }));
  router.post('/notify', operation(async (req, res) => {
    if (!canNotify) return res.sendStatus(403);
    const message = req.body?.message;
    if (typeof message !== 'string' || !message.trim() || message.length > 2000) return res.sendStatus(400);
    await core('services/notify/' + notify.slice(7), { message, title: 'Good Tools' });
    res.sendStatus(204);
  }));
  return router;
}
