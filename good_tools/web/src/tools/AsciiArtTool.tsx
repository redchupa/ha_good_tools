import { useState, useRef } from 'react';
import { CopyButton } from '../components/CopyButton';

const FONT_5X5: Record<string, string[]> = {
  A: ['  #  ', ' # # ', '#####', '#   #', '#   #'],
  B: ['#### ', '#   #', '#### ', '#   #', '#### '],
  C: [' ####', '#    ', '#    ', '#    ', ' ####'],
  D: ['#### ', '#   #', '#   #', '#   #', '#### '],
  E: ['#####', '#    ', '#### ', '#    ', '#####'],
  F: ['#####', '#    ', '#### ', '#    ', '#    '],
  G: [' ####', '#    ', '#  ##', '#   #', ' ####'],
  H: ['#   #', '#   #', '#####', '#   #', '#   #'],
  I: ['#####', '  #  ', '  #  ', '  #  ', '#####'],
  J: ['#####', '   # ', '   # ', '#  # ', ' ##  '],
  K: ['#   #', '#  # ', '###  ', '#  # ', '#   #'],
  L: ['#    ', '#    ', '#    ', '#    ', '#####'],
  M: ['#   #', '## ##', '# # #', '#   #', '#   #'],
  N: ['#   #', '##  #', '# # #', '#  ##', '#   #'],
  O: [' ### ', '#   #', '#   #', '#   #', ' ### '],
  P: ['#### ', '#   #', '#### ', '#    ', '#    '],
  Q: [' ### ', '#   #', '# # #', '#  # ', ' ## #'],
  R: ['#### ', '#   #', '#### ', '#  # ', '#   #'],
  S: [' ####', '#    ', ' ### ', '    #', '#### '],
  T: ['#####', '  #  ', '  #  ', '  #  ', '  #  '],
  U: ['#   #', '#   #', '#   #', '#   #', ' ### '],
  V: ['#   #', '#   #', '#   #', ' # # ', '  #  '],
  W: ['#   #', '#   #', '# # #', '## ##', '#   #'],
  X: ['#   #', ' # # ', '  #  ', ' # # ', '#   #'],
  Y: ['#   #', ' # # ', '  #  ', '  #  ', '  #  '],
  Z: ['#####', '   # ', '  #  ', ' #   ', '#####'],
  '0': [' ### ', '#  ##', '# # #', '##  #', ' ### '],
  '1': ['  #  ', ' ##  ', '  #  ', '  #  ', '#####'],
  '2': ['#### ', '    #', ' ### ', '#    ', '#####'],
  '3': ['#### ', '    #', ' ### ', '    #', '#### '],
  '4': ['#   #', '#   #', '#####', '    #', '    #'],
  '5': ['#####', '#    ', '#### ', '    #', '#### '],
  '6': [' ####', '#    ', '#### ', '#   #', ' ### '],
  '7': ['#####', '    #', '   # ', '  #  ', '  #  '],
  '8': [' ### ', '#   #', ' ### ', '#   #', ' ### '],
  '9': [' ### ', '#   #', ' ####', '    #', '#### '],
  ' ': ['     ', '     ', '     ', '     ', '     '],
  '!': ['  #  ', '  #  ', '  #  ', '     ', '  #  '],
  '-': ['     ', '     ', '#####', '     ', '     '],
};

function renderBanner(text: string, fillChar: string): string {
  const ch = fillChar || '#';
  const rows = ['', '', '', '', ''];
  for (const raw of text.toUpperCase()) {
    const glyph = FONT_5X5[raw] || FONT_5X5[' '];
    for (let r = 0; r < 5; r++) {
      rows[r] += glyph[r].replace(/#/g, ch) + ' ';
    }
  }
  return rows.join('\n');
}

export default function AsciiArtTool() {
  const [mode, setMode] = useState<'text' | 'image'>('text');
  const [text, setText] = useState('HA TOOLS');
  const [fillChar, setFillChar] = useState('█');
  const [imgAscii, setImgAscii] = useState('');
  const [cols, setCols] = useState(72);
  const [invert, setInvert] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const textOutput = renderBanner(text, fillChar);

  const handleImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const aspect = img.height / img.width;
        const w = cols;
        const h = Math.max(10, Math.round(w * aspect * 0.5));
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, w, h);
        const { data } = ctx.getImageData(0, 0, w, h);
        const ramp = invert ? ' .:-=+*#%@' : '@%#*+=-:. ';
        const lines: string[] = [];
        for (let y = 0; y < h; y++) {
          let line = '';
          for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4;
            const lum = (0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]) / 255;
            line += ramp[Math.min(ramp.length - 1, Math.floor(lum * ramp.length))];
          }
          lines.push(line);
        }
        setImgAscii(lines.join('\n'));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const activeResult = mode === 'text' ? textOutput : imgAscii;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode('text')}
          className={`px-3.5 py-2 rounded-xl text-sm font-medium cursor-pointer ${
            mode === 'text'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          텍스트 배너
        </button>
        <button
          type="button"
          onClick={() => setMode('image')}
          className={`px-3.5 py-2 rounded-xl text-sm font-medium cursor-pointer ${
            mode === 'image'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          이미지 → ASCII 아트
        </button>
      </div>

      {mode === 'text' ? (
        <div className="flex flex-wrap gap-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="영문/숫자 입력 (예: HELLO 2026)"
            className="flex-1 min-w-[200px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:border-indigo-500"
          />
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">채움 문자:</span>
            {['█', '#', '@', '*', '■'].map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => setFillChar(ch)}
                className={`w-8 h-8 rounded-lg border font-mono cursor-pointer ${
                  fillChar === ch
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                {ch}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleImage(e.target.files[0])}
            className="text-sm"
          />
          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            너비({cols}자):
            <input
              type="range"
              min={30}
              max={120}
              value={cols}
              onChange={(e) => setCols(Number(e.target.value))}
            />
          </label>
          <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
            <input type="checkbox" checked={invert} onChange={(e) => setInvert(e.target.checked)} />
            명암 반전
          </label>
        </div>
      )}

      <div className="flex justify-end">
        <CopyButton text={activeResult} label="ASCII 복사" />
      </div>

      <pre className="p-4 rounded-xl bg-slate-950 text-emerald-400 font-mono text-[11px] sm:text-xs overflow-x-auto leading-tight min-h-[160px]">
        {activeResult || '이미지를 선택하거나 텍스트를 입력하면 여기에 표시됩니다.'}
      </pre>
    </div>
  );
}
