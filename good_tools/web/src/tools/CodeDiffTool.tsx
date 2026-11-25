import { useText } from '../hooks/language';
import { useMemo, useState } from 'react';
import { diffLines } from 'diff';

export default function CodeDiffTool() {
  const ui = useText();
  const [left, setLeft] = useState('name: Good Tools\nversion: 0.9.0\ntheme: light\nport: 8080\n');
  const [right, setRight] = useState('name: Good Tools\nversion: 1.0.0\ntheme: dark\ningress: true\nport: 8099\n');
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);

  const changes = useMemo(
    () => diffLines(left, right, { ignoreWhitespace }),
    [left, right, ignoreWhitespace]
  );

  const stats = useMemo(() => {
    let added = 0;
    let removed = 0;
    for (const c of changes) {
      const count = c.count || 0;
      if (c.added) added += count;
      if (c.removed) removed += count;
    }
    return { added, removed };
  }, [changes]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={ignoreWhitespace} onChange={(e) => setIgnoreWhitespace(e.target.checked)} />
          {ui("공백 차이 무시", "Ignore whitespace differences")}
        </label>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">+{stats.added} {ui("추가", "Added")}</span>
          <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400">-{stats.removed} {ui("삭제", "Removed")}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <textarea
          rows={9}
          value={left}
          onChange={(e) => setLeft(e.target.value)}
          placeholder={ui("원본 텍스트 (Before)", "Original text")}
          className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs"
        />
        <textarea
          rows={9}
          value={right}
          onChange={(e) => setRight(e.target.value)}
          placeholder={ui("수정 텍스트 (After)", "Modified text")}
          className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs"
        />
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden font-mono text-xs">
        {changes.map((part, idx) => {
          const bg = part.added
            ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
            : part.removed
            ? 'bg-rose-500/15 text-rose-800 dark:text-rose-300'
            : 'bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400';
          const prefix = part.added ? '+ ' : part.removed ? '- ' : '  ';
          return (
            <pre key={idx} className={`px-3 py-1 whitespace-pre-wrap break-all ${bg}`}>
              {part.value
                .replace(/\n$/, '')
                .split('\n')
                .map((line) => prefix + line)
                .join('\n')}
            </pre>
          );
        })}
      </div>
    </div>
  );
}
