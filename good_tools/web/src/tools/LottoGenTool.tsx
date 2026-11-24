import { useState } from 'react';
import { Dices, RotateCcw } from 'lucide-react';
import { CopyButton } from '../components/CopyButton';

function ballColor(n: number) {
  if (n <= 10) return 'bg-amber-400 text-slate-900';
  if (n <= 20) return 'bg-sky-500 text-white';
  if (n <= 30) return 'bg-rose-500 text-white';
  if (n <= 40) return 'bg-slate-500 text-white';
  return 'bg-emerald-500 text-white';
}

export default function LottoGenTool() {
  const [gameCount, setGameCount] = useState(5);
  const [fixed, setFixed] = useState<number[]>([]);
  const [excluded, setExcluded] = useState<number[]>([]);
  const [games, setGames] = useState<number[][]>([]);

  const toggleNumber = (n: number) => {
    if (fixed.includes(n)) {
      setFixed(fixed.filter((x) => x !== n));
      setExcluded([...excluded, n]);
    } else if (excluded.includes(n)) {
      setExcluded(excluded.filter((x) => x !== n));
    } else if (fixed.length < 5) {
      setFixed([...fixed, n]);
    } else {
      setExcluded([...excluded, n]);
    }
  };

  const generate = () => {
    const pool = Array.from({ length: 45 }, (_, i) => i + 1).filter(
      (n) => !fixed.includes(n) && !excluded.includes(n)
    );
    const need = 6 - fixed.length;
    if (pool.length < need) return;

    const results: number[][] = [];
    for (let g = 0; g < gameCount; g++) {
      const copy = [...pool];
      const picked = [...fixed];
      for (let i = 0; i < need; i++) {
        const idx = Math.floor(Math.random() * copy.length);
        picked.push(copy.splice(idx, 1)[0]);
      }
      results.push(picked.sort((a, b) => a - b));
    }
    setGames(results);
  };

  const copyText = games.map((g, i) => `${String.fromCharCode(65 + i)}: ${g.join(', ')}`).join('\n');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          게임 수:
          <select
            value={gameCount}
            onChange={(e) => setGameCount(Number(e.target.value))}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
          >
            {[1, 2, 3, 5, 10].map((c) => (
              <option key={c} value={c}>{c}게임</option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={generate}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium cursor-pointer"
        >
          <Dices className="w-4 h-4" /> 번호 추첨
        </button>

        <button
          type="button"
          onClick={() => {
            setFixed([]);
            setExcluded([]);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" /> 고정/제외 초기화
        </button>

        {games.length > 0 && <CopyButton text={copyText} label="결과 복사" className="ml-auto" />}
      </div>

      {/* Number Picker for Fixed / Excluded */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
        <div className="text-xs text-slate-500 flex flex-wrap gap-3">
          <span>번호 클릭: 1회 <strong className="text-emerald-600">고정수({fixed.length}/5)</strong> → 2회 <strong className="text-rose-500">제외수({excluded.length})</strong> → 3회 해제</span>
        </div>
        <div className="grid grid-cols-9 sm:grid-cols-15 gap-1.5">
          {Array.from({ length: 45 }, (_, i) => i + 1).map((n) => {
            const isFix = fixed.includes(n);
            const isExc = excluded.includes(n);
            return (
              <button
                key={n}
                type="button"
                onClick={() => toggleNumber(n)}
                className={`h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isFix
                    ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
                    : isExc
                    ? 'bg-rose-500/20 text-rose-500 line-through'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                }`}
              >
                {n}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results */}
      {games.length > 0 && (
        <div className="space-y-2.5">
          {games.map((g, idx) => {
            const sum = g.reduce((a, b) => a + b, 0);
            const odd = g.filter((x) => x % 2 === 1).length;
            return (
              <div
                key={idx}
                className="flex flex-wrap items-center gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
              >
                <span className="w-6 text-xs font-bold text-slate-400">{String.fromCharCode(65 + idx)}</span>
                <div className="flex items-center gap-2">
                  {g.map((n) => (
                    <span
                      key={n}
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shadow-xs ${ballColor(n)}`}
                    >
                      {n}
                    </span>
                  ))}
                </div>
                <span className="ml-auto text-xs text-slate-500 font-mono">
                  합계 {sum} · 홀짝 {odd}:{6 - odd}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
