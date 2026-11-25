import { useText } from '../hooks/language';
import { useState } from 'react';
import { CopyButton, copyToClipboard } from '../components/CopyButton';

export default function HtmlCodesTool() {
  const ui = useText();
  const ENTITIES = [
    { char: '&', entity: '&amp;', num: '&#38;', desc: ui('앰퍼샌드 (Ampersand)', "Ampersand") },
    { char: '<', entity: '&lt;', num: '&#60;', desc: ui('보다 작음 (Less-than)', "Less than") },
    { char: '>', entity: '&gt;', num: '&#62;', desc: ui('보다 큼 (Greater-than)', "Greater than") },
    { char: '"', entity: '&quot;', num: '&#34;', desc: ui('큰따옴표 (Double quote)', "Double quote") },
    { char: "'", entity: '&apos;', num: '&#39;', desc: ui('작은따옴표 (Apostrophe)', "Apostrophe") },
    { char: '\u00A0', entity: '&nbsp;', num: '&#160;', desc: ui('줄바꿈 없는 공백', "Nonbreaking space") },
    { char: '©', entity: '&copy;', num: '&#169;', desc: ui('저작권 (Copyright)', "Copyright") },
    { char: '®', entity: '&reg;', num: '&#174;', desc: ui('등록상표 (Registered)', "Registered trademark") },
    { char: '™', entity: '&trade;', num: '&#8482;', desc: ui('상표 (Trademark)', "Trademark") },
    { char: '₩', entity: '&#8361;', num: '&#8361;', desc: ui('원화 기호 (Won)', "Won") },
    { char: '€', entity: '&euro;', num: '&#8364;', desc: ui('유로 (Euro)', "Euro") },
    { char: '£', entity: '&pound;', num: '&#163;', desc: ui('파운드 (Pound)', "Pound") },
    { char: '¥', entity: '&yen;', num: '&#165;', desc: ui('엔 (Yen)', "Yen") },
    { char: '±', entity: '&plusmn;', num: '&#177;', desc: ui('플러스마이너스', "Plus-minus") },
    { char: '×', entity: '&times;', num: '&#215;', desc: ui('곱셈 기호', "Multiplication") },
    { char: '÷', entity: '&divide;', num: '&#247;', desc: ui('나눗셈 기호', "Division") },
    { char: '°', entity: '&deg;', num: '&#176;', desc: ui('도 (Degree)', "Degree") },
    { char: '·', entity: '&middot;', num: '&#183;', desc: ui('가운뎃점', "Middle dot") },
    { char: '…', entity: '&hellip;', num: '&#8230;', desc: ui('말줄임표', "Ellipsis") },
    { char: '←', entity: '&larr;', num: '&#8592;', desc: ui('왼쪽 화살표', "Left arrow") },
    { char: '→', entity: '&rarr;', num: '&#8594;', desc: ui('오른쪽 화살표', "Right arrow") },
    { char: '↑', entity: '&uarr;', num: '&#8593;', desc: ui('위쪽 화살표', "Up arrow") },
    { char: '↓', entity: '&darr;', num: '&#8595;', desc: ui('아래쪽 화살표', "Down arrow") },
    { char: '♥', entity: '&hearts;', num: '&#9829;', desc: ui('하트', "Heart") },
    { char: '★', entity: '&#9733;', num: '&#9733;', desc: ui('채워진 별', "Solid star") },
  ];
  const [search, setSearch] = useState('');
  const [raw, setRaw] = useState('<div class="hello">Good Tools & Home Assistant</div>');
  const [copiedMsg, setCopiedMsg] = useState('');

  const escaped = raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const filtered = ENTITIES.filter(
    (e) =>
      !search.trim() ||
      e.char.includes(search) ||
      e.entity.toLowerCase().includes(search.toLowerCase()) ||
      e.desc.toLowerCase().includes(search.toLowerCase())
  );

  const pick = async (val: string) => {
    await copyToClipboard(val);
    setCopiedMsg(ui(`'${val}' 복사됨`, `Copied ${val}`));
    setTimeout(() => setCopiedMsg(''), 1500);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
        <div>
          <div className="text-xs font-semibold text-slate-500 mb-1">{ui("실시간 HTML Escape 입력", "Text to HTML entities")}</div>
          <textarea
            rows={3}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-500">{ui("Escape 결과", "Escaped text")}</span>
            <CopyButton text={escaped} />
          </div>
          <textarea
            readOnly
            rows={3}
            value={escaped}
            className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={ui("엔티티 이름 또는 설명 검색...", "Search entity names or descriptions...")}
          className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
        />
        {copiedMsg && <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{copiedMsg}</span>}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500">
              <th className="py-2 px-3">{ui("문자", "Character")}</th>
              <th className="py-2 px-3">{ui("HTML 엔티티", "HTML entity")}</th>
              <th className="py-2 px-3">{ui("숫자 코드", "Numeric code")}</th>
              <th className="py-2 px-3">{ui("설명", "Description")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((e) => (
              <tr key={e.entity} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="py-2 px-3 text-base font-bold">
                  <button type="button" onClick={() => pick(e.char)} className="cursor-pointer hover:text-indigo-500">
                    {e.char === '\u00A0' ? '␣' : e.char}
                  </button>
                </td>
                <td className="py-2 px-3 font-mono">
                  <button type="button" onClick={() => pick(e.entity)} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 cursor-pointer">
                    {e.entity}
                  </button>
                </td>
                <td className="py-2 px-3 font-mono">
                  <button type="button" onClick={() => pick(e.num)} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 cursor-pointer">
                    {e.num}
                  </button>
                </td>
                <td className="py-2 px-3 text-slate-600 dark:text-slate-300">{e.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
