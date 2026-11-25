import { Diagnostic } from '../components/Diagnostic';
import { useMemo, useState } from 'react';
import { ArrowDownUp, Wand2 } from 'lucide-react';
import { CopyButton } from '../components/CopyButton';
import { useText } from '../hooks/language';
import { CODECS, DEFAULT_OPTIONS, convert, decodeJwt, detectCodec, type CodecId, type CodecOptions } from '../utils/codec';

type Tab = 'convert' | 'jwt';
const MAX_INPUT = 2_000_000;
const GROUPED: CodecId[] = ['hex', 'octal', 'binary', 'decimal', 'ascii-hex'];

const PRESETS: { ko: string; en: string; from: CodecId; to: CodecId }[] = [
  { ko: '텍스트 → Base64', en: 'Text → Base64', from: 'plain', to: 'base64' },
  { ko: 'Base64 → 텍스트', en: 'Base64 → text', from: 'base64', to: 'plain' },
  { ko: 'URL 인코딩', en: 'URL encode', from: 'plain', to: 'url' },
  { ko: 'URL 디코딩', en: 'URL decode', from: 'url', to: 'plain' },
  { ko: 'HTML 이스케이프', en: 'HTML escape', from: 'plain', to: 'html' },
  { ko: '텍스트 → Hex', en: 'Text → hex', from: 'plain', to: 'hex' },
  { ko: 'Gzip 압축', en: 'Gzip', from: 'plain', to: 'gzip' },
  { ko: 'Gzip 해제', en: 'Gunzip', from: 'gzip', to: 'plain' },
];

