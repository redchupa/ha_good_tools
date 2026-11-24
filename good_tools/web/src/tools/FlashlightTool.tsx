import { useText } from '../hooks/language';
import { useEffect, useState } from 'react';
import { Maximize2, Power, AlertTriangle } from 'lucide-react';

export default function FlashlightTool() {
  const ui = useText();
  const PRESETS = [
    { name: ui('순백색', "Pure white"), color: '#ffffff' },
    { name: ui('따뜻한 조명', "Warm white"), color: '#fff3c4' },
    { name: ui('주광색', "Daylight"), color: '#e0f2fe' },
    { name: ui('야간 적색', "Night red"), color: '#ef4444' },
    { name: ui('그린', "Green"), color: '#22c55e' },
  ];
  const [on, setOn] = useState(false);
  const [color, setColor] = useState('#ffffff');
  const [brightness, setBrightness] = useState(100);
  const [mode, setMode] = useState<'solid' | 'strobe' | 'sos'>('solid');
  const [blinkState, setBlinkState] = useState(true);
  useEffect(() => {
    if (!on || !('wakeLock' in navigator)) return;
    let disposed = false;
    let lock: WakeLockSentinel | undefined;
    navigator.wakeLock.request('screen').then(handle => {
      if (disposed) return handle.release();
      lock = handle;
    }).catch(() => {});
    return () => { disposed = true; lock?.release().catch(() => {}); };
  }, [on]);

  useEffect(() => {
    if (!on || mode === 'solid') {
      setBlinkState(true);
      return;
    }
    if (mode === 'strobe') {
      const id = setInterval(() => setBlinkState((b) => !b), 160);
      return () => clearInterval(id);
    }
    // SOS Morse sequence
    const pattern = [200, 200, 200, 200, 200, 400, 600, 200, 600, 200, 600, 400, 200, 200, 200, 200, 200, 1200];
    let step = 0;
    let timer: ReturnType<typeof setTimeout>;
    const run = () => {
      setBlinkState(step % 2 === 0);
      timer = setTimeout(() => {
        step = (step + 1) % pattern.length;
        run();
      }, pattern[step]);
    };
    run();
    return () => clearTimeout(timer);
  }, [on, mode]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setOn(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold cursor-pointer"
        >
          <Maximize2 className="w-4 h-4" /> {ui("전체화면 손전등 켜기", "Turn on full-screen flashlight")}
        </button>

        <div className="flex items-center gap-1.5">
          {(['solid', 'strobe', 'sos'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium uppercase cursor-pointer ${
                mode === m ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800'
              }`}
            >
              {m === 'solid' ? ui('상시', "Steady") : m === 'strobe' ? ui('점멸', "Flash") : 'SOS'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {PRESETS.map((p) => (
          <button
            key={p.name}
            type="button"
            onClick={() => setColor(p.color)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs cursor-pointer ${
              color === p.color ? 'border-indigo-500 ring-2 ring-indigo-500/30' : 'border-slate-200 dark:border-slate-700'
            }`}
          >
            <span className="w-4 h-4 rounded-full border border-slate-300" style={{ backgroundColor: p.color }} />
            {p.name}
          </button>
        ))}
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-9 h-9 rounded-lg cursor-pointer" />
      </div>

      <label className="block text-xs text-slate-500 max-w-sm">
        {ui("화면 밝기:", "Screen brightness:")} {brightness}%
        <input type="range" min={20} max={100} value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} className="w-full mt-1" />
      </label>

      <div
        className="h-40 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-colors"
        style={{ backgroundColor: color, opacity: brightness / 100 }}
      >
        <span className="px-3 py-1 rounded-full bg-black/50 text-white text-xs">{ui("미리보기", "Preview")}</span>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-500">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
        {ui("웹 브라우저는 화면 조명(Screen Flashlight)과 Wake Lock(화면 꺼짐 방지)을 사용합니다.", "Uses the screen as a light and requests a wake lock to keep it on.")}
      </div>

      {on && (
        <div
          onClick={() => setOn(false)}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-end pb-12 cursor-pointer transition-colors"
          style={{
            backgroundColor: blinkState ? color : '#000000',
            opacity: blinkState ? brightness / 100 : 1,
          }}
        >
          <button
            type="button"
            onClick={() => setOn(false)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-black/70 text-white text-sm font-medium backdrop-blur-sm"
          >
            <Power className="w-4 h-4" /> {ui("화면을 탭하여 끄기", "Tap the screen to turn off")}
          </button>
        </div>
      )}
    </div>
  );
}
