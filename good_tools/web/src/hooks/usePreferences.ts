import { useEffect, useState, useCallback } from 'react';

export type ThemeMode =
  | 'system'
  | 'light'
  | 'dark'
  | 'ha-blue'
  | 'ocean'
  | 'forest'
  | 'sunset'
  | 'lavender'
  | 'rose-dark';

export interface ThemeOption {
  id: ThemeMode;
  label: string;
  labelEn: string;
  isDark: boolean | 'auto';
  swatch: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  { id: 'system', label: '시스템 자동', labelEn: 'System Auto', isDark: 'auto', swatch: 'linear-gradient(135deg, #f8fafc 50%, #0f172a 50%)' },
  { id: 'light', label: '라이트', labelEn: 'Crisp Light', isDark: false, swatch: '#4f46e5' },
  { id: 'dark', label: '다크', labelEn: 'Midnight Dark', isDark: true, swatch: '#0f172a' },
  { id: 'ha-blue', label: 'HA 블루', labelEn: 'HA Blue', isDark: false, swatch: '#0284c7' },
  { id: 'sunset', label: '선셋 웜', labelEn: 'Warm Sunset', isDark: false, swatch: '#ea580c' },
  { id: 'lavender', label: '라벤더', labelEn: 'Soft Lavender', isDark: false, swatch: '#7c3aed' },
  { id: 'ocean', label: '오션 다크', labelEn: 'Deep Ocean', isDark: true, swatch: '#0369a1' },
  { id: 'forest', label: '포레스트 다크', labelEn: 'Forest Dark', isDark: true, swatch: '#059669' },
  { id: 'rose-dark', label: '로즈 다크', labelEn: 'Rose Dark', isDark: true, swatch: '#e11d48' },
];

const DARK_THEMES = new Set<ThemeMode>(['dark', 'ocean', 'forest', 'rose-dark']);
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

  // Load synced theme from HA /data/prefs.json
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

  const persist = useCallback((nextFav: string[], nextHidden: string[], nextLang: LangMode) => {
    localStorage.setItem('good_tools_favorites', JSON.stringify(nextFav));
    localStorage.setItem('good_tools_hidden', JSON.stringify(nextHidden));
    localStorage.setItem('good_tools_lang', nextLang);
    fetch('./api/prefs', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ favorites: nextFav, hiddenTools: nextHidden, lang: nextLang }),
    }).catch(() => {});
  }, []);

  const toggleFavorite = useCallback(
    (id: string) => {
      setFavorites((prev) => {
        const next = prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev];
        persist(next, hiddenTools, lang);
        return next;
      });
    },
    [hiddenTools, lang, persist]
  );

  const toggleHidden = useCallback(
    (id: string) => {
      setHiddenTools((prev) => {
        const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
        persist(favorites, next, lang);
        return next;
      });
    },
    [favorites, lang, persist]
  );

  const setLang = useCallback(
    (nextLang: LangMode) => {
      setLangState(nextLang);
      persist(favorites, hiddenTools, nextLang);
    },
    [favorites, hiddenTools, persist]
  );

  return { favorites, toggleFavorite, hiddenTools, toggleHidden, lang, setLang };
}
