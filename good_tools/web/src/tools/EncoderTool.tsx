import { useState } from 'react';
import { CopyButton } from '../components/CopyButton';

type Mode = 'base64' | 'url' | 'unicode' | 'hex' | 'jwt';

function toBase64(str: string) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

function fromBase64(b64: string) {
  const bin = atob(b64.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export default function EncoderTool() {
  const [mode, setMode] = useState<Mode>('base64');
  const [input, setInput] = useState('안녕하세요 Home Assistant Good Tools!');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const encode = () => {
    setError('');
    try {
      if (mode === 'base64') setOutput(toBase64(input));
      else if (mode === 'url') setOutput(encodeURIComponent(input));
      else if (mode === 'unicode') {
        setOutput(
          Array.from(input)
            .map((c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'))
            .join('')
        );
      } else if (mode === 'hex') {
        const bytes = new TextEncoder().encode(input);
        setOutput(Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join(' '));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '인코딩 오류');
    }
  };

  const decode = () => {
    setError('');
    try {
      if (mode === 'base64') setOutput(fromBase64(input.trim()));
      else if (mode === 'url') setOutput(decodeURIComponent(input.trim()));
      else if (mode === 'unicode') {
        setOutput(input.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16))));
      } else if (mode === 'hex') {
        const clean = input.replace(/[^0-9a-fA-F]/g, '');
        const bytes = new Uint8Array(clean.length / 2);
        for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
        setOutput(new TextDecoder().decode(bytes));
      } else if (mode === 'jwt') {
        const parts = input.trim().split('.');
        if (parts.length < 2) throw new Error('올바른 JWT 형식(header.payload.signature)이 아닙니다.');
        const header = JSON.parse(fromBase64(parts[0]));
        const payload = JSON.parse(fromBase64(parts[1]));
        setOutput(JSON.stringify({ header, payload, signature: parts[2] || '' }, null, 2));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '디코딩 오류');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ['base64', 'Base64'],
            ['url', 'URL'],
            ['unicode', 'Unicode (\\uXXXX)'],
            ['hex', 'Hex'],
            ['jwt', 'JWT 디코더'],
          ] as [Mode, string][]
        ).map(([m, label]) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError('');
              setOutput('');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
              mode === m ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800'
            }`}
          >
            {label}
          </button>
        ))}

        <div className="ml-auto flex gap-2">
          {mode !== 'jwt' && (
            <button
              type="button"
              onClick={encode}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium cursor-pointer"
            >
              인코딩 →
            </button>
          )}
          <button
            type="button"
            onClick={decode}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium cursor-pointer"
          >
            디코딩 →
          </button>
        </div>
      </div>

      {error && <div className="text-xs text-rose-500">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <textarea
          rows={11}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={mode === 'jwt' ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' : '변환할 문자열 입력...'}
          className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs"
        />
        <div className="space-y-1.5">
          <div className="flex justify-end">
            <CopyButton text={output} />
          </div>
          <textarea
            readOnly
            rows={10}
            value={output}
            placeholder="결과가 여기에 표시됩니다..."
            className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs"
          />
        </div>
      </div>
    </div>
  );
}
