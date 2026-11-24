import { useText } from '../hooks/language';
import { useEffect, useRef, useState } from 'react';
import { Upload, CheckCircle2, XCircle } from 'lucide-react';
import { CopyButton } from '../components/CopyButton';

interface HashSet {
  md5: string;
  sha1: string;
  sha256: string;
  sha512: string;
  crc32: string;
}

export default function FileChecksumTool() {
  const ui = useText();
  const t = ui;
  const [sourceLabel, setSourceLabel] = useState('');
  const [textInput, setTextInput] = useState('');
  const [hashes, setHashes] = useState<HashSet | null>(null);
  const [expected, setExpected] = useState('');

  const task = useRef<Worker | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  useEffect(() => () => task.current?.terminate(), []);
  const stop = () => {
    task.current?.terminate();
    task.current = null;
    setProgress(null);
  };
  const calculate = (blob: Blob, label: string) => {
    stop();
    setSourceLabel(label);
    setHashes(null);
    setProgress(0);
    const worker = new Worker(new URL('../utils/checksum.worker.ts', import.meta.url), { type: 'module' });
    task.current = worker;
    const fail = () => { stop(); setSourceLabel(t('읽기에 실패했습니다. 파일을 다시 선택해 주세요.','Could not read the file. Choose it again.')); };
    worker.onerror = fail;
    worker.onmessage = ({ data }) => {
      if (task.current !== worker) return;
      if (data.error) return fail();
      if (data.result) { setHashes(data.result); stop(); }
      else setProgress(data.progress);
    };
    worker.postMessage(blob);
  };
  const handleFile = (file: File) => calculate(file, file.name);
  const handleText = (val: string) => {
    setTextInput(val);
    if (val) calculate(new Blob([val]), 'Text');
    else { stop(); setSourceLabel(''); setHashes(null); }
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
          <span className="text-sm font-medium">{t('파일 선택 (로컬 계산)','Choose a file')}</span>
          <span className="text-xs text-slate-400">{t('업로드 없이 브라우저에서 즉시 해시 계산','Files are processed on this device.')}</span>
          <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </label>

        <textarea
          maxLength={100000}
          rows={4}
          value={textInput}
          onChange={(e) => handleText(e.target.value)}
          placeholder={ui("또는 텍스트를 직접 입력해 해시 계산...", "Or type text to calculate its hash...")}
          className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm outline-none focus:border-indigo-500"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          value={expected}
          onChange={(e) => setExpected(e.target.value)}
          placeholder={ui("기대하는 체크섬 값을 붙여넣으면 자동으로 일치 여부를 검사합니다...", "Paste the expected checksum to compare...")}
          className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
        />
        {normExpected && hashes && (
          matchedAlgo ? (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4" /> {ui("일치 (", "Match (")}{matchedAlgo.toUpperCase()})
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 text-xs font-semibold">
              <XCircle className="w-4 h-4" /> {ui("불일치", "No match")}
            </span>
          )
        )}
      </div>

      {progress !== null && <div><progress max={100} value={progress} /> {progress}% <button onClick={() => { stop(); setSourceLabel(t('취소됨','Cancelled')); }}>{t('취소','Cancel')}</button></div>}
      {!hashes && sourceLabel && <p role="status">{sourceLabel}</p>}
      {hashes && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-500">{ui("대상:", "Source:")} {sourceLabel}</div>
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
