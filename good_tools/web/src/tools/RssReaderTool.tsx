import { Diagnostic } from '../components/Diagnostic';
import { useText } from '../hooks/language';
import { useEffect, useState } from 'react';
import { Rss, Plus, Trash2, ExternalLink, RefreshCw } from 'lucide-react';

interface SavedFeed {
  id: string;
  name: string;
  url: string;
}

interface FeedItem {
  title: string;
  link: string;
  pubDate: string;
  author: string;
  snippet: string;
  categories: string[];
}

export default function RssReaderTool() {
  const ui = useText();
  const [feeds, setFeeds] = useState<SavedFeed[]>([]);
  const [url, setUrl] = useState('https://www.home-assistant.io/atom.xml');
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedData, setFeedData] = useState<{ title: string; description: string; items: FeedItem[] } | null>(null);

  const loadSavedFeeds = async () => {
    try {
      const r = await fetch('./api/feeds');
      const d = await r.json();
      if (Array.isArray(d.feeds)) setFeeds(d.feeds);
    } catch {}
  };

  const fetchFeed = async (targetUrl: string) => {
    if (loading || !targetUrl.trim()) return;
    setUrl(targetUrl);
    setLoading(true);
    setError('');
    try {
      const res = await fetch('./api/rss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || ui('피드 조회 실패', "Could not load the feed."));
      setFeedData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : ui('요청 오류', "Request failed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSavedFeeds();
  }, []);

  const addFeed = async () => {
    if (!newName.trim() || !url.trim()) return;
    const r = await fetch('./api/feeds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), url: url.trim() }),
    });
    const d = await r.json();
    if (r.ok && Array.isArray(d.feeds)) {
      setFeeds(d.feeds);
      setNewName('');
    }
  };

  const removeFeed = async (id: string) => {
    const r = await fetch(`./api/feeds/${id}`, { method: 'DELETE' });
    const d = await r.json();
    if (r.ok && Array.isArray(d.feeds)) setFeeds(d.feeds);
  };

  return (
    <div className="space-y-5">
      {/* Saved Feeds bar */}
      <div className="flex flex-wrap items-center gap-2">
        {feeds.map((f) => (
          <div
            key={f.id}
            className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
          >
            <button type="button" disabled={loading} onClick={() => fetchFeed(f.url)} className="font-medium hover:text-indigo-500 cursor-pointer">
              {f.name}
            </button>
            <button
              type="button"
              onClick={() => removeFeed(f.id)}
              className="p-0.5 text-slate-400 hover:text-rose-500 cursor-pointer"
              title={ui("삭제", "Removed")}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Fetch & Save form */}
      <div className="flex flex-wrap gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={ui("RSS / Atom 피드 URL 입력...", "Enter an RSS or Atom feed URL...")}
          className="flex-1 min-w-[240px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono"
        />
        <button
          type="button"
          onClick={() => fetchFeed(url)}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium disabled:opacity-40 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> {ui("불러오기", "Load feed")}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={ui("현재 URL을 즐겨찾기에 저장할 이름...", "Name this feed to save it...")}
          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
        />
        <button
          type="button"
          onClick={addFeed}
          disabled={!newName.trim()}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> {ui("피드 저장 (HA /data 영속)", "Save feed to HA")}
        </button>
      </div>

      {error && <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-300 text-xs"><Diagnostic text={error} /></div>}

      {feedData && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
            <Rss className="w-4 h-4 text-orange-500" />
            <h2 className="font-bold text-base">{feedData.title}</h2>
            <span className="text-xs text-slate-400">({feedData.items.length}{ui("개 항목)", " items)")}</span>
          </div>

          <div className="space-y-2.5">
            {feedData.items.map((item, idx) => (
              <a
                key={idx}
                href={item.link}
                target="_blank"
                rel="noreferrer"
                className="block p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-white">{item.title}</h3>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                </div>
                {item.snippet && (
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{item.snippet}</p>
                )}
                <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
                  {item.pubDate && <span>{new Date(item.pubDate).toLocaleString()}</span>}
                  {item.author && <span>· {item.author}</span>}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
