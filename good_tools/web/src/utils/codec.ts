import { gzipSync, zlibSync, deflateSync, Gunzip, Unzlib, Inflate } from 'fflate';

// Every format converts to and from UTF-8 bytes, so any input format can be shown as any output.
export type CodecId =
  | 'plain' | 'url' | 'html' | 'base64' | 'base64url' | 'ascii-hex' | 'hex'
  | 'octal' | 'binary' | 'decimal' | 'unicode' | 'gzip' | 'zlib' | 'deflate';

export interface CodecOptions {
  separator: string;      // between hex/octal/binary/decimal groups
  upper: boolean;         // hex letters
  urlPlus: boolean;       // URL: space as "+"
  htmlAll: boolean;       // HTML: encode every non-ASCII character
}
export const DEFAULT_OPTIONS: CodecOptions = { separator: ' ', upper: false, urlPlus: false, htmlAll: false };

export const MAX_OUTPUT_BYTES = 10 * 1024 * 1024;
const utf8 = new TextEncoder();

export class CodecError extends Error {}

export function bytesToText(bytes: Uint8Array) {
  try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
  catch { throw new CodecError('UTF-8 텍스트가 아닌 바이너리입니다. 출력 형식을 Hex나 Base64로 바꿔 보세요. / Not UTF-8 text; choose Hex or Base64 output.'); }
}

function toBase64(bytes: Uint8Array) {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 8192) bin += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(bin);
}
function fromBase64(text: string) {
  const clean = text.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(clean)) throw new CodecError('Base64 문자(A–Z, a–z, 0–9, +, /, =)만 넣어 주세요. / Invalid Base64.');
  const padded = clean.padEnd(Math.ceil(clean.length / 4) * 4, '=');
  try { return Uint8Array.from(atob(padded), c => c.charCodeAt(0)); }
  catch { throw new CodecError('Base64 길이가 올바르지 않습니다. / Invalid Base64 length.'); }
}

// Groups of digits in a radix ("48 65", "0x48,0x65", "\x48\x65", "486c").
function parseGroups(text: string, radix: 2 | 8 | 10 | 16) {
  const width = { 2: 8, 8: 3, 10: 3, 16: 2 }[radix];
  const digit = { 2: '[01]', 8: '[0-7]', 10: '[0-9]', 16: '[0-9a-fA-F]' }[radix];
  const cleaned = text.trim().replace(radix === 16 ? /0x|\\x|%/gi : radix === 8 ? /\\|0o/gi : radix === 2 ? /0b/gi : /(?!)/g, ' ');
  if (!cleaned) return new Uint8Array();
  if (new RegExp(`[^${digit.slice(1, -1)}\\s,;:.-]`).test(cleaned)) {
    throw new CodecError(`${({ 2: '2진수', 8: '8진수', 10: '10진수', 16: '16진수' })[radix]}가 아닌 문자가 있습니다. / Unexpected character.`);
  }
  const parts = cleaned.split(/[\s,;:.-]+/).filter(Boolean);
  // A single unseparated run is split into fixed-width groups.
  const groups = parts.length === 1 && parts[0].length > width && radix !== 10
    ? parts[0].match(new RegExp(`${digit}{1,${width}}`, 'g')) || []
    : parts;
  if (radix === 16 && parts.length === 1 && parts[0].length % 2) throw new CodecError('16진수 자릿수가 홀수입니다. / Odd number of hex digits.');
  return Uint8Array.from(groups, g => {
    const n = parseInt(g, radix);
    if (!(n >= 0 && n <= 255)) throw new CodecError(`바이트 범위(0–255)를 벗어난 값: ${g} / Value out of byte range.`);
    return n;
  });
}
function formatGroups(bytes: Uint8Array, radix: 2 | 8 | 10 | 16, o: CodecOptions) {
  const width = { 2: 8, 8: 3, 10: 0, 16: 2 }[radix];
  const out = Array.from(bytes, b => b.toString(radix).padStart(width, '0'));
  const joined = out.join(radix === 10 && !o.separator ? ' ' : o.separator);
  return radix === 16 && o.upper ? joined.toUpperCase() : joined;
}

const NAMED: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', copy: '©', reg: '®', hellip: '…', middot: '·' };
function htmlDecode(text: string) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, ref: string) => {
    if (ref[0] === '#') {
      const code = ref[1].toLowerCase() === 'x' ? parseInt(ref.slice(2), 16) : parseInt(ref.slice(1), 10);
      return code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : whole;
    }
    return NAMED[ref.toLowerCase()] ?? whole;
  });
}
function htmlEncode(text: string, all: boolean) {
  return Array.from(text, c => {
    if (c === '&') return '&amp;';
    if (c === '<') return '&lt;';
    if (c === '>') return '&gt;';
    if (c === '"') return '&quot;';
    if (c === "'") return '&#39;';
    const code = c.codePointAt(0)!;
    return all && code > 126 ? `&#x${code.toString(16).toUpperCase()};` : c;
  }).join('');
}

