import { useHaCapabilities } from '../components/HaIntegration';
import { useText } from '../hooks/language';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pin, Trash2, Plus, RefreshCw, Pencil, X, Check } from 'lucide-react';
import { CopyButton } from '../components/CopyButton';

interface ClipItem {
  id: string;
  title: string;
  content: string;
  tag: string;
  pinned: boolean;
  rev: number;
  createdAt: string;
  updatedAt?: string;
}
interface Draft { id: string; rev: number; title: string; content: string; tag: string }

const NOTIFY_LIMIT = 2000;
const REFRESH_MS = 30000;

async function call(path: string, method = 'GET', body?: unknown) {
  const r = await fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data: { items?: ClipItem[]; item?: ClipItem; error?: string } = {};
  try { data = await r.json(); } catch { /* HTML error page from a proxy */ }
  return { ok: r.ok, status: r.status, data };
}

export default function SharedClipboardTool() {
  const t = useText();
  const caps = useHaCapabilities();
  const [items, setItems] = useState<ClipItem[]>([]);
  const [title, setTitle] = useState('');
  const [tag, setTag] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: 'error' | 'info'; text: string } | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const editing = useRef(false);
  editing.current = Boolean(draft);

  const offline = t('HA에 연결하지 못했습니다. 연결을 확인한 뒤 다시 시도해 주세요.', 'Could not reach HA. Check the connection and retry.');
  const apply = (list?: ClipItem[]) => { if (Array.isArray(list)) setItems(list); };

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const { ok, data } = await call('./api/clipboard');
      if (ok) apply(data.items);
      else if (!quiet) setMessage({ kind: 'error', text: data.error || offline });
    } catch {
      if (!quiet) setMessage({ kind: 'error', text: offline });
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [offline]);

  // Pick up notes added on other devices when this screen comes back into view, and every 30 s
  // while it is visible. Polling pauses while a note is being edited.
  useEffect(() => {
    load();
    const refresh = () => { if (document.visibilityState === 'visible' && !editing.current) load(true); };
    const timer = setInterval(refresh, REFRESH_MS);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [load]);

  const run = async (action: () => Promise<{ ok: boolean; status: number; data: { items?: ClipItem[]; item?: ClipItem; error?: string } }>) => {
    try {
      const result = await action();
      apply(result.data.items);
      if (!result.ok) setMessage({ kind: 'error', text: result.data.error || offline });
      return result;
    } catch {
      setMessage({ kind: 'error', text: offline });
      return null;
    }
  };

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || saving) return;
    setMessage(null);
    setSaving(true);
    const result = await run(() => call('./api/clipboard', 'POST', { title, content, tag }));
    setSaving(false);
    if (result?.ok) { setTitle(''); setContent(''); setTag(''); }
  };

  const togglePin = (it: ClipItem) => run(() => call(`./api/clipboard/${it.id}`, 'PATCH', { pinned: !it.pinned }));
  const remove = (it: ClipItem) => {
    if (!window.confirm(t(`"${it.title || '메모'}"를 삭제할까요?`, `Delete "${it.title || 'note'}"?`))) return;
    run(() => call(`./api/clipboard/${it.id}`, 'DELETE'));
  };

  const saveEdit = async () => {
    if (!draft || !draft.content.trim()) return;
    setSaving(true);
    const { id, rev, ...fields } = draft;
    const result = await run(() => call(`./api/clipboard/${id}`, 'PATCH', { ...fields, rev }));
    setSaving(false);
    if (result?.ok) { setDraft(null); setMessage(null); return; }
    if (result?.status === 409 && result.data.item) {
      // Keep what the user typed; base the next save on the copy another device just saved.
      setDraft({ ...draft, rev: result.data.item.rev });
      setMessage({ kind: 'error', text: t(
        '다른 기기에서 먼저 수정했습니다. 목록에서 최신 내용을 확인한 뒤, 지금 입력한 내용으로 덮어쓰려면 다시 저장을 누르세요.',
        'Another device changed this note first. Check the latest text in the list; save again to replace it with yours.') });
    }
    if (result?.status === 404) setDraft(null);
  };

  const sendNotification = async (text: string) => {
    const message = text.length > NOTIFY_LIMIT ? text.slice(0, NOTIFY_LIMIT - 1) + '…' : text;
    try {
      const r = await fetch('./api/ha/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message }) });
      setMessage(r.ok
        ? { kind: 'info', text: text.length > NOTIFY_LIMIT ? t('앞부분 2,000자를 전송했습니다.', 'Sent the first 2,000 characters.') : t('전송했습니다.', 'Sent.') }
        : { kind: 'error', text: t('전송하지 못했습니다. HA 연동 권한을 확인해 주세요.', 'Not sent. Check the HA access settings.') });
    } catch { setMessage({ kind: 'error', text: offline }); }
  };

  const field = 'px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm';
  const iconButton = 'p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer';

  return (
    <div className="space-y-5">
      <form onSubmit={addItem} className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100}
            placeholder={t('제목 (선택, 예: 현관 비밀번호, 쇼핑 링크)', 'Title (optional)')} className={field + ' sm:col-span-2'} />
          <input value={tag} onChange={(e) => setTag(e.target.value)} maxLength={30}
            placeholder={t('태그 (선택, 예: 링크, 메모)', 'Tag (optional)')} className={field} />
        </div>
        <textarea rows={3} value={content} maxLength={20000} onChange={(e) => setContent(e.target.value)}
          placeholder={t('PC와 스마트폰 HA 앱에서 함께 공유할 텍스트나 URL을 붙여넣으세요...', 'Paste text or a link to share between devices...')}
          className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:border-indigo-500" />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-slate-400">{t('HA /data에 저장되고, 다른 기기의 화면도 30초 안에 또는 화면으로 돌아올 때 갱신됩니다. 고정 메모는 최대 20개, 일반 메모는 최근 50개를 보관합니다.',
            'Saved in HA /data. Other screens refresh within 30 s or when reopened. Keeps 20 pinned and the latest 50 other notes.')}</span>
          <div className="flex gap-2">
            <button type="button" onClick={() => load()}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs cursor-pointer">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> {t('새로고침', 'Refresh')}
            </button>
            <button type="submit" disabled={saving || !content.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-medium cursor-pointer">
              <Plus className="w-3.5 h-3.5" /> {saving && !draft ? t('저장 중…', 'Saving…') : t('공유 저장', 'Save')}
            </button>
          </div>
        </div>
      </form>

      {message && (
        <div role={message.kind === 'error' ? 'alert' : 'status'}
          className={`flex items-start gap-2 text-xs p-3 rounded-lg ${message.kind === 'error' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-300' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'}`}>
          <span className="flex-1">{message.text}</span>
          <button type="button" onClick={() => setMessage(null)} aria-label={t('닫기', 'Close')} className="cursor-pointer"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="py-12 text-center text-sm text-slate-400">{t('저장된 공유 메모가 없습니다.', 'No shared notes yet.')}</div>
      ) : (
        <div className="space-y-2.5">
          {items.map((it) => (
            <div key={it.id} className={`p-4 rounded-xl border transition-colors ${it.pinned
              ? 'border-amber-400/50 bg-amber-50/40 dark:bg-amber-500/10'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60'}`}>
              {draft?.id === it.id ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input aria-label={t('제목', 'Title')} value={draft.title} maxLength={100} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className={field + ' sm:col-span-2'} />
                    <input aria-label={t('태그', 'Tag')} value={draft.tag} maxLength={30} onChange={(e) => setDraft({ ...draft, tag: e.target.value })} className={field} />
                  </div>
                  <textarea aria-label={t('내용', 'Content')} rows={4} value={draft.content} maxLength={20000} onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                    className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono" />
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => { setDraft(null); setMessage(null); }} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs cursor-pointer">
                      <X className="w-3.5 h-3.5" /> {t('취소', 'Cancel')}
                    </button>
                    <button type="button" disabled={saving || !draft.content.trim()} onClick={saveEdit} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 disabled:opacity-50 text-white text-xs font-medium cursor-pointer">
                      <Check className="w-3.5 h-3.5" /> {saving ? t('저장 중…', 'Saving…') : t('수정 저장', 'Save changes')}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{it.title || t('메모', 'Note')}</span>
                      {it.tag && <span className="px-2 py-0.5 rounded-full text-[11px] bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-300">#{it.tag}</span>}
                      <span className="text-[11px] text-slate-400">{new Date(it.updatedAt || it.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {caps?.notify && (
                        <button type="button" onClick={() => sendNotification(it.content)} className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] cursor-pointer">
                          {t('알림 전송', 'Notify')}
                        </button>
                      )}
                      <CopyButton text={it.content} />
                      <button type="button" title={t('수정', 'Edit')} aria-label={t('수정', 'Edit')} onClick={() => { setMessage(null); setDraft({ id: it.id, rev: it.rev, title: it.title, content: it.content, tag: it.tag }); }}
                        className={iconButton + ' text-slate-400 hover:text-indigo-500'}>
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" title={t('상단 고정', 'Pin to top')} aria-label={t('상단 고정', 'Pin to top')} aria-pressed={it.pinned} onClick={() => togglePin(it)}
                        className={iconButton + (it.pinned ? ' text-amber-500 bg-amber-50 dark:bg-amber-500/20' : ' text-slate-400 hover:text-amber-500')}>
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" title={t('삭제', 'Delete')} aria-label={t('삭제', 'Delete')} onClick={() => remove(it)}
                        className={iconButton + ' text-slate-400 hover:text-rose-500'}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <pre className="text-xs font-mono whitespace-pre-wrap break-all text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 p-3 rounded-lg">{it.content}</pre>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
