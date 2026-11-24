import { useEffect, useState, useCallback } from 'react';

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

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('good_tools_theme') || 'system';
    return VALID_THEMES.has(saved) ? (saved as ThemeMode) : 'system';
  });

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
    localStorage.setItem('good_tools_theme', theme);

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (theme === 'system') apply('system');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next);
    fetch('./api/prefs', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: next }),
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetch('./api/prefs')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.theme && VALID_THEMES.has(data.theme)) {
          setThemeState(data.theme as ThemeMode);
        }
      })
      .catch(() => {});
  }, []);

  return { theme, setTheme };
}

export function useSyncedPrefs() {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('good_tools_favorites') || '[]');
    } catch {
      return [];
    }
  });

  const [hiddenTools, setHiddenTools] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('good_tools_hidden') || '[]');
    } catch {
      return [];
    }
  });

  const [lang, setLangState] = useState<LangMode>(() => {
    return (localStorage.getItem('good_tools_lang') as LangMode) === 'en' ? 'en' : 'ko';
  });

  useEffect(() => {
    let active = true;
    fetch('./api/prefs')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!active || !data) return;
        if (Array.isArray(data.favorites)) {
          setFavorites(data.favorites);
          localStorage.setItem('good_tools_favorites', JSON.stringify(data.favorites));
        }
        if (Array.isArray(data.hiddenTools)) {
          setHiddenTools(data.hiddenTools);
          localStorage.setItem('good_tools_hidden', JSON.stringify(data.hiddenTools));
        }
        if (data.lang === 'en' || data.lang === 'ko') {
          setLangState(data.lang);
          localStorage.setItem('good_tools_lang', data.lang);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const persist = useCallback((key: string, storage: string, value: string[] | LangMode) => {
    localStorage.setItem(storage, typeof value === 'string' ? value : JSON.stringify(value));
    fetch('./api/prefs', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: value }),
    }).catch(() => {});
  }, []);

  const toggleFavorite = (id: string) => {
    const next = favorites.includes(id) ? favorites.filter(x => x !== id) : [id, ...favorites];
    setFavorites(next);
    persist('favorites', 'good_tools_favorites', next);
  };
  const toggleHidden = (id: string) => {
    const next = hiddenTools.includes(id) ? hiddenTools.filter(x => x !== id) : [...hiddenTools, id];
    setHiddenTools(next);
    persist('hiddenTools', 'good_tools_hidden', next);
  };
  const setLang = (next: LangMode) => {
    setLangState(next);
    persist('lang', 'good_tools_lang', next);
  };

  return { favorites, toggleFavorite, hiddenTools, toggleHidden, lang, setLang };
}
