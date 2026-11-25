import { Diagnostic } from '../components/Diagnostic';
import { useText } from '../hooks/language';
import { useMemo, useState } from 'react';
import { CopyButton } from '../components/CopyButton';

import { parseCsv } from '../utils/csv';

export default function CsvJsonTool() {
  const ui = useText();
  const [csvText, setCsvText] = useState(ui('name,room,state\n거실 조명,거실,on\n안방 에어컨,안방,off\n현관 센서,현관,on', "name,room,state\nLiving room light,living room,on\nBedroom AC,bedroom,off\nDoor sensor,entryway,on"));
  const [filter, setFilter] = useState('');

  const { rows, error } = useMemo(() => {
    try { return { rows: parseCsv(csvText), error: '' }; }
    catch (err) { return { rows: [], error: err instanceof Error ? err.message : String(err) }; }
  }, [csvText]);
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
  const filteredRows = filter.trim()
    ? rows.filter((r) => Object.values(r).some((v) => v.toLowerCase().includes(filter.toLowerCase())))
    : rows;
  const jsonOut = useMemo(() => JSON.stringify(rows, null, 2), [rows]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-slate-500">{ui("CSV / TSV 입력 (엑셀 복사 붙여넣기 지원)", "CSV / TSV input (paste from a spreadsheet)")}</div>
          <textarea
            rows={8}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">{ui("JSON 출력 (", "JSON output (")}{rows.length}{ui("행)", " rows)")}</span>
            <CopyButton text={jsonOut} label={ui("JSON 복사", "Copy JSON")} />
          </div>
          <textarea
            readOnly
            rows={8}
            value={jsonOut}
            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs"
          />
        </div>
      </div>

      {error && <p role="alert"><Diagnostic text={error} /></p>}
      {headers.length > 0 && (
        <div className="space-y-2">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={ui("테이블 내 데이터 검색...", "Search table data...")}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
          />
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-xs text-left border-collapse">
              <caption>{ui("미리보기", "Preview")} {Math.min(filteredRows.length, 200)} / {filteredRows.length}{ui("행", " rows")}</caption>
              <thead className="bg-slate-100 dark:bg-slate-800">
                <tr>
                  {headers.map((h) => (
                    <th key={h} className="py-2 px-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRows.slice(0, 200).map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    {headers.map((h) => (
                      <td key={h} className="py-2 px-3">{row[h]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
