import { parseCsv } from './csv';
import { describe, it, expect } from 'vitest';
import { engToKor, korToEng } from './engKor';
import { parseSmi, parseSrtOrVtt, cuesToSrt, cuesToVtt, shiftCues } from './subtitle';
import { crc32, calculateSubnet, generateUuidV4, generateUuidV7, generateUlid, generateNanoId } from './helpers';
import { TOOLS } from '../data/tools';
import {
  LANGUAGE_OPTIONS,
  SHELL_STRINGS,
  isValidLang,
  getToolName,
  translatePhrase,
} from '../data/locales';

describe('Tools registry', () => {
  it('registers all modernized tools with unique IDs', () => {
    expect(TOOLS.length).toBeGreaterThan(0);
    const ids = new Set(TOOLS.map((t) => t.id));
    expect(ids.size).toBe(TOOLS.length);
  });
});

describe('engKor converter', () => {
  it('converts English QWERTY to Korean', () => {
    expect(engToKor('dkssudgktpdy')).toBe('안녕하세요');
    expect(engToKor('gksrmf')).toBe('한글');
  });

  it('converts Korean to English QWERTY', () => {
    expect(korToEng('안녕하세요')).toBe('dkssudgktpdy');
    expect(korToEng('ㅗ디ㅣㅐ')).toBe('hello');
  });
});

describe('subtitle converter', () => {
  it('parses SMI and outputs SRT and VTT with shift', () => {
    const smi = `<SYNC Start=1000><P Class=KRCC>Hello<br>World\n<SYNC Start=3000><P Class=KRCC>&nbsp;`;
    const cues = parseSmi(smi);
    expect(cues).toHaveLength(1);
    expect(cues[0].text).toBe('Hello\nWorld');

    const shifted = shiftCues(cues, 500);
    expect(shifted[0].startMs).toBe(1500);

    const srt = cuesToSrt(shifted);
    expect(srt).toContain('00:00:01,500 --> 00:00:03,500');

    const vtt = cuesToVtt(shifted);
    expect(vtt).toContain('WEBVTT');
    expect(parseSrtOrVtt(srt)).toHaveLength(1);
  });
});

describe('crypto & network helpers', () => {
  it('computes standard CRC32', () => {
    const bytes = new TextEncoder().encode('123456789');
    expect(crc32(bytes)).toBe('cbf43926');
  });

  it('calculates CIDR /24 subnet accurately', () => {
    const sub = calculateSubnet('192.168.1.129', 24);
    expect(sub.network).toBe('192.168.1.0');
    expect(sub.broadcast).toBe('192.168.1.255');
    expect(sub.usableHosts).toBe(254);
  });

  it('generates valid UUID v4, UUID v7, ULID, and NanoID', () => {
    expect(generateUuidV4()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(generateUuidV7()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(generateUlid()).toHaveLength(26);
    expect(generateNanoId(21)).toHaveLength(21);
  });
});

describe('CSV import', () => {
  it('preserves quoted delimiters, embedded CRLF, and escaped quotes', () => {
    expect(parseCsv('room,note\r\n"a,b","line 1\r\n""2"""')).toEqual([
      { room: 'a,b', note: 'line 1\r\n"2"' },
    ]);
  });
  it('rejects incomplete records and parses tab-separated records', () => {
    expect(() => parseCsv('a,b\n"unfinished')).toThrow();
    expect(parseCsv('a\tb\nx\ty')).toEqual([{ a: 'x', b: 'y' }]);
    expect(parseCsv('name;price\n"Kim; Jr";1,5')).toEqual([{ name: 'Kim; Jr', price: '1,5' }]);
    expect(parseCsv('only\nx,y')).toEqual([{ only: 'x,y' }]);
  });
});

it('rejects fractional prefixes and missing IPv4 octets', () => {
  expect(() => calculateSubnet('192..1.1', 24)).toThrow();
  expect(() => calculateSubnet('192.168.1.1', 24.5)).toThrow();
});

describe('multi-language locales', () => {
  it('provides 10 valid language options with complete shell strings', () => {
    expect(LANGUAGE_OPTIONS).toHaveLength(10);
    for (const opt of LANGUAGE_OPTIONS) {
      expect(isValidLang(opt.code)).toBe(true);
      const s = SHELL_STRINGS[opt.code];
      expect(s.dashboard.length).toBeGreaterThan(0);
      expect(s.chooseLanguage.length).toBeGreaterThan(0);
      expect(Object.keys(s.categories)).toEqual(['ha', 'general', 'developer', 'feed', 'games']);
    }
    expect(isValidLang('xx')).toBe(false);
  });

  it('localizes tool names and common phrases across languages', () => {
    const tool = TOOLS.find((t) => t.id === 'uuid-gen')!;
    expect(tool).toBeDefined();
    expect(getToolName(tool, 'ko')).toBe(tool.name);
    expect(getToolName(tool, 'en')).toBe(tool.nameEn);
    expect(getToolName(tool, 'ja')).toContain('UUID');
    expect(translatePhrase('ko', '복사', 'Copy')).toBe('복사');
    expect(translatePhrase('en', '복사', 'Copy')).toBe('Copy');
    expect(translatePhrase('ja', '복사', 'Copy')).toBe('コピー');
    expect(translatePhrase('es', '복사', 'Copy')).toBe('Copiar');
    expect(translatePhrase('fr', '존재하지않는문구', 'Fallback text')).toBe('Fallback text');
  });
});
