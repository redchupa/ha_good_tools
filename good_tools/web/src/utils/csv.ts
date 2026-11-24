// Pick the delimiter that appears most often outside quotes in the header line (, ; or tab).
export function detectDelimiter(text: string) {
  const counts: Record<string, number> = { ',': 0, ';': 0, '\t': 0 };
  let quoted = false;
  for (const c of text) {
    if (c === '"') quoted = !quoted;
    else if (!quoted && (c === '\n' || c === '\r')) break;
    else if (!quoted && c in counts) counts[c]++;
  }
  const [best, count] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return count ? best : ''; // A header without delimiters is a single-column file.
}

export function parseCsv(input: string): Record<string, string>[] {
  const text = input.replace(/^\uFEFF/, '');
  if (text.length > 500000) throw new Error('입력은 50만 자까지 지원합니다.');
  const delimiter = detectDelimiter(text);
  let quoted = false;
  let closed = false;
  let cell = '';
  let row: string[] = [];
  let headers: string[] | undefined;
  const result: Record<string, string>[] = [];
  function endRow() {
    row.push(cell);
    if (!headers) {
      headers = row.map((h, i) => h.trim() || 'col' + (i + 1));
      if (new Set(headers).size !== headers.length) throw new Error('열 이름이 중복됩니다.');
    } else {
      if (row.length !== headers.length) throw new Error('열 개수가 일치하지 않습니다.');
      result.push(Object.fromEntries(headers.map((h, i) => [h, row[i]])));
    }
    row = [];
    cell = '';
    closed = false;
  }
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c !== '"') cell += c;
      else if (text[i + 1] === '"') { cell += '"'; i++; }
      else { quoted = false; closed = true; }
    } else if (c === '\r' || c === '\n') {
      if (row.length || cell || closed) endRow();
      if (c === '\r' && text[i + 1] === '\n') i++;
    } else if (c === delimiter) {
      row.push(cell);
      cell = '';
      closed = false;
    } else if (c === '"' && !cell && !closed) quoted = true;
    else if (closed || c === '"') throw new Error('따옴표 위치를 확인해 주세요.');
    else cell += c;
  }
  if (quoted) throw new Error('닫히지 않은 따옴표가 있습니다.');
  if (row.length || cell || closed) endRow();
  return result;
}
