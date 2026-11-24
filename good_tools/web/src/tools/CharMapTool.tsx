import { useText } from '../hooks/language';
import { useState } from 'react';
import { copyToClipboard } from '../components/CopyButton';

export default function CharMapTool() {
  const ui = useText();
  const GROUPS: { name: string; chars: string[] }[] = [
    { name: ui('화살표', "Arrows"), chars: ['←', '→', '↑', '↓', '↔', '↕', '↖', '↗', '↘', '↙', '⇐', '⇒', '⇑', '⇓', '⇔', '➜', '➤', '➥', '↩', '↪', '↺', '↻'] },
    { name: ui('도형·별·체크', "Shapes, stars and checks"), chars: ['★', '☆', '✦', '✧', '✩', '✪', '●', '○', '◎', '◉', '■', '□', '▪', '▫', '▲', '△', '▼', '▽', '◆', '◇', '♠', '♣', '♥', '♦', '✓', '✔', '✕', '✖', '✗', '✘', '☑', '☐', '☒'] },
    { name: ui('괄호·문장부호', "Brackets and punctuation"), chars: ['「', '」', '『', '』', '【', '】', '〔', '〕', '《', '》', '〈', '〉', '‘', '’', '“', '”', '…', '·', '※', '§', '¶', '†', '‡', '•', '‣', '◦', '‐', '–', '—'] },
    { name: ui('수학·단위', "Math and units"), chars: ['±', '×', '÷', '≠', '≈', '≤', '≥', '∞', '√', '∑', '∏', '∫', '∂', '∆', 'π', '°', '℃', '℉', '‰', '㎡', '㎥', '㎞', '㎝', '㎜', '㎏', '㎖', 'ℓ', '원', '₩', '$', '€', '£', '¥'] },
    { name: ui('원문자·숫자', "Circled letters and numbers"), chars: ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪', '⑫', '⑬', '⑭', '⑮', '❶', '❷', '❸', '❹', '❺', 'ⓐ', 'ⓑ', 'ⓒ', '㉠', '㉡', '㉢', '㉮', '㉯', '㉰', 'Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ', 'Ⅶ', 'Ⅷ', 'Ⅸ', 'Ⅹ'] },
    { name: ui('그리스 문자', "Greek letters"), chars: ['α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'ι', 'κ', 'λ', 'μ', 'ν', 'ξ', 'ο', 'π', 'ρ', 'σ', 'τ', 'υ', 'φ', 'χ', 'ψ', 'ω', 'Α', 'Β', 'Γ', 'Δ', 'Θ', 'Λ', 'Π', 'Σ', 'Φ', 'Ψ', 'Ω'] },
    { name: ui('인기 이모지', "Popular emoji"), chars: ['😀', '😂', '🥰', '😎', '🤔', '👍', '👏', '🙏', '🔥', '✨', '🎉', '💡', '⚡', '✅', '❌', '⚠️', '📌', '🏠', '📱', '💻', '🔒', '🔑', '📊', '🚀', '❤️', '🧡', '💛', '💚', '💙', '💜'] },
  ];
  const [selectedGroup, setSelectedGroup] = useState(0);
  const [search, setSearch] = useState('');
  const [recent, setRecent] = useState<string[]>([]);
  const [toast, setToast] = useState('');

  const handlePick = async (ch: string) => {
    await copyToClipboard(ch);
    setRecent((prev) => [ch, ...prev.filter((c) => c !== ch)].slice(0, 16));
    setToast(ui(`'${ch}' 복사됨 (U+${ch.codePointAt(0)?.toString(16).toUpperCase().padStart(4, '0')})`, `Copied ${ch} (U+${ch.codePointAt(0)?.toString(16).toUpperCase().padStart(4, '0')})`));
    setTimeout(() => setToast(''), 1800);
  };

  const visibleGroups = GROUPS.filter((_, i) => selectedGroup === 0 || i + 1 === selectedGroup)
    .map((g) => ({
      ...g,
      chars: search.trim()
        ? g.chars.filter(
            (c) =>
              c.includes(search) ||
              g.name.includes(search) ||
              (c.codePointAt(0)?.toString(16).toLowerCase() || '').includes(search.toLowerCase())
          )
        : g.chars,
    }))
    .filter((g) => g.chars.length > 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={ui("카테고리명, 문자 또는 유니코드(16진수) 검색...", "Search by category, character or Unicode (hex)...")}
          className="flex-1 min-w-[220px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:border-indigo-500"
        />
        {toast && (
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
            {toast}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {[ui('전체', "All"), ...GROUPS.map((g) => g.name)].map((name, index) => (
          <button
            key={name}
            type="button"
            onClick={() => setSelectedGroup(index)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
              selectedGroup === index
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {recent.length > 0 && (
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="text-xs font-semibold text-slate-500 mb-2">{ui("최근 복사한 문자", "Recently copied")}</div>
          <div className="flex flex-wrap gap-1.5">
            {recent.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => handlePick(c)}
                className="w-10 h-10 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 text-lg flex items-center justify-center cursor-pointer"
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-5">
        {visibleGroups.map((g) => (
          <div key={g.name}>
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              {g.name} ({g.chars.length})
            </h3>
            <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-12 gap-1.5">
              {g.chars.map((c, idx) => (
                <button
                  key={`${g.name}-${idx}`}
                  type="button"
                  onClick={() => handlePick(c)}
                  title={ui(`클릭하여 복사 (U+${c.codePointAt(0)?.toString(16).toUpperCase()})`, `Click to copy (U+${c.codePointAt(0)?.toString(16).toUpperCase()})`)}
                  className="h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 hover:border-indigo-400 text-xl flex items-center justify-center transition-all cursor-pointer active:scale-95"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
