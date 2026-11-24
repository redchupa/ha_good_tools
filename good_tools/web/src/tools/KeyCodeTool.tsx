import { useText } from '../hooks/language';
import { useEffect, useState } from 'react';

interface KeyInfo {
  key: string;
  code: string;
  keyCode: number;
  location: number;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
  timestamp: string;
}

export default function KeyCodeTool() {
  const ui = useText();
  const [last, setLast] = useState<KeyInfo | null>(null);
  const [history, setHistory] = useState<KeyInfo[]>([]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') return;
      e.preventDefault();
      const info: KeyInfo = {
        key: e.key === ' ' ? 'Space ( )' : e.key,
        code: e.code,
        keyCode: e.keyCode,
        location: e.location,
        ctrlKey: e.ctrlKey,
        altKey: e.altKey,
        shiftKey: e.shiftKey,
        metaKey: e.metaKey,
        timestamp: new Date().toLocaleTimeString(),
      };
      setLast(info);
      setHistory((prev) => [info, ...prev].slice(0, 12));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="space-y-5">
      <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border-2 border-dashed border-slate-300 dark:border-slate-700 text-center">
        {last ? (
          <div className="space-y-3">
            <div className="inline-block px-6 py-3 rounded-2xl bg-white dark:bg-slate-900 border-2 border-indigo-500 shadow-md text-3xl font-mono font-bold text-indigo-600 dark:text-indigo-400">
              {last.key}
            </div>
            <div className="flex justify-center gap-2 text-xs">
              {(['ctrlKey', 'altKey', 'shiftKey', 'metaKey'] as const).map((m) => (
                <span
                  key={m}
                  className={`px-2.5 py-1 rounded-lg font-mono ${
                    last[m]
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {m.replace('Key', '').toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-500">{ui("아무 키보드 키나 눌러보세요. 이벤트 정보가 실시간으로 표시됩니다.", "Press any key to see its event details.")}</div>
        )}
      </div>

      {last && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          {[
            ['event.key', last.key],
            ['event.code', last.code],
            ['event.keyCode (legacy)', String(last.keyCode)],
            ['event.location', String(last.location)],
          ].map(([k, v]) => (
            <div key={k} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="text-[11px] text-slate-500">{k}</div>
              <div className="font-mono font-bold text-base mt-1">{v}</div>
            </div>
          ))}
        </div>
      )}

      {history.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-slate-500">{ui("최근 입력 로그", "Recent key events")}</div>
          <div className="flex flex-wrap gap-1.5">
            {history.map((h, i) => (
              <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono text-xs">
                {h.code} ({h.keyCode})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
