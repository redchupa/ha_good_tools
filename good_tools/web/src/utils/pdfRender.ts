import type { PDFDocumentProxy } from 'pdfjs-dist';

// pdf.js is about 1.7 MB, so it loads only when a PDF is actually opened.
let library: Promise<typeof import('pdfjs-dist')> | undefined;
function pdfjs() {
  library ??= Promise.all([import('pdfjs-dist'), import('pdfjs-dist/build/pdf.worker.min.mjs?url')])
    .then(([lib, worker]) => {
      lib.GlobalWorkerOptions.workerSrc = worker.default;
      return lib;
    });
  return library;
}

export class PdfPasswordError extends Error {
  constructor(readonly wrong: boolean) {
    super(wrong ? '비밀번호가 맞지 않습니다. / Wrong password.' : '비밀번호로 보호된 PDF입니다. / This PDF needs a password.');
  }
}

export interface OpenedPdf { doc: PDFDocumentProxy; close: () => void }

// The loading task owns the worker-side document, so closing goes through it.
export async function openPdf(data: ArrayBuffer, password = ''): Promise<OpenedPdf> {
  const lib = await pdfjs();
  const assets = new URL('./' + __PDFJS_ASSETS__ + '/', document.baseURI).href;
  const task = lib.getDocument({
    data: new Uint8Array(data),
    password: password || undefined,
    cMapUrl: assets + 'cmaps/',
    cMapPacked: true,
    standardFontDataUrl: assets + 'standard_fonts/',
    wasmUrl: assets + 'wasm/',
  });
  try {
    return { doc: await task.promise, close: () => { void task.destroy(); } };
  } catch (err) {
    void task.destroy();
    if ((err as { name?: string })?.name === 'PasswordException') {
      throw new PdfPasswordError((err as { code?: number }).code === 2);
    }
    throw new Error('PDF를 열 수 없습니다. 손상되었거나 지원하지 않는 파일입니다. / Could not open this PDF.');
  }
}

// iOS Safari refuses canvases above about 16.7 million pixels, so every page is capped there.
export const MAX_CANVAS_PIXELS = 16_000_000;

export interface RenderOptions { dpi: number; background?: string }

export async function renderPdfPage(doc: PDFDocumentProxy, pageNumber: number, { dpi, background = '#ffffff' }: RenderOptions) {
  const page = await doc.getPage(pageNumber);
  try {
    let scale = dpi / 72;
    const base = page.getViewport({ scale: 1 });
    const pixels = base.width * base.height * scale * scale;
    if (pixels > MAX_CANVAS_PIXELS) scale *= Math.sqrt(MAX_CANVAS_PIXELS / pixels);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    await page.render({ canvas, viewport, background }).promise;
    return { canvas, reduced: scale < dpi / 72 };
  } finally {
    page.cleanup();
  }
}

// Page list such as "1-3, 5". Empty means every page.
export function parsePageRange(range: string, total: number) {
  if (!range.trim()) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>();
  for (const part of range.split(',')) {
    const match = /^\s*(\d+)\s*(?:-\s*(\d+)\s*)?$/.exec(part);
    if (!match) throw new Error('페이지 범위를 확인하세요 (예: 1-3, 5). / Check the page range.');
    const start = Number(match[1]), end = Number(match[2] ?? match[1]);
    if (start < 1 || end > total || end < start) throw new Error(`1~${total} 사이로 입력하세요. / Use pages 1–${total}.`);
    for (let p = start; p <= end; p++) pages.add(p);
  }
  return [...pages].sort((a, b) => a - b);
}
