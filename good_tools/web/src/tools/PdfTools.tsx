import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Upload, Download, Trash2 } from 'lucide-react';

function downloadBytes(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

export default function PdfTools() {
  const [tab, setTab] = useState<'merge' | 'split' | 'img2pdf'>('merge');
  const [files, setFiles] = useState<File[]>([]);
  const [splitFile, setSplitFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageRange, setPageRange] = useState('1-2');
  const [imgFiles, setImgFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const handleMerge = async () => {
    if (files.length < 2) return;
    setBusy(true);
    setMsg('');
    try {
      const merged = await PDFDocument.create();
      for (const f of files) {
        const doc = await PDFDocument.load(await f.arrayBuffer());
        const copied = await merged.copyPages(doc, doc.getPageIndices());
        copied.forEach((p) => merged.addPage(p));
      }
      downloadBytes(await merged.save(), 'merged.pdf');
      setMsg(`총 ${files.length}개 PDF 병합 완료!`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'PDF 병합 오류');
    } finally {
      setBusy(false);
    }
  };

  const onSelectSplit = async (file: File) => {
    setSplitFile(file);
    setMsg('');
    try {
      const doc = await PDFDocument.load(await file.arrayBuffer());
      setPageCount(doc.getPageCount());
      setPageRange(`1-${Math.min(2, doc.getPageCount())}`);
    } catch {
      setMsg('PDF 파일을 읽을 수 없습니다.');
    }
  };

  const handleSplit = async () => {
    if (!splitFile) return;
    setBusy(true);
    setMsg('');
    try {
      const src = await PDFDocument.load(await splitFile.arrayBuffer());
      const total = src.getPageCount();
      const indices: number[] = [];
      for (const part of pageRange.split(',').map((s) => s.trim()).filter(Boolean)) {
        if (part.includes('-')) {
          const [s, e] = part.split('-').map(Number);
          for (let p = Math.max(1, s); p <= Math.min(total, e); p++) indices.push(p - 1);
        } else {
          const p = Number(part);
          if (p >= 1 && p <= total) indices.push(p - 1);
        }
      }
      if (indices.length === 0) throw new Error('추출할 페이지 범위가 올바르지 않습니다.');
      const out = await PDFDocument.create();
      const copied = await out.copyPages(src, indices);
      copied.forEach((p) => out.addPage(p));
      downloadBytes(await out.save(), `extracted-${splitFile.name}`);
      setMsg(`${indices.length}페이지 추출 완료!`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'PDF 분할 오류');
    } finally {
      setBusy(false);
    }
  };

  const handleImgToPdf = async () => {
    if (imgFiles.length === 0) return;
    setBusy(true);
    setMsg('');
    try {
      const doc = await PDFDocument.create();
      for (const f of imgFiles) {
        const bytes = await f.arrayBuffer();
        const img = f.type === 'image/png' ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
        const page = doc.addPage([img.width, img.height]);
        page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
      }
      downloadBytes(await doc.save(), 'images.pdf');
      setMsg(`이미지 ${imgFiles.length}장을 PDF로 변환 완료!`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'PNG/JPG 이미지만 지원합니다.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ['merge', 'PDF 병합'],
            ['split', 'PDF 페이지 추출'],
            ['img2pdf', '이미지 → PDF'],
          ] as const
        ).map(([t, label]) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTab(t);
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
            <span className="text-sm font-medium">병합할 PDF 파일 여러 개를 선택하세요 (100% 로컬 처리)</span>
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
                <Download className="w-4 h-4" /> {busy ? '병합 중...' : '병합 후 다운로드'}
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
            <span className="text-sm font-medium">PDF로 합칠 PNG / JPG 이미지를 선택하세요</span>
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

      {msg && <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 text-xs font-medium">{msg}</div>}
    </div>
  );
}
