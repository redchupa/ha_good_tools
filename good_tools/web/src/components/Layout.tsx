import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  Star,
  Sun,
  Moon,
  Monitor,
  Menu,
  X,
  Wrench,
  Home,
  Sparkles,
} from 'lucide-react';
import { TOOLS, CATEGORY_LABELS, type ToolCategory } from '../data/tools';
import { ToolIcon } from './ToolIcon';
import type { ThemeMode } from '../hooks/usePreferences';

interface LayoutProps {
  children: React.ReactNode;
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  favorites: string[];
}

export function Layout({ children, theme, setTheme, favorites }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  // Ctrl+K / Cmd+K quick command palette
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const filteredTools = query.trim()
    ? TOOLS.filter((t) => {
        const q = query.toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          t.shortDesc.toLowerCase().includes(q) ||
          t.keywords.some((k) => k.toLowerCase().includes(q))
        );
      })
    : TOOLS;

  const cycleTheme = () => {
    const order: ThemeMode[] = ['system', 'light', 'dark'];
    setTheme(order[(order.indexOf(theme) + 1) % order.length]);
  };

  const categories: ToolCategory[] = ['general', 'developer', 'feed'];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 h-14 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <Link
          to="/"
          onClick={() => setSidebarOpen(false)}
          className="flex items-center gap-2.5 font-bold text-slate-900 dark:text-white"
        >
          <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-500 text-white flex items-center justify-center shadow-sm">
            <Wrench className="w-4 h-4" />
          </span>
          <span className="tracking-tight">Good Tools</span>
        </Link>
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="메뉴 닫기"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
        <div>
          <Link
            to="/"
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              location.pathname === '/'
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>전체 도구 대시보드</span>
            <span className="ml-auto text-xs px-1.5 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
              {TOOLS.length}
            </span>
          </Link>
        </div>

        {favorites.length > 0 && (
          <div>
            <div className="px-3 mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              <Star className="w-3 h-3 fill-current" />
              즐겨찾기
            </div>
            <div className="space-y-0.5">
              {favorites
                .map((id) => TOOLS.find((t) => t.id === id))
                .filter((t): t is NonNullable<typeof t> => Boolean(t))
                .map((tool) => {
                  const active = location.pathname === `/tool/${tool.id}`;
                  return (
                    <Link
                      key={tool.id}
                      to={`/tool/${tool.id}`}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        active
                          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300 font-medium'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                      }`}
                    >
                      <ToolIcon name={tool.icon} className="w-4 h-4 shrink-0 opacity-80" />
                      <span className="truncate">{tool.name}</span>
                    </Link>
                  );
                })}
            </div>
          </div>
        )}

        {categories.map((cat) => (
          <div key={cat}>
            <div className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {CATEGORY_LABELS[cat].label}
            </div>
            <div className="space-y-0.5">
              {TOOLS.filter((t) => t.category === cat).map((tool) => {
                const active = location.pathname === `/tool/${tool.id}`;
                return (
                  <Link
                    key={tool.id}
                    to={`/tool/${tool.id}`}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      active
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300 font-medium'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                    }`}
                  >
                    <ToolIcon name={tool.icon} className="w-4 h-4 shrink-0 opacity-80" />
                    <span className="truncate">{tool.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500 flex items-center justify-between">
        <span className="inline-flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          HA App v1.0.0
        </span>
        <span>32 Tools</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-72 max-w-[82vw] bg-white dark:bg-slate-900 h-full shadow-2xl z-10">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        <header className="sticky top-0 z-20 h-14 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="메뉴 열기"
          >
            <Menu className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSearchOpen(true);
            }}
            className="flex-1 max-w-md flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 text-sm hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors cursor-pointer"
          >
            <Search className="w-4 h-4 shrink-0" />
            <span className="truncate">도구 빠르게 찾기...</span>
            <kbd className="ml-auto hidden sm:inline-block px-1.5 py-0.5 text-[11px] font-mono rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300">
              Ctrl K
            </kbd>
          </button>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={cycleTheme}
              title={`테마: ${theme === 'system' ? '시스템' : theme === 'light' ? '라이트' : '다크'}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-medium cursor-pointer"
            >
              {theme === 'light' && <Sun className="w-4 h-4 text-amber-500" />}
              {theme === 'dark' && <Moon className="w-4 h-4 text-indigo-400" />}
              {theme === 'system' && <Monitor className="w-4 h-4 text-cyan-500" />}
              <span className="hidden sm:inline">
                {theme === 'system' ? '자동' : theme === 'light' ? '라이트' : '다크'}
              </span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 max-w-6xl w-full mx-auto">{children}</main>
      </div>

      {/* Command Search Modal */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4 bg-slate-950/50 backdrop-blur-xs"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="도구 이름, 기능, 키워드로 검색 (예: qr, base64, 자막, 로또)..."
                className="flex-1 bg-transparent outline-none text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500"
              >
                ESC
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto p-2 space-y-0.5">
              {filteredTools.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">일치하는 도구가 없습니다.</div>
              ) : (
                filteredTools.map((tool) => (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => {
                      navigate(`/tool/${tool.id}`);
                      setSearchOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-indigo-50 dark:hover:bg-indigo-500/15 transition-colors cursor-pointer"
                  >
                    <span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                      <ToolIcon name={tool.icon} className="w-4 h-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {tool.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {tool.shortDesc}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
