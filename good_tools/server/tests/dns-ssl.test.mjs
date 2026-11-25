import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { createApp } from '../index.mjs';
import { OutboundBusy } from '../utils/outbound.mjs';

async function withServer(options, fn) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'good-tools-dns-ssl-'));
  const app = createApp({ dataDir: tempDir, allowNetworkTools: true, ...options });
  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  try {
    return await fn(baseUrl);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

describe('DNS incomplete / error distinction', () => {
  const instantOutbound = { run: async (_host, work) => work(() => {}) };

  it('treats ENODATA and ENOTFOUND as empty records, not failures', async () => {
    await withServer(
      {
        outbound: instantOutbound,
        createDnsResolver: () => ({
          cancel() {},
          async resolve(_domain, type) {
            if (type === 'A') return ['93.184.216.34'];
            const err = new Error('not found');
            err.code = type === 'AAAA' ? 'ENOTFOUND' : 'ENODATA';
            throw err;
          },
        }),
      },
      async (baseUrl) => {
        const res = await fetch(`${baseUrl}/api/dns`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain: 'example.com' }),
        });
        assert.equal(res.status, 200);
        const body = await res.json();
        assert.equal(body.domain, 'example.com');
        assert.deepEqual(body.records.A, ['93.184.216.34']);
        assert.deepEqual(body.records.MX, []);
        assert.deepEqual(body.failedTypes, []);
      }
    );
  });

  it('preserves succeeded records and reports partial timeouts in failedTypes', async () => {
    await withServer(
      {
        outbound: instantOutbound,
        createDnsResolver: () => ({
          cancel() {},
          async resolve(_domain, type) {
            if (type === 'A') return ['1.2.3.4'];
            if (type === 'MX') {
              const err = new Error('timeout');
              err.code = 'ETIMEOUT';
              throw err;
            }
            const err = new Error('no data');
            err.code = 'ENODATA';
            throw err;
          },
        }),
      },
      async (baseUrl) => {
        const res = await fetch(`${baseUrl}/api/dns`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain: 'partial.example.com' }),
        });
        assert.equal(res.status, 200);
        const body = await res.json();
        assert.deepEqual(body.records.A, ['1.2.3.4']);
        assert.deepEqual(body.failedTypes, ['MX']);
      }
    );
  });

  it('reports all record types in failedTypes on full DNS timeout', async () => {
    await withServer(
      {
        outbound: instantOutbound,
        createDnsResolver: () => ({
          cancel() {},
          async resolve() {
            const err = new Error('timeout');
            err.code = 'ETIMEOUT';
            throw err;
          },
        }),
      },
      async (baseUrl) => {
        const res = await fetch(`${baseUrl}/api/dns`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain: 'timeout.example.com' }),
        });
        assert.equal(res.status, 200);
        const body = await res.json();
        assert.deepEqual(body.failedTypes, ['A', 'AAAA', 'MX', 'TXT', 'CNAME', 'NS']);
      }
    );
  });
});

describe('SSL header rate-limit contract', () => {
  it('OutboundBusy exposes retry seconds used for headerRetryAfter', () => {
    const busy = new OutboundBusy(60000);
    assert.equal(busy.seconds, 60);
  });
});
