import { Diagnostic } from '../components/Diagnostic';
import { useText } from '../hooks/language';
import { useEffect, useRef, useState } from 'react';
import { Upload, Download, ShieldCheck } from 'lucide-react';

export default function ImageStudioTool() {
  const ui = useText();
  const [srcUrl, setSrcUrl] = useState('');
  const [origMeta, setOrigMeta] = useState<{ name: string; w: number; h: number; size: number } | null>(null);
  const [format, setFormat] = useState<'image/webp' | 'image/jpeg' | 'image/png'>('image/webp');
  const [quality, setQuality] = useState(0.85);
  const [scalePct, setScalePct] = useState(100);
  const [outUrl, setOutUrl] = useState('');
  const [outSize, setOutSize] = useState(0);

  const [error, setError] = useState('');
  const [source, setSource] = useState<File | null>(null);
  const revision = useRef(0);
  useEffect(() => () => { if (srcUrl) URL.revokeObjectURL(srcUrl); }, [srcUrl]);
  useEffect(() => () => { if (outUrl) URL.revokeObjectURL(outUrl); }, [outUrl]);

  const handleFile = (file: File) => {
    if (file.size > 16 * 1024 * 1024) return setError(ui('이미지는 16 MiB까지 지원합니다.', "Image files can be up to 16 MiB."));
    setSource(file);
    setSrcUrl(URL.createObjectURL(file));
  };
  useEffect(() => {
    if (!source || !srcUrl) return;
    const token = ++revision.current;
    const img = new Image();
    setError('');
    setOutUrl('');
    img.onerror = () => setError(ui('이미지를 읽을 수 없습니다.', "Could not read the image."));
    img.onload = () => {
      setOrigMeta({ name: source.name, w: img.width, h: img.height, size: source.size });
      const w = Math.max(1, Math.round(img.width * scalePct / 100));
      const h = Math.max(1, Math.round(img.height * scalePct / 100));
      if (w * h > 16000000 || Math.max(w,h) > 8192) return setError(ui('출력 크기를 줄여 주세요.', "Reduce the output dimensions."));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return setError(ui('이미지 메모리가 부족합니다.', "Not enough memory for this image."));
      if (format === 'image/jpeg') {
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, w, h);
      }
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(blob => {
        if (revision.current !== token) return;
        if (!blob) return setError(ui('이미지 변환에 실패했습니다.', "Image conversion failed."));
        setOutUrl(URL.createObjectURL(blob));
        setOutSize(blob.size);
      }, format, quality);
    };
    img.src = srcUrl;
    return () => { revision.current++; img.onload = null; img.onerror = null; };
  }, [srcUrl, source, format, quality, scalePct]);

  const ext = format === 'image/webp' ? 'webp' : format === 'image/jpeg' ? 'jpg' : 'png';
  const savedPct = origMeta && outSize ? Math.round(((origMeta.size - outSize) / origMeta.size) * 100) : 0;

  return (
    <div className="space-y-5">
      <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 cursor-pointer bg-slate-50 dark:bg-slate-800/40">
        <Upload className="w-6 h-6 text-indigo-500" />
        <span className="text-sm font-medium">{ui("변환/압축할 이미지를 선택하세요", "Choose an image to convert or compress")}</span>
        <span className="text-xs text-slate-400 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> {ui("Canvas 재인코딩으로 GPS·카메라 EXIF 메타데이터가 자동 제거됩니다", "Re-encoding removes GPS and camera EXIF metadata.")}
        </span>
        <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </label>

      {error && <p role="alert"><Diagnostic text={error} /></p>}
      {origMeta && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
            <label className="space-y-1">
              <span className="text-slate-500">{ui("출력 포맷", "Output format")}</span>
              <select
                value={format}
                onChange={(e) => {
                  const f = e.target.value as 'image/webp' | 'image/jpeg' | 'image/png';
                  setFormat(f);

                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                <option value="image/webp">{ui("WebP (최고 압축률)", "WebP (high compression)")}</option>
                <option value="image/jpeg">JPEG</option>
                <option value="image/png">{ui("PNG (무손실)", "PNG (lossless)")}</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-slate-500">{ui("품질:", "Quality:")} {Math.round(quality * 100)}%</span>
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.05}
                value={quality}
                onChange={(e) => {
                  const q = Number(e.target.value);
                  setQuality(q);

                }}
                className="w-full"
              />
            </label>
            <label className="space-y-1">
              <span className="text-slate-500">
                {ui("크기:", "Size:")} {scalePct}% ({Math.round((origMeta.w * scalePct) / 100)}×{Math.round((origMeta.h * scalePct) / 100)})
              </span>
              <input
                type="range"
                min={10}
                max={100}
                step={5}
                value={scalePct}
                onChange={(e) => {
                  const p = Number(e.target.value);
                  setScalePct(p);

                }}
                className="w-full"
              />
            </label>
          </div>

          {outUrl && (
            <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-500/10 flex flex-col items-center gap-4">
              <div className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                {ui("원본", "Original")} {(origMeta.size / 1024).toFixed(1)} {ui("KB → 결과", " KB → result")} {(outSize / 1024).toFixed(1)} KB ({savedPct >= 0 ? ui(`${savedPct}% 절감`, `${savedPct}% smaller`) : ui(`${Math.abs(savedPct)}% 증가`, `${Math.abs(savedPct)}% larger`)}{ui(") · EXIF 제거됨", ") · EXIF removed")}
              </div>
              <img src={outUrl} alt="Converted" className="max-h-72 rounded-xl shadow-sm" />
              <a
                href={outUrl}
                download={`${origMeta.name.replace(/\.[^.]+$/, '')}-clean.${ext}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium"
              >
                <Download className="w-4 h-4" /> {ui("변환 이미지 다운로드 (.", "Download converted image (.")}{ext})
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}
