import { useEffect, useState, useCallback } from 'react';

export type ThemeMode = 'system' | 'light' | 'dark';
export type LangMode = 'ko' | 'en';

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('good_tools_theme') as ThemeMode | null;
    return saved || 'system';
  });

  useEffect(() => {
    const root = document.documentElement;
    const apply = (mode: ThemeMode) => {
      const isDark =
        mode === 'dark' ||
        (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      root.classList.toggle('dark', isDark);
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

  // Load synced prefs from HA /data/prefs.json on mount
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
