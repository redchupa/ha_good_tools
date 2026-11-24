import { useState } from 'react';
import CryptoJS from 'crypto-js';
import { RefreshCw } from 'lucide-react';
import { CopyButton } from '../components/CopyButton';

export default function CryptoTool() {
  const [tab, setTab] = useState<'aes' | 'hmac' | 'password'>('aes');
  const [text, setText] = useState('Home Assistant Secret Payload');
  const [secret, setSecret] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const [pwLen, setPwLen] = useState(20);
  const [pwSymbols, setPwSymbols] = useState(true);
  const [password, setPassword] = useState('');

  const encryptAes = () => {
    setError('');
    if (!secret) return setError('암호화 키를 입력해 주세요.');
    setOutput(CryptoJS.AES.encrypt(text, secret).toString());
  };

  const decryptAes = () => {
    setError('');
    try {
      const bytes = CryptoJS.AES.decrypt(text.trim(), secret);
      const plain = bytes.toString(CryptoJS.enc.Utf8);
      if (!plain) throw new Error('복호화에 실패했습니다. 키 또는 암호문을 확인해 주세요.');
      setOutput(plain);
    } catch (e) {
      setError(e instanceof Error ? e.message : '복호화 오류');
    }
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
            ['aes', 'AES-256 암복호화'],
            ['hmac', 'HMAC / SHA 해시'],
            ['password', '보안 비밀번호 생성기'],
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
            placeholder="비밀 키 (Passphrase)"
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono"
          />
          <textarea
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="평문 또는 AES 암호문 입력..."
            className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs"
          />
          <div className="flex gap-2">
            <button type="button" onClick={encryptAes} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium cursor-pointer">
              AES 암호화
            </button>
            <button type="button" onClick={decryptAes} className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-medium cursor-pointer">
              AES 복호화
            </button>
            <CopyButton text={output} className="ml-auto" />
          </div>
          {error && <div className="text-xs text-rose-500">{error}</div>}
          <textarea
            readOnly
            rows={4}
            value={output}
            placeholder="결과..."
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
            {[
              ['HMAC-SHA256', CryptoJS.HmacSHA256(text, secret).toString()],
              ['HMAC-SHA512', CryptoJS.HmacSHA512(text, secret).toString()],
              ['SHA-256', CryptoJS.SHA256(text).toString()],
              ['MD5', CryptoJS.MD5(text).toString()],
            ].map(([name, val]) => (
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
              길이: <strong>{pwLen}자</strong>
              <input type="range" min={8} max={64} value={pwLen} onChange={(e) => setPwLen(Number(e.target.value))} />
            </label>
            <label className="text-xs flex items-center gap-1.5">
              <input type="checkbox" checked={pwSymbols} onChange={(e) => setPwSymbols(e.target.checked)} />
              특수문자 포함
            </label>
            <button
              type="button"
              onClick={genPassword}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> 생성
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
