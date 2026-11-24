import { useText } from '../hooks/language';
import { useEffect, useState } from 'react';
import { CopyButton } from '../components/CopyButton';

export default function TimestampConvTool() {
  const ui = useText();
  const [nowMs, setNowMs] = useState(Date.now());
  const [tsInput, setTsInput] = useState(() => String(Math.floor(Date.now() / 1000)));
  const [dateInput, setDateInput] = useState(() => new Date().toISOString().slice(0, 16));

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const parsedNum = Number(tsInput.trim());
  const isMs = Math.abs(parsedNum) > 1e11;
  const fromTsDate = !Number.isNaN(parsedNum) && tsInput.trim() !== '' ? new Date(isMs ? parsedNum : parsedNum * 1000) : null;
  const validTs = fromTsDate && !Number.isNaN(fromTsDate.getTime());

  const fromDateObj = new Date(dateInput);
  const validDate = !Number.isNaN(fromDateObj.getTime());

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-200 dark:border-indigo-500/30 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs text-indigo-600 dark:text-indigo-300">{ui("현재 Unix Timestamp (실시간)", "Current Unix timestamp")}</div>
          <div className="font-mono text-xl font-bold">{Math.floor(nowMs / 1000)}</div>
        </div>
        <div className="flex gap-2">
          <CopyButton text={String(Math.floor(nowMs / 1000))} label={ui("초(s) 복사", "Copy seconds")} />
          <CopyButton text={String(nowMs)} label={ui("밀리초(ms) 복사", "Copy milliseconds")} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
          <h2 className="text-sm font-semibold">{ui("Timestamp → 날짜/시각 (초·밀리초 자동 감지)", "Timestamp to date and time (seconds or milliseconds)")}</h2>
          <input
            value={tsInput}
            onChange={(e) => setTsInput(e.target.value)}
            placeholder={ui("예: 1700000000 또는 1700000000000", "Example: 1700000000 or 1700000000000")}
            className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-sm"
          />
          {validTs && fromTsDate ? (
            <div className="space-y-1.5 text-xs font-mono">
              <div><strong>{ui("한국시간 (KST):", "Korean Standard Time (KST):")}</strong> {fromTsDate.toLocaleString(ui('ko-KR', 'en-US'), { timeZone: 'Asia/Seoul' })}</div>
              <div><strong>UTC:</strong> {fromTsDate.toUTCString()}</div>
              <div><strong>ISO 8601:</strong> {fromTsDate.toISOString()}</div>
              <div className="text-slate-400">{ui("감지 단위:", "Detected unit:")} {isMs ? ui('밀리초 (ms)', "Milliseconds (ms)") : ui('초 (s)', "Seconds (s)")}</div>
            </div>
          ) : (
            <div className="text-xs text-rose-500">{ui("올바른 숫자 타임스탬프를 입력해 주세요.", "Enter a numeric timestamp.")}</div>
          )}
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
          <h2 className="text-sm font-semibold">{ui("날짜/시각 → Timestamp", "Date and time to timestamp")}</h2>
          <input
            type="datetime-local"
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
            className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-sm"
          />
          {validDate && (
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <span className="font-mono">{ui("초(s):", "Seconds:")} {Math.floor(fromDateObj.getTime() / 1000)}</span>
                <CopyButton text={String(Math.floor(fromDateObj.getTime() / 1000))} />
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <span className="font-mono">{ui("밀리초(ms):", "Milliseconds:")} {fromDateObj.getTime()}</span>
                <CopyButton text={String(fromDateObj.getTime())} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
