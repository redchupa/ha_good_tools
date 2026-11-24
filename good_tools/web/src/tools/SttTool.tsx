import { useEffect, useRef, useState } from 'react';
import { Mic, Square, ShieldAlert } from 'lucide-react';
import { CopyButton } from '../components/CopyButton';

export default function SttTool() {
  const [lang, setLang] = useState('ko-KR');
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');
  const recRef = useRef<any>(null);

  useEffect(() => () => {
    const rec = recRef.current;
    if (rec) {
      rec.onresult = rec.onerror = rec.onend = null;
      rec.abort();
    }
  }, []);

  const SpeechRecognition =
    typeof window !== 'undefined'
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null;

  const start = () => {
    setError('');
    if (!SpeechRecognition) {
      setError('이 브라우저는 Web Speech Recognition API를 지원하지 않습니다. Chrome 또는 Edge를 사용해 주세요.');
      return;
    }
    if (!window.isSecureContext) {
      setError('마이크 음성 인식은 브라우저 보안 정책상 HTTPS(예: Nabu Casa, 리버스 프록시) 또는 localhost에서만 동작합니다.');
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (event: any) => {
      let finalChunk = '';
      let interimChunk = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const txt = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalChunk += txt + ' ';
        else interimChunk += txt;
      }
      if (finalChunk) setTranscript((prev) => prev + finalChunk);
      setInterim(interimChunk);
    };
    rec.onerror = (e: any) => {
      setError(`음성 인식 오류: ${e.error}`);
      setListening(false);
    };
    rec.onend = () => {
      setListening(false);
      setInterim('');
    };
    recRef.current = rec;
    rec.start();
    setListening(true);
  };

  const stop = () => {
    recRef.current?.stop();
    setListening(false);
  };

  return (
    <div className="space-y-4">
      {!window.isSecureContext && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-500/15 border border-amber-400/30 text-amber-800 dark:text-amber-300 text-xs">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            현재 HTTP(비보안) 연결로 접속 중입니다. 브라우저 보안 정책상 마이크 입력은 HTTPS(Nabu Casa / Cloudflare Tunnel / Nginx HTTPS) 또는 localhost 접속 시 활성화됩니다.
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
        >
          <option value="ko-KR">한국어 (ko-KR)</option>
          <option value="en-US">English (en-US)</option>
          <option value="ja-JP">日本語 (ja-JP)</option>
        </select>

        {!listening ? (
          <button
            type="button"
            onClick={start}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium cursor-pointer"
          >
            <Mic className="w-4 h-4" /> 음성 인식 시작
          </button>
        ) : (
          <button
            type="button"
            onClick={stop}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 text-white text-sm font-medium animate-pulse cursor-pointer"
          >
            <Square className="w-4 h-4" /> 인식 중지
          </button>
        )}

        <div className="ml-auto flex gap-2">
          <CopyButton text={transcript} />
          <button
            type="button"
            onClick={() => setTranscript('')}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs cursor-pointer"
          >
            초기화
          </button>
        </div>
      </div>

      {error && <div className="text-xs text-rose-500">{error}</div>}

      <textarea
        rows={10}
        value={transcript + (interim ? ` ${interim}` : '')}
        onChange={(e) => setTranscript(e.target.value)}
        placeholder="음성 인식 결과가 여기에 실시간으로 기록됩니다..."
        className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm outline-none focus:border-indigo-500"
      />
    </div>
  );
}
