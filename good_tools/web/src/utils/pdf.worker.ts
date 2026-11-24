import { PDFDocument } from 'pdf-lib';

function pageIndices(range: string, total: number) {
  const indices = new Set<number>();
  for (const part of range.split(',')) {
    const match = /^(\d+)(?:\s*-\s*(\d+))?$/.exec(part.trim());
    if (!match) throw Error('페이지 범위를 확인하세요. / Invalid page range.');
    const start = Number(match[1]), end = Number(match[2] ?? start);
    if (start < 1 || end > total || end < start) throw Error('범위 초과 / Page outside document.');
    for (let i = start; i <= end; i++) indices.add(i - 1);
  }
  return Array.from(indices);
}

self.onmessage = async ({ data: { mode, files, range } }: MessageEvent<{mode:string; files:File[]; range:string}>) => {
  try {
    if (!files.length || files.reduce((n,f)=>n+f.size,0) > 32*1024*1024) throw Error('합계 32 MiB 이하의 파일을 선택하세요. / Select up to 32 MiB.');
    if (mode === 'inspect') {
      self.postMessage({ pages: (await PDFDocument.load(await files[0].arrayBuffer())).getPageCount() });
      return;
    }
    const out = await PDFDocument.create();
    for (const [i,file] of files.entries()) {
      const bytes = await file.arrayBuffer();
      if (mode === 'img2pdf') {
        const img = file.type === 'image/png' ? await out.embedPng(bytes) : await out.embedJpg(bytes);
        out.addPage([img.width,img.height]).drawImage(img);
      } else {
        const src = await PDFDocument.load(bytes);
        const pages = mode === 'split' ? pageIndices(range, src.getPageCount()) : src.getPageIndices();
        for (const page of await out.copyPages(src, pages)) out.addPage(page);
      }
      self.postMessage({ progress: Math.floor(90*(i+1)/files.length) });
    }
    self.postMessage({ blob: new Blob([await out.save() as BlobPart], {type:'application/pdf'}) });
  } catch (e) { self.postMessage({ error: e instanceof Error ? e.message : 'PDF error' }); }
};
