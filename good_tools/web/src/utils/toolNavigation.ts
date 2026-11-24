const key = 'good_tools_recent';

export function recentTools(): string[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(saved) ? saved.filter(id => typeof id === 'string').slice(0, 8) : [];
  } catch { return []; }
}

export function rememberTool(id: string) {
  try { localStorage.setItem(key, JSON.stringify([id, ...recentTools().filter(x => x !== id)].slice(0,8))); }
  catch { /* Device storage may be disabled. */ }
}

export function panelLink(parent: URL, id: string) {
  const match = parent.pathname.match(/(?:^|\/)([a-zA-Z0-9_]+_good_tools)(?:\/|$)/);
  const slug = match?.[1] || '47dec900_good_tools';
  return parent.origin + '/app/' + slug + '?tool=' + encodeURIComponent(id);
}

export function shareTool(id: string) {
  try {
    if (window.parent === window && !location.pathname.startsWith('/api/hassio_ingress/')) {
      return location.origin + location.pathname + '#/tool/' + encodeURIComponent(id);
    }
    return panelLink(new URL(window.parent.location.href), id);
  } catch { return ''; }
}

export function sharedToolId() {
  try { return new URL(window.parent.location.href).searchParams.get('tool'); }
  catch { return null; }
}
