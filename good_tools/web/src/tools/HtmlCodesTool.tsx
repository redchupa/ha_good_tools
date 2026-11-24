import { useState } from 'react';
import { CopyButton, copyToClipboard } from '../components/CopyButton';

const ENTITIES = [
  { char: '&', entity: '&amp;', num: '&#38;', desc: '앰퍼샌드 (Ampersand)' },
  { char: '<', entity: '&lt;', num: '&#60;', desc: '보다 작음 (Less-than)' },
  { char: '>', entity: '&gt;', num: '&#62;', desc: '보다 큼 (Greater-than)' },
  { char: '"', entity: '&quot;', num: '&#34;', desc: '큰따옴표 (Double quote)' },
  { char: "'", entity: '&apos;', num: '&#39;', desc: '작은따옴표 (Apostrophe)' },
  { char: '\u00A0', entity: '&nbsp;', num: '&#160;', desc: '줄바꿈 없는 공백' },
  { char: '©', entity: '&copy;', num: '&#169;', desc: '저작권 (Copyright)' },
  { char: '®', entity: '&reg;', num: '&#174;', desc: '등록상표 (Registered)' },
  { char: '™', entity: '&trade;', num: '&#8482;', desc: '상표 (Trademark)' },
  { char: '₩', entity: '&#8361;', num: '&#8361;', desc: '원화 기호 (Won)' },
  { char: '€', entity: '&euro;', num: '&#8364;', desc: '유로 (Euro)' },
  { char: '£', entity: '&pound;', num: '&#163;', desc: '파운드 (Pound)' },
  { char: '¥', entity: '&yen;', num: '&#165;', desc: '엔 (Yen)' },
  { char: '±', entity: '&plusmn;', num: '&#177;', desc: '플러스마이너스' },
  { char: '×', entity: '&times;', num: '&#215;', desc: '곱셈 기호' },
  { char: '÷', entity: '&divide;', num: '&#247;', desc: '나눗셈 기호' },
  { char: '°', entity: '&deg;', num: '&#176;', desc: '도 (Degree)' },
  { char: '·', entity: '&middot;', num: '&#183;', desc: '가운뎃점' },
  { char: '…', entity: '&hellip;', num: '&#8230;', desc: '말줄임표' },
  { char: '←', entity: '&larr;', num: '&#8592;', desc: '왼쪽 화살표' },
  { char: '→', entity: '&rarr;', num: '&#8594;', desc: '오른쪽 화살표' },
  { char: '↑', entity: '&uarr;', num: '&#8593;', desc: '위쪽 화살표' },
  { char: '↓', entity: '&darr;', num: '&#8595;', desc: '아래쪽 화살표' },
  { char: '♥', entity: '&hearts;', num: '&#9829;', desc: '하트' },
  { char: '★', entity: '&#9733;', num: '&#9733;', desc: '채워진 별' },
];

export default function HtmlCodesTool() {
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
    setCopiedMsg(`'${val}' 복사됨`);
    setTimeout(() => setCopiedMsg(''), 1500);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
        <div>
          <div className="text-xs font-semibold text-slate-500 mb-1">실시간 HTML Escape 입력</div>
          <textarea
            rows={3}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-500">Escape 결과</span>
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
          placeholder="엔티티 이름 또는 설명 검색..."
          className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
        />
        {copiedMsg && <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{copiedMsg}</span>}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500">
              <th className="py-2 px-3">문자</th>
              <th className="py-2 px-3">HTML 엔티티</th>
              <th className="py-2 px-3">숫자 코드</th>
              <th className="py-2 px-3">설명</th>
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
