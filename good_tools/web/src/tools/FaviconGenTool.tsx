import { useText } from '../hooks/language';
import { useEffect, useState } from 'react';
import { Upload, Download } from 'lucide-react';

const SIZES = [
  { label: 'Favicon 32×32', w: 32, h: 32, filename: 'favicon-32x32.png' },
  { label: 'Apple Touch 180×180', w: 180, h: 180, filename: 'apple-touch-icon.png' },
  { label: 'HA App icon.png (256×256)', w: 256, h: 256, filename: 'icon.png' },
  { label: 'PWA Icon 512×512', w: 512, h: 512, filename: 'icon-512.png' },
];

export default function FaviconGenTool() {
  const ui = useText();
  const [srcUrl, setSrcUrl] = useState('');
  const [svgCode, setSvgCode] = useState(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" rx="28" fill="#4f46e5"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#fff" font-size="64" font-family="sans-serif" font-weight="bold">G</text></svg>`
  );

  useEffect(() => () => { if (srcUrl) URL.revokeObjectURL(srcUrl); }, [srcUrl]);

  const effectiveUrl =
    srcUrl || `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgCode)}`;

  const downloadSize = (w: number, h: number, filename: string) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = filename;
      a.click();
    };
    img.src = effectiveUrl;
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          <label className="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 cursor-pointer bg-slate-50 dark:bg-slate-800/40 text-xs font-medium">
            <Upload className="w-4 h-4 text-indigo-500" />
            {ui("이미지 파일 업로드 (PNG/JPG/SVG)", "Upload image (PNG/JPG/SVG)")}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) setSrcUrl(URL.createObjectURL(e.target.files[0]));
              }}
            />
          </label>
          <div className="text-xs font-semibold text-slate-500">{ui("또는 SVG 코드 직접 편집", "Or edit SVG code")}</div>
          <textarea
            rows={6}
            value={svgCode}
            onChange={(e) => {
              setSrcUrl('');
              setSvgCode(e.target.value);
            }}
            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs"
          />
        </div>

        <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 gap-4">
          <img src={effectiveUrl} alt="Icon Preview" className="w-32 h-32 rounded-2xl shadow-md bg-white p-1 object-contain" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
            {SIZES.map((s) => (
              <button
                key={s.filename}
                type="button"
                onClick={() => downloadSize(s.w, s.h, s.filename)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
