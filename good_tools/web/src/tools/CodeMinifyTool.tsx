import { Diagnostic } from '../components/Diagnostic';
import { useText } from '../hooks/language';
import { useState } from 'react';
import { Minimize2 } from 'lucide-react';
import { CopyButton } from '../components/CopyButton';

type MinLang = 'json' | 'html' | 'css' | 'js' | 'sql';

function minifySource(code: string, lang: MinLang): string {
  if (lang === 'json') return JSON.stringify(JSON.parse(code));
  if (lang === 'html') {
    return code
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/>\s+</g, '><')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }
  if (lang === 'css') {
    return code
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s*([{}:;,])\s*/g, '$1')
      .replace(/;}/g, '}')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }
  if (lang === 'sql') {
    return code
      .replace(/--.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  // Lightweight JS whitespace/comment strip (safe for basic scripts)
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|\s)\/\/.*$/gm, '$1')
    .replace(/\n+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export default function CodeMinifyTool() {
  const ui = useText();
  const [lang, setLang] = useState<MinLang>('css');
  const [input, setInput] = useState('/* Sample CSS */\nbody {\n  margin: 0;\n  padding: 16px;\n  color: #111827;\n}');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const runMinify = () => {
    setError('');
    try {
      setOutput(minifySource(input, lang));
    } catch (err) {
      setError(err instanceof Error ? err.message : ui('압축 중 오류가 발생했습니다.', "Could not minify the code."));
    }
  };

  const inBytes = new TextEncoder().encode(input).length;
  const outBytes = new TextEncoder().encode(output).length;
  const savedPct = output && inBytes > 0 ? Math.round(((inBytes - outBytes) / inBytes) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(['json', 'html', 'css', 'js', 'sql'] as MinLang[]).map((l) => (
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

        <button
          type="button"
          onClick={runMinify}
          className="ml-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium cursor-pointer"
        >
          <Minimize2 className="w-3.5 h-3.5" /> {ui("코드 압축", "Minify code")}
        </button>
      </div>

      {error && <div className="text-xs text-rose-500 font-mono"><Diagnostic text={error} /></div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <div className="text-xs text-slate-500">{ui("원본 (", "Original (")}{inBytes.toLocaleString()} bytes)</div>
          <textarea
            rows={14}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">
              {ui("압축 결과 (", "Minified (")}{outBytes.toLocaleString()} bytes{output ? ui(` · ${savedPct}% 절감`, ` · ${savedPct}% smaller`) : ''})
            </span>
            <CopyButton text={output} />
          </div>
          <textarea
            readOnly
            rows={14}
            value={output}
            className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs"
          />
        </div>
      </div>
    </div>
  );
}
