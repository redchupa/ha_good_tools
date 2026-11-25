import assert from 'node:assert/strict';
import test from 'node:test';
import { cachedLookup, createOutboundPolicy, OutboundBusy } from '../utils/outbound.mjs';

function fixture() {
  let time = Date.UTC(2026, 0, 1);
  const now = () => time;
  const policy = createOutboundPolicy({ now, sleep: async ms => { time += ms; } });
  return { ...policy, now, advance: ms => { time += ms; } };
}

test('paces the first call and spaces calls to the same hostname across routes', async () => {
  const gate = fixture(), start = gate.now();
  const first = await gate.run('Example.test.', gate.now);
  const second = await gate.run('example.test', gate.now);
  assert.equal(first - start, 2000);
  assert.equal(second - first, 10000);
});

test('refuses simultaneous calls and caps active or waiting hosts', async () => {
  const gate = fixture();
  const latch = Promise.withResolvers();
  const held = ['a','b','c'].map(host => gate.run(host, () => latch.promise));
  await assert.rejects(gate.run('a', assert.fail), OutboundBusy);
  await assert.rejects(gate.run('d', assert.fail), OutboundBusy);
  latch.resolve();
  await Promise.all(held);
  await gate.run('d', () => {});
});

for (const [status, header, seconds] of [[429, '120', 120], [503, 'date', 180], [429, 'invalid', 60]]) {
  test(`respects upstream ${status} cooldown (${header}) without a retry`, async () => {
    const gate = fixture();
    await assert.rejects(gate.run('one', observe => {
      const retry = header === 'date' ? new Date(gate.now() + 180000).toUTCString() : header;
      observe(new Response(null, {status, headers: {'Retry-After': retry}}));
    }), err => err.seconds === seconds);
    await assert.rejects(gate.run('one', assert.fail), err => err.seconds === seconds);
    await gate.run('two', () => {});
    gate.advance(seconds * 1000);
    await gate.run('one', () => {});
  });
}

test('coalesces concurrent lookups, expires cached results and releases rejected work', async () => {
  let time = 0, calls = 0;
  const get = cachedLookup(500, () => time);
  const load = async () => ++calls;
  assert.deepEqual(await Promise.all([get(load), get(load)]), [1,1]);
  assert.equal(await get(load), 1);
  time = 500;
  await assert.rejects(get(async () => { throw Error('unavailable'); }));
  assert.equal(await get(load), 2);
});
