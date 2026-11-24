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

// Reuse the panel route the current Home Assistant version is showing (/app/ on current
// releases, /hassio/ingress/ on older ones) so the link opens on the same installation.
export function panelLink(parent: URL, id: string) {
  const match = parent.pathname.match(/^(.*\/)?([a-zA-Z0-9_]+_good_tools)(?:\/|$)/);
  const slug = match?.[2] || '47dec900_good_tools';
  const prefix = match?.[1] === '/hassio/ingress/' ? '/hassio/ingress/' : '/app/';
  return parent.origin + prefix + slug + '?tool=' + encodeURIComponent(id);
}

export function shareTool(id: string) {
  try {
    if (window.parent === window && !location.pathname.startsWith('/api/hassio_ingress/')) {
      return location.origin + location.pathname + '#/tool/' + encodeURIComponent(id);
    }
    return panelLink(new URL(window.parent.location.href), id);
  } catch { return ''; }
}

// Read ?tool= once and remove it, so reloading the panel later opens the dashboard again.
export function takeSharedToolId() {
  try {
    const url = new URL(window.parent.location.href);
    const id = url.searchParams.get('tool');
    if (id) {
      url.searchParams.delete('tool');
      window.parent.history.replaceState(window.parent.history.state, '', url.pathname + url.search + url.hash);
    }
    return id;
  } catch { return null; }
}
