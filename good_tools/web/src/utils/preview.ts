// Keep remote documents from loading trackers and issuing subresource requests from Ingress.
export function previewDocument(html: string) {
  const policy = "default-src 'none'; img-src data: blob:; style-src 'unsafe-inline'; form-action 'none'; base-uri 'none'";
  return `<!doctype html><meta http-equiv="Content-Security-Policy" content="${policy}">${html}`;
}
