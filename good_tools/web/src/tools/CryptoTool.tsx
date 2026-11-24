import { Diagnostic } from '../components/Diagnostic';
import { useText } from '../hooks/language';
import { useMemo, useState } from 'react';
import { encrypt, decrypt, textHashes } from '../utils/secureCrypto';
import { RefreshCw } from 'lucide-react';
import { CopyButton } from '../components/CopyButton';

export default function CryptoTool() {
  const ui = useText();
  const t = ui;
  const [tab, setTab] = useState<'aes' | 'hmac' | 'password'>('aes');
  const [text, setText] = useState('Home Assistant Secret Payload');
  const [secret, setSecret] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const [pwLen, setPwLen] = useState(20);
  const [pwSymbols, setPwSymbols] = useState(true);
  const [password, setPassword] = useState('');

  const rows = useMemo(() => (tab === 'hmac' ? textHashes(text, secret) : []), [tab, text, secret]);
  const [busy, setBusy] = useState(false);
  const transform = async (mode: 'encrypt' | 'decrypt') => {
    setError(''); setOutput(''); setBusy(true);
    try { setOutput(await (mode === 'encrypt' ? encrypt(text,secret) : decrypt(text.trim(),secret))); }
    catch (e) { setError(e instanceof Error ? e.message : ui('암호 문구와 입력을 확인해 주세요.', "Check the passphrase and input.")); }
    finally { setBusy(false); }
  };
  const genPassword = () => {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789' +
      (pwSymbols ? '!@#$%^&*()-_=+[]{}?' : '');
    const arr = new Uint32Array(pwLen);
    crypto.getRandomValues(arr);
    setPassword(Array.from(arr, (n) => chars[n % chars.length]).join(''));
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(
          [
            ['aes', t('AES-256 암복호화','AES-256 encryption')],
            ['hmac', t('HMAC / SHA 해시','HMAC / SHA hashes')],
            ['password', t('보안 비밀번호 생성기','Password generator')],
          ] as const
        ).map(([t, label]) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTab(t);
              setError('');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium cursor-pointer ${
              tab === t ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'aes' && (
        <div className="space-y-3">
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder={ui("비밀 키 (Passphrase)", "Passphrase")}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono"
          />
          <textarea
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={ui("평문 또는 AES 암호문 입력...", "Enter plaintext or AES ciphertext...")}
            className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs"
          />
          <div className="flex gap-2">
            <button type="button" disabled={busy} onClick={() => transform('encrypt')} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium cursor-pointer">
              {ui("AES 암호화", "Encrypt with AES")}
            </button>
            <button type="button" disabled={busy} onClick={() => transform('decrypt')} className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-medium cursor-pointer">
              {ui("AES 복호화", "Decrypt AES")}
            </button>
            <CopyButton text={output} className="ml-auto" />
          </div>
          {busy && <p role="status" className="text-xs text-slate-500">{t('키를 만드는 중입니다. 기기에 따라 몇 초 걸릴 수 있습니다.','Deriving the key. This can take a few seconds on slower devices.')}</p>}
          {error && <div className="text-xs text-rose-500"><Diagnostic text={error} /></div>}
          <textarea
            readOnly
            rows={4}
            value={output}
            placeholder={ui("결과...", "Result...")}
            className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs"
          />
        </div>
      )}

      {tab === 'hmac' && (
        <div className="space-y-3">
          <input
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="HMAC Secret Key"
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono"
          />
          <textarea
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs"
          />
          <div className="space-y-2">
            {rows.map(([name, val]) => (
              <div key={name} className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                <div className="min-w-0">
                  <div className="font-bold text-indigo-600 dark:text-indigo-400">{name}</div>
                  <div className="font-mono break-all mt-0.5">{val}</div>
                </div>
                <CopyButton text={val} />
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'password' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <label className="text-xs flex items-center gap-2">
              {ui("길이:", "Length:")} <strong>{pwLen}{ui("자", " characters")}</strong>
              <input type="range" min={8} max={64} value={pwLen} onChange={(e) => setPwLen(Number(e.target.value))} />
            </label>
            <label className="text-xs flex items-center gap-1.5">
              <input type="checkbox" checked={pwSymbols} onChange={(e) => setPwSymbols(e.target.checked)} />
              {ui("특수문자 포함", "Include symbols")}
            </label>
            <button
              type="button"
              onClick={genPassword}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> {ui("생성", "Generate")}
            </button>
          </div>
          {password && (
            <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="font-mono text-base font-bold break-all">{password}</span>
              <CopyButton text={password} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
