import { useEffect, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { openPdf, renderPdfPage } from '../utils/pdfRender';
import { useText } from '../hooks/language';

// Draws one page with pdf.js. Browser PDF viewers are unavailable in sandboxed frames and in the
// Android Companion WebView, so an image is the only preview that works everywhere.
export function PdfPagePreview({ file, page }: { file: File; page: number }) {
  const t = useText();
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [image, setImage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    let close = () => {};
    setDoc(null); setImage(''); setError('');
    file.arrayBuffer().then(data => openPdf(data)).then(opened => {
      close = opened.close;
      if (active) setDoc(opened.doc); else close();
    }).catch(e => { if (active) setError(e instanceof Error ? e.message : String(e)); });
    return () => { active = false; close(); };
  }, [file]);

  useEffect(() => {
    if (!doc) return;
    let active = true;
    let url = '';
    const target = Math.min(Math.max(1, page), doc.numPages);
    renderPdfPage(doc, target, { dpi: 72 * Math.min(2, window.devicePixelRatio || 1) })
      .then(({ canvas }) => new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png')))
      .then(blob => {
        if (!active || !blob) return;
        url = URL.createObjectURL(blob);
        setImage(url);
      })
      .catch(e => { if (active) setError(e instanceof Error ? e.message : String(e)); });
    return () => { active = false; if (url) URL.revokeObjectURL(url); };
  }, [doc, page]);

  if (error) return <p role="alert" className="text-xs text-rose-500">{error}</p>;
  if (!image) return <p className="text-xs text-slate-400 animate-pulse">{t('미리보기를 만드는 중…', 'Rendering preview…')}</p>;
  return <img src={image} alt={t(`${page}페이지 미리보기`, `Page ${page} preview`)} className="max-h-80 mx-auto border border-slate-200 dark:border-slate-700 rounded-lg bg-white" />;
}
