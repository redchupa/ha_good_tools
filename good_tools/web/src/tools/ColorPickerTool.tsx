import { useState } from 'react';
import { CopyButton } from '../components/CopyButton';

function hexToRgb(hex: string) {
  const clean = hex.replace('#', '');
  const n = parseInt(clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function luminance(r: number, g: number, b: number) {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function contrastRatio(hex1: string, hex2: string) {
  const c1 = hexToRgb(hex1);
  const c2 = hexToRgb(hex2);
  const l1 = luminance(c1.r, c1.g, c1.b);
  const l2 = luminance(c2.r, c2.g, c2.b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

const SWATCHES = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#10b981',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899',
  '#0f172a', '#475569', '#94a3b8', '#f8fafc',
];

export default function ColorPickerTool() {
  const [hex, setHex] = useState('#4f46e5');
  const [bgHex, setBgHex] = useState('#ffffff');

  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const rgbStr = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  const hslStr = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
  const ratio = contrastRatio(hex, bgHex);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              type="color"
              value={hex}
              onChange={(e) => setHex(e.target.value)}
              className="w-20 h-20 rounded-2xl border border-slate-200 dark:border-slate-700 cursor-pointer"
            />
            <div className="space-y-1.5 flex-1">
              <div className="text-xs text-slate-500">HEX 코드</div>
              <input
                value={hex}
                onChange={(e) => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && setHex(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-sm uppercase"
              />
            </div>
          </div>

          <div className="space-y-2">
            {[
              ['HEX', hex.toUpperCase()],
              ['RGB', rgbStr],
              ['HSL', hslStr],
            ].map(([label, val]) => (
              <div key={label} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                <span className="font-semibold text-slate-500 w-10">{label}</span>
                <span className="font-mono flex-1">{val}</span>
                <CopyButton text={val} />
              </div>
            ))}
          </div>
        </div>

        {/* WCAG Contrast Checker */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">WCAG 명암비 검사</span>
            <label className="flex items-center gap-1.5 text-xs">
              배경색:
              <input type="color" value={bgHex} onChange={(e) => setBgHex(e.target.value)} className="w-6 h-6 rounded cursor-pointer" />
            </label>
          </div>
          <div className="p-5 rounded-xl border border-slate-200 text-center space-y-1" style={{ backgroundColor: bgHex, color: hex }}>
            <div className="text-xl font-bold">가독성 미리보기 AaBbCc</div>
            <div className="text-xs">본문 텍스트 크기에서의 색상 대비를 확인하세요.</div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono font-bold text-base">{ratio.toFixed(2)} : 1</span>
            <div className="flex gap-1.5">
              <span className={`px-2 py-0.5 rounded-full font-semibold ${ratio >= 4.5 ? 'bg-emerald-500/15 text-emerald-600' : 'bg-rose-500/15 text-rose-500'}`}>
                AA {ratio >= 4.5 ? '통과' : '미달'}
              </span>
              <span className={`px-2 py-0.5 rounded-full font-semibold ${ratio >= 7 ? 'bg-emerald-500/15 text-emerald-600' : 'bg-rose-500/15 text-rose-500'}`}>
                AAA {ratio >= 7 ? '통과' : '미달'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold text-slate-500 mb-2">빠른 팔레트 (Tailwind)</div>
        <div className="grid grid-cols-8 sm:grid-cols-16 gap-2">
          {SWATCHES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setHex(s)}
              title={s}
              className="h-9 rounded-lg border border-slate-300/60 cursor-pointer hover:scale-105 transition-transform"
              style={{ backgroundColor: s }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
