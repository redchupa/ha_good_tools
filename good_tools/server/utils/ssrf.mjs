import dns from 'node:dns/promises';
import http from 'node:http';
import https from 'node:https';
import { Readable } from 'node:stream';
import net from 'node:net';

/**
 * Checks whether an IPv4 or IPv6 address is private, loopback, link-local, or reserved.
 */
export function isPrivateIp(ip) {
  if (typeof ip !== 'string' || !ip || ip.includes('%')) return true;
  const cleaned = ip.toLowerCase().trim();

  // IPv4-mapped IPv6 (e.g. ::ffff:127.0.0.1)
  if (cleaned.startsWith('::ffff:')) {
    return isPrivateIp(cleaned.slice(7));
  }

  if (net.isIPv4(cleaned)) {
    const parts = cleaned.split('.').map(Number);
    const [a, b] = parts;
    if (a === 0) return true;                          // 0.0.0.0/8
    if (a === 10) return true;                         // 10.0.0.0/8
    if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT
    if (a === 127) return true;                        // 127.0.0.0/8 loopback
    if (a === 169 && b === 254) return true;           // 169.254.0.0/16 link-local / cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true;  // 172.16.0.0/12
    if (a === 192 && b === 168) return true;           // 192.168.0.0/16
    if (a === 192 && (b === 0 && [0, 2].includes(parts[2]) || b === 88 && parts[2] === 99)) return true;
    if (a === 198 && (b === 18 || b === 19 || b === 51 && parts[2] === 100)) return true;
    if (a === 203 && b === 0 && parts[2] === 113) return true;
    if (a >= 224) return true;                         // multicast & reserved
    return false;
  }

  if (net.isIPv6(cleaned)) {
    const addr = new URL('http://[' + cleaned + ']').hostname.slice(1, -1);
    const [prefix, subnet] = addr.split(':');
    if (!/^[23][0-9a-f]{3}$/.test(prefix)) return true;
    if (prefix === '2001' && (parseInt(subnet || '0', 16) < 0x200 || subnet === 'db8')) return true;
    return prefix === '2002' || prefix === '3fff';
  }

  return true;
}

/**
 * Validates that a URL is http/https and resolves only to public IP addresses.
 * Return the URL and a validated address for the transport.
 */
export async function resolvePublicTarget(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('올바른 URL 형식이 아닙니다.');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('http:// 또는 https:// 프로토콜만 허용됩니다.');
  }

  if (parsed.username || parsed.password) throw new Error('사용자 정보가 포함된 URL은 차단됩니다.');
  const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
  if (!host || host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) {
    throw new Error('로컬 또는 내부 네트워크 주소는 보안상 차단됩니다.');
  }

  if (net.isIP(host)) {
    if (isPrivateIp(host)) {
      throw new Error('사설 IP 주소는 보안상 차단됩니다.');
    }
    return { url: parsed, address: host };
  }

  let records;
  try {
    records = await dns.lookup(host, { all: true });
  } catch {
    throw new Error(`도메인 DNS 조회에 실패했습니다: ${host}`);
  }

  if (!records || records.length === 0) {
    throw new Error(`도메인 주소를 확인할 수 없습니다: ${host}`);
  }

  for (const rec of records) {
    if (isPrivateIp(rec.address)) {
      throw new Error('사설 또는 내부 IP로 해석되는 주소는 보안상 차단됩니다.');
    }
  }

  return { url: parsed, address: records[0].address };
}

export async function assertSafePublicUrl(rawUrl) {
  return (await resolvePublicTarget(rawUrl)).url;
}

// Connect to the validated address, retaining the URL authority for Host and TLS identity.
export function requestPublic({ url, address }, options) {
  const transport = url.protocol === 'https:' ? https : http;
  const hostname = url.hostname.replace(/^\[|\]$/g, '');
  return new Promise((resolve, reject) => {
    const req = transport.request(url, {
      ...options, agent: false, autoSelectFamily: false,
      lookup: (_host, _opts, callback) => callback(null, address, net.isIP(address)),
      servername: net.isIP(hostname) ? undefined : hostname,
    }, (message) => {
      const status = message.statusCode;
      const empty = options.method === 'HEAD' || [204, 205, 304].includes(status);
      if (empty) message.resume();
      try {
        resolve(new Response(empty ? null : Readable.toWeb(message), {
          status,
          headers: Object.entries(message.headersDistinct).flatMap(([key, values]) => values.map(value => [key, value])),
          statusText: message.statusMessage,
        }));
      } catch (err) {
        message.destroy();
        reject(err);
      }
    });
    req.once('upgrade', (_response, socket) => {
      socket.destroy();
      reject(new Error('프로토콜 전환은 지원하지 않습니다.'));
    });
    req.once('error', reject);
    req.end();
  });
}
