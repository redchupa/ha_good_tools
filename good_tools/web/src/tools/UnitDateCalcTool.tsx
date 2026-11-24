import { useText } from '../hooks/language';
import { useState } from 'react';

export default function UnitDateCalcTool() {
  const ui = useText();
  const [pyeong, setPyeong] = useState('34');
  const [sqm, setSqm] = useState((34 * 3.305785).toFixed(2));
  const [celsius, setCelsius] = useState('24');
  const [cm, setCm] = useState('175');
  const [kg, setKg] = useState('70');

  const today = new Date();
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const [targetDate, setTargetDate] = useState('2026-12-31');
  const [birthDate, setBirthDate] = useState('1990-01-01');

  const dDayDiff = (Date.parse(targetDate) - todayUtc) / 86400000;

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
          <h2 className="text-sm font-semibold">{ui("평수 ↔ 제곱미터(㎡)", "Pyeong ↔ square meters (m²)")}</h2>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <label className="space-y-1">
              <span className="text-slate-500">{ui("평", "Pyeong")}</span>
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
          <h2 className="text-sm font-semibold">{ui("생활 단위 빠른 변환", "Everyday unit conversions")}</h2>
          <div className="flex items-center justify-between gap-2">
            <span>{ui("섭씨(℃):", "Celsius (°C):")}</span>
            <input value={celsius} onChange={(e) => setCelsius(e.target.value)} className="w-24 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono" />
            <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
              = {((parseFloat(celsius) || 0) * 1.8 + 32).toFixed(1)} ℉
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span>{ui("길이(cm):", "Length (cm):")}</span>
            <input value={cm} onChange={(e) => setCm(e.target.value)} className="w-24 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono" />
            <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
              = {((parseFloat(cm) || 0) / 2.54).toFixed(2)} in
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span>{ui("무게(kg):", "Weight (kg):")}</span>
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
          <h2 className="text-sm font-semibold">{ui("D-Day 계산기", "Days to a date")}</h2>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-sm"
          />
          <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
            {Number.isNaN(dDayDiff) ? '-' : dDayDiff === 0 ? ui('D-Day (오늘!)', "Today!") : dDayDiff > 0 ? `D-${dDayDiff}` : `D+${Math.abs(dDayDiff)}`}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
          <h2 className="text-sm font-semibold">{ui("만 나이 계산기", "Age calculator")}</h2>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-sm"
          />
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {ui("만", "Age:")} {calcManAge()}{ui("세", " years")}
          </div>
        </div>
      </section>
    </div>
  );
}
