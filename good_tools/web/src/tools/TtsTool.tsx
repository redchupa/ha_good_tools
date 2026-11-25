import { useText } from '../hooks/language';
import { useEffect, useState } from 'react';
import { Play, Square, Pause } from 'lucide-react';

export default function TtsTool() {
  const ui = useText();
  const [text, setText] = useState(ui('안녕하세요. Home Assistant Good Tools 문자 음성 변환기입니다.', "Hello. This is Home Assistant Good Tools text-to-speech."));
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [speaking, setSpeaking] = useState(false);

  const voiceLanguage = ui('ko', 'en');
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    if (!supported) return;
    const load = () => {
      const list = window.speechSynthesis.getVoices();
      setVoices(list);
      if (list.length > 0 && !selectedVoice) {
        const preferred = list.find((v) => v.lang.toLowerCase().startsWith(voiceLanguage));
        setSelectedVoice((preferred || list[0]).name);
      }
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      window.speechSynthesis.cancel();
    };
  }, [supported, selectedVoice, voiceLanguage]);

  const speak = () => {
    if (!supported || !text.trim()) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    const v = voices.find((x) => x.name === selectedVoice);
    if (v) utter.voice = v;
    utter.rate = rate;
    utter.pitch = pitch;
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utter);
  };

  const stop = () => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  if (!supported) {
    return <div className="text-sm text-rose-500">{ui("이 브라우저는 Web Speech API(TTS)를 지원하지 않습니다.", "Your browser does not support text-to-speech.")}</div>;
  }

  return (
    <div className="space-y-4">
      <textarea
        rows={6}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={ui("음성으로 읽어줄 텍스트를 입력하세요...", "Enter text to read aloud...")}
        className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm outline-none focus:border-indigo-500"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
        <label className="text-xs space-y-1">
          <span className="text-slate-500">{ui("음성 선택 (", "Voice (")}{voices.length}{ui("개)", " available)")}</span>
          <select
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
          >
            {voices.map((v) => (
              <option key={v.name} value={v.name}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs space-y-1">
          <span className="text-slate-500">{ui("속도:", "Speed:")} {rate.toFixed(1)}x</span>
          <input type="range" min={0.5} max={2} step={0.1} value={rate} onChange={(e) => setRate(Number(e.target.value))} className="w-full" />
        </label>
        <label className="text-xs space-y-1">
          <span className="text-slate-500">{ui("음높이(Pitch):", "Pitch:")} {pitch.toFixed(1)}</span>
          <input type="range" min={0.5} max={2} step={0.1} value={pitch} onChange={(e) => setPitch(Number(e.target.value))} className="w-full" />
        </label>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={speak}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium cursor-pointer"
        >
          <Play className="w-4 h-4" /> {ui("읽기 시작", "Read aloud")}
        </button>
        <button
          type="button"
          onClick={() => window.speechSynthesis.pause()}
          disabled={!speaking}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm disabled:opacity-40 cursor-pointer"
        >
          <Pause className="w-4 h-4" /> {ui("일시정지", "Pause")}
        </button>
        <button
          type="button"
          onClick={stop}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-300 dark:border-rose-500/40 text-rose-600 dark:text-rose-400 text-sm cursor-pointer"
        >
          <Square className="w-4 h-4" /> {ui("정지", "Stop")}
        </button>
      </div>
    </div>
  );
}