// Decompress with an output cap so a small "zip bomb" cannot exhaust the phone's memory.
function inflate(kind: 'gzip' | 'zlib' | 'deflate', input: Uint8Array) {
  const chunks: Uint8Array[] = [];
  let total = 0;
  let finished = false;
  const stream = kind === 'gzip' ? new Gunzip() : kind === 'zlib' ? new Unzlib() : new Inflate();
  stream.ondata = (data, final) => {
    total += data.length;
    if (total > MAX_OUTPUT_BYTES) throw new CodecError('압축 해제 결과가 10 MiB를 넘습니다. / Output exceeds 10 MiB.');
    chunks.push(data);
    if (final) finished = true;
  };
  try { stream.push(input, true); }
  catch (err) {
    if (err instanceof CodecError) throw err;
    throw new CodecError(`${kind} 데이터가 아니거나 손상되었습니다. / Not valid ${kind} data.`);
  }
  if (!finished && kind !== 'deflate') throw new CodecError('압축 데이터가 중간에 끊겼습니다. / Truncated data.');
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) { out.set(c, offset); offset += c.length; }
  return out;
}
// Compressed input may be pasted as Base64 (usual) or hex.
function binaryInput(text: string) {
  const t = text.trim();
  return /^(?:[0-9a-f]{2}[\s:]?)+$/i.test(t) && t.replace(/[\s:]/g, '').length % 2 === 0 ? parseGroups(t, 16) : fromBase64(t);
}

export interface Codec { id: CodecId; ko: string; en: string; decode: (text: string, o: CodecOptions) => Uint8Array; encode: (bytes: Uint8Array, o: CodecOptions) => string }

