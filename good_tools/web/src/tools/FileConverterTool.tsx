import { useEffect, useRef, useState } from 'react';
import { Upload, Download, FileArchive, X } from 'lucide-react';
import { zipSync } from 'fflate';
import { useText } from '../hooks/language';
import { downloadBlob } from '../utils/download';
import { openPdf, renderPdfPage, parsePageRange, PdfPasswordError } from '../utils/pdfRender';
import { drawImage, canvasToBlob, baseName, FORMAT_EXT, type ImageFormat } from '../utils/imageConvert';

type Mode = 'pdf2img' | 'img2img' | 'img2pdf';
interface Output { name: string; blob: Blob; url: string; note?: string }

const MAX_PDF_BYTES = 64 * 1024 * 1024;
const MAX_PAGES = 300;
const A4: [number, number] = [595.28, 841.89];

export default function FileConverterTool() {
  const t = useText();
  const [mode, setMode] = useState<Mode>('pdf2img');
  const [files, setFiles] = useState<File[]>([]);
  const [format, setFormat] = useState<ImageFormat>('image/png');
  const [quality, setQuality] = useState(90);
  const [dpi, setDpi] = useState(150);
  const [range, setRange] = useState('');
  const [password, setPassword] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);
  const [scale, setScale] = useState(100);
  const [maxWidth, setMaxWidth] = useState('');
  const [pageSize, setPageSize] = useState<'image' | 'a4'>('image');
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState('');
  const run = useRef(0);

  // Object URLs keep their blobs alive, so they are tracked outside React state and released on
  // reset and when the tool closes (state updaters no longer run after unmount).
  const urls = useRef(new Set<string>());
  const clearOutputs = () => {
    urls.current.forEach(url => URL.revokeObjectURL(url));
    urls.current.clear();
    setOutputs([]);
  };
  useEffect(() => () => {
    run.current++;
    urls.current.forEach(url => URL.revokeObjectURL(url));
    urls.current.clear();
  }, []);

  const reset = (next: Mode) => {
    run.current++;
    setMode(next); setFiles([]); setError(''); setProgress(null); setNeedsPassword(false); setPassword('');
    setFormat(next === 'img2img' ? 'image/jpeg' : 'image/png');
    clearOutputs();
  };
  const pick = (list: FileList | null) => {
    run.current++;
    setFiles(Array.from(list || []));
    setError(''); setProgress(null); setNeedsPassword(false);
    clearOutputs();
  };
  const cancel = () => { run.current++; setProgress(null); setError(t('취소했습니다. 만들어진 파일은 아래에 남아 있습니다.', 'Cancelled. Finished files are kept below.')); };
  const add = (output: Omit<Output, 'url'>) => {
    const url = URL.createObjectURL(output.blob);
    urls.current.add(url);
    setOutputs(prev => [...prev, { ...output, url }]);
  };

  async function convert() {
    const id = ++run.current;
    const alive = () => run.current === id;
    setError(''); clearOutputs();
    try {
      if (mode === 'pdf2img') await pdfToImages(alive);
      else if (mode === 'img2img') await imagesToImages(alive);
      else await imagesToPdf(alive);
    } catch (err) {
      if (!alive()) return;
      if (err instanceof PdfPasswordError) setNeedsPassword(true);
      setError(err instanceof Error ? err.message : t('변환하지 못했습니다.', 'Conversion failed.'));
    } finally {
      if (alive()) setProgress(null);
    }
  }

  async function pdfToImages(alive: () => boolean) {
    const file = files[0];
    if (file.size > MAX_PDF_BYTES) throw new Error(t('PDF는 64 MiB까지 변환할 수 있습니다.', 'PDFs up to 64 MiB are supported.'));
    const { doc, close } = await openPdf(await file.arrayBuffer(), password);
    try {
      setNeedsPassword(false);
      const pages = parsePageRange(range, doc.numPages);
      if (pages.length > MAX_PAGES) throw new Error(t(`한 번에 ${MAX_PAGES}페이지까지 변환할 수 있습니다. 범위를 나눠 주세요.`, `Convert up to ${MAX_PAGES} pages at a time.`));
      const width = String(pages.at(-1)).length;
      for (const [i, page] of pages.entries()) {
        if (!alive()) return;
        setProgress({ done: i, total: pages.length });
        const { canvas, reduced } = await renderPdfPage(doc, page, { dpi });
        const blob = await canvasToBlob(canvas, format, quality / 100);
        if (!alive()) return;
        add({ name: `${baseName(file.name)}-p${String(page).padStart(width, '0')}.${FORMAT_EXT[format]}`, blob,
          note: reduced ? t('기기 한도로 해상도를 낮췄습니다', 'Resolution reduced to fit this device') : undefined });
      }
    } finally {
      close();
    }
  }

  async function imagesToImages(alive: () => boolean) {
    const width = Number(maxWidth) || undefined;
    for (const [i, file] of files.entries()) {
      if (!alive()) return;
      setProgress({ done: i, total: files.length });
      const { canvas, reduced } = await drawImage(file, { scale: scale / 100, maxWidth: width, background: format === 'image/jpeg' ? '#ffffff' : undefined });
      const blob = await canvasToBlob(canvas, format, quality / 100);
      if (!alive()) return;
      add({ name: `${baseName(file.name)}.${FORMAT_EXT[format]}`, blob,
        note: reduced && !width ? t('기기 한도로 크기를 줄였습니다', 'Reduced to fit this device') : undefined });
    }
  }

  async function imagesToPdf(alive: () => boolean) {
    const { PDFDocument } = await import('pdf-lib');
    const pdf = await PDFDocument.create();
    for (const [i, file] of files.entries()) {
      if (!alive()) return;
      setProgress({ done: i, total: files.length });
      // Re-encode through a canvas: any browser-readable format works and memory stays bounded.
      const { canvas } = await drawImage(file, { background: '#ffffff', maxWidth: 4000 });
      const w = canvas.width, h = canvas.height;
      const jpeg = await pdf.embedJpg(await (await canvasToBlob(canvas, 'image/jpeg', quality / 100)).arrayBuffer());
      if (pageSize === 'a4') {
        const [pw, ph] = w > h ? [A4[1], A4[0]] : A4;
        const fit = Math.min((pw - 48) / w, (ph - 48) / h);
        pdf.addPage([pw, ph]).drawImage(jpeg, { x: (pw - w * fit) / 2, y: (ph - h * fit) / 2, width: w * fit, height: h * fit });
      } else {
        // 96 px per inch, as images appear on screen.
        pdf.addPage([w * 0.75, h * 0.75]).drawImage(jpeg, { x: 0, y: 0, width: w * 0.75, height: h * 0.75 });
      }
    }
    if (!alive()) return;
    const bytes = await pdf.save();
    add({ name: `${files.length === 1 ? baseName(files[0].name) : 'images'}.pdf`, blob: new Blob([bytes as BlobPart], { type: 'application/pdf' }) });
  }

  const saveZip = async () => {
    const entries: Record<string, [Uint8Array, { level: 0 }]> = {};
    for (const o of outputs) entries[o.name] = [new Uint8Array(await o.blob.arrayBuffer()), { level: 0 }];
    const zip = zipSync(entries);
    downloadBlob(new Blob([zip as BlobPart], { type: 'application/zip' }), `${baseName(files[0]?.name || 'converted')}-${FORMAT_EXT[format]}.zip`);
  };

  const accept = mode === 'pdf2img' ? 'application/pdf,.pdf' : 'image/*,.svg,.heic,.heif';
  const busy = progress !== null;
  const chip = (active: boolean) => `px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${active ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`;
  const field = 'px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs';
  const totalSize = outputs.reduce((n, o) => n + o.blob.size, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="tablist">
        {([
          ['pdf2img', t('PDF → 이미지 (JPG·PNG)', 'PDF → images')],
          ['img2img', t('이미지 형식·크기 변환', 'Convert images')],
          ['img2pdf', t('이미지 → PDF', 'Images → PDF')],
        ] as [Mode, string][]).map(([m, label]) => (
          <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => reset(m)} className={chip(mode === m)}>{label}</button>
        ))}
      </div>

      <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 cursor-pointer bg-slate-50 dark:bg-slate-800/40">
        <Upload className="w-6 h-6 text-indigo-500" />
        <span className="text-sm font-medium">
          {mode === 'pdf2img' ? t('PDF 파일 선택', 'Choose a PDF') : t('이미지 파일 선택 (여러 개 가능)', 'Choose images (several allowed)')}
        </span>
        <span className="text-xs text-slate-400 text-center">
          {mode === 'pdf2img'
            ? t('업로드 없이 이 기기에서 변환합니다 · 64 MiB까지', 'Converted on this device · up to 64 MiB')
            : t('PNG·JPG·WebP·GIF·BMP·SVG (HEIC는 Safari) · 이 기기에서 변환', 'PNG, JPG, WebP, GIF, BMP, SVG (HEIC on Safari) · on this device')}
        </span>
        <input type="file" accept={accept} multiple={mode !== 'pdf2img'} className="hidden" onChange={(e) => pick(e.target.files)} />
      </label>

      {files.length > 0 && (
        <div className="text-xs text-slate-500">
          {files.length === 1 ? files[0].name : t(`${files.length}개 파일`, `${files.length} files`)} · {(files.reduce((n, f) => n + f.size, 0) / 1024 / 1024).toFixed(2)} MiB
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
        {mode !== 'img2pdf' && (
          <label className="text-xs space-y-1">
            <span className="block text-slate-500">{t('출력 형식', 'Output format')}</span>
            <select value={format} onChange={(e) => setFormat(e.target.value as ImageFormat)} className={field}>
              <option value="image/png">PNG</option>
              <option value="image/jpeg">JPG</option>
              <option value="image/webp">WebP</option>
            </select>
          </label>
        )}
        {(format !== 'image/png' || mode === 'img2pdf') && (
          <label className="text-xs space-y-1">
            <span className="block text-slate-500">{t('품질', 'Quality')} {quality}%</span>
            <input type="range" min={40} max={100} value={quality} onChange={(e) => setQuality(Number(e.target.value))} />
          </label>
        )}
        {mode === 'pdf2img' && (
          <>
            <label className="text-xs space-y-1">
              <span className="block text-slate-500">{t('해상도', 'Resolution')}</span>
              <select value={dpi} onChange={(e) => setDpi(Number(e.target.value))} className={field}>
                <option value={72}>72 DPI ({t('화면용', 'screen')})</option>
                <option value={150}>150 DPI ({t('기본', 'default')})</option>
                <option value={300}>300 DPI ({t('인쇄용', 'print')})</option>
              </select>
            </label>
            <label className="text-xs space-y-1">
              <span className="block text-slate-500">{t('페이지 (비우면 전체)', 'Pages (blank = all)')}</span>
              <input value={range} onChange={(e) => setRange(e.target.value)} placeholder="1-3, 5" className={field + ' w-28 font-mono'} />
            </label>
            {needsPassword && (
              <label className="text-xs space-y-1">
                <span className="block text-slate-500">{t('PDF 비밀번호', 'PDF password')}</span>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={field + ' w-36'} autoComplete="off" />
              </label>
            )}
          </>
        )}
        {mode === 'img2img' && (
          <>
            <label className="text-xs space-y-1">
              <span className="block text-slate-500">{t('배율', 'Scale')} {scale}%</span>
              <input type="range" min={10} max={200} step={5} value={scale} onChange={(e) => setScale(Number(e.target.value))} />
            </label>
            <label className="text-xs space-y-1">
              <span className="block text-slate-500">{t('최대 너비(px, 선택)', 'Max width (px, optional)')}</span>
              <input inputMode="numeric" value={maxWidth} onChange={(e) => setMaxWidth(e.target.value.replace(/\D/g, ''))} placeholder="1920" className={field + ' w-24'} />
            </label>
          </>
        )}
        {mode === 'img2pdf' && (
          <label className="text-xs space-y-1">
            <span className="block text-slate-500">{t('페이지 크기', 'Page size')}</span>
            <select value={pageSize} onChange={(e) => setPageSize(e.target.value as 'image' | 'a4')} className={field}>
              <option value="image">{t('이미지 크기 그대로', 'Same as image')}</option>
              <option value="a4">{t('A4에 맞춤', 'Fit to A4')}</option>
            </select>
          </label>
        )}
        <button type="button" disabled={!files.length || busy} onClick={convert}
          className="ml-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium disabled:opacity-40 cursor-pointer">
          {t('변환', 'Convert')}
        </button>
      </div>

      {format === 'image/jpeg' && mode !== 'img2pdf' && (
        <p className="text-[11px] text-slate-400">{t('JPG는 투명 배경을 지원하지 않아 흰색으로 채웁니다.', 'JPG has no transparency; transparent areas become white.')}</p>
      )}

      {progress && (
        <div className="flex items-center gap-2 text-xs" role="status">
          <progress max={progress.total} value={progress.done} className="flex-1" />
          <span>{progress.done}/{progress.total}</span>
          <button type="button" onClick={cancel} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer">
            <X className="w-3 h-3" /> {t('취소', 'Cancel')}
          </button>
        </div>
      )}
      {error && <div role="alert" className="text-xs text-rose-500">{error}</div>}

      {outputs.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500">{t(`결과 ${outputs.length}개`, `${outputs.length} files`)} · {(totalSize / 1024 / 1024).toFixed(2)} MiB</span>
            {outputs.length > 1 && (
              <button type="button" onClick={saveZip} className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium cursor-pointer">
                <FileArchive className="w-3.5 h-3.5" /> {t('모두 ZIP으로 저장', 'Save all as ZIP')}
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {outputs.map(o => (
              <div key={o.url} className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900">
                {o.blob.type.startsWith('image/')
                  ? <img src={o.url} alt={o.name} loading="lazy" className="w-full h-32 object-contain bg-[repeating-conic-gradient(#e2e8f0_0_25%,#fff_0_50%)] bg-[length:16px_16px]" />
                  : <div className="h-32 flex items-center justify-center text-xs text-slate-400">PDF</div>}
                <div className="p-2 space-y-1">
                  <div className="text-[11px] font-mono break-all">{o.name}</div>
                  <div className="text-[10px] text-slate-400">{(o.blob.size / 1024).toFixed(1)} KiB{o.note ? ' · ' + o.note : ''}</div>
                  <button type="button" onClick={() => downloadBlob(o.blob, o.name)} className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 cursor-pointer">
                    <Download className="w-3.5 h-3.5" /> {t('저장', 'Save')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
