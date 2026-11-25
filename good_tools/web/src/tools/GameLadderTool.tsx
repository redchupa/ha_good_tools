import { useText } from '../hooks/language';
import { useEffect, useState, useRef } from 'react';
import { RefreshCw, Play, Users } from 'lucide-react';

const PALETTE = ['#D9480F', '#1C7ED6', '#C2255C', '#2B8A3E', '#7048E8', '#0B7285', '#E67700', '#5C7CFA'];

interface LadderState {
  n: number;
  k: number;
  rungs: boolean[][];
  results: boolean[]; // true = 당첨(커피)
  done: number[];
  revealedEnds: Record<number, number>; // endCol -> startIdx
  activePaths: { startIdx: number; points: string; color: string; length: number }[];
}

function rand() {
  try {
    return crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
  } catch {
    return Math.random();
  }
}

function buildLadder(n: number, k: number): LadderState {
  const rungs: boolean[][] = [];
  for (let l = 0; l < 11; l++) {
    const row = new Array(n - 1).fill(false);
    for (let g = 0; g < n - 1; g++) {
      if (rand() < 0.42 && !(g > 0 && row[g - 1])) row[g] = true;
    }
    rungs.push(row);
  }
  for (let g = 0; g < n - 1; g++) {
    if (rungs.some((row) => row[g])) continue;
    const free = rungs.map((row, l) => (!row[g - 1] && !row[g + 1] ? l : -1)).filter((l) => l >= 0);
    if (free.length) rungs[free[Math.floor(rand() * free.length)]][g] = true;
    else {
      const row = new Array(n - 1).fill(false);
      row[g] = true;
      rungs.splice(Math.floor(rand() * (rungs.length + 1)), 0, row);
    }
  }
  const results = Array.from({ length: n }, (_, i) => i < k);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [results[i], results[j]] = [results[j], results[i]];
  }
  return { n, k, rungs, results, done: [], revealedEnds: {}, activePaths: [] };
}

