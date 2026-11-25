import { Diagnostic } from '../components/Diagnostic';
import { useText } from '../hooks/language';
import { useEffect, useRef, useState } from 'react';
import { CopyButton } from '../components/CopyButton';

declare global {
  interface Window {
    daum?: {
      Postcode: new (opts: {
        oncomplete: (data: any) => void;
        width?: string;
        height?: string;
      }) => { embed: (el: HTMLElement) => void };
    };
  }
}

export default function PostcodeTool() {
  const ui = useText();
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    let active = true;
    const mountWidget = () => {
      if (!active || !window.daum?.Postcode || !containerRef.current) return;
      containerRef.current.innerHTML = '';
      new window.daum.Postcode({
        oncomplete: (data) => {
          if (active) setSelected(data);
        },
        width: '100%',
        height: '460px',
      }).embed(containerRef.current);
      setLoaded(true);
    };

    if (window.daum?.Postcode) {
      mountWidget();
      return () => { active = false; };
    }

    const script = document.createElement('script');
    script.src = 'https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    script.async = true;
    script.onload = mountWidget;
    script.onerror = () => setError(ui('다음 우편번호 스크립트를 불러올 수 없습니다. 인터넷 연결을 확인해 주세요.', "Could not load the Korean postcode finder. Check your connection."));
    document.body.appendChild(script);
    return () => {
      active = false;
      script.onload = null;
      script.onerror = null;
      script.remove();
    };
  }, []);

  return (
    <div className="space-y-4">
      {selected && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-500/30 space-y-2 text-sm">
          <div className="font-semibold text-emerald-700 dark:text-emerald-300">{ui("선택된 주소", "Selected address")}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {[
              [ui('우편번호 (5자리)', "Postcode (5 digits)"), selected.zonecode],
              [ui('도로명 주소', "Street address"), selected.roadAddress],
              [ui('지번 주소', "Lot-based address"), selected.jibunAddress || selected.autoJibunAddress],
              [ui('영문 도로명 주소', "Street address in English"), selected.roadAddressEnglish],
            ].map(([label, val]) => (
              <div key={label} className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <div className="min-w-0">
                  <div className="text-[11px] text-slate-400">{label}</div>
                  <div className="font-medium truncate">{val || '-'}</div>
                </div>
                {val && <CopyButton text={val} />}
              </div>
            ))}
          </div>
        </div>
      )}

      {error ? (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-300 text-sm"><Diagnostic text={error} /></div>
      ) : (
        <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white min-h-[460px]">
          {!loaded && <div className="p-10 text-center text-sm text-slate-400">{ui("우편번호 검색기를 불러오는 중...", "Loading the Korean postcode finder...")}</div>}
          <div ref={containerRef} className="w-full min-h-[460px]" />
        </div>
      )}
    </div>
  );
}
