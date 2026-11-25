import { useText } from '../hooks/language';
import { useMemo, useState } from 'react';
import { CopyButton } from '../components/CopyButton';

export default function CharCounterTool() {
  const ui = useText();
  const [text, setText] = useState('');

  const stats = useMemo(() => {
    const withSpaces = text.length;
    const withoutSpaces = text.replace(/\s/g, '').length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const lines = text ? text.split(/\r?\n/).length : 0;
    const utf8Bytes = new TextEncoder().encode(text).length;
    // Approximate EUC-KR byte length (ASCII=1, non-ASCII=2)
    let euckrBytes = 0;
    for (const ch of text) {
      euckrBytes += ch.charCodeAt(0) <= 0x7f ? 1 : 2;
    }
    const readMin = Math.max(0, Math.ceil(words / 200));
    return { withSpaces, withoutSpaces, words, lines, utf8Bytes, euckrBytes, readMin };
  }, [text]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {[
          { label: ui('공백 포함', "With spaces"), value: ui(`${stats.withSpaces.toLocaleString()}자`, `${stats.withSpaces.toLocaleString()} characters`) },
          { label: ui('공백 제외', "Without spaces"), value: ui(`${stats.withoutSpaces.toLocaleString()}자`, `${stats.withoutSpaces.toLocaleString()} characters`) },
          { label: ui('단어 수', "Words"), value: ui(`${stats.words.toLocaleString()}개`, `${stats.words.toLocaleString()}`) },
          { label: ui('줄 수', "Lines"), value: ui(`${stats.lines.toLocaleString()}줄`, `${stats.lines.toLocaleString()}`) },
          { label: 'UTF-8', value: `${stats.utf8Bytes.toLocaleString()} B` },
          { label: ui('EUC-KR(추정)', "EUC-KR (estimate)"), value: `${stats.euckrBytes.toLocaleString()} B` },
        ].map((item) => (
          <div key={item.label} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">{item.label}</div>
            <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">{item.value}</div>
          </div>
        ))}
      </div>

      <textarea
        rows={12}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={ui("글자수와 바이트를 계산할 텍스트를 입력하세요...", "Enter text to count characters and bytes...")}
        className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm outline-none focus:border-indigo-500"
      />

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{ui("예상 읽기 시간: 약", "Estimated reading time: about")} {stats.readMin}{ui("분", " min")}</span>
        <div className="flex gap-2">
          <CopyButton text={text} label={ui("텍스트 복사", "Copy text")} />
          <button
            type="button"
            onClick={() => setText('')}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            {ui("지우기", "Clear")}
          </button>
        </div>
      </div>
    </div>
  );
}
