import { LookupNotice, checkLookupLimit } from '../components/LookupNotice';
import { Diagnostic } from '../components/Diagnostic';
import { useText } from '../hooks/language';
import { useState } from 'react';
import { ExternalLink, Search } from 'lucide-react';
import { CopyButton } from '../components/CopyButton';

interface UnshortenResult {
  originalUrl: string;
  finalUrl: string;
  hops: number;
  chain: { hop: number; url: string; status: number; statusText: string }[];
}

export default function LongUrlTool() {
  const ui = useText();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<UnshortenResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('./api/unshorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      checkLookupLimit(res, ui);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || ui('추적 실패', "Trace failed"));
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : ui('요청 중 오류가 발생했습니다.', "Request failed."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <LookupNotice pending={loading} />
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={ui("단축 URL 입력 (예: https://bit.ly/..., https://t.co/...)", "Enter a short URL (e.g. https://bit.ly/...)")}
          className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium disabled:opacity-40 cursor-pointer"
        >
          <Search className="w-4 h-4" />
          {loading ? ui('추적 중...', "Tracing...") : ui('원주소 추적', "Trace URL")}
        </button>
      </form>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-300 text-sm">
          <Diagnostic text={error} />
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                {ui("최종 목적지 URL (", "Destination URL (")}{result.hops}{ui("단계)", " hops)")}
              </span>
              <div className="flex items-center gap-1.5">
                <CopyButton text={result.finalUrl} />
                <a
                  href={result.finalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium"
                >
                  {ui("열기", "Open")} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
            <div className="font-mono text-sm break-all text-slate-900 dark:text-white">{result.finalUrl}</div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-500">{ui("리다이렉트 경로", "Redirect chain")}</div>
            {result.chain.map((step) => (
              <div
                key={step.hop}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs"
              >
                <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-mono font-bold">
                  #{step.hop} · {step.status}
                </span>
                <span className="font-mono break-all text-slate-700 dark:text-slate-200">{step.url}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
