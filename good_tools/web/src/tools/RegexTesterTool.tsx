import { useMemo, useState } from 'react';
import { CopyButton } from '../components/CopyButton';

const PRESETS = [
  { label: '휴대폰 번호', pattern: '01[016789]-?\\d{3,4}-?\\d{4}', flags: 'g' },
  { label: '이메일', pattern: '[\\w.-]+@[\\w.-]+\\.[a-zA-Z]{2,}', flags: 'g' },
  { label: 'URL', pattern: 'https?://[^\\s]+', flags: 'g' },
  { label: 'IPv4 주소', pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b', flags: 'g' },
  { label: '한글만 추출', pattern: '[가-힣]+', flags: 'g' },
];

export default function RegexTesterTool() {
  const [pattern, setPattern] = useState('01[016789]-?\\d{3,4}-?\\d{4}');
  const [flags, setFlags] = useState('g');
  const [text, setText] = useState('연락처: 010-1234-5678 / 보조: 01098765432 / 이메일: test@example.com');
  const [replaceWith, setReplaceWith] = useState('010-****-****');

  const { matches, replaced, error } = useMemo(() => {
    try {
      const safeFlags = flags.includes('g') ? flags : flags + 'g';
      const re = new RegExp(pattern, safeFlags);
      const found = Array.from(text.matchAll(re))
        .slice(0, 200)
        .map((m) => ({ value: m[0], index: m.index ?? 0 }));
      const rep = text.replace(new RegExp(pattern, flags), replaceWith);
      return { matches: found, replaced: rep, error: '' };
    } catch (e) {
      return { matches: [], replaced: '', error: e instanceof Error ? e.message : '정규식 오류' };
    }
  }, [pattern, flags, text, replaceWith]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => {
              setPattern(p.pattern);
              setFlags(p.flags);
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-xs font-medium cursor-pointer"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          placeholder="정규표현식 패턴"
          className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-sm"
        />
        <input
          value={flags}
          onChange={(e) => setFlags(e.target.value)}
          placeholder="flags"
          className="w-20 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-sm text-center"
        />
      </div>

      {error && <div className="text-xs text-rose-500 font-mono">{error}</div>}

      <textarea
        rows={5}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="테스트할 문자열 입력..."
        className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs"
      />

      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
        <div className="text-xs font-semibold text-slate-500">매칭 결과 ({matches.length}건)</div>
        <div className="flex flex-wrap gap-1.5">
          {matches.length === 0 ? (
            <span className="text-xs text-slate-400">일치 항목 없음</span>
          ) : (
            matches.map((m, i) => (
              <span key={i} className="px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-mono text-xs">
                {m.value} <span className="opacity-60">@{m.index}</span>
              </span>
            ))
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <input
            value={replaceWith}
            onChange={(e) => setReplaceWith(e.target.value)}
            placeholder="치환할 문자열 (예: $1-****)"
            className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs"
          />
          <CopyButton text={replaced} label="치환 결과 복사" />
        </div>
        <pre className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-mono text-xs whitespace-pre-wrap">
          {replaced}
        </pre>
      </div>
    </div>
  );
}
