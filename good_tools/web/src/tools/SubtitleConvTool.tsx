import { useText } from '../hooks/language';
import { downloadBlob } from '../utils/download';
import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { CopyButton } from '../components/CopyButton';
import { parseSmi, parseSrtOrVtt, shiftCues, cuesToSrt, cuesToVtt, cuesToSmi } from '../utils/subtitle';

export default function SubtitleConvTool() {
  const ui = useText();
  const [input, setInput] = useState(
    `<SYNC Start=1000><P Class=KRCC>안녕하세요!<br>자막 변환기입니다.\n<SYNC Start=3500><P Class=KRCC>&nbsp;\n<SYNC Start=4000><P Class=KRCC>SMI, SRT, VTT를 자유롭게 변환합니다.\n<SYNC Start=7000><P Class=KRCC>&nbsp;`
  );
  const [targetFormat, setTargetFormat] = useState<'srt' | 'vtt' | 'smi'>('srt');
  const [shiftMs, setShiftMs] = useState(0);
  const [filename, setFilename] = useState('subtitle');

  const handleFile = async (file: File) => {
    setFilename(file.name.replace(/\.[^.]+$/, ''));
    const buf = await file.arrayBuffer();
    // Try UTF-8 first, fallback to EUC-KR if replacement characters appear
    let decoded = new TextDecoder('utf-8').decode(buf);
    if (decoded.includes('\uFFFD')) {
      try {
        decoded = new TextDecoder('euc-kr').decode(buf);
      } catch {
        // keep utf-8
      }
    }
    setInput(decoded);
  };

  const { cues, output } = useMemo(() => {
    const isSmi = /<SYNC\s+Start=/i.test(input);
    const parsed = isSmi ? parseSmi(input) : parseSrtOrVtt(input);
    const shifted = shiftMs !== 0 ? shiftCues(parsed, shiftMs) : parsed;
    let out = '';
    if (shifted.length > 0) {
      out = targetFormat === 'srt' ? cuesToSrt(shifted) : targetFormat === 'vtt' ? cuesToVtt(shifted) : cuesToSmi(shifted);
    }
    return { cues: shifted, output: out };
  }, [input, targetFormat, shiftMs]);

  const downloadOutput = () => {
    const blob = new Blob(['\uFEFF' + output], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, `${filename}.${targetFormat}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
        <input
          type="file"
          accept=".smi,.srt,.vtt,.txt"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          className="text-xs"
        />
        <div className="flex items-center gap-2 text-xs">
          <span>{ui("출력 형식:", "Output format:")}</span>
          {(['srt', 'vtt', 'smi'] as const).map((fmt) => (
            <button
              key={fmt}
              type="button"
              onClick={() => setTargetFormat(fmt)}
              className={`px-2.5 py-1 rounded-lg uppercase font-semibold cursor-pointer ${
                targetFormat === fmt ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {fmt}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-1.5 text-xs ml-auto">
          {ui("싱크 이동(ms):", "Time offset (ms):")}
          <input
            type="number"
            step={100}
            value={shiftMs}
            onChange={(e) => setShiftMs(Number(e.target.value) || 0)}
            className="w-24 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-slate-500">{ui("원본 자막 (SMI / SRT / VTT 자동 인식)", "Source subtitles (SMI / SRT / VTT detected automatically)")}</div>
          <textarea
            rows={14}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs outline-none focus:border-indigo-500"
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              {ui("변환 결과 (", "Result (")}{cues.length}{ui("개 자막 블록)", " subtitle blocks)")}
            </span>
            <div className="flex items-center gap-1.5">
              <CopyButton text={output} />
              <button
                type="button"
                onClick={downloadOutput}
                disabled={!output}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium disabled:opacity-40 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> {ui("다운로드", "Download")}
              </button>
            </div>
          </div>
          <textarea
            readOnly
            rows={14}
            value={output}
            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs outline-none"
          />
        </div>
      </div>
    </div>
  );
}
