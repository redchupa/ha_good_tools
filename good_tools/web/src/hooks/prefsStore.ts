import { isValidLang, type LangMode } from '../data/locales';

// One preferences store for the whole page. Changes are sent as {add, remove}
// operations so that two devices editing at the same time both keep their change.
export type ListChange = { add?: string[]; remove?: string[] };
export interface Prefs { favorites: string[]; hiddenTools: string[]; lang: LangMode; theme: string }
export interface PrefsChange { favorites?: ListChange; hiddenTools?: ListChange; lang?: LangMode; theme?: string }
export interface PrefsState extends Prefs { loaded: boolean; syncError: string }

const KEYS = { favorites: 'good_tools_favorites', hiddenTools: 'good_tools_hidden', lang: 'good_tools_lang', theme: 'good_tools_theme' } as const;

function readList(key: string): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value.filter((x): x is string => typeof x === 'string') : [];
  } catch { return []; }
}
function readText(key: string) {
  try { return localStorage.getItem(key) || ''; } catch { return ''; }
}
function save(prefs: Prefs) {
  try {
    localStorage.setItem(KEYS.favorites, JSON.stringify(prefs.favorites));
    localStorage.setItem(KEYS.hiddenTools, JSON.stringify(prefs.hiddenTools));
    localStorage.setItem(KEYS.lang, prefs.lang);
    localStorage.setItem(KEYS.theme, prefs.theme);
  } catch { /* Device storage may be disabled. */ }
}

export function applyList(list: string[], change: ListChange | undefined, prepend: boolean) {
  if (!change) return list;
  const add = change.add || [];
  const remove = new Set(change.remove || []);
  const kept = list.filter(id => !remove.has(id) && !add.includes(id));
  return prepend ? [...add, ...kept] : [...kept, ...add];
}
export function applyChange(prefs: Prefs, change: PrefsChange): Prefs {
  return {
    favorites: applyList(prefs.favorites, change.favorites, true),
    hiddenTools: applyList(prefs.hiddenTools, change.hiddenTools, false),
    lang: change.lang || prefs.lang,
    theme: change.theme || prefs.theme,
  };
}
function fromServer(data: unknown, fallback: Prefs): Prefs {
  const d = (data && typeof data === 'object' ? data : {}) as Partial<Prefs>;
  return {
    favorites: Array.isArray(d.favorites) ? d.favorites : fallback.favorites,
    hiddenTools: Array.isArray(d.hiddenTools) ? d.hiddenTools : fallback.hiddenTools,
    lang: isValidLang(d.lang) ? d.lang : fallback.lang,
    theme: typeof d.theme === 'string' && d.theme ? d.theme : fallback.theme,
  };
}

type Fetch = typeof fetch;
export function createPrefsStore(request: Fetch = (...args) => fetch(...args)) {
  const savedLang = readText(KEYS.lang);
  let state: PrefsState = {
    favorites: readList(KEYS.favorites),
    hiddenTools: readList(KEYS.hiddenTools),
    lang: isValidLang(savedLang) ? savedLang : 'ko',
    theme: readText(KEYS.theme) || 'system',
    loaded: false,
    syncError: '',
  };
  // Changes not yet acknowledged by the server, re-applied on top of every server snapshot.
  let pending: PrefsChange[] = [];
  // Last copy confirmed by the server; failed changes roll back to it.
  let confirmed: Prefs = { favorites: state.favorites, hiddenTools: state.hiddenTools, lang: state.lang, theme: state.theme };
  let inflight = 0;
  let started = false;
  const listeners = new Set<() => void>();
  const emit = (next: Partial<PrefsState>) => {
    state = { ...state, ...next };
    save(state);
    listeners.forEach(fn => fn());
  };
  const withPending = (base: Prefs) => pending.reduce(applyChange, base);

  async function send(change: PrefsChange) {
    inflight++;
    try {
      const r = await request('./api/prefs', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(change) });
      if (!r.ok) throw Error(String(r.status));
      confirmed = fromServer(await r.json(), state);
      pending = pending.filter(c => c !== change);
      emit({ ...withPending(confirmed), syncError: '' });
    } catch {
      pending = pending.filter(c => c !== change);
      emit({ ...withPending(confirmed), syncError: '설정을 HA에 저장하지 못해 이전 상태로 되돌렸습니다. 연결을 확인한 뒤 다시 바꿔 주세요. / Could not save settings to HA; the change was undone.' });
    } finally { inflight--; }
  }

  async function refresh() {
    try {
      const r = await request('./api/prefs');
      if (!r.ok) throw Error(String(r.status));
      confirmed = fromServer(await r.json(), state);
      const queued = state.loaded ? [] : pending.slice();
      emit({ ...withPending(confirmed), loaded: true });
      // Changes made before the first response are sent now, on top of the server copy.
      for (const change of queued) void send(change);
    } catch {
      if (state.loaded) return; // a later refresh failing changes nothing
      emit({ loaded: true });
      for (const change of pending.slice()) void send(change);
    }
  }

  return {
    getState: () => state,
    subscribe(fn: () => void) {
      listeners.add(fn);
      if (!started) {
        started = true;
        void refresh();
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible' && state.loaded && !inflight && !pending.length) void refresh();
        });
      }
      return () => listeners.delete(fn);
    },
    change(change: PrefsChange) {
      pending.push(change);
      emit(applyChange(state, change));
      if (state.loaded) void send(change);
    },
    dismissError: () => emit({ syncError: '' }),
    refresh,
  };
}

export const prefsStore = createPrefsStore();
