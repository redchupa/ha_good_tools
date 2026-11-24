const encoder = new TextEncoder();
function encode(bytes: Uint8Array) {
  let str = '';
  for (let i = 0; i < bytes.length; i += 8192) str += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(str);
}
function decode(text: string) { return Uint8Array.from(atob(text), c => c.charCodeAt(0)); }
function subtle() {
  if (!globalThis.crypto?.subtle) throw new Error('Web Crypto requires HTTPS. HTTPS로 다시 접속해 주세요.');
  return globalThis.crypto.subtle;
}
async function derive(secret: string, salt: Uint8Array<ArrayBuffer>) {
  if (!secret) throw new Error('Enter a passphrase / 암호 문구를 입력해 주세요.');
  const api = subtle();
  const raw = await api.importKey('raw', encoder.encode(secret), 'PBKDF2', false, ['deriveKey']);
  return api.deriveKey({ name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' }, raw,
    { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
export async function encrypt(text: string, secret: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await derive(secret, salt);
  const ciphertext = await subtle().encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(text));
  return ['GT1', encode(salt), encode(iv), encode(new Uint8Array(ciphertext))].join('.');
}
export async function decrypt(text: string, secret: string) {
  if (text.startsWith('U2FsdGVkX1')) {
    const { default: legacy } = await import('crypto-js');
    const result = legacy.AES.decrypt(text, secret).toString(legacy.enc.Utf8);
    if (!result) throw new Error('Invalid legacy passphrase or ciphertext.');
    return result;
  }
  const parts = text.split('.');
  if (parts.length !== 4 || parts[0] !== 'GT1') throw new Error('Unknown ciphertext format.');
  const salt = decode(parts[1]), iv = decode(parts[2]);
  if (salt.length !== 16 || iv.length !== 12) throw new Error('Invalid ciphertext.');
  const key = await derive(secret, salt);
  return new TextDecoder().decode(await subtle().decrypt({ name: 'AES-GCM', iv }, key, decode(parts[3])));
}
export async function textHashes(text: string, secret: string) {
  const api = subtle();
  const bytes = encoder.encode(text);
  const hex = (buf: ArrayBuffer) => Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2,'0')).join('');
  const rows = [['SHA-256', hex(await api.digest('SHA-256', bytes))]];
  if (secret) {
    for (const hash of ['SHA-256','SHA-512']) {
      const key = await api.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash }, false, ['sign']);
      rows.push(['HMAC-' + hash, hex(await api.sign('HMAC', key, bytes))]);
    }
  }
  return rows;
}
