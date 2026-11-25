import { LookupNotice, checkLookupLimit } from '../components/LookupNotice';
import { Diagnostic } from '../components/Diagnostic';
import { useText } from '../hooks/language';
import { useState } from 'react';
import { ShieldCheck, ShieldAlert, Search } from 'lucide-react';

export default function SslCheckerTool() {
  const ui = useText();
  const [host, setHost] = useState('www.home-assistant.io');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  const inspect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!host.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const r = await fetch('./api/ssl-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host: host.trim(), port: 443 }),
      });
      checkLookupLimit(r, ui);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || ui('진단 실패', "Check failed"));
      setResult(d);
    } catch (err) {
      setError(err instanceof Error ? err.message : ui('요청 오류', "Request failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <LookupNotice pending={loading} />
      <form onSubmit={inspect} className="flex gap-2">
        <input
          value={host}
          onChange={(e) => setHost(e.target.value)}
          placeholder={ui("도메인 입력 (예: github.com, duckdns.org 도메인)", "Enter a domain (e.g. github.com)")}
          className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium disabled:opacity-40 cursor-pointer"
        >
          <Search className="w-4 h-4" /> {loading ? ui('진단 중...', "Checking...") : ui('SSL 진단', "Check certificate")}
        </button>
      </form>

      {error && <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-300 text-xs"><Diagnostic text={error} /></div>}

      {result && (
        <div className="space-y-4">
          <div
            className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
              result.authorized && result.daysRemaining > 14
                ? 'border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/10'
                : 'border-amber-500/40 bg-amber-50 dark:bg-amber-500/10'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {result.authorized ? (
                <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <ShieldAlert className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              )}
              <div>
                <div className="font-bold text-sm">
                  {result.host} ({result.authorized ? ui('신뢰된 인증서', "Trusted certificate") : ui(`경고: ${result.authError}`, `Warning: ${result.authError}`)})
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  {ui("발급자:", "Issuer:")} {result.issuer || '-'} · {result.protocol} ({result.cipher})
                </div>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-white dark:bg-slate-900 font-mono font-bold text-sm">
              {ui("만료까지 D-", "Days until expiry:")}{result.daysRemaining}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="text-slate-400">{ui("발급일 (Valid From)", "Valid from")}</div>
              <div className="font-mono mt-0.5">{result.validFrom}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="text-slate-400">{ui("만료일 (Valid To)", "Valid to")}</div>
              <div className="font-mono mt-0.5">{result.validTo}</div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-slate-500">{ui("HTTP 보안 헤더", "HTTP security headers")}</div>
            {result.httpStatus == null && <p role="status" className="text-xs">
              {result.headerRetryAfter
                ? ui(`헤더 조회가 제한되었습니다. ${result.headerRetryAfter}초 후 다시 시도해 주세요.`, `Header lookup is limited. Try again in ${result.headerRetryAfter} seconds.`)
                : ui('보안 헤더를 조회하지 못했습니다.', 'Could not retrieve security headers.')}
            </p>}
            <div className="grid grid-cols-1 gap-1.5 text-xs">
              {Object.entries(result.securityHeaders || {}).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="font-mono font-semibold">{k}</span>
                  <span className={`font-mono truncate max-w-[60%] ${v ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                    {v ? String(v) : ui('미설정', "Not set")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
