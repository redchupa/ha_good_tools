import { Diagnostic } from '../components/Diagnostic';
import { useText } from '../hooks/language';
import { previewDocument } from '../utils/preview';
import { useState } from 'react';
import { Search } from 'lucide-react';
import { CopyButton } from '../components/CopyButton';

export default function HtmlViewerTool() {
  const ui = useText();
  const [tab, setTab] = useState<'remote' | 'live'>('remote');
  const [url, setUrl] = useState('https://www.home-assistant.io');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [remote, setRemote] = useState<any>(null);

  const [liveHtml, setLiveHtml] = useState(
    `<div style="font-family:sans-serif;padding:24px;">\n  <h2 style="color:#4f46e5;">Good Tools HTML 미리보기</h2>\n  <p>여기에 HTML/CSS 코드를 입력하면 우측에서 즉시 렌더링됩니다.</p>\n</div>`
  );

  const fetchRemote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('./api/fetch-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || ui('가져오기 실패', "Fetch failed"));
      setRemote(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : ui('요청 오류', "Request failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab('remote')}
          className={`px-3.5 py-2 rounded-xl text-xs font-medium cursor-pointer ${
            tab === 'remote' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800'
          }`}
        >
          {ui("원격 URL 소스 보기", "View source from a URL")}
        </button>
        <button
          type="button"
          onClick={() => setTab('live')}
          className={`px-3.5 py-2 rounded-xl text-xs font-medium cursor-pointer ${
            tab === 'live' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800'
          }`}
        >
          {ui("실시간 HTML 미리보기", "Live HTML preview")}
        </button>
      </div>

      {tab === 'remote' ? (
        <div className="space-y-4">
          <form onSubmit={fetchRemote} className="flex gap-2">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium disabled:opacity-40 cursor-pointer"
            >
              <Search className="w-4 h-4" /> {loading ? ui('로딩...', "Loading...") : ui('소스 조회', "Fetch source")}
            </button>
          </form>

          {error && <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-300 text-xs"><Diagnostic text={error} /></div>}

          {remote && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="text-slate-400">Title</div>
                  <div className="font-semibold mt-0.5 truncate">{remote.meta.title || '-'}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="text-slate-400">{ui("HTTP 상태 / 크기", "HTTP status / size")}</div>
                  <div className="font-mono font-semibold mt-0.5">{remote.status} · {(remote.size / 1024).toFixed(1)} KB</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="text-slate-400">OG Description</div>
                  <div className="truncate mt-0.5">{remote.meta.ogDescription || remote.meta.description || '-'}</div>
                </div>
              </div>

              <div className="flex justify-end">
                <CopyButton text={remote.html} label={ui("HTML 전체 복사", "Copy full HTML")} />
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 font-mono text-xs overflow-auto max-h-[420px] whitespace-pre-wrap break-all">
                {remote.html}
              </pre>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <textarea
            rows={15}
            value={liveHtml}
            onChange={(e) => setLiveHtml(e.target.value)}
            className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs"
          />
          <iframe
            title="Live HTML Preview"
            sandbox=""
            srcDoc={previewDocument(liveHtml)}
            className="w-full h-[360px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white"
          />
        </div>
      )}
    </div>
  );
}
