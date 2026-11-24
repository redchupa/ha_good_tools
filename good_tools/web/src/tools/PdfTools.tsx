import { useText } from '../hooks/language';
import { downloadBlob } from '../utils/download';
import { useEffect, useRef, useState } from 'react';
import { Upload, Download, Trash2 } from 'lucide-react';

export default function PdfTools() {
  const t = useText();
  const [tab, setTab] = useState<'merge' | 'split' | 'img2pdf'>('merge');
  const [files, setFiles] = useState<File[]>([]);
  const [splitFile, setSplitFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageRange, setPageRange] = useState('1-2');
  const [imgFiles, setImgFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState('');
  const [result, setResult] = useState<{ blob:Blob; name:string } | null>(null);
  const worker = useRef<Worker | null>(null);
  useEffect(() => () => worker.current?.terminate(), []);
  useEffect(() => {
    if (!splitFile) { setPreview(''); return; }
    const url = URL.createObjectURL(splitFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [splitFile]);
  const cancel = () => { worker.current?.terminate(); worker.current = null; setBusy(false); };
  const process = (mode:string, input:File[], name = '') => {
    cancel(); setMsg(''); setResult(null); setProgress(0);
    if (input.reduce((n,f)=>n+f.size,0) > 32*1024*1024) return setMsg('합계 32 MiB 이하의 파일을 선택하세요. / Select up to 32 MiB.');
    const task = new Worker(new URL('../utils/pdf.worker.ts', import.meta.url), { type: 'module' });
    worker.current = task; setBusy(true);
    task.onerror = () => { setMsg('PDF 처리 실패 / Try a smaller file.'); cancel(); };
    task.onmessage = ({ data }) => {
      if (worker.current !== task) return;
      if (data.progress !== undefined) { setProgress(data.progress); return; }
      cancel();
      if (data.error) setMsg(data.error);
      else if (data.pages !== undefined) {
        setPageCount(data.pages);
        setPageRange('1-' + Math.min(2,data.pages));
      } else setResult({ blob:data.blob, name });
    };
    task.postMessage({ mode, files:input, range:pageRange });
  };
  const handleMerge = () => process('merge', files, 'merged.pdf');
  const handleSplit = () => splitFile && process('split', [splitFile], 'extracted-' + splitFile.name);
  const handleImgToPdf = () => process('img2pdf', imgFiles, 'images.pdf');
  const onSelectSplit = (file:File) => {
    setPageCount(0);
    setSplitFile(file.size <= 32*1024*1024 ? file : null);
    process('inspect', [file]);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ['merge', t('PDF 병합','Merge PDFs')],
            ['split', t('PDF 페이지 추출','Extract pages')],
            ['img2pdf', t('이미지 → PDF','Images to PDF')],
          ] as const
        ).map(([t, label]) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              cancel(); setResult(null); setTab(t);
              setMsg('');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-medium cursor-pointer ${
              tab === t ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'merge' && (
        <div className="space-y-4">
          <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 cursor-pointer bg-slate-50 dark:bg-slate-800/40">
            <Upload className="w-6 h-6 text-indigo-500" />
            <span className="text-sm font-medium">{t('병합할 PDF 파일 여러 개를 선택하세요 (100% 로컬 처리)','Choose PDFs to merge on this device.')}</span>
            <input
              type="file"
              accept="application/pdf"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && setFiles((prev) => [...prev, ...Array.from(e.target.files!)])}
            />
          </label>
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                  <span>{i + 1}. {f.name} ({(f.size / 1024).toFixed(1)} KB)</span>
                  <button type="button" onClick={() => setFiles(files.filter((_, idx) => idx !== i))} className="text-rose-500 p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleMerge}
                disabled={files.length < 2 || busy}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium disabled:opacity-40 cursor-pointer"
              >
                <Download className="w-4 h-4" /> {busy ? t('병합 중...','Merging…') : t('병합 후 다운로드','Merge files')}
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'split' && (
        <div className="space-y-4">
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => e.target.files?.[0] && onSelectSplit(e.target.files[0])}
            className="text-sm"
          />
          {splitFile && (
            <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="text-xs text-slate-500">
                선택 파일: <strong>{splitFile.name}</strong> (총 {pageCount}페이지)
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={pageRange}
                  onChange={(e) => setPageRange(e.target.value)}
                  placeholder="예: 1-3, 5, 7-8"
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={handleSplit}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium cursor-pointer"
                >
                  <Download className="w-4 h-4" /> 선택 페이지 추출
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'img2pdf' && (
        <div className="space-y-4">
          <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 cursor-pointer bg-slate-50 dark:bg-slate-800/40">
            <Upload className="w-6 h-6 text-indigo-500" />
            <span className="text-sm font-medium">{t('PDF로 합칠 PNG / JPG 이미지를 선택하세요','Choose PNG or JPEG images.')}</span>
            <input
              type="file"
              accept="image/png,image/jpeg"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && setImgFiles(Array.from(e.target.files))}
            />
          </label>
          {imgFiles.length > 0 && (
            <button
              type="button"
              onClick={handleImgToPdf}
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium cursor-pointer"
            >
              <Download className="w-4 h-4" /> 이미지 {imgFiles.length}장 → PDF 저장
            </button>
          )}
        </div>
      )}

      {tab === 'split' && preview && pageCount > 0 && <details><summary>선택 페이지 미리보기 / Page preview</summary>
        <iframe title="PDF preview" sandbox="" className="h-72 w-full" src={preview + '#page=' + Math.min(pageCount, Math.max(1,parseInt(pageRange) || 1))} />
      </details>}
      {busy && <div><progress value={progress} max={100} /> <button onClick={cancel}>취소 / Cancel</button></div>}
      {result && <button className="rounded-lg border px-3 py-2" onClick={()=>downloadBlob(result.blob,result.name)}>저장 / Save {result.name} ({Math.ceil(result.blob.size/1024)} KiB)</button>}
      {msg && <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 text-xs font-medium">{msg}</div>}
    </div>
  );
}
