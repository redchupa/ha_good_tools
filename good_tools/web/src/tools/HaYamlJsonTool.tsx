import { useState } from 'react';
import yaml from 'js-yaml';
import { CheckCircle2, XCircle, ArrowRightLeft } from 'lucide-react';
import { CopyButton } from '../components/CopyButton';

const SAMPLE_YAML = `alias: 현관문 열림 알림
description: 야간에 현관문이 열리면 조명을 켜고 알림을 보냅니다.
trigger:
  - platform: state
    entity_id: binary_sensor.front_door
    to: "on"
condition:
  - condition: sun
    after: sunset
action:
  - service: light.turn_on
    target:
      entity_id: light.hallway
mode: single
`;

export default function HaYamlJsonTool() {
  const [yamlText, setYamlText] = useState(SAMPLE_YAML);
  const [jsonText, setJsonText] = useState('');
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  const yamlToJson = () => {
    try {
      const parsed = yaml.load(yamlText);
      const out = JSON.stringify(parsed, null, 2);
      setJsonText(out);
      setStatus({ ok: true, msg: 'YAML 문법 정상 — JSON으로 변환 완료' });
    } catch (e) {
      setStatus({ ok: false, msg: e instanceof Error ? e.message : 'YAML 구문 오류' });
    }
  };

  const jsonToYaml = () => {
    try {
      const parsed = JSON.parse(jsonText);
      const out = yaml.dump(parsed, { indent: 2, lineWidth: 120 });
      setYamlText(out);
      setStatus({ ok: true, msg: 'JSON 문법 정상 — YAML로 변환 완료' });
    } catch (e) {
      setStatus({ ok: false, msg: e instanceof Error ? e.message : 'JSON 구문 오류' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={yamlToJson}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium cursor-pointer"
        >
          <ArrowRightLeft className="w-3.5 h-3.5" /> YAML 검증 & → JSON
        </button>
        <button
          type="button"
          onClick={jsonToYaml}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium cursor-pointer"
        >
          <ArrowRightLeft className="w-3.5 h-3.5" /> JSON → YAML
        </button>
        {status && (
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium ${
              status.ok
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                : 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
            }`}
          >
            {status.ok ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {status.msg}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">YAML</span>
            <CopyButton text={yamlText} />
          </div>
          <textarea
            rows={16}
            value={yamlText}
            onChange={(e) => setYamlText(e.target.value)}
            className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs outline-none focus:border-indigo-500"
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">JSON</span>
            <CopyButton text={jsonText} />
          </div>
          <textarea
            rows={16}
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder="변환된 JSON이 여기에 표시됩니다..."
            className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs outline-none focus:border-indigo-500"
          />
        </div>
      </div>
    </div>
  );
}
