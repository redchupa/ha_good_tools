import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { prefsStore } from './prefsStore';

export type ThemeMode =
  | 'system'
  | 'light'
  | 'dark'
  | 'ha-blue'
  | 'sunset'
  | 'lavender'
  | 'peach-cute'
  | 'mint-cream'
  | 'sakura'
  | 'ocean'
  | 'forest'
  | 'rose-dark'
  | 'aurora'
  | 'cyberpunk'
  | 'mecha-bot';

export type ThemeGroup = 'basic' | 'cute' | 'futuristic';

export interface ThemeOption {
  id: ThemeMode;
  label: string;
  labelEn: string;
  group: ThemeGroup;
  isDark: boolean | 'auto';
  swatch: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  // 기본
  { id: 'system', label: '시스템 자동', labelEn: 'System Auto', group: 'basic', isDark: 'auto', swatch: 'linear-gradient(135deg, #f8fafc 50%, #0f172a 50%)' },
  { id: 'light', label: '라이트', labelEn: 'Crisp Light', group: 'basic', isDark: false, swatch: '#4f46e5' },
  { id: 'dark', label: '다크', labelEn: 'Midnight Dark', group: 'basic', isDark: true, swatch: '#0f172a' },
  { id: 'ha-blue', label: 'HA 블루', labelEn: 'HA Blue', group: 'basic', isDark: false, swatch: '#0284c7' },

  // 귀엽고 예쁜 테마
  { id: 'peach-cute', label: '피치 캔디 (귀여움)', labelEn: 'Peach Candy', group: 'cute', isDark: false, swatch: 'linear-gradient(135deg, #fb7185, #fdba74)' },
  { id: 'mint-cream', label: '민트 크림 (귀여움)', labelEn: 'Mint Cream', group: 'cute', isDark: false, swatch: 'linear-gradient(135deg, #14b8a6, #6ee7b7)' },
  { id: 'sakura', label: '벚꽃 블라썸 (예쁨)', labelEn: 'Sakura Blossom', group: 'cute', isDark: false, swatch: 'linear-gradient(135deg, #ec4899, #c084fc)' },
  { id: 'lavender', label: '라벤더 (예쁨)', labelEn: 'Soft Lavender', group: 'cute', isDark: false, swatch: '#7c3aed' },
  { id: 'sunset', label: '선셋 웜', labelEn: 'Warm Sunset', group: 'cute', isDark: false, swatch: 'linear-gradient(135deg, #f97316, #ec4899)' },

  // 미래 · 로봇 · 감성 다크 테마
  { id: 'cyberpunk', label: '사이버 네온 (미래)', labelEn: 'Cyber Neon', group: 'futuristic', isDark: true, swatch: 'linear-gradient(135deg, #06b6d4, #d946ef)' },
  { id: 'mecha-bot', label: '메카 로봇 (로봇)', labelEn: 'Mecha Robot', group: 'futuristic', isDark: true, swatch: 'linear-gradient(135deg, #334155, #f59e0b)' },
  { id: 'aurora', label: '오로라 드림 (예쁨)', labelEn: 'Aurora Dream', group: 'futuristic', isDark: true, swatch: 'linear-gradient(135deg, #14b8a6, #7c3aed)' },
  { id: 'ocean', label: '오션 다크', labelEn: 'Deep Ocean', group: 'futuristic', isDark: true, swatch: '#0369a1' },
  { id: 'forest', label: '포레스트 다크', labelEn: 'Forest Dark', group: 'futuristic', isDark: true, swatch: '#059669' },
  { id: 'rose-dark', label: '로즈 다크', labelEn: 'Rose Dark', group: 'futuristic', isDark: true, swatch: '#e11d48' },
];

const DARK_THEMES = new Set<ThemeMode>(['dark', 'ocean', 'forest', 'rose-dark', 'aurora', 'cyberpunk', 'mecha-bot']);
const VALID_THEMES = new Set<string>(THEME_OPTIONS.map((t) => t.id));

export type LangMode = 'ko' | 'en';

function usePrefsState() {
  return useSyncExternalStore(prefsStore.subscribe, prefsStore.getState);
}

export function useTheme() {
  const stored = usePrefsState().theme;
  const theme: ThemeMode = VALID_THEMES.has(stored) ? (stored as ThemeMode) : 'system';

  useEffect(() => {
    const root = document.documentElement;
    const apply = (mode: ThemeMode) => {
      const isDark =
        DARK_THEMES.has(mode) ||
        (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      root.classList.toggle('dark', isDark);
      if (mode === 'system' || mode === 'light' || mode === 'dark') {
        root.removeAttribute('data-theme');
      } else {
        root.setAttribute('data-theme', mode);
      }
    };
    apply(theme);
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (theme === 'system') apply('system');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = useCallback((next: ThemeMode) => prefsStore.change({ theme: next }), []);
  return { theme, setTheme };
}

export function useSyncedPrefs() {
  const { favorites, hiddenTools, lang, syncError } = usePrefsState();
  const toggleFavorite = useCallback((id: string) => prefsStore.change({
    favorites: prefsStore.getState().favorites.includes(id) ? { remove: [id] } : { add: [id] },
  }), []);
  const toggleHidden = useCallback((id: string) => prefsStore.change({
    hiddenTools: prefsStore.getState().hiddenTools.includes(id) ? { remove: [id] } : { add: [id] },
  }), []);
  const setLang = useCallback((next: LangMode) => prefsStore.change({ lang: next }), []);
  return { favorites, toggleFavorite, hiddenTools, toggleHidden, lang, setLang, syncError, dismissSyncError: prefsStore.dismissError };
}
