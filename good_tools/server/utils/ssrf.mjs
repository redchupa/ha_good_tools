import dns from 'node:dns/promises';
import net from 'node:net';

/**
 * Checks whether an IPv4 or IPv6 address is private, loopback, link-local, or reserved.
 */
export function isPrivateIp(ip) {
  if (!ip) return true;
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
    if (a >= 224) return true;                         // multicast & reserved
    return false;
  }

  if (net.isIPv6(cleaned)) {
    if (cleaned === '::' || cleaned === '::1') return true;
    if (cleaned.startsWith('fc') || cleaned.startsWith('fd')) return true; // ULA fc00::/7
    if (/^fe[89ab]/i.test(cleaned)) return true;                           // link-local fe80::/10
    if (cleaned.startsWith('ff')) return true;                             // multicast
    return false;
  }

  return true;
}

/**
 * Validates that a URL is http/https and resolves only to public IP addresses.
 * Returns the parsed URL object if safe; throws Error otherwise.
 */
export async function assertSafePublicUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('올바른 URL 형식이 아닙니다.');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('http:// 또는 https:// 프로토콜만 허용됩니다.');
  }

  const host = parsed.hostname.toLowerCase();
  if (!host || host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) {
    throw new Error('로컬 또는 내부 네트워크 주소는 보안상 차단됩니다.');
  }

  if (net.isIP(host)) {
    if (isPrivateIp(host)) {
      throw new Error('사설 IP 주소는 보안상 차단됩니다.');
    }
    return parsed;
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

  return parsed;
}
