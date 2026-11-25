import { setTimeout as delay } from 'node:timers/promises';

const SECOND = 1000;
const GAP = 10 * SECOND;
const FIRST_WAIT = 2 * SECOND;

export class OutboundBusy extends Error {
  constructor(ms) {
    const seconds = Math.max(1, Math.ceil(ms / SECOND));
    super(`외부 서버 보호를 위해 ${seconds}초 후 다시 조회해 주세요. / Please try again in ${seconds} seconds.`);
    this.seconds = seconds;
  }
}

export function createOutboundPolicy({ now = Date.now, sleep = delay } = {}) {
  const hosts = new Map();
  let active = 0;
  let nextStart = 0;

  async function run(host, work) {
    const key = host.toLowerCase().replace(/\.$/, '');
    const time = now();
    for (const [name, entry] of hosts) {
      if (!entry.active && entry.until <= time) hosts.delete(name);
    }
    const entry = hosts.get(key) || { active: false, until: 0, paused: false };
    if (entry.active || entry.paused) throw new OutboundBusy(Math.max(GAP, entry.until - time));
    if (active >= 3 || (!hosts.has(key) && hosts.size >= 256)) throw new OutboundBusy(GAP);
    const start = Math.max(time + FIRST_WAIT, entry.until, nextStart);
    nextStart = start + FIRST_WAIT;
    hosts.set(key, entry);
    entry.active = true;
    active++;
    const observe = response => {
      if (![429, 503].includes(response.status)) return;
      const header = response.headers.get('retry-after')?.trim() || '';
      const wait = /^\d+$/.test(header) ? Number(header) * SECOND : Date.parse(header) - now();
      const cooldown = Math.max(60000, Number.isFinite(wait) ? wait : 0);
      entry.paused = true;
      entry.until = now() + cooldown;
      throw new OutboundBusy(cooldown);
    };
    try {
      await sleep(start - time);
      return await work(observe);
    } finally {
      entry.active = false;
      entry.until = Math.max(entry.until, now() + GAP);
      active--;
    }
  }
  return { run };
}

// For fixed public datasets. Recent requests share both pending work and successful results.
export function cachedLookup(ttl, now = Date.now) {
  let value, expires = 0, pending;
  return load => {
    if (now() < expires) return Promise.resolve(value);
    if (!pending) pending = Promise.resolve().then(load).then(result => {
      value = result;
      expires = now() + ttl;
      return result;
    }).finally(() => { pending = undefined; });
    return pending;
  };
}
