import { useMemo, useState } from 'react';
import { CopyButton } from '../components/CopyButton';

const PRESETS = [
  { label: '매 5분마다', expr: '*/5 * * * *' },
  { label: '매시 정각', expr: '0 * * * *' },
  { label: '매일 오전 7시', expr: '0 7 * * *' },
  { label: '평일 오전 8시 30분', expr: '30 8 * * 1-5' },
  { label: '매주 일요일 자정', expr: '0 0 * * 0' },
  { label: '매월 1일 오전 9시', expr: '0 9 1 * *' },
];

function field(expr: string, min: number, max: number) {
  const values = new Set<number>();
  for (const part of expr.split(',')) {
    const match = /^(\*|\d+)(?:-(\d+))?(?:\/(\d+))?$/.exec(part);
    if (!match || (match[1] === '*' && match[2])) throw Error();
    const start = match[1] === '*' ? min : Number(match[1]);
    const end = match[2] ? Number(match[2]) : (match[1] === '*' || match[3] ? max : start);
    const step = Number(match[3] ?? 1);
    if (start < min || end > max || end < start || !Number.isSafeInteger(step) || step < 1) throw Error();
    for (let n = start; n <= end; n += step) values.add(n);
  }
  return values;
}

function getNextRuns(expr: string, count: number): { runs: Date[]; error?: string } {
  try {
    const parts = expr.trim().split(/\s+/);
    if (parts.length !== 5 || expr.length > 256) throw Error();
    const [minutes, hours, dates, months, weekdays] = [[0,59],[0,23],[1,31],[1,12],[0,6]]
      .map(([lo, hi], i) => field(parts[i], lo, hi));
    const now = new Date();
    const day = new Date(now);
    day.setHours(0, 0, 0, 0);
    const runs: Date[] = [];
    for (let i = 0; i < 366 && runs.length < count; i++, day.setDate(day.getDate() + 1)) {
      const dom = dates.has(day.getDate()), dow = weekdays.has(day.getDay());
      const dayMatches = parts[2].startsWith('*') || parts[4].startsWith('*') ? dom && dow : dom || dow;
      if (!months.has(day.getMonth() + 1) || !dayMatches) continue;
      for (const hour of [...hours].sort((a,b) => a-b)) {
        for (const minute of [...minutes].sort((a,b) => a-b)) {
          const time = new Date(day);
          time.setHours(hour, minute);
          if (time > now && time.getHours() === hour) runs.push(time);
          if (runs.length === count) return { runs };
        }
      }
    }
    return runs.length ? { runs } : { runs, error: '앞으로 1년 안에 실행 시각이 없습니다.' };
  } catch { return { runs: [], error: '5개 필드의 범위, 목록 및 간격을 확인해 주세요.' }; }
}

export default function HaCronTool() {
  const [expr, setExpr] = useState('30 8 * * 1-5');

  const { runs, error } = useMemo(() => getNextRuns(expr, 5), [expr]);

  const parts = expr.trim().split(/\s+/);
  const haYaml =
    !error && parts.length === 5 && parts.slice(2).every(p => p === '*') &&
    parts.slice(0, 2).every(p => /^(\*|\d+|\*\/\d+)$/.test(p))
      ? `trigger:\n  - platform: time_pattern\n    minutes: "${parts[0].replace("*/", "/")}"\n    hours: "${parts[1].replace("*/", "/")}"`
      : '';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.expr}
            type="button"
            onClick={() => setExpr(p.expr)}
            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-xs font-medium cursor-pointer"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 items-center">
        <input
          value={expr}
          onChange={(e) => setExpr(e.target.value)}
          className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-lg font-bold tracking-wider"
        />
        <CopyButton text={expr} size="md" />
      </div>

      <div className="grid grid-cols-5 gap-2 text-center text-xs">
        {['분 (0-59)', '시 (0-23)', '일 (1-31)', '월 (1-12)', '요일 (0=일~6=토)'].map((label, idx) => (
          <div key={label} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">{parts[idx] || '?'}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {error && <div className="text-xs text-rose-500">{error}</div>}

      {runs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="text-xs font-semibold text-slate-500">다음 5회 실행 예정 시각</div>
            <ul className="space-y-1.5 font-mono text-xs">
              {runs.map((d, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[10px] font-bold">
                    {i + 1}
                  </span>
                  <span>{d.toLocaleString('ko-KR', { weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">HA time_pattern 트리거 참고</span>
              <CopyButton text={haYaml} />
            </div>
            {!haYaml && <p>이 일정에는 별도 HA 조건이 필요합니다.</p>}
            <pre className="p-3 rounded-lg bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto">{haYaml}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