export default function GameLadderTool() {
  const ui = useText();
  const [n, setN] = useState(4);
  const [k, setK] = useState(1);
  const [winLabel, setWinLabel] = useState(ui('커피 당첨', "Buy coffee"));
  const [names, setNames] = useState<string[]>([ui('1번', "1"), ui('2번', "2"), ui('3번', "3"), ui('4번', "4"), ui('5번', "5"), ui('6번', "6"), ui('7번', "7"), ui('8번', "8")]);
  const [ladder, setLadder] = useState<LadderState | null>(null);
  const [summary, setSummary] = useState(ui('위쪽 번호를 누르면 사다리를 따라 내려갑니다', "Choose a number at the top to follow its path."));
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  useEffect(() => () => clearTimers(), []);

  const makeNew = (nextN = n, nextK = k) => {
    clearTimers();
    setLadder(buildLadder(nextN, Math.min(nextK, nextN - 1)));
    setSummary(ui('위쪽 번호를 누르면 사다리를 따라 내려갑니다', "Choose a number at the top to follow its path."));
  };

  const getCoords = (L: LadderState) => {
    const sp = Math.min(180, 720 / Math.max(1, L.n - 1));
    const x0 = 450 - (sp * (L.n - 1)) / 2;
    const x = (i: number) => x0 + i * sp;
    const y = (l: number) => 130 + (l * 560) / Math.max(1, L.rungs.length - 1);
    return { x, y };
  };

  const runPlayer = (startIdx: number) => {
    setLadder((prev) => {
      if (!prev || prev.done.includes(startIdx)) return prev;
      const { x, y } = getCoords(prev);
      let c = startIdx;
      const pts: [number, number][] = [[x(c), 88]];
      for (let l = 0; l < prev.rungs.length; l++) {
        const yl = y(l);
        const d = c > 0 && prev.rungs[l][c - 1] ? -1 : c < prev.n - 1 && prev.rungs[l][c] ? 1 : 0;
        if (d) {
          pts.push([x(c), yl]);
          c += d;
          pts.push([x(c), yl]);
        }
      }
      pts.push([x(c), 740]);
      let len = 0;
      for (let i = 1; i < pts.length; i++) {
        len += Math.abs(pts[i][0] - pts[i - 1][0]) + Math.abs(pts[i][1] - pts[i - 1][1]);
      }

      const endCol = c;
      const isWin = prev.results[endCol];
      const nextDone = [...prev.done, startIdx];
      const nextRevealed = { ...prev.revealedEnds, [endCol]: startIdx };

      if (nextDone.length === prev.n) {
        const winners = prev.results
          .map((w, col) => (w ? names[nextRevealed[col]] || ui(`${nextRevealed[col] + 1}번`, `${nextRevealed[col] + 1}`) : ''))
          .filter(Boolean);
        setSummary(ui(`최종 결과 (${winLabel}): ${winners.join(', ')}`, `Result (${winLabel}): ${winners.join(", ")}`));
      } else {
        setSummary(`${names[startIdx] || ui(`${startIdx + 1}번`, `${startIdx + 1}`)} → ${isWin ? winLabel + '!' : ui('통과', "Pass")}`);
      }

      return {
        ...prev,
        done: nextDone,
        revealedEnds: nextRevealed,
        activePaths: [
          ...prev.activePaths,
          {
            startIdx,
            points: pts.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' '),
            color: PALETTE[startIdx % PALETTE.length],
            length: len,
          },
        ],
      };
    });
  };

  const revealAll = () => {
    if (!ladder) return;
    clearTimers();
    let delay = 0;
    for (let i = 0; i < ladder.n; i++) {
      if (!ladder.done.includes(i)) {
        const idx = i;
        timersRef.current.push(setTimeout(() => runPlayer(idx), delay * 260));
        delay++;
      }
    }
  };

  if (!ladder) {
    return (
      <div className="space-y-5 max-w-xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <div className="font-semibold text-sm">{ui("참가 인원", "Players")}</div>
              <div className="text-xs text-slate-500">{ui("2명 ~ 8명", "2 to 8 players")}</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const next = Math.max(2, n - 1);
                  setN(next);
                  setK(Math.min(k, next - 1));
                }}
                className="w-8 h-8 rounded-lg border border-slate-300 dark:border-slate-600 font-bold cursor-pointer"
              >
                −
              </button>
              <span className="w-6 text-center font-bold">{n}</span>
              <button
                type="button"
                onClick={() => setN(Math.min(8, n + 1))}
                className="w-8 h-8 rounded-lg border border-slate-300 dark:border-slate-600 font-bold cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <div className="font-semibold text-sm">{ui("당첨 인원", "Number of winners")}</div>
              <div className="text-xs text-slate-500">{ui("벌칙/커피 쏘는 사람", "Players assigned the outcome")}</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setK(Math.max(1, k - 1))}
                className="w-8 h-8 rounded-lg border border-slate-300 dark:border-slate-600 font-bold cursor-pointer"
              >
                −
              </button>
              <span className="w-6 text-center font-bold">{k}</span>
              <button
                type="button"
                onClick={() => setK(Math.min(n - 1, k + 1))}
                className="w-8 h-8 rounded-lg border border-slate-300 dark:border-slate-600 font-bold cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500">{ui("당첨 항목 이름", "Outcome label")}</label>
          <input
            value={winLabel}
            onChange={(e) => setWinLabel(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
          />
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-500">{ui("참가자 이름 (선택 수정)", "Player names (optional)")}</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Array.from({ length: n }, (_, i) => (
              <input
                key={i}
                value={names[i]}
                onChange={(e) => {
                  const next = [...names];
                  next[i] = e.target.value;
                  setNames(next);
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-center font-medium"
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => makeNew(n, k)}
          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          <Play className="w-4 h-4" /> {ui("사다리 만들기", "Create ladder")}
        </button>
      </div>
    );
  }

  const { x, y } = getCoords(ladder);

  return (
    <div className="space-y-4">
      <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-200 dark:border-indigo-500/30 text-center font-bold text-sm text-indigo-700 dark:text-indigo-300">
        {summary}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3">
        <svg viewBox="0 0 900 820" className="w-full max-w-2xl mx-auto select-none">
          {/* Vertical lines */}
          {Array.from({ length: ladder.n }, (_, i) => (
            <line key={`v-${i}`} x1={x(i)} y1={88} x2={x(i)} y2={740} stroke="currentColor" strokeOpacity={0.25} strokeWidth={5} strokeLinecap="round" />
          ))}

          {/* Rungs */}
          {ladder.rungs.map((row, l) =>
            row.map((on, g) =>
              on ? (
                <line
                  key={`r-${l}-${g}`}
                  x1={x(g)}
                  y1={y(l)}
                  x2={x(g + 1)}
                  y2={y(l)}
                  stroke="currentColor"
                  strokeOpacity={0.28}
                  strokeWidth={5}
                  strokeLinecap="round"
                />
              ) : null
            )
          )}

          {/* Active traced paths */}
          {ladder.activePaths.map((p) => (
            <polyline
              key={p.startIdx}
              points={p.points}
              fill="none"
              stroke={p.color}
              strokeWidth={8}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {/* Top clickable player chips */}
          {Array.from({ length: ladder.n }, (_, i) => {
            const done = ladder.done.includes(i);
            return (
              <g key={`p-${i}`} onClick={() => runPlayer(i)} className="cursor-pointer">
                <circle
                  cx={x(i)}
                  cy={46}
                  r={34}
                  fill={PALETTE[i % PALETTE.length]}
                  opacity={done ? 0.55 : 1}
                />
                <text x={x(i)} y={52} textAnchor="middle" fill="#ffffff" fontSize={18} fontWeight="bold">
                  {(names[i] || `${i + 1}`).slice(0, 4)}
                </text>
              </g>
            );
          })}

          {/* Bottom result boxes */}
          {Array.from({ length: ladder.n }, (_, col) => {
            const revealedPlayer = ladder.revealedEnds[col];
            const shown = revealedPlayer !== undefined;
            const win = ladder.results[col];
            return (
              <g key={`end-${col}`}>
                <rect
                  x={x(col) - 48}
                  y={748}
                  width={96}
                  height={56}
                  rx={14}
                  fill={shown ? (win ? '#e11d48' : '#10b981') : '#64748b'}
                  fillOpacity={shown ? 1 : 0.25}
                />
                <text
                  x={x(col)}
                  y={781}
                  textAnchor="middle"
                  fill={shown ? '#ffffff' : 'currentColor'}
                  fontSize={16}
                  fontWeight="bold"
                >
                  {shown ? (win ? winLabel.slice(0, 5) : ui('통과', "Pass")) : '?'}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={revealAll}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium cursor-pointer"
        >
          <Play className="w-4 h-4" /> {ui("모두 공개", "Reveal all")}
        </button>
        <button
          type="button"
          onClick={() => makeNew()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" /> {ui("새 사다리", "New ladder")}
        </button>
        <button
          type="button"
          onClick={() => {
            clearTimers();
            setLadder(null);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          <Users className="w-4 h-4" /> {ui("인원·이름 바꾸기", "Edit players")}
        </button>
      </div>
    </div>
  );
}
