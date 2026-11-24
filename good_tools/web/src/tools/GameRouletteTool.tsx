import { useState } from 'react';
import { RotateCw, Plus, X } from 'lucide-react';

const PALETTE = ['#D9480F', '#1C7ED6', '#C2255C', '#2B8A3E', '#7048E8', '#0B7285', '#E67700', '#5C7CFA'];

const PRESETS: Record<string, string[]> = {
  '점심 메뉴': ['한식 백반', '국밥', '중식', '일식', '분식', '쌀국수', '햄버거', '샐러드'],
  '야식 메뉴': ['치킨', '피자', '족발/보쌈', '떡볶이', '라면', '곱창'],
  '카페 음료': ['아메리카노', '카페라떼', '바닐라라떼', '말차라떼', '에이드', '스무디'],
};

export default function GameRouletteTool() {
  const [items, setItems] = useState<string[]>(PRESETS['점심 메뉴']);
  const [newItem, setNewItem] = useState('');
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState('');

  const spin = () => {
    if (spinning || items.length < 2) return;
    setSpinning(true);
    setWinner('');
    const randDeg = Math.floor(Math.random() * 360);
    const nextRot = rotation + 360 * 6 + randDeg;
    setRotation(nextRot);

    setTimeout(() => {
      const at = (360 - (nextRot % 360)) % 360;
      const sliceAngle = 360 / items.length;
      const idx = Math.floor(at / sliceAngle) % items.length;
      setWinner(items[idx]);
      setSpinning(false);
    }, 4500);
  };

  const addItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim() || items.length >= 12) return;
    setItems([...items, newItem.trim().slice(0, 14)]);
    setNewItem('');
  };

  const cx = 200;
  const cy = 200;
  const R = 185;
  const sliceAngle = 360 / Math.max(1, items.length);

  const pt = (deg: number, r: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* Wheel area */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-full max-w-[340px]">
          <svg viewBox="0 0 400 400" className="w-full drop-shadow-md">
            <g
              style={{
                transformOrigin: '200px 200px',
                transform: `rotate(${rotation}deg)`,
                transition: spinning ? 'transform 4.4s cubic-bezier(.12,.68,.08,1)' : 'none',
              }}
            >
              {items.map((label, i) => {
                const [x0, y0] = pt(i * sliceAngle, R);
                const [x1, y1] = pt((i + 1) * sliceAngle, R);
                const [tx, ty] = pt((i + 0.5) * sliceAngle, R * 0.64);
                const largeArc = sliceAngle > 180 ? 1 : 0;
                const col = PALETTE[i === items.length - 1 && i % PALETTE.length === 0 ? 4 : i % PALETTE.length];
                return (
                  <g key={`${label}-${i}`}>
                    <path
                      d={`M${cx},${cy} L${x0.toFixed(1)},${y0.toFixed(1)} A${R},${R} 0 ${largeArc} 1 ${x1.toFixed(1)},${y1.toFixed(1)} Z`}
                      fill={col}
                    />
                    <text
                      x={tx.toFixed(1)}
                      y={ty.toFixed(1)}
                      fill="#ffffff"
                      fontSize={items.length <= 8 ? 15 : 12}
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${((i + 0.5) * sliceAngle).toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)})`}
                    >
                      {label}
                    </text>
                  </g>
                );
              })}
              <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth={4} />
            </g>
            {/* Center cap & Top pointer */}
            <circle cx={cx} cy={cy} r={24} fill="#ffffff" stroke="#cbd5e1" strokeWidth={3} />
            <path d="M184 2 H216 L200 34 Z" fill="#0f172a" stroke="#ffffff" strokeWidth={2} />
          </svg>
        </div>

        <div className="text-center min-h-[44px]">
          {spinning ? (
            <div className="text-sm font-semibold text-indigo-500 animate-pulse">두근두근 돌아가는 중...</div>
          ) : winner ? (
            <div className="px-5 py-2 rounded-2xl bg-indigo-50 dark:bg-indigo-500/20 border border-indigo-300 dark:border-indigo-500/40 text-lg font-extrabold text-indigo-700 dark:text-indigo-300">
              당첨: {winner}
            </div>
          ) : (
            <div className="text-xs text-slate-400">돌리기 버튼을 눌러 오늘의 선택을 뽑아보세요</div>
          )}
        </div>

        <button
          type="button"
          onClick={spin}
          disabled={spinning || items.length < 2}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm disabled:opacity-40 cursor-pointer"
        >
          <RotateCw className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`} />
          {spinning ? '돌리는 중...' : winner ? '다시 돌리기' : '돌림판 돌리기'}
        </button>
      </div>

      {/* Menu editor */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(PRESETS).map(([title, list]) => (
            <button
              key={title}
              type="button"
              onClick={() => {
                setItems(list);
                setWinner('');
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-xs font-medium cursor-pointer"
            >
              {title}
            </button>
          ))}
        </div>

        <form onSubmit={addItem} className="flex gap-2">
          <input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="항목 추가 (최대 12개)..."
            className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
          />
          <button
            type="submit"
            disabled={!newItem.trim() || items.length >= 12}
            className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium disabled:opacity-40 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> 추가
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          {items.map((item, idx) => (
            <span
              key={`${item}-${idx}`}
              className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: PALETTE[idx % PALETTE.length] }}
              />
              {item}
              {items.length > 2 && (
                <button
                  type="button"
                  onClick={() => setItems(items.filter((_, i) => i !== idx))}
                  className="text-slate-400 hover:text-rose-500 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
