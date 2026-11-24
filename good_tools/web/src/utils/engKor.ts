// 2-beolsik Korean <-> English QWERTY bidirectional converter

const CHO = [
  'r', 'R', 's', 'e', 'E', 'f', 'a', 'q', 'Q', 't', 'T', 'd', 'w', 'W', 'c', 'z', 'x', 'v', 'g',
];
const JUNG = [
  'k', 'o', 'i', 'O', 'j', 'p', 'u', 'P', 'h', 'hk', 'ho', 'hl', 'y', 'n', 'nj', 'np', 'nl', 'b',
  'm', 'ml', 'l',
];
const JONG = [
  '', 'r', 'R', 'rt', 's', 'sw', 'sg', 'e', 'f', 'fr', 'fa', 'fq', 'ft', 'fx', 'fv', 'fg', 'a', 'q',
  'qt', 't', 'T', 'd', 'w', 'c', 'z', 'x', 'v', 'g',
];

const KEY_TO_JAMO: Record<string, string> = {
  r: 'ㄱ', R: 'ㄲ', s: 'ㄴ', e: 'ㄷ', E: 'ㄸ', f: 'ㄹ', a: 'ㅁ', q: 'ㅂ', Q: 'ㅃ',
  t: 'ㅅ', T: 'ㅆ', d: 'ㅇ', w: 'ㅈ', W: 'ㅉ', c: 'ㅊ', z: 'ㅋ', x: 'ㅌ', v: 'ㅍ', g: 'ㅎ',
  k: 'ㅏ', o: 'ㅐ', i: 'ㅑ', O: 'ㅒ', j: 'ㅓ', p: 'ㅔ', u: 'ㅕ', P: 'ㅖ', h: 'ㅗ',
  y: 'ㅛ', n: 'ㅜ', b: 'ㅠ', m: 'ㅡ', l: 'ㅣ',
};

const JAMO_TO_KEY: Record<string, string> = Object.fromEntries(
  Object.entries(KEY_TO_JAMO).map(([k, v]) => [v, k])
);

const COMPLEX_JUNG: Record<string, string> = {
  hk: 'hk', ho: 'ho', hl: 'hl', nj: 'nj', np: 'np', nl: 'nl', ml: 'ml',
};

const COMPLEX_JONG: Record<string, string> = {
  rt: 'rt', sw: 'sw', sg: 'sg', fr: 'fr', fa: 'fa', fq: 'fq', ft: 'ft',
  fx: 'fx', fv: 'fv', fg: 'fg', qt: 'qt',
};

const isVowelKey = (c: string) => JUNG.includes(c);
const isConsonantKey = (c: string) => CHO.includes(c);

export function engToKor(input: string): string {
  let out = '';
  let i = 0;

  while (i < input.length) {
    const ch = input[i];
    if (isConsonantKey(ch) && i + 1 < input.length && isVowelKey(input[i + 1])) {
      const choIdx = CHO.indexOf(ch);
      i++;

      let jungKey = input[i++];
      if (i < input.length && COMPLEX_JUNG[jungKey + input[i]]) {
        jungKey += input[i++];
      }
      const jungIdx = JUNG.indexOf(jungKey);

      let jongIdx = 0;
      if (i < input.length && isConsonantKey(input[i])) {
        // Check if next consonant is followed by a vowel (then it's next syllable's cho)
        if (i + 1 < input.length && isVowelKey(input[i + 1])) {
          // no jong
        } else {
          // Could be double jong
          const c1 = input[i];
          const c2 = input[i + 1] || '';
          const c3 = input[i + 2] || '';
          if (COMPLEX_JONG[c1 + c2] && !isVowelKey(c3)) {
            jongIdx = JONG.indexOf(c1 + c2);
            i += 2;
          } else if (JONG.includes(c1)) {
            jongIdx = JONG.indexOf(c1);
            i += 1;
          }
        }
      }

      out += String.fromCharCode(0xac00 + choIdx * 21 * 28 + jungIdx * 28 + jongIdx);
    } else if (KEY_TO_JAMO[ch]) {
      out += KEY_TO_JAMO[ch];
      i++;
    } else {
      out += ch;
      i++;
    }
  }
  return out;
}

export function korToEng(input: string): string {
  let out = '';
  for (const ch of input) {
    const code = ch.charCodeAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) {
      const offset = code - 0xac00;
      const cho = Math.floor(offset / (21 * 28));
      const jung = Math.floor((offset % (21 * 28)) / 28);
      const jong = offset % 28;
      out += CHO[cho] + JUNG[jung] + JONG[jong];
    } else if (JAMO_TO_KEY[ch]) {
      out += JAMO_TO_KEY[ch];
    } else {
      out += ch;
    }
  }
  return out;
}
