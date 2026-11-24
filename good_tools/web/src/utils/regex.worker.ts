self.onmessage = ({ data: { pattern, flags, text, replaceWith } }) => {
  try {
    if (text.length > 32000 || pattern.length > 1024 || replaceWith.length > 256) {
      throw new Error('문자열은 32,000자, 패턴은 1,024자, 치환식은 256자까지 입력해 주세요.');
    }
    const matches = [];
    let count = 0;
    for (const match of text.matchAll(new RegExp(pattern, flags.includes('g') ? flags : flags + 'g'))) {
      if (matches.length < 200) matches.push({ value: match[0], index: match.index });
      count++;
    }
    // Capture and context substitutions can expand to the length of the original text.
    const expansion = replaceWith.length + (replaceWith.match(/\$[&`'0-9<]/g)?.length || 0) * text.length;
    if (text.length + (flags.includes('g') ? count : Math.min(1, count)) * expansion > 1000000) {
      throw new Error('치환 결과가 너무 큽니다.');
    }
    const replaced = text.replace(new RegExp(pattern, flags), replaceWith);
    self.postMessage({ matches, replaced, error: '' });
  } catch (err) {
    self.postMessage({ matches: [], replaced: '', error: err instanceof Error ? err.message : '정규식 오류' });
  }
};
