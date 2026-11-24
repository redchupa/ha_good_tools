import { useEffect, useRef, useState } from 'react';

type Phase = 'idle' | 'wait' | 'go' | 'tooSoon' | 'result';

const LS_KEY = 'good_tools_react_best';

function getTodayBest(): number | null {
  try {
    const v = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
    if (v && v.d === new Date().toDateString() && v.ms > 0) return v.ms;
  } catch {}
  return null;
}

export default function GameReactionTool() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [lastMs, setLastMs] = useState<number | null>(null);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [bestMs, setBestMs] = useState<number | null>(() => getTodayBest());
  const [history, setHistory] = useState<number[]>([]);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t0Ref = useRef(0);
  const doneAtRef = useRef(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleTap = () => {
    const now = performance.now();

    if (phase === 'wait') {
      if (timerRef.current) clearTimeout(timerRef.current);
      doneAtRef.current = now;
      setPhase('tooSoon');
      return;
    }

    if (phase === 'go') {
      const ms = Math.round(now - t0Ref.current);
      doneAtRef.current = now;
      setLastMs(ms);
      setHistory((prev) => [ms, ...prev].slice(0, 5));
      const curBest = getTodayBest();
      const record = curBest === null || ms < curBest;
      if (record) {
        localStorage.setItem(LS_KEY, JSON.stringify({ d: new Date().toDateString(), ms }));
        setBestMs(ms);
      }
      setIsNewRecord(record);
      setPhase('result');
      return;
    }

    if ((phase === 'result' || phase === 'tooSoon') && now - doneAtRef.current < 500) {
      return;
    }

    // Start waiting
    setPhase('wait');
    setIsNewRecord(false);
    const delay = 1500 + Math.random() * 2500;
    timerRef.current = setTimeout(() => {
      t0Ref.current = performance.now();
      setPhase('go');
    }, delay);
  };

  const comment =
    lastMs === null
      ? ''
      : lastMs < 200
      ? '번개 같아요!'
      : lastMs < 250
      ? '아주 빨라요!'
      : lastMs < 300
      ? '빠른 편이에요!'
      : lastMs < 400
      ? '무난해요.'
      : '조금 더 집중해 보세요.';

  const avg = history.length > 0 ? Math.round(history.reduce((a, b) => a + b, 0) / history.length) : null;

  const padStyle =
    phase === 'wait'
      ? 'bg-rose-700 text-white border-rose-600'
      : phase === 'go'
      ? 'bg-emerald-600 text-white border-emerald-500 scale-[1.01]'
      : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700';

  return (
    <div className="space-y-5 max-w-xl mx-auto">
      <button
        type="button"
        onMouseDown={handleTap}
        onTouchStart={(e) => {
          e.preventDefault();
          handleTap();
        }}
        className={`w-full h-64 rounded-3xl border-2 flex flex-col items-center justify-center gap-2 transition-all select-none cursor-pointer ${padStyle}`}
      >
        {phase === 'idle' && (
          <>
            <span className="text-3xl font-extrabold">시작하기</span>
            <span className="text-sm opacity-75">화면을 누르면 빨간색으로 바뀌며 대기합니다</span>
          </>
        )}
        {phase === 'wait' && (
          <>
            <span className="text-3xl font-extrabold">기다리세요...</span>
            <span className="text-sm opacity-90">초록색이 되는 순간 바로 누르세요</span>
          </>
        )}
        {phase === 'go' && (
          <>
            <span className="text-4xl font-black">지금 누르세요!</span>
          </>
        )}
        {phase === 'tooSoon' && (
          <>
            <span className="text-2xl font-extrabold text-rose-500">너무 빨랐어요!</span>
            <span className="text-sm opacity-75">초록색으로 바뀐 뒤에 눌러주세요 (다시 누르면 재시작)</span>
          </>
        )}
        {phase === 'result' && lastMs !== null && (
          <>
            {isNewRecord && (
              <span className="px-3 py-0.5 rounded-full bg-amber-400 text-slate-900 text-xs font-bold">
                오늘 최고 기록 갱신!
              </span>
            )}
            <span className="text-5xl font-black font-mono text-indigo-600 dark:text-indigo-400">{lastMs}ms</span>
            <span className="text-sm font-medium">{comment} · 다시 하려면 화면을 누르세요</span>
          </>
        )}
      </button>

      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="text-xs text-slate-500">오늘 최고 기록</div>
          <div className="font-mono font-bold text-xl mt-0.5 text-emerald-600 dark:text-emerald-400">
            {bestMs !== null ? `${bestMs}ms` : '-'}
          </div>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="text-xs text-slate-500">최근 {history.length}회 평균</div>
          <div className="font-mono font-bold text-xl mt-0.5 text-indigo-600 dark:text-indigo-400">
            {avg !== null ? `${avg}ms` : '-'}
          </div>
        </div>
      </div>
    </div>
  );
}
