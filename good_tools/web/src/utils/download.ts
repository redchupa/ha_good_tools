export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  try {
    anchor.click();
  } finally {
    anchor.remove();
    // WebViews may consume the URL after the click handler returns.
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
}
