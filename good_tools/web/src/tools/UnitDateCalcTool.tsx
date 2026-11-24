import { useState } from 'react';

export default function UnitDateCalcTool() {
  const [pyeong, setPyeong] = useState('34');
  const [sqm, setSqm] = useState((34 * 3.305785).toFixed(2));
  const [celsius, setCelsius] = useState('24');
  const [cm, setCm] = useState('175');
  const [kg, setKg] = useState('70');

  const todayStr = new Date().toISOString().slice(0, 10);
  const [targetDate, setTargetDate] = useState('2026-12-31');
  const [birthDate, setBirthDate] = useState('1990-01-01');

  const dDayDiff = Math.ceil(
    (new Date(targetDate + 'T00:00:00').getTime() - new Date(todayStr + 'T00:00:00').getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const calcManAge = () => {
    const b = new Date(birthDate + 'T00:00:00');
    const now = new Date();
    let age = now.getFullYear() - b.getFullYear();
    const m = now.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
    return Number.isNaN(age) ? '-' : age;
  };

  return (
    <div className="space-y-6">
      {/* Area: Pyeong <-> m2 */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
          <h2 className="text-sm font-semibold">평수 ↔ 제곱미터(㎡)</h2>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <label className="space-y-1">
              <span className="text-slate-500">평</span>
              <input
                type="number"
                value={pyeong}
                onChange={(e) => {
                  setPyeong(e.target.value);
                  const n = parseFloat(e.target.value);
                  setSqm(Number.isNaN(n) ? '' : (n * 3.305785).toFixed(2));
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-sm"
              />
            </label>
            <label className="space-y-1">
              <span className="text-slate-500">㎡</span>
              <input
                type="number"
                value={sqm}
                onChange={(e) => {
                  setSqm(e.target.value);
                  const n = parseFloat(e.target.value);
                  setPyeong(Number.isNaN(n) ? '' : (n / 3.305785).toFixed(2));
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-sm"
              />
            </label>
          </div>
        </div>

        {/* Temp / Length / Weight */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs">
          <h2 className="text-sm font-semibold">생활 단위 빠른 변환</h2>
          <div className="flex items-center justify-between gap-2">
            <span>섭씨(℃):</span>
            <input value={celsius} onChange={(e) => setCelsius(e.target.value)} className="w-24 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono" />
            <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
              = {((parseFloat(celsius) || 0) * 1.8 + 32).toFixed(1)} ℉
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span>길이(cm):</span>
            <input value={cm} onChange={(e) => setCm(e.target.value)} className="w-24 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono" />
            <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
              = {((parseFloat(cm) || 0) / 2.54).toFixed(2)} in
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span>무게(kg):</span>
            <input value={kg} onChange={(e) => setKg(e.target.value)} className="w-24 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono" />
            <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
              = {((parseFloat(kg) || 0) * 2.20462).toFixed(2)} lb
            </span>
          </div>
        </div>
      </section>

      {/* Date Calculators */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
          <h2 className="text-sm font-semibold">D-Day 계산기</h2>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-sm"
          />
          <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
            {Number.isNaN(dDayDiff) ? '-' : dDayDiff === 0 ? 'D-Day (오늘!)' : dDayDiff > 0 ? `D-${dDayDiff}` : `D+${Math.abs(dDayDiff)}`}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
          <h2 className="text-sm font-semibold">만 나이 계산기</h2>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-sm"
          />
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            만 {calcManAge()}세
          </div>
        </div>
      </section>
    </div>
  );
}