export const CODECS: Codec[] = [
  { id: 'plain', ko: '일반 텍스트 (UTF-8)', en: 'Plain text (UTF-8)', decode: t => utf8.encode(t), encode: b => bytesToText(b) },
  {
    id: 'url', ko: 'URL 인코딩 (%XX)', en: 'URL encoding (%XX)',
    decode: (t, o) => {
      try { return utf8.encode(decodeURIComponent(o.urlPlus ? t.replace(/\+/g, ' ') : t)); }
      catch { throw new CodecError('잘못된 % 인코딩이 있습니다. / Malformed percent-encoding.'); }
    },
    encode: (b, o) => { const e = encodeURIComponent(bytesToText(b)); return o.urlPlus ? e.replace(/%20/g, '+') : e; },
  },
  { id: 'html', ko: 'HTML 엔티티', en: 'HTML entities', decode: t => utf8.encode(htmlDecode(t)), encode: (b, o) => htmlEncode(bytesToText(b), o.htmlAll) },
  { id: 'base64', ko: 'Base64', en: 'Base64', decode: t => fromBase64(t), encode: b => toBase64(b) },
  { id: 'base64url', ko: 'Base64URL', en: 'Base64URL', decode: t => fromBase64(t), encode: b => toBase64(b).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') },
  {
    id: 'ascii-hex', ko: 'ASCII Hex (문자 코드)', en: 'ASCII hex (character codes)',
    decode: t => {
      const parts = t.trim().replace(/0x|\\x|U\+/gi, ' ').split(/[\s,]+/).filter(Boolean);
      if (parts.length === 1 && parts[0].length > 2) return parseGroups(parts[0], 16);
      return utf8.encode(parts.map(p => {
        const code = parseInt(p, 16);
        if (!/^[0-9a-f]+$/i.test(p) || code > 0x10ffff) throw new CodecError(`문자 코드가 아닙니다: ${p} / Not a character code.`);
        return String.fromCodePoint(code);
      }).join(''));
    },
    encode: (b, o) => {
      const codes = Array.from(bytesToText(b), c => c.codePointAt(0)!.toString(16).padStart(2, '0'));
      const joined = codes.join(o.separator || ' ');
      return o.upper ? joined.toUpperCase() : joined;
    },
  },
  { id: 'hex', ko: 'Hex (바이트)', en: 'Hex (bytes)', decode: t => parseGroups(t, 16), encode: (b, o) => formatGroups(b, 16, o) },
  { id: 'octal', ko: '8진수 (Octal)', en: 'Octal', decode: t => parseGroups(t, 8), encode: (b, o) => formatGroups(b, 8, { ...o, separator: o.separator || ' ' }) },
  { id: 'binary', ko: '2진수 (Binary)', en: 'Binary', decode: t => parseGroups(t, 2), encode: (b, o) => formatGroups(b, 2, o) },
  { id: 'decimal', ko: '10진수 바이트', en: 'Decimal bytes', decode: t => parseGroups(t, 10), encode: (b, o) => formatGroups(b, 10, o) },
  {
    id: 'unicode', ko: 'Unicode 이스케이프 (\\uXXXX)', en: 'Unicode escapes (\\uXXXX)',
    decode: t => utf8.encode(t.replace(/\\u\{([0-9a-f]{1,6})\}|\\u([0-9a-f]{4})/gi, (_, wide, short) => {
      const code = parseInt(wide || short, 16);
      return wide ? String.fromCodePoint(code) : String.fromCharCode(code);
    })),
    encode: (b, o) => Array.from(bytesToText(b), c => {
      const code = c.codePointAt(0)!;
      const hex = code > 0xffff ? `\\u{${code.toString(16)}}` : '\\u' + code.toString(16).padStart(4, '0');
      return o.upper ? hex.toUpperCase().replace('\\U', '\\u') : hex;
    }).join(''),
  },
  { id: 'gzip', ko: 'Gzip (Base64로 표시)', en: 'Gzip (shown as Base64)', decode: t => inflate('gzip', binaryInput(t)), encode: b => toBase64(gzipSync(b, { mtime: 0 })) },
  { id: 'zlib', ko: 'Zlib (Base64로 표시)', en: 'Zlib (shown as Base64)', decode: t => inflate('zlib', binaryInput(t)), encode: b => toBase64(zlibSync(b)) },
  { id: 'deflate', ko: 'Deflate raw (Base64로 표시)', en: 'Raw Deflate (shown as Base64)', decode: t => inflate('deflate', binaryInput(t)), encode: b => toBase64(deflateSync(b)) },
];

export function getCodec(id: CodecId) {
  return CODECS.find(c => c.id === id)!;
}

export function convert(text: string, from: CodecId, to: CodecId, options: CodecOptions = DEFAULT_OPTIONS) {
  const bytes = getCodec(from).decode(text, options);
  if (bytes.length > MAX_OUTPUT_BYTES) throw new CodecError('입력이 10 MiB를 넘습니다. / Input exceeds 10 MiB.');
  return { output: getCodec(to).encode(bytes, options), bytes: bytes.length };
}

// Best guess at what was pasted, used by the "detect" button.
export function detectCodec(text: string): CodecId | 'jwt' {
  const t = text.trim();
  if (!t) return 'plain';
  if (/^eyJ[\w-]*\.[\w-]*\.?[\w-]*$/.test(t)) return 'jwt';
  if (/^H4sI[A-Za-z0-9+/=\s]+$/.test(t)) return 'gzip';
  if (/^eJ[A-Za-z0-9+/=\s]+$/.test(t)) return 'zlib';
  if (/^(?:[01]{8}[\s]*)+$/.test(t)) return 'binary';
  if (/(?:\\u[0-9a-f]{4}|\\u\{[0-9a-f]+\})/i.test(t)) return 'unicode';
  if (/&(?:#x?[0-9a-f]+|[a-z]+);/i.test(t)) return 'html';
  if (/%[0-9a-f]{2}/i.test(t) && !/\s/.test(t)) return 'url';
  if (/^(?:(?:0x|\\x)?[0-9a-f]{2}[\s:,]*)+$/i.test(t) && t.replace(/0x|\\x|[\s:,]/gi, '').length % 2 === 0) return 'hex';
  if (t.length % 4 === 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(t) && t.length >= 8) return 'base64';
  if (/^[A-Za-z0-9_-]{16,}$/.test(t) && /[-_]/.test(t)) return 'base64url';
  return 'plain';
}

export interface JwtView { header: unknown; payload: Record<string, unknown>; signature: string; times: { claim: string; date: string; past: boolean }[] }

export function decodeJwt(token: string, now = Date.now()): JwtView {
  const parts = token.trim().replace(/^Bearer\s+/i, '').split('.');
  if (parts.length < 2 || parts.length > 3) throw new CodecError('JWT는 header.payload.signature 형식이어야 합니다. / Expected header.payload.signature.');
  const json = (part: string, label: string) => {
    try { return JSON.parse(bytesToText(fromBase64(part))); }
    catch { throw new CodecError(`${label}를 JSON으로 읽을 수 없습니다. / ${label} is not JSON.`); }
  };
  const header = json(parts[0], 'header');
  const payload = json(parts[1], 'payload');
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new CodecError('payload가 JSON 객체가 아닙니다. / Payload is not an object.');
  const times = ['iat', 'nbf', 'exp']
    .filter(claim => typeof payload[claim] === 'number')
    .map(claim => ({ claim, date: new Date((payload[claim] as number) * 1000).toISOString(), past: (payload[claim] as number) * 1000 < now }));
  return { header, payload, signature: parts[2] || '', times };
}
