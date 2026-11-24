import { useEffect, useState } from 'react';

// What the current page can do. Some browser features exist only on HTTPS pages, and the
// server-side network and LAN tools can be switched off in the app options.
export interface Environment {
  secure: boolean;
  speechRecognition: boolean;
  speechSynthesis: boolean;
  networkTools: boolean | null; // null until /api/health answers
  lanTools: boolean | null;
}

export type Requirement = 'secure-camera' | 'speech-recognition' | 'speech-synthesis' | 'network' | 'lan';

export interface Availability {
  level: 'ok' | 'limited' | 'blocked';
  ko: string;
  en: string;
}

// Requirements per tool. 'limited' means part of the tool still works (for example scanning a
// saved image without the camera, or calculating with saved exchange rates).
export const TOOL_REQUIREMENTS: Record<string, { needs: Requirement; partial?: boolean }[]> = {
  stt: [{ needs: 'speech-recognition' }],
  tts: [{ needs: 'speech-synthesis' }],
  'barcode-scanner': [{ needs: 'secure-camera', partial: true }],
  'long-url': [{ needs: 'network' }],
  'ip-info': [{ needs: 'network' }],
  'html-viewer': [{ needs: 'network' }],
  'rss-reader': [{ needs: 'network' }],
  'ssl-checker': [{ needs: 'network' }],
  'currency-calc': [{ needs: 'network', partial: true }],
  'lan-wol': [{ needs: 'lan' }],
};

const REASONS: Record<Requirement, { ko: string; en: string }> = {
  'secure-camera': { ko: '카메라는 HTTPS 접속에서만 열 수 있습니다. 이미지 파일 스캔은 사용할 수 있습니다.', en: 'The camera needs an HTTPS connection. Scanning saved images still works.' },
  'speech-recognition': { ko: '이 브라우저나 HTTP 접속에서는 음성 인식을 쓸 수 없습니다. HTTPS 주소나 Chrome·Edge·Safari에서 열어 주세요.', en: 'Speech recognition needs HTTPS and a supporting browser (Chrome, Edge or Safari).' },
  'speech-synthesis': { ko: '이 브라우저는 음성 읽기를 지원하지 않습니다.', en: 'This browser cannot read text aloud.' },
  network: { ko: '앱 설정의 allow_network_tools가 꺼져 있어 외부 조회를 할 수 없습니다.', en: 'allow_network_tools is off in the app options, so online lookups are disabled.' },
  lan: { ko: '앱 설정의 allow_lan_tools가 꺼져 있습니다. 켜고 앱을 다시 시작하면 사용할 수 있습니다.', en: 'allow_lan_tools is off in the app options. Turn it on and restart the app.' },
};

function meets(needs: Requirement, env: Environment) {
  switch (needs) {
    case 'secure-camera': return env.secure && !!navigator.mediaDevices?.getUserMedia;
    case 'speech-recognition': return env.secure && env.speechRecognition;
    case 'speech-synthesis': return env.speechSynthesis;
    case 'network': return env.networkTools !== false;
    case 'lan': return env.lanTools !== false;
  }
}

export function toolAvailability(id: string, env: Environment): Availability {
  for (const { needs, partial } of TOOL_REQUIREMENTS[id] || []) {
    if (!meets(needs, env)) return { level: partial ? 'limited' : 'blocked', ...REASONS[needs] };
  }
  return { level: 'ok', ko: '', en: '' };
}

function browserEnvironment(): Environment {
  const w = window as unknown as Record<string, unknown>;
  return {
    secure: window.isSecureContext,
    speechRecognition: Boolean(w.SpeechRecognition || w.webkitSpeechRecognition),
    speechSynthesis: 'speechSynthesis' in window,
    networkTools: null,
    lanTools: null,
  };
}

let server: Promise<{ allowNetworkTools?: boolean; allowLanTools?: boolean } | null> | undefined;
export function useEnvironment() {
  const [env, setEnv] = useState(browserEnvironment);
  useEffect(() => {
    let active = true;
    server ??= fetch('./api/health').then(r => (r.ok ? r.json() : null)).catch(() => null);
    server.then(health => {
      if (active && health) setEnv(e => ({ ...e, networkTools: health.allowNetworkTools !== false, lanTools: health.allowLanTools === true }));
    });
    return () => { active = false; };
  }, []);
  return env;
}
