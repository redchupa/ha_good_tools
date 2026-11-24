import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { isPrivateIp, assertSafePublicUrl, requestPublic } from '../utils/ssrf.mjs';
import { buildMagicPacket } from '../utils/lan.mjs';
import { createApp } from '../index.mjs';

describe('SSRF protection', () => {
  it('detects private and loopback IPs', () => {
    assert.equal(isPrivateIp('127.0.0.1'), true);
    assert.equal(isPrivateIp('10.0.0.1'), true);
    assert.equal(isPrivateIp('192.168.1.129'), true);
    assert.equal(isPrivateIp('172.16.5.4'), true);
    assert.equal(isPrivateIp('169.254.169.254'), true);
    assert.equal(isPrivateIp('100.82.209.32'), true);
    assert.equal(isPrivateIp('::1'), true);
    assert.equal(isPrivateIp('::ffff:192.168.1.1'), true);
    assert.equal(isPrivateIp('8.8.8.8'), false);
    assert.equal(isPrivateIp('1.1.1.1'), false);
  });

  it('connects to a selected address and preserves the HTTP authority', async () => {
    const fixture = http.createServer((req, res) => res.end(req.headers.host));
    await new Promise(resolve => fixture.listen(0, '127.0.0.1', resolve));
    try {
      const url = new URL('http://fixture.invalid:' + fixture.address().port);
      const response = await requestPublic({ url, address: '127.0.0.1' }, { method: 'GET' });
      assert.equal(await response.text(), url.host);
    } finally {
      await new Promise(resolve => fixture.close(resolve));
    }
  });

  it('rejects localhost, private IPs, and non-http protocols', async () => {
    await assert.rejects(() => assertSafePublicUrl('http://127.0.0.1:8123'));
    await assert.rejects(() => assertSafePublicUrl('http://192.168.1.129'));
    await assert.rejects(() => assertSafePublicUrl('http://localhost:8099'));
    await assert.rejects(() => assertSafePublicUrl('http://homeassistant.local:8123'));
    await assert.rejects(() => assertSafePublicUrl('file:///etc/passwd'));
    await assert.rejects(() => assertSafePublicUrl('not-a-url'));
  });
});

describe('API routes', () => {
  let server;
  let baseUrl;
  let tempDir;

  before(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'good-tools-test-'));
    const app = createApp({ dataDir: tempDir, allowNetworkTools: true, appVersion: '1.0.0-test' });
    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('GET /api/health returns ok and config', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'ok');
    assert.equal(data.version, '1.0.0-test');
    assert.equal(data.allowNetworkTools, true);
  });

  it('POST /api/unshorten blocks private IPs', async () => {
    const res = await fetch(`${baseUrl}/api/unshorten`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'http://192.168.1.129' }),
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.error, /사설|차단/);
  });

  it('GET/POST/DELETE /api/feeds persists feeds', async () => {
    const list1 = await (await fetch(`${baseUrl}/api/feeds`)).json();
    assert.ok(Array.isArray(list1.feeds));
    const initialCount = list1.feeds.length;

    const createRes = await fetch(`${baseUrl}/api/feeds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Feed', url: 'https://example.com/rss.xml' }),
    });
    assert.equal(createRes.status, 201);
    const created = await createRes.json();
    assert.equal(created.feeds.length, initialCount + 1);

    const delRes = await fetch(`${baseUrl}/api/feeds/${created.feed.id}`, { method: 'DELETE' });
    assert.equal(delRes.status, 200);
    const afterDel = await delRes.json();
    assert.equal(afterDel.feeds.length, initialCount);
  });

  it('GET/PUT /api/prefs persists favorites, hiddenTools, and lang', async () => {
    const res1 = await (await fetch(`${baseUrl}/api/prefs`)).json();
    assert.deepEqual(res1.favorites, []);
    assert.equal(res1.lang, 'ko');

    const putRes = await fetch(`${baseUrl}/api/prefs`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ favorites: ['char-counter'], hiddenTools: ['magic-eye'], lang: 'en' }),
    });
    assert.equal(putRes.status, 200);
    const saved = await putRes.json();
    assert.deepEqual(saved.favorites, ['char-counter']);
    assert.deepEqual(saved.hiddenTools, ['magic-eye']);
    assert.equal(saved.lang, 'en');
  });

  it('GET/POST/PATCH/DELETE /api/clipboard persists shared notes', async () => {
    const postRes = await fetch(`${baseUrl}/api/clipboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'WiFi', content: 'Hello Clipboard', tag: 'home' }),
    });
    assert.equal(postRes.status, 201);
    const { item } = await postRes.json();
    assert.equal(item.content, 'Hello Clipboard');

    const patchRes = await fetch(`${baseUrl}/api/clipboard/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinned: true }),
    });
    const patched = await patchRes.json();
    assert.equal(patched.items[0].pinned, true);

    const delRes = await fetch(`${baseUrl}/api/clipboard/${item.id}`, { method: 'DELETE' });
    const after = await delRes.json();
    assert.equal(after.items.length, 0);
  });

  it('keeps concurrent notes and independent preferences', async () => {
    const send = (route, method, body) => fetch(baseUrl + route, {
      method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    const results = await Promise.all(Array.from({ length: 8 }, (_, i) =>
      send('/api/clipboard', 'POST', { content: 'note ' + i })));
    assert.ok(results.every(r => r.status === 201));
    const { items } = await (await fetch(baseUrl + '/api/clipboard')).json();
    assert.equal(new Set(items.map(i => i.content)).size, 8);
    await Promise.all([
      send('/api/prefs', 'PUT', { lang: 'ko' }),
      send('/api/prefs', 'PUT', { theme: 'dark' }),
    ]);
    const prefs = await (await fetch(baseUrl + '/api/prefs')).json();
    assert.equal(prefs.lang, 'ko');
    assert.equal(prefs.theme, 'dark');
  });

  it('preserves unreadable data and continues serving after a write failure', async () => {
    const file = path.join(tempDir, 'clipboard.json');
    await fs.writeFile(file, 'corrupt');
    const response = await fetch(baseUrl + '/api/clipboard', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: 'note' }),
    });
    assert.equal(response.status, 500);
    assert.equal(await fs.readFile(file, 'utf8'), 'corrupt');
    assert.equal((await fetch(baseUrl + '/api/health')).status, 200);
  });

  it('validates WoL magic packet and blocks SSRF on /api/ssl-check', async () => {
    const pkt = buildMagicPacket('AA:BB:CC:DD:EE:FF');
    assert.equal(pkt.length, 102);
    assert.throws(() => buildMagicPacket('INVALID-MAC'));

    const sslRes = await fetch(`${baseUrl}/api/ssl-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ host: '192.168.1.129' }),
    });
    assert.equal(sslRes.status, 400);
  });
});
