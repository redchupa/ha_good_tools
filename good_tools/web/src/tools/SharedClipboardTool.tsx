import { useHaCapabilities } from '../components/HaIntegration';
import { useEffect, useState } from 'react';
import { Pin, Trash2, Plus, RefreshCw } from 'lucide-react';
import { CopyButton } from '../components/CopyButton';

interface ClipItem {
  id: string;
  title: string;
  content: string;
  tag: string;
  pinned: boolean;
  createdAt: string;
}

export default function SharedClipboardTool() {
  const caps = useHaCapabilities();
  const [notification, setNotification] = useState('');
  const sendNotification = async (message: string) => {
    try {
      const r = await fetch('./api/ha/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message }) });
      setNotification(r.ok ? '전송됨 / Sent' : '전송 실패 / Check permission and message length.');
    } catch { setNotification('연결 실패 / Retry when connected.'); }
  };
  const [items, setItems] = useState<ClipItem[]>([]);
  const [title, setTitle] = useState('');
  const [tag, setTag] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch('./api/clipboard');
      const d = await r.json();
      if (Array.isArray(d.items)) setItems(d.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setError('');
    const r = await fetch('./api/clipboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, tag }),
    });
    const d = await r.json();
    if (!r.ok) {
      setError(d.error || '저장 실패');
      return;
    }
    setItems(d.items || []);
    setTitle('');
    setContent('');
    setTag('');
  };

  const togglePin = async (id: string, pinned: boolean) => {
    const r = await fetch(`./api/clipboard/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinned: !pinned }),
    });
    const d = await r.json();
    if (Array.isArray(d.items)) setItems(d.items);
  };

  const remove = async (id: string) => {
    const r = await fetch(`./api/clipboard/${id}`, { method: 'DELETE' });
    const d = await r.json();
    if (Array.isArray(d.items)) setItems(d.items);
  };

  return (
    <div className="space-y-5">
      {notification && <p role="status">{notification}</p>}
      <form onSubmit={addItem} className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목 (선택, 예: 현관 비밀번호, 쇼핑 링크)"
            className="sm:col-span-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
          />
          <input
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="태그 (선택, 예: 링크, 메모)"
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
          />
        </div>
        <textarea
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="PC와 스마트폰 HA 앱에서 함께 공유할 텍스트나 URL을 붙여넣으세요..."
          className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:border-indigo-500"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">HA `/data/clipboard.json`에 저장되어 모든 기기에서 즉시 공유됩니다.</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={load}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> 새로고침
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> 공유 저장
            </button>
          </div>
        </div>
        {error && <div className="text-xs text-rose-500">{error}</div>}
      </form>

      {items.length === 0 ? (
        <div className="py-12 text-center text-sm text-slate-400">저장된 공유 메모가 없습니다.</div>
      ) : (
        <div className="space-y-2.5">
          {items.map((it) => (
            <div
              key={it.id}
              className={`p-4 rounded-xl border transition-colors ${
                it.pinned
                  ? 'border-amber-400/50 bg-amber-50/40 dark:bg-amber-500/10'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">{it.title || '메모'}</span>
                  {it.tag && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-300">
                      #{it.tag}
                    </span>
                  )}
                  <span className="text-[11px] text-slate-400">{new Date(it.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  {caps?.notify && <button onClick={() => sendNotification(it.content)}>알림 전송 / Notify</button>}
                  <CopyButton text={it.content} />
                  <button
                    type="button"
                    onClick={() => togglePin(it.id, it.pinned)}
                    className={`p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer ${
                      it.pinned ? 'text-amber-500 bg-amber-50 dark:bg-amber-500/20' : 'text-slate-400 hover:text-amber-500'
                    }`}
                    title="상단 고정"
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(it.id)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-500 cursor-pointer"
                    title="삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <pre className="text-xs font-mono whitespace-pre-wrap break-all text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 p-3 rounded-lg">
                {it.content}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
