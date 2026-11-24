import { MAX_CANVAS_PIXELS } from './pdfRender';

export type ImageFormat = 'image/png' | 'image/jpeg' | 'image/webp';
export const FORMAT_EXT: Record<ImageFormat, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };

// Decode any image the browser can display (PNG, JPEG, WebP, GIF, BMP, AVIF, SVG; HEIC on Safari).
export async function decodeImage(file: Blob): Promise<{ source: CanvasImageSource; width: number; height: number; close: () => void }> {
  if (file.type !== 'image/svg+xml' && typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file);
      return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
    } catch { /* fall back to <img>, which also handles SVG */ }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    // SVG files without a size report 0; use the usual default viewport size.
    return { source: img, width: img.naturalWidth || 300, height: img.naturalHeight || 150, close: () => URL.revokeObjectURL(url) };
  } catch {
    URL.revokeObjectURL(url);
    throw new Error('이 브라우저가 읽을 수 없는 이미지입니다 (예: HEIC는 Safari에서만). / This browser cannot read the image.');
  }
}

export interface DrawOptions { scale?: number; maxWidth?: number; background?: string }

export function fitSize(width: number, height: number, { scale = 1, maxWidth }: DrawOptions) {
  let w = width * scale, h = height * scale;
  if (maxWidth && w > maxWidth) { h *= maxWidth / w; w = maxWidth; }
  if (w * h > MAX_CANVAS_PIXELS) { const f = Math.sqrt(MAX_CANVAS_PIXELS / (w * h)); w *= f; h *= f; }
  return { width: Math.max(1, Math.round(w)), height: Math.max(1, Math.round(h)) };
}

export async function drawImage(file: Blob, options: DrawOptions = {}) {
  const image = await decodeImage(file);
  try {
    const size = fitSize(image.width, image.height, options);
    const canvas = document.createElement('canvas');
    canvas.width = size.width;
    canvas.height = size.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('캔버스를 만들 수 없습니다. / Canvas is unavailable.');
    if (options.background) { ctx.fillStyle = options.background; ctx.fillRect(0, 0, size.width, size.height); }
    ctx.drawImage(image.source, 0, 0, size.width, size.height);
    return { canvas, reduced: size.width < Math.round(image.width * (options.scale ?? 1)) };
  } finally {
    image.close();
  }
}

export function canvasToBlob(canvas: HTMLCanvasElement, type: ImageFormat, quality = 0.92): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob(blob => {
    // Browsers without a WebP encoder silently return PNG; report that instead of mislabelling it.
    if (!blob) reject(new Error('이미지를 저장하지 못했습니다. 크기를 줄여 다시 시도하세요. / Could not encode the image.'));
    else if (blob.type !== type) reject(new Error(`이 브라우저는 ${FORMAT_EXT[type].toUpperCase()} 저장을 지원하지 않습니다. / ${FORMAT_EXT[type].toUpperCase()} output is not supported here.`));
    else resolve(blob);
    canvas.width = canvas.height = 0; // free the pixel buffer right away on low-memory phones
  }, type, quality));
}

export function baseName(name: string) {
  return name.replace(/\.[^.]+$/, '') || 'file';
}
