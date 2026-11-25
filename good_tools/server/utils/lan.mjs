import { OutboundBusy } from './outbound.mjs';
import dns from 'node:dns/promises';
import dgram from 'node:dgram';
import net from 'node:net';
import tls from 'node:tls';
import { resolvePublicTarget, requestPublic } from './ssrf.mjs';

export function buildMagicPacket(macAddress) {
  const clean = String(macAddress || '').trim().replace(/[:-]/g, '');
  if (!/^[0-9a-fA-F]{12}$/.test(clean)) {
    throw new Error('올바른 MAC 주소 형식이 아닙니다 (예: AA:BB:CC:DD:EE:FF)');
  }
  const macBytes = Buffer.from(clean, 'hex');
  const packet = Buffer.alloc(6 + 16 * 6, 0xff);
  for (let i = 0; i < 16; i++) {
    macBytes.copy(packet, 6 + i * 6);
  }
  return packet;
}

export function isLanAddress(ip) {
  if (net.isIPv4(ip)) {
    const [a, b, c] = ip.split('.').map(Number);
    // 172.30.32.0/23 is the Supervisor network (Core, Supervisor and other apps).
    if (a === 172 && b === 30 && (c === 32 || c === 33)) return false;
    return a === 10 || a === 192 && b === 168 || a === 172 && b >= 16 && b <= 31;
  }
  return net.isIPv6(ip) && /^f[cd]/i.test(ip);
}

export async function sendWakeOnLan(macAddress, broadcastIp = '255.255.255.255', port = 9) {
  if (typeof macAddress !== 'string') throw new Error('MAC 주소를 입력해 주세요.');
  const packet = buildMagicPacket(macAddress);
  const ip = String(broadcastIp || '255.255.255.255').trim();
  if (!net.isIPv4(ip) || !(ip === '255.255.255.255' || isLanAddress(ip))) {
    throw new Error('브로드캐스트 주소는 올바른 IPv4 형식이어야 합니다.');
  }
  const p = Number(port);
  if (!Number.isInteger(p) || p < 1 || p > 65535) {
    throw new Error('포트는 1~65535 사이의 정수여야 합니다.');
  }

  return new Promise((resolve, reject) => {
    const socket = dgram.createSocket('udp4');
    socket.once('error', (err) => {
      socket.close();
      reject(err);
    });
    socket.bind(() => {
      try {
        socket.setBroadcast(true);
      } catch (err) {
        socket.close();
        reject(err);
        return;
      }
      socket.send(packet, 0, packet.length, p, ip, (err) => {
        socket.close();
        if (err) reject(err);
        else resolve({ mac: macAddress.toUpperCase(), broadcastIp: ip, port: p, bytes: packet.length });
      });
    });
  });
}

export async function checkTcpPort(host, port, timeoutMs = 2500) {
  const h = String(host || '').trim();
  if (!h || h.length > 253 || /\s/.test(h)) {
    throw new Error('올바른 호스트명 또는 IP 주소를 입력해 주세요.');
  }
  const p = Number(port);
  if (!Number.isInteger(p) || p < 1 || p > 65535) {
    throw new Error('포트는 1~65535 사이의 정수여야 합니다.');
  }

  const records = net.isIP(h) ? [{ address: h }] : await dns.lookup(h, { all: true });
  if (!records.length || records.some(record => !isLanAddress(record.address))) {
    throw new Error('LAN의 사설 주소만 점검할 수 있습니다.');
  }
  const start = Date.now();
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;
    const finish = (open, error = '') => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve({ host: h, port: p, open, latencyMs: Date.now() - start, error: error || undefined });
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false, '연결 시간 초과'));
    socket.once('error', (err) => finish(false, err.code || err.message));
    socket.connect(p, records[0].address);
  });
}

export async function inspectSsl(rawHost, port, outbound, userAgent) {
  const input = String(rawHost || '').trim();
  const authority = net.isIPv6(input) ? '[' + input + ']' : input.replace(/^https?:\/\//i, '');
  const cleanHost = new URL('https://' + authority).hostname;
  const p = Number(port);
  if (!cleanHost) throw new Error('도메인을 입력해 주세요.');
  if (!Number.isInteger(p) || p < 1 || p > 65535) throw new Error('올바른 포트 번호가 아닙니다.');

  // Enforce SSRF protection on target host
  let target;

  const certInfo = await outbound.run(cleanHost, async () => {
    target = await resolvePublicTarget(`https://${cleanHost}:${p}`);
    return new Promise((resolve, reject) => {
      const socket = tls.connect(
        { host: target.address, port: p, servername: net.isIP(cleanHost.replace(/^\[|\]$/g, '')) ? undefined : cleanHost, rejectUnauthorized: false, timeout: 8000 },
        () => {
          const cert = socket.getPeerCertificate(false);
          const authorized = socket.authorized;
          const authError = socket.authorizationError;
          const protocol = socket.getProtocol();
          const cipher = socket.getCipher();
          socket.destroy();

          if (!cert || !Object.keys(cert).length) {
            return reject(new Error('서버에서 TLS 인증서를 반환하지 않았습니다.'));
          }

          const validToDate = new Date(cert.valid_to);
          const daysRemaining = Math.floor((validToDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

          resolve({
            host: cleanHost,
            port: p,
            authorized,
            authError: authError ? String(authError) : null,
            protocol,
            cipher: cipher?.name || '',
            subject: cert.subject?.CN || '',
            issuer: cert.issuer?.O || cert.issuer?.CN || '',
            validFrom: cert.valid_from,
            validTo: cert.valid_to,
            daysRemaining,
            san: cert.subjectaltname || '',
            fingerprint256: cert.fingerprint256 || '',
          });
        }
      );
      socket.once('timeout', () => {
        socket.destroy();
        reject(new Error('TLS 연결 시간이 초과되었습니다.'));
      });
      socket.once('error', (err) => {
        socket.destroy();
        reject(new Error(err.message || 'TLS 연결 오류'));
      });
    });
  });

  // Also inspect HTTP security headers
  let securityHeaders = {};
  let httpStatus = null;
  let headerRetryAfter = null;
  try {
    const resp = await outbound.run(cleanHost, async observe => {
      const response = await requestPublic(target, {
        method: 'HEAD', headers: { 'User-Agent': userAgent },
        signal: AbortSignal.timeout(6000),
      });
      observe(response);
      return response;
    });
    httpStatus = resp.status;
    for (const h of [
      'strict-transport-security',
      'content-security-policy',
      'x-frame-options',
      'x-content-type-options',
      'referrer-policy',
      'permissions-policy',
      'server',
    ]) {
      securityHeaders[h] = resp.headers.get(h) || null;
    }
  } catch (err) {
    if (err instanceof OutboundBusy) headerRetryAfter = err.seconds;
  }

  return { ...certInfo, httpStatus, securityHeaders, headerRetryAfter };
}
