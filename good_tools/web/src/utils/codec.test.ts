import { describe, expect, it } from 'vitest';
import { gzipSync } from 'fflate';
import { CODECS, convert, decodeJwt, detectCodec, DEFAULT_OPTIONS, type CodecId } from './codec';

const sample = '안녕 Home <Assistant> & "도구" 😀';

describe('codec conversions', () => {
  it('round-trips every format through plain text', () => {
    for (const { id } of CODECS) {
      const encoded = convert(sample, 'plain', id).output;
      expect(convert(encoded, id, 'plain').output, id).toBe(sample);
    }
  });

  it('matches known encodings', () => {
    const to = (id: CodecId, text = 'Hi!', o = DEFAULT_OPTIONS) => convert(text, 'plain', id, o).output;
    expect(to('hex')).toBe('48 69 21');
    expect(to('hex', 'Hi!', { ...DEFAULT_OPTIONS, separator: '', upper: true })).toBe('486921');
    expect(to('octal')).toBe('110 151 041');
    expect(to('binary')).toBe('01001000 01101001 00100001');
    expect(to('decimal')).toBe('72 105 33');
    expect(to('base64', '한')).toBe('7ZWc');
    expect(to('ascii-hex', '한A')).toBe('d55c 41');
    expect(convert('d55c', 'ascii-hex', 'plain').output).toBe('한');
    expect(convert('48656c6c6f', 'ascii-hex', 'plain').output).toBe('Hello');
    expect(to('url', 'a b&c', { ...DEFAULT_OPTIONS, urlPlus: true })).toBe('a+b%26c');
    expect(to('html', '<é>', { ...DEFAULT_OPTIONS, htmlAll: true })).toBe('&lt;&#xE9;&gt;');
    expect(to('unicode', 'A😀')).toBe('\\u0041\\u{1f600}');
    expect(to('base64url', 'ÿþ')).toBe('w7_Dvg');
  });

  it('reads common pasted variants', () => {
    expect(convert('0x48,0x69', 'hex', 'plain').output).toBe('Hi');
    expect(convert('\\x48\\x69', 'hex', 'plain').output).toBe('Hi');
    expect(convert('0100100001101001', 'binary', 'plain').output).toBe('Hi');
    expect(convert('\\110\\151', 'octal', 'plain').output).toBe('Hi');
    expect(convert('&amp;&#65;&#x42;&nbsp;', 'html', 'plain').output).toBe('&AB ');
    const gz = btoa(String.fromCharCode(...gzipSync(new TextEncoder().encode('gzip text'))));
    expect(convert(gz, 'gzip', 'plain').output).toBe('gzip text');
  });

  it('reports wrong input instead of showing a wrong result', () => {
    expect(() => convert('48 6', 'hex', 'plain')).not.toThrow();
    expect(() => convert('486', 'hex', 'plain')).toThrow(/홀수/);
    expect(() => convert('zz', 'hex', 'plain')).toThrow();
    expect(() => convert('400', 'decimal', 'plain')).toThrow(/0–255/);
    expect(() => convert('%E0%A4%A', 'url', 'plain')).toThrow();
    expect(() => convert('ff fe', 'hex', 'plain')).toThrow(/UTF-8/);
    expect(convert('ff fe', 'hex', 'base64').output).toBe('//4=');
    expect(() => convert('bm90IGd6aXA=', 'gzip', 'plain')).toThrow(/gzip/);
  });

  it('stops decompression bombs', () => {
    const bomb = btoa(String.fromCharCode(...gzipSync(new Uint8Array(11 * 1024 * 1024))));
    expect(() => convert(bomb, 'gzip', 'hex')).toThrow(/10 MiB/);
  });

  it('detects the pasted format', () => {
    expect(detectCodec('SGVsbG8gV29ybGQ=')).toBe('base64');
    expect(detectCodec('48 65 6c 6c 6f')).toBe('hex');
    expect(detectCodec('H4sIAAAAAAAA')).toBe('gzip');
    expect(detectCodec('a%20b')).toBe('url');
    expect(detectCodec('&lt;b&gt;')).toBe('html');
    expect(detectCodec('01001000 01101001')).toBe('binary');
    expect(detectCodec('eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.sig')).toBe('jwt');
    expect(detectCodec('hello world')).toBe('plain');
    expect(detectCodec('Password')).toBe('plain');
    expect(detectCodec('2024')).toBe('plain');
  });
});

describe('JWT', () => {
  it('decodes claims and reports expiry', () => {
    const part = (v: object) => btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(v))))
      .replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
    const token = `${part({ alg: 'HS256' })}.${part({ sub: '한', exp: 1000, iat: 10 })}.abc`;
    const view = decodeJwt('Bearer ' + token, 2_000_000);
    expect(view.header).toEqual({ alg: 'HS256' });
    expect(view.payload.sub).toBe('한');
    expect(view.times.find(t => t.claim === 'exp')).toEqual({ claim: 'exp', date: '1970-01-01T00:16:40.000Z', past: true });
    expect(() => decodeJwt('abc')).toThrow();
  });
});