export default function EncoderTool() {
  const ui = useText();
  const [tab, setTab] = useState<Tab>('convert');
  const [input, setInput] = useState(ui('안녕하세요 Home Assistant Good Tools!', "Hello from Home Assistant Good Tools!"));
  const [from, setFrom] = useState<CodecId>('plain');
  const [to, setTo] = useState<CodecId>('base64');
  const [options, setOptions] = useState<CodecOptions>(DEFAULT_OPTIONS);
  const [jwt, setJwt] = useState('');
  const [hint, setHint] = useState('');

  const result = useMemo(() => {
    if (!input) return { output: '', error: '', bytes: 0 };
    if (input.length > MAX_INPUT) return { output: '', error: ui('입력은 200만 자까지 지원합니다.', 'Input is limited to 2,000,000 characters.'), bytes: 0 };
    try { return { ...convert(input, from, to, options), error: '' }; }
    catch (e) { return { output: '', error: e instanceof Error ? e.message : String(e), bytes: 0 }; }
  }, [input, from, to, options, ui]);

  const jwtView = useMemo(() => {
    if (!jwt.trim()) return null;
    try { return { view: decodeJwt(jwt), error: '' }; }
    catch (e) { return { view: null, error: e instanceof Error ? e.message : String(e) }; }
  }, [jwt]);

  const swap = () => {
    if (result.output && !result.error) setInput(result.output);
    setFrom(to); setTo(from); setHint('');
  };
  const detect = () => {
    const found = detectCodec(input);
    if (found === 'jwt') { setJwt(input.trim()); setTab('jwt'); return; }
    setFrom(found);
    if (found === to) setTo('plain');
    setHint(ui(`입력을 "${CODECS.find(c => c.id === found)!.ko}"로 판단했습니다.`, `Detected: ${CODECS.find(c => c.id === found)!.en}.`));
  };
  const setOption = <K extends keyof CodecOptions>(key: K, value: CodecOptions[K]) => setOptions(o => ({ ...o, [key]: value }));

  const chip = (active: boolean) => `px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${active ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`;
  const select = 'px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs';
  const area = 'w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs';
  const codecLabel = (id: CodecId) => { const c = CODECS.find(x => x.id === id)!; return ui(c.ko, c.en); };
  const grouped = GROUPED.includes(to);

  return (
    <div className="space-y-4">
      <div className="flex gap-2" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'convert'} onClick={() => setTab('convert')} className={chip(tab === 'convert')}>{ui('인코딩 / 디코딩', 'Encode / decode')}</button>
        <button type="button" role="tab" aria-selected={tab === 'jwt'} onClick={() => setTab('jwt')} className={chip(tab === 'jwt')}>{ui('JWT 디코더', 'JWT decoder')}</button>
      </div>

      {tab === 'convert' && (
        <>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map(p => (
              <button key={p.ko} type="button" onClick={() => { setFrom(p.from); setTo(p.to); setHint(''); }}
                className={chip(from === p.from && to === p.to)}>{ui(p.ko, p.en)}</button>
            ))}
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <label className="text-xs space-y-1">
              <span className="block text-slate-500">{ui('입력 형식', 'From')}</span>
              <select aria-label={ui('입력 형식', 'From')} value={from} onChange={(e) => { setFrom(e.target.value as CodecId); setHint(''); }} className={select}>
                {CODECS.map(c => <option key={c.id} value={c.id}>{ui(c.ko, c.en)}</option>)}
              </select>
            </label>
            <button type="button" onClick={swap} title={ui('결과를 입력으로 바꾸기', 'Swap')} aria-label={ui('입력과 출력 바꾸기', 'Swap input and output')}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer"><ArrowDownUp className="w-4 h-4" /></button>
            <label className="text-xs space-y-1">
              <span className="block text-slate-500">{ui('출력 형식', 'To')}</span>
              <select aria-label={ui('출력 형식', 'To')} value={to} onChange={(e) => setTo(e.target.value as CodecId)} className={select}>
                {CODECS.map(c => <option key={c.id} value={c.id}>{ui(c.ko, c.en)}</option>)}
              </select>
            </label>
            <button type="button" onClick={detect} className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs cursor-pointer">
              <Wand2 className="w-3.5 h-3.5" /> {ui('입력 형식 자동 감지', 'Detect input')}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-300">
            {grouped && (
              <label className="flex items-center gap-1.5">{ui('구분자', 'Separator')}
                <select value={options.separator} onChange={(e) => setOption('separator', e.target.value)} className={select + ' py-1'}>
                  <option value=" ">{ui('공백', 'Space')}</option>
                  <option value="">{ui('없음', 'None')}</option>
                  <option value=",">,</option>
                  <option value=":">:</option>
                  <option value={'\n'}>{ui('줄바꿈', 'New line')}</option>
                </select>
              </label>
            )}
            {(to === 'hex' || to === 'ascii-hex' || to === 'unicode') && (
              <label className="flex items-center gap-1.5"><input type="checkbox" checked={options.upper} onChange={(e) => setOption('upper', e.target.checked)} />{ui('대문자', 'Uppercase')}</label>
            )}
            {(to === 'url' || from === 'url') && (
              <label className="flex items-center gap-1.5"><input type="checkbox" checked={options.urlPlus} onChange={(e) => setOption('urlPlus', e.target.checked)} />{ui('공백을 + 로 (폼 형식)', 'Space as + (form style)')}</label>
            )}
            {to === 'html' && (
              <label className="flex items-center gap-1.5"><input type="checkbox" checked={options.htmlAll} onChange={(e) => setOption('htmlAll', e.target.checked)} />{ui('한글 등 비ASCII 문자도 &#x..; 로', 'Encode non-ASCII as &#x..;')}</label>
            )}
          </div>

          {hint && <p role="status" className="text-xs text-indigo-600 dark:text-indigo-400">{hint}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-1">
              <span className="text-xs font-semibold text-slate-500">{ui('입력', 'Input')} · {codecLabel(from)} · {input.length.toLocaleString()}{ui('자', ' chars')}</span>
              <textarea rows={10} value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} className={area} />
            </label>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">{ui('결과', 'Result')} · {codecLabel(to)}{result.output ? ` · ${result.bytes.toLocaleString()} bytes` : ''}</span>
                <CopyButton text={result.output} />
              </div>
              <textarea rows={10} readOnly value={result.output} spellCheck={false} aria-label={ui('결과', 'Result')} className={area} />
            </div>
          </div>
          {result.error && <div role="alert" className="text-xs text-rose-500"><Diagnostic text={result.error} /></div>}
          {['gzip', 'zlib', 'deflate'].includes(to) && (
            <p className="text-[11px] text-slate-400">{ui('압축 결과는 바이너리라서 Base64로 보여 줍니다. 압축 해제 입력은 Base64나 Hex 모두 받을 수 있습니다.',
              'Compressed output is binary, so it is shown as Base64. Decompression accepts Base64 or hex input.')}</p>
          )}
        </>
      )}

      {tab === 'jwt' && (
        <div className="space-y-3">
          <textarea rows={5} value={jwt} onChange={(e) => setJwt(e.target.value)} spellCheck={false}
            placeholder={ui('JWT를 붙여넣으세요 (Bearer 접두어 포함 가능)', 'Paste a JWT (a "Bearer " prefix is fine)')} className={area} />
          <p className="text-[11px] text-slate-400">{ui('토큰은 이 기기에서만 해석하며 서명은 검증하지 않습니다. 실사용 토큰은 공유하지 마세요.',
            'Decoded on this device only; the signature is not verified. Do not share live tokens.')}</p>
          {jwtView?.error && <div role="alert" className="text-xs text-rose-500"><Diagnostic text={jwtView.error} /></div>}
          {jwtView?.view && (
            <div className="space-y-3">
              {jwtView.view.times.length > 0 && (
                <div className="flex flex-wrap gap-2 text-xs">
                  {jwtView.view.times.map(time => (
                    <span key={time.claim} className={`px-2.5 py-1 rounded-lg ${time.claim === 'exp' && time.past ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300' : 'bg-slate-100 dark:bg-slate-800'}`}>
                      <strong>{time.claim}</strong> {new Date(time.date).toLocaleString()}
                      {time.claim === 'exp' && (time.past ? ui(' · 만료됨', ' · expired') : ui(' · 유효', ' · valid'))}
                    </span>
                  ))}
                </div>
              )}
              {([['Header', jwtView.view.header], ['Payload', jwtView.view.payload]] as const).map(([label, value]) => (
                <div key={label} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">{label}</span>
                    <CopyButton text={JSON.stringify(value, null, 2)} />
                  </div>
                  <pre className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-mono text-xs whitespace-pre-wrap break-all">{JSON.stringify(value, null, 2)}</pre>
                </div>
              ))}
              <div className="text-xs"><span className="font-semibold text-slate-500">Signature</span>
                <div className="font-mono break-all text-slate-500">{jwtView.view.signature || ui('(없음)', '(none)')}</div></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
