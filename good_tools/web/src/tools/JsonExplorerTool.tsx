import { Diagnostic } from '../components/Diagnostic';
import { useText } from '../hooks/language';
import { useMemo, useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { copyToClipboard } from '../components/CopyButton';

const SAMPLE_JSON = `{
  "home_assistant": {
    "version": "2026.11.2",
    "location": "Seoul",
    "lights": [
      { "id": "light.living", "on": true, "brightness": 220 },
      { "id": "light.bedroom", "on": false, "brightness": 0 }
    ]
  }
}`;

function TreeNode({
  name,
  value,
  path,
  onPick,
}: {
  name: string;
  value: unknown;
  path: string;
  onPick: (path: string, val: unknown) => void;
}) {
  const [open, setOpen] = useState(true);
  const isObj = value !== null && typeof value === 'object';

  if (!isObj) {
    return (
      <div className="pl-5 py-0.5 flex items-center gap-1.5 text-xs font-mono hover:bg-indigo-50 dark:hover:bg-indigo-500/15 rounded px-1">
        <button type="button" onClick={() => onPick(path, value)} className="text-left cursor-pointer flex items-center gap-1.5 w-full">
          <span className="text-indigo-600 dark:text-indigo-400">{name}:</span>
          <span className="text-emerald-700 dark:text-emerald-300 break-all">{JSON.stringify(value)}</span>
        </button>
      </div>
    );
  }

  const entries = Array.isArray(value)
    ? value.map((v, i) => [String(i), v, `${path}[${i}]`] as const)
    : Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, v, `${path}.${k}`] as const);

  return (
    <div className="pl-3">
      <div className="flex items-center gap-1 py-0.5 text-xs font-mono">
        <button type="button" onClick={() => setOpen((o) => !o)} className="p-0.5 text-slate-400 cursor-pointer">
          {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
        <button
          type="button"
          onClick={() => onPick(path, value)}
          className="font-semibold text-slate-800 dark:text-slate-200 hover:text-indigo-500 cursor-pointer"
        >
          {name} <span className="text-slate-400 font-normal">{Array.isArray(value) ? `[${entries.length}]` : `{${entries.length}}`}</span>
        </button>
      </div>
      {open && (
        <div className="border-l border-slate-200 dark:border-slate-700 ml-2">
          {entries.map(([k, v, childPath]) => (
            <TreeNode key={childPath} name={k} value={v} path={childPath} onPick={onPick} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function JsonExplorerTool() {
  const ui = useText();
  const [raw, setRaw] = useState(SAMPLE_JSON);
  const [selectedPath, setSelectedPath] = useState('');

  const { parsed, error } = useMemo(() => {
    try {
      return { parsed: JSON.parse(raw), error: '' };
    } catch (e) {
      return { parsed: null, error: e instanceof Error ? e.message : ui('JSON 파싱 오류', "Invalid JSON") };
    }
  }, [raw]);

  const handlePick = async (path: string) => {
    setSelectedPath(path);
    await copyToClipboard(path);
  };

  return (
    <div className="space-y-4">
      {selectedPath && (
        <div className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono text-xs">
          {ui("JSONPath 복사됨:", "Copied JSONPath:")} <strong>{selectedPath}</strong>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-slate-500">{ui("JSON 입력", "JSON input")}</div>
          <textarea
            rows={16}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs"
          />
          {error && <div className="text-xs text-rose-500 font-mono"><Diagnostic text={error} /></div>}
        </div>

        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-slate-500">{ui("트리 탐색 (노드 클릭 시 JSONPath 복사)", "Explore tree (click a node to copy its JSONPath)")}</div>
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 overflow-auto max-h-[380px]">
            {parsed !== null ? (
              <TreeNode name="$" value={parsed} path="$" onPick={handlePick} />
            ) : (
              <div className="text-xs text-slate-400">{ui("올바른 JSON을 입력하면 트리가 표시됩니다.", "Enter valid JSON to see the tree.")}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
