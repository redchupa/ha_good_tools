import { useState } from 'react';
import { format } from 'prettier/standalone';
import { format as formatSql } from 'sql-formatter';
import yaml from 'js-yaml';
import { Sparkles } from 'lucide-react';
import { CopyButton } from '../components/CopyButton';

type Lang = 'json' | 'js' | 'html' | 'css' | 'sql' | 'yaml';

export default function CodeBeautifyTool() {
  const [lang, setLang] = useState<Lang>('json');
  const [indent, setIndent] = useState(2);
  const [input, setInput] = useState('{"app":"Good Tools","version":"1.0.0","features":["ingress","dark-mode","32-tools"]}');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const runFormat = async () => {
    setError('');
    try {
      let res = '';
      if (lang === 'json') {
        res = JSON.stringify(JSON.parse(input), null, indent);
      } else if (lang === 'js') {
        res = await format(input, { parser: 'babel', tabWidth: indent, plugins: await Promise.all([import('prettier/plugins/babel'), import('prettier/plugins/estree')]) });
      } else if (lang === 'html') {
        res = await format(input, { parser: 'html', tabWidth: indent, plugins: [await import('prettier/plugins/html')] });
      } else if (lang === 'css') {
        res = await format(input, { parser: 'css', tabWidth: indent, plugins: [await import('prettier/plugins/postcss')] });
      } else if (lang === 'sql') {
        res = formatSql(input, { tabWidth: indent });
      } else if (lang === 'yaml') {
        res = yaml.dump(yaml.load(input), { indent });
      }
      setOutput(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : '포맷팅 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(['json', 'js', 'html', 'css', 'sql', 'yaml'] as Lang[]).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLang(l)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase cursor-pointer ${
              lang === l ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800'
            }`}
          >
            {l}
          </button>
        ))}

        <select
          value={indent}
          onChange={(e) => setIndent(Number(e.target.value))}
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
        >
          <option value={2}>들여쓰기 2칸</option>
          <option value={4}>들여쓰기 4칸</option>
        </select>

        <button
          type="button"
          onClick={runFormat}
          className="ml-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" /> 코드 정렬
        </button>
      </div>

      {error && <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-300 text-xs font-mono">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <textarea
          rows={15}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs"
        />
        <div className="space-y-1.5">
          <div className="flex justify-end">
            <CopyButton text={output} />
          </div>
          <textarea
            readOnly
            rows={14}
            value={output}
            placeholder="정렬 결과가 여기에 표시됩니다..."
            className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs"
          />
        </div>
      </div>
    </div>
  );
}
