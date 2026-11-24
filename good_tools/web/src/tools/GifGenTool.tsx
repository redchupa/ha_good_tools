import { useState } from 'react';
import { GIFEncoder, quantize, applyPalette } from 'gifenc';
import { Upload, Download, Trash2, ArrowUp, ArrowDown, Play } from 'lucide-react';

interface FrameItem {
  id: string;
  name: string;
  url: string;
}

export default function GifGenTool() {
  const [frames, setFrames] = useState<FrameItem[]>([]);
  const [delayMs, setDelayMs] = useState(400);
  const [width, setWidth] = useState(480);
  const [gifUrl, setGifUrl] = useState('');
  const [busy, setBusy] = useState(false);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const added: FrameItem[] = [];
    for (const f of Array.from(fileList)) {
      if (!f.type.startsWith('image/')) continue;
      added.push({ id: `${Date.now()}-${Math.random()}`, name: f.name, url: URL.createObjectURL(f) });
    }
    setFrames((prev) => [...prev, ...added]);
  };

  const moveFrame = (idx: number, dir: -1 | 1) => {
    const next = [...frames];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setFrames(next);
  };

  const generateGif = async () => {
    if (frames.length < 2) return;
    setBusy(true);
    try {
      const imgs = await Promise.all(
        frames.map(
          (f) =>
            new Promise<HTMLImageElement>((resolve, reject) => {
              const img = new Image();
              img.onload = () => resolve(img);
              img.onerror = reject;
              img.src = f.url;
            })
        )
      );

      const first = imgs[0];
      const targetW = Math.min(width, 960);
      const targetH = Math.round((first.height / first.width) * targetW);
      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

      const gif = GIFEncoder();
      for (const img of imgs) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetW, targetH);
        ctx.drawImage(img, 0, 0, targetW, targetH);
        const { data } = ctx.getImageData(0, 0, targetW, targetH);
        const palette = quantize(data, 256);
        const index = applyPalette(data, palette);
        gif.writeFrame(index, targetW, targetH, { palette, delay: delayMs });
      }
      gif.finish();

      const blob = new Blob([gif.bytes()], { type: 'image/gif' });
      if (gifUrl) URL.revokeObjectURL(gifUrl);
      setGifUrl(URL.createObjectURL(blob));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 cursor-pointer bg-slate-50 dark:bg-slate-800/40 transition-colors">
        <Upload className="w-6 h-6 text-indigo-500" />
        <span className="text-sm font-medium">이미지 여러 장을 선택하거나 클릭해 추가하세요 (최소 2장)</span>
        <span className="text-xs text-slate-400">PNG, JPG, WebP 지원 · 모든 처리는 브라우저 내에서 로컬로 수행됩니다</span>
        <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      </label>

      {frames.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <label className="text-xs font-medium flex items-center gap-2">
              프레임 간격: <strong>{delayMs}ms</strong>
              <input type="range" min={80} max={2000} step={20} value={delayMs} onChange={(e) => setDelayMs(Number(e.target.value))} />
            </label>
            <label className="text-xs font-medium flex items-center gap-2">
              출력 너비: <strong>{width}px</strong>
              <input type="range" min={160} max={800} step={40} value={width} onChange={(e) => setWidth(Number(e.target.value))} />
            </label>
            <button
              type="button"
              onClick={generateGif}
              disabled={frames.length < 2 || busy}
              className="ml-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium disabled:opacity-40 cursor-pointer"
            >
              <Play className="w-4 h-4" />
              {busy ? '생성 중...' : `GIF 생성 (${frames.length}프레임)`}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {frames.map((f, idx) => (
              <div key={f.id} className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900">
                <img src={f.url} alt={f.name} className="w-full h-24 object-cover" />
                <div className="p-2 flex items-center justify-between gap-1">
                  <span className="text-[11px] font-mono text-slate-500">#{idx + 1}</span>
                  <div className="flex items-center gap-0.5">
                    <button type="button" onClick={() => moveFrame(idx, -1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"><ArrowUp className="w-3 h-3" /></button>
                    <button type="button" onClick={() => moveFrame(idx, 1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"><ArrowDown className="w-3 h-3" /></button>
                    <button type="button" onClick={() => setFrames(frames.filter((x) => x.id !== f.id))} className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/15 rounded"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {gifUrl && (
        <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-500/10 flex flex-col items-center gap-4">
          <img src={gifUrl} alt="Generated GIF" className="max-w-full rounded-xl shadow-md" />
          <a
            href={gifUrl}
            download="good-tools-animation.gif"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            GIF 다운로드
          </a>
        </div>
      )}
    </div>
  );
}
