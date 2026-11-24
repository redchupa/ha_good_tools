import { useState } from 'react';
import CryptoJS from 'crypto-js';
import { Upload, CheckCircle2, XCircle } from 'lucide-react';
import { CopyButton } from '../components/CopyButton';
import { crc32 } from '../utils/helpers';

interface HashSet {
  md5: string;
  sha1: string;
  sha256: string;
  sha512: string;
  crc32: string;
}

function computeHashesFromBytes(bytes: Uint8Array): HashSet {
  const words: number[] = [];
  for (let i = 0; i < bytes.length; i++) {
    words[i >>> 2] |= bytes[i] << (24 - (i % 4) * 8);
  }
  const wa = CryptoJS.lib.WordArray.create(words, bytes.length);
  return {
    md5: CryptoJS.MD5(wa).toString(),
    sha1: CryptoJS.SHA1(wa).toString(),
    sha256: CryptoJS.SHA256(wa).toString(),
    sha512: CryptoJS.SHA512(wa).toString(),
    crc32: crc32(bytes),
  };
}

export default function FileChecksumTool() {
  const [sourceLabel, setSourceLabel] = useState('');
  const [textInput, setTextInput] = useState('');
  const [hashes, setHashes] = useState<HashSet | null>(null);
  const [expected, setExpected] = useState('');

  const handleFile = async (file: File) => {
    const bytes = new Uint8Array(await file.arrayBuffer());
    setSourceLabel(`${file.name} (${file.size.toLocaleString()} bytes)`);
    setHashes(computeHashesFromBytes(bytes));
  };

  const handleText = (val: string) => {
    setTextInput(val);
    if (!val) {
      setHashes(null);
      setSourceLabel('');
      return;
    }
    const bytes = new TextEncoder().encode(val);
    setSourceLabel(`텍스트 입력 (${bytes.length} bytes)`);
    setHashes(computeHashesFromBytes(bytes));
  };

  const normExpected = expected.trim().toLowerCase();
  const matchedAlgo = hashes && normExpected
    ? Object.entries(hashes).find(([, v]) => v.toLowerCase() === normExpected)?.[0]
    : undefined;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 cursor-pointer bg-slate-50 dark:bg-slate-800/40">
          <Upload className="w-6 h-6 text-indigo-500" />
          <span className="text-sm font-medium">파일 선택 (로컬 계산)</span>
          <span className="text-xs text-slate-400">업로드 없이 브라우저에서 즉시 해시 계산</span>
          <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </label>

        <textarea
          rows={4}
          value={textInput}
          onChange={(e) => handleText(e.target.value)}
          placeholder="또는 텍스트를 직접 입력해 해시 계산..."
          className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm outline-none focus:border-indigo-500"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          value={expected}
          onChange={(e) => setExpected(e.target.value)}
          placeholder="기대하는 체크섬 값을 붙여넣으면 자동으로 일치 여부를 검사합니다..."
          className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
        />
        {normExpected && hashes && (
          matchedAlgo ? (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4" /> 일치 ({matchedAlgo.toUpperCase()})
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 text-xs font-semibold">
              <XCircle className="w-4 h-4" /> 불일치
            </span>
          )
        )}
      </div>

      {hashes && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-500">대상: {sourceLabel}</div>
          {(
            [
              ['MD5', hashes.md5],
              ['SHA-1', hashes.sha1],
              ['SHA-256', hashes.sha256],
              ['SHA-512', hashes.sha512],
              ['CRC32', hashes.crc32],
            ] as const
          ).map(([algo, val]) => (
            <div
              key={algo}
              className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
            >
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">{algo}</div>
                <div className="font-mono text-xs break-all mt-0.5">{val}</div>
              </div>
              <CopyButton text={val} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
