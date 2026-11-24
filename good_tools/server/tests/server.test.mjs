import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { isPrivateIp, assertSafePublicUrl } from '../utils/ssrf.mjs';
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
});
