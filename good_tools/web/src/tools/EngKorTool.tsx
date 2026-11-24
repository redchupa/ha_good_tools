import { useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { CopyButton } from '../components/CopyButton';
import { engToKor, korToEng } from '../utils/engKor';

export default function EngKorTool() {
  const [direction, setDirection] = useState<'e2k' | 'k2e'>('e2k');
  const [input, setInput] = useState('dkssudgktpdy! ghkrdlsdyd gksdudxk qusghksrl dlqslek.');

  const output = direction === 'e2k' ? engToKor(input) : korToEng(input);

  const swap = () => {
    setInput(output);
    setDirection((d) => (d === 'e2k' ? 'k2e' : 'e2k'));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setDirection('e2k')}
          className={`px-3.5 py-2 rounded-xl text-sm font-medium cursor-pointer ${
            direction === 'e2k' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800'
          }`}
        >
          영타 → 한글 (dkssud → 안녕)
        </button>
        <button
          type="button"
          onClick={() => setDirection('k2e')}
          className={`px-3.5 py-2 rounded-xl text-sm font-medium cursor-pointer ${
            direction === 'k2e' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800'
          }`}
        >
          한글 → 영타 (ㅗ디ㅣㅐ → hello)
        </button>
        <button
          type="button"
          onClick={swap}
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          <ArrowLeftRight className="w-3.5 h-3.5" /> 입출력 바꾸기
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-slate-500">입력</div>
          <textarea
            rows={8}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm outline-none focus:border-indigo-500"
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">변환 결과</span>
            <CopyButton text={output} />
          </div>
          <textarea
            readOnly
            rows={8}
            value={output}
            className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm outline-none"
          />
        </div>
      </div>
    </div>
  );
}
