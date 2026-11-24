export interface SubtitleCue {
  startMs: number;
  endMs: number;
  text: string;
}

function pad(n: number, len = 2) {
  return String(Math.floor(n)).padStart(len, '0');
}

export function formatTimestamp(ms: number, sep: ',' | '.' = ','): string {
  const safe = Math.max(0, Math.round(ms));
  const hours = Math.floor(safe / 3600000);
  const minutes = Math.floor((safe % 3600000) / 60000);
  const seconds = Math.floor((safe % 60000) / 1000);
  const millis = safe % 1000;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}${sep}${pad(millis, 3)}`;
}

function parseTimestamp(ts: string): number {
  const m = ts.trim().match(/(?:(\d+):)?(\d{1,2}):(\d{1,2})[,.](\d{1,3})/);
  if (!m) return 0;
  const h = Number(m[1] || 0);
  const min = Number(m[2]);
  const s = Number(m[3]);
  const ms = Number(m[4].padEnd(3, '0'));
  return h * 3600000 + min * 60000 + s * 1000 + ms;
}

export function parseSmi(content: string): SubtitleCue[] {
  const syncRegex = /<SYNC\s+Start=(\d+)[^>]*>([\s\S]*?)(?=<SYNC\s+Start=|<\/BODY>|$)/gi;
  const raw: { startMs: number; text: string }[] = [];
  let match: RegExpExecArray | null;
  while ((match = syncRegex.exec(content)) !== null) {
    const startMs = Number(match[1]);
    const cleaned = match[2]
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&amp;/gi, '&')
      .replace(/\r/g, '')
      .trim();
    raw.push({ startMs, text: cleaned });
  }

  const cues: SubtitleCue[] = [];
  for (let i = 0; i < raw.length; i++) {
    if (!raw[i].text) continue;
    const endMs = i + 1 < raw.length ? raw[i + 1].startMs : raw[i].startMs + 3000;
    cues.push({ startMs: raw[i].startMs, endMs: Math.max(endMs, raw[i].startMs + 200), text: raw[i].text });
  }
  return cues;
}

export function parseSrtOrVtt(content: string): SubtitleCue[] {
  const blocks = content.replace(/\r/g, '').replace(/^WEBVTT.*\n*/i, '').trim().split(/\n{2,}/);
  const cues: SubtitleCue[] = [];
  for (const block of blocks) {
    const lines = block.split('\n');
    const timeIdx = lines.findIndex((l) => l.includes('-->'));
    if (timeIdx === -1) continue;
    const [startStr, endStr] = lines[timeIdx].split('-->');
    const text = lines.slice(timeIdx + 1).join('\n').trim();
    if (!text) continue;
    cues.push({
      startMs: parseTimestamp(startStr),
      endMs: parseTimestamp(endStr),
      text,
    });
  }
  return cues;
}

export function shiftCues(cues: SubtitleCue[], offsetMs: number): SubtitleCue[] {
  return cues.map((c) => ({
    ...c,
    startMs: Math.max(0, c.startMs + offsetMs),
    endMs: Math.max(200, c.endMs + offsetMs),
  }));
}

export function cuesToSrt(cues: SubtitleCue[]): string {
  return cues
    .map((c, idx) => `${idx + 1}\n${formatTimestamp(c.startMs, ',')} --> ${formatTimestamp(c.endMs, ',')}\n${c.text}`)
    .join('\n\n') + '\n';
}

export function cuesToVtt(cues: SubtitleCue[]): string {
  return (
    'WEBVTT\n\n' +
    cues
      .map((c) => `${formatTimestamp(c.startMs, '.')} --> ${formatTimestamp(c.endMs, '.')}\n${c.text}`)
      .join('\n\n') +
    '\n'
  );
}

export function cuesToSmi(cues: SubtitleCue[]): string {
  const body = cues
    .map(
      (c) =>
        `<SYNC Start=${c.startMs}><P Class=KRCC>${c.text.replace(/\n/g, '<br>')}\n<SYNC Start=${c.endMs}><P Class=KRCC>&nbsp;`
    )
    .join('\n');
  return `<SAMI>\n<HEAD>\n<STYLE TYPE="text/css"><!-- .KRCC { Name:Korean; lang:ko-KR; SAMIType:CC; } --></STYLE>\n</HEAD>\n<BODY>\n${body}\n</BODY>\n</SAMI>\n`;
}
