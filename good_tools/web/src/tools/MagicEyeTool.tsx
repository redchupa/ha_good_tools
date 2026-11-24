import { useText } from '../hooks/language';
import { useEffect, useRef, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';

export default function MagicEyeTool() {
  const ui = useText();
  const [hiddenText, setHiddenText] = useState('HA 2026');
  const [stripWidth, setStripWidth] = useState(90);
  const [depthStrength, setDepthStrength] = useState(18);
  const [palette, setPalette] = useState<'ocean' | 'neon' | 'mono'>('ocean');
  const [seed, setSeed] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = 720;
    const H = 360;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    // 1. Render depth map on offscreen canvas
    const depthCanvas = document.createElement('canvas');
    depthCanvas.width = W;
    depthCanvas.height = H;
    const dctx = depthCanvas.getContext('2d')!;
    dctx.fillStyle = '#000000';
    dctx.fillRect(0, 0, W, H);
    dctx.fillStyle = '#ffffff';
    dctx.textAlign = 'center';
    dctx.textBaseline = 'middle';
    dctx.font = 'bold 120px sans-serif';
    dctx.fillText(hiddenText || '3D', W / 2, H / 2);
    const depthData = dctx.getImageData(0, 0, W, H).data;

    // 2. Generate autostereogram pixels
    const out = ctx.createImageData(W, H);
    const data = out.data;

    const pickColor = () => {
      if (palette === 'mono') {
        const v = Math.floor(Math.random() * 255);
        return [v, v, v];
      }
      if (palette === 'neon') {
        return [
          Math.floor(80 + Math.random() * 175),
          Math.floor(20 + Math.random() * 180),
          Math.floor(140 + Math.random() * 115),
        ];
      }
      return [
        Math.floor(15 + Math.random() * 70),
        Math.floor(80 + Math.random() * 140),
        Math.floor(130 + Math.random() * 125),
      ];
    };

    for (let y = 0; y < H; y++) {
      const rowColors: [number, number, number][] = new Array(W);
      for (let x = 0; x < W; x++) {
        const dVal = depthData[(y * W + x) * 4] / 255;
        const shift = Math.round(dVal * depthStrength);
        const sep = Math.max(20, stripWidth - shift);
        if (x < sep) {
          rowColors[x] = pickColor() as [number, number, number];
        } else {
          rowColors[x] = rowColors[x - sep];
        }
        const idx = (y * W + x) * 4;
        data[idx] = rowColors[x][0];
        data[idx + 1] = rowColors[x][1];
        data[idx + 2] = rowColors[x][2];
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(out, 0, 0);

    // Draw two helper focus dots at the top
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(W / 2 - stripWidth / 2, 18, 5, 0, Math.PI * 2);
    ctx.arc(W / 2 + stripWidth / 2, 18, 5, 0, Math.PI * 2);
    ctx.fill();
  }, [hiddenText, stripWidth, depthStrength, palette, seed]);

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'magiceye.png';
    a.click();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <input
          value={hiddenText}
          onChange={(e) => setHiddenText(e.target.value)}
          placeholder={ui("숨길 글자 (짧을수록 선명)", "Hidden text (shorter is clearer)")}
          className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
        />
        <select
          value={palette}
          onChange={(e) => setPalette(e.target.value as 'ocean' | 'neon' | 'mono')}
          className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
        >
          <option value="ocean">{ui("오션 블루 패턴", "Ocean blue pattern")}</option>
          <option value="neon">{ui("네온 퍼플 패턴", "Neon purple pattern")}</option>
          <option value="mono">{ui("모노크롬 패턴", "Monochrome pattern")}</option>
        </select>
        <label className="flex flex-col text-xs text-slate-500 justify-center">
          {ui("패턴 간격 (", "Pattern spacing (")}{stripWidth}px)
          <input type="range" min={60} max={140} value={stripWidth} onChange={(e) => setStripWidth(Number(e.target.value))} />
        </label>
        <label className="flex flex-col text-xs text-slate-500 justify-center">
          {ui("입체 깊이 (", "Depth (")}{depthStrength}px)
          <input type="range" min={8} max={32} value={depthStrength} onChange={(e) => setDepthStrength(Number(e.target.value))} />
        </label>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setSeed((s) => s + 1)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> {ui("패턴 재생성", "Regenerate pattern")}
        </button>
        <button
          type="button"
          onClick={downloadPng}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" /> {ui("PNG 저장", "Save PNG")}
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 p-2">
        <canvas ref={canvasRef} className="w-full max-w-[720px] mx-auto rounded-xl" />
      </div>
      <p className="text-xs text-slate-500">
        {ui("보는 방법: 상단의 흰 점 2개가 3개로 겹쳐 보이도록 초점을 화면 뒤쪽으로 맞추면 숨겨진 글자가 입체로 떠오릅니다.", "Focus behind the screen until the two white dots appear as three. The hidden text should come into view.")}
      </p>
    </div>
  );
}
