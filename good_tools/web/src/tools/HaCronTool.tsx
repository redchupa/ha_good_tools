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

function matchField(expr: string, val: number, min: number, max: number): boolean {
  for (const part of expr.split(',')) {
    const [range, stepStr] = part.split('/');
    const step = stepStr ? Number(stepStr) : 1;
    if (!step || step < 1) return false;

    if (range === '*') {
      if ((val - min) % step === 0) return true;
    } else if (range.includes('-')) {
      const [s, e] = range.split('-').map(Number);
      if (val >= s && val <= e && (val - s) % step === 0) return true;
    } else {
      const n = Number(range);
      if (Number.isInteger(n) && n >= min && n <= max && val === n) return true;
    }
  }
  return false;
}

function getNextRuns(cronExpr: string, count = 5): { runs: Date[]; error?: string } {
  const parts = cronExpr.trim().split(/\s+/);
  if (parts.length !== 5) {
    return { runs: [], error: '5필드 크론 표현식을 입력해 주세요 (분 시 일 월 요일).' };
  }
  const [mExp, hExp, domExp, monExp, dowExp] = parts;
  const runs: Date[] = [];
  const cur = new Date();
  cur.setSeconds(0, 0);
  cur.setMinutes(cur.getMinutes() + 1);

  const limit = 60 * 24 * 366; // up to 1 year search
  for (let i = 0; i < limit && runs.length < count; i++) {
    if (
      matchField(mExp, cur.getMinutes(), 0, 59) &&
      matchField(hExp, cur.getHours(), 0, 23) &&
      matchField(domExp, cur.getDate(), 1, 31) &&
      matchField(monExp, cur.getMonth() + 1, 1, 12) &&
      matchField(dowExp, cur.getDay(), 0, 6)
    ) {
      runs.push(new Date(cur.getTime()));
    }
    cur.setMinutes(cur.getMinutes() + 1);
  }
  return { runs };
}

export default function HaCronTool() {
  const [expr, setExpr] = useState('30 8 * * 1-5');

  const { runs, error } = useMemo(() => getNextRuns(expr, 5), [expr]);

  const parts = expr.trim().split(/\s+/);
  const haYaml =
    parts.length === 5
      ? `trigger:\n  - platform: time_pattern\n    minutes: "${parts[0]}"\n    hours: "${parts[1]}"`
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
            <pre className="p-3 rounded-lg bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto">{haYaml}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
