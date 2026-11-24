import { gcm } from '@noble/ciphers/aes.js';
import { md5, sha1 } from '@noble/hashes/legacy.js';
import { hmac } from '@noble/hashes/hmac.js';
import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { sha256, sha512 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';

// GT1 = PBKDF2-SHA256 (600,000 rounds) + AES-256-GCM. Web Crypto is used when the page is a
// secure context; plain HTTP pages (common for LAN Home Assistant) use the same algorithms in JS,
// so ciphertext moves freely between an HTTPS phone and an HTTP PC.
const ITERATIONS = 600000;
const encoder = new TextEncoder();

function encode(bytes: Uint8Array) {
  let str = '';
  for (let i = 0; i < bytes.length; i += 8192) str += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(str);
}
function decode(text: string) {
  try { return Uint8Array.from(atob(text), c => c.charCodeAt(0)); }
  catch { throw new Error('Invalid ciphertext. / 암호문 형식을 확인해 주세요.'); }
}
function webCrypto(): SubtleCrypto | null {
  return globalThis.isSecureContext !== false && globalThis.crypto?.subtle ? globalThis.crypto.subtle : null;
}
function random(length: number) {
  return crypto.getRandomValues(new Uint8Array(length));
}
function requireSecret(secret: string) {
  if (!secret) throw new Error('Enter a passphrase / 암호 문구를 입력해 주세요.');
}

async function webKey(api: SubtleCrypto, secret: string, salt: Uint8Array<ArrayBuffer>) {
  const raw = await api.importKey('raw', encoder.encode(secret), 'PBKDF2', false, ['deriveKey']);
  return api.deriveKey({ name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' }, raw,
    { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
function jsKey(secret: string, salt: Uint8Array) {
  return pbkdf2Async(sha256, encoder.encode(secret), salt, { c: ITERATIONS, dkLen: 32, asyncTick: 20 });
}

export async function encrypt(text: string, secret: string, api: SubtleCrypto | null = webCrypto()) {
  requireSecret(secret);
  const salt = random(16);
  const iv = random(12);
  const plain = encoder.encode(text);
  const ciphertext = api
    ? new Uint8Array(await api.encrypt({ name: 'AES-GCM', iv }, await webKey(api, secret, salt), plain))
    : gcm(await jsKey(secret, salt), iv).encrypt(plain);
  return ['GT1', encode(salt), encode(iv), encode(ciphertext)].join('.');
}

export async function decrypt(text: string, secret: string, api: SubtleCrypto | null = webCrypto()) {
  if (text.startsWith('U2FsdGVkX1')) {
    const { default: legacy } = await import('crypto-js');
    let result = '';
    try { result = legacy.AES.decrypt(text, secret).toString(legacy.enc.Utf8); } catch { /* wrong passphrase */ }
    if (!result) throw new Error('Invalid legacy passphrase or ciphertext. / 암호 문구를 확인해 주세요.');
    return result;
  }
  requireSecret(secret);
  const parts = text.split('.');
  if (parts.length !== 4 || parts[0] !== 'GT1') throw new Error('Unknown ciphertext format. / 지원하지 않는 암호문입니다.');
  const salt = decode(parts[1]), iv = decode(parts[2]), body = decode(parts[3]);
  if (salt.length !== 16 || iv.length !== 12) throw new Error('Invalid ciphertext. / 암호문 형식을 확인해 주세요.');
  try {
    const plain = api
      ? new Uint8Array(await api.decrypt({ name: 'AES-GCM', iv }, await webKey(api, secret, salt), body))
      : gcm(await jsKey(secret, salt), iv).decrypt(body);
    return new TextDecoder('utf-8', { fatal: true }).decode(plain);
  } catch {
    throw new Error('Wrong passphrase or modified ciphertext. / 암호 문구가 틀렸거나 암호문이 변경되었습니다.');
  }
}

// Plain digests and HMACs are fast enough in JS everywhere, so they never depend on HTTPS.
export function textHashes(text: string, secret: string) {
  const bytes = encoder.encode(text);
  const rows: [string, string][] = [
    ['MD5', bytesToHex(md5(bytes))],
    ['SHA-1', bytesToHex(sha1(bytes))],
    ['SHA-256', bytesToHex(sha256(bytes))],
    ['SHA-512', bytesToHex(sha512(bytes))],
  ];
  if (secret) {
    const key = encoder.encode(secret);
    rows.push(['HMAC-SHA-256', bytesToHex(hmac(sha256, key, bytes))]);
    rows.push(['HMAC-SHA-512', bytesToHex(hmac(sha512, key, bytes))]);
  }
  return rows;
}
