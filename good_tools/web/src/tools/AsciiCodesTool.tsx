import { useMemo, useState } from 'react';
import { CopyButton } from '../components/CopyButton';

const CONTROL_NAMES = [
  'NUL', 'SOH', 'STX', 'ETX', 'EOT', 'ENQ', 'ACK', 'BEL', 'BS', 'TAB', 'LF', 'VT', 'FF', 'CR', 'SO', 'SI',
  'DLE', 'DC1', 'DC2', 'DC3', 'DC4', 'NAK', 'SYN', 'ETB', 'CAN', 'EM', 'SUB', 'ESC', 'FS', 'GS', 'RS', 'US',
];

export default function AsciiCodesTool() {
  const [filter, setFilter] = useState<'all' | 'printable' | 'control'>('printable');
  const [search, setSearch] = useState('');
  const [sampleText, setSampleText] = useState('Hello HA!');

  const rows = useMemo(() => {
    return Array.from({ length: 128 }, (_, code) => {
      const isCtrl = code < 32 || code === 127;
      const char = code < 32 ? CONTROL_NAMES[code] : code === 32 ? 'SPACE' : code === 127 ? 'DEL' : String.fromCharCode(code);
      return {
        dec: code,
        hex: '0x' + code.toString(16).toUpperCase().padStart(2, '0'),
        oct: code.toString(8).padStart(3, '0'),
        bin: code.toString(2).padStart(8, '0'),
        char,
        isCtrl,
      };
    }).filter((r) => {
      if (filter === 'printable' && r.isCtrl) return false;
      if (filter === 'control' && !r.isCtrl) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return String(r.dec).includes(q) || r.hex.toLowerCase().includes(q) || r.char.toLowerCase().includes(q);
    });
  }, [filter, search]);

  const textHex = Array.from(sampleText).map((c) => c.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')).join(' ');
  const textDec = Array.from(sampleText).map((c) => c.charCodeAt(0)).join(' ');

  return (
    <div className="space-y-5">
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
        <div className="text-xs font-semibold text-slate-500">문자열 → ASCII 코드 즉시 변환</div>
        <input
          value={sampleText}
          onChange={(e) => setSampleText(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-sm"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <span className="font-mono truncate">DEC: {textDec}</span>
            <CopyButton text={textDec} />
          </div>
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <span className="font-mono truncate">HEX: {textHex}</span>
            <CopyButton text={textHex} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(['printable', 'control', 'all'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
              filter === f ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800'
            }`}
          >
            {f === 'printable' ? '출력 문자 (32~126)' : f === 'control' ? '제어 문자 (0~31, 127)' : '전체 (0~127)'}
          </button>
        ))}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="문자, DEC, HEX 검색..."
          className="ml-auto px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
        />
      </div>

      <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
        <table className="w-full text-xs font-mono text-left border-collapse">
          <thead className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
            <tr className="text-slate-500">
              <th className="py-2 px-3">DEC</th>
              <th className="py-2 px-3">HEX</th>
              <th className="py-2 px-3">OCT</th>
              <th className="py-2 px-3">BIN</th>
              <th className="py-2 px-3">CHAR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((r) => (
              <tr key={r.dec} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="py-1.5 px-3">{r.dec}</td>
                <td className="py-1.5 px-3 text-indigo-600 dark:text-indigo-400">{r.hex}</td>
                <td className="py-1.5 px-3">{r.oct}</td>
                <td className="py-1.5 px-3 text-slate-500">{r.bin}</td>
                <td className="py-1.5 px-3 font-bold text-sm">{r.char}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
