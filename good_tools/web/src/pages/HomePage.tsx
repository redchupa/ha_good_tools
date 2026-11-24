import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Star, Wifi, ShieldAlert, Radio } from 'lucide-react';
import { TOOLS, CATEGORY_LABELS, type ToolCategory } from '../data/tools';
import { ToolIcon } from '../components/ToolIcon';
import type { LangMode } from '../hooks/usePreferences';

interface HomePageProps {
  favorites: string[];
  toggleFavorite: (id: string) => void;
  hiddenTools: string[];
  lang: LangMode;
}

export function HomePage({ favorites, toggleFavorite, hiddenTools, lang }: HomePageProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'all' | ToolCategory>('all');

  const visibleBase = TOOLS.filter((t) => !hiddenTools.includes(t.id));

  const filtered = visibleBase.filter((t) => {
    if (category !== 'all' && t.category !== category) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      (t.nameEn || '').toLowerCase().includes(q) ||
      t.shortDesc.toLowerCase().includes(q) ||
      t.keywords.some((k) => k.toLowerCase().includes(q))
    );
  });

  const favoriteTools = favorites
    .map((id) => TOOLS.find((t) => t.id === id))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  const tName = (t: (typeof TOOLS)[number]) => (lang === 'en' && t.nameEn ? t.nameEn : t.name);
  const tDesc = (t: (typeof TOOLS)[number]) => (lang === 'en' && t.shortDescEn ? t.shortDescEn : t.shortDesc);

  return (
    <div className="space-y-6">
      <div className="hero-banner relative overflow-hidden rounded-2xl p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Good Tools
          </h1>
          <p className="mt-1.5 text-sm sm:text-base text-white/85">
            {lang === 'en' ? 'Useful Tools Collection' : '좋은 도구 모음'}
          </p>

          <div className="mt-5 relative max-w-lg">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                lang === 'en'
                  ? 'Search tools (pdf, yaml, cron, qr, clipboard, ssl)...'
                  : '도구 검색 (예: 클립보드, PDF, YAML, 크론, 이미지, 바코드, RSS)...'
              }
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 text-sm shadow-sm outline-none focus:ring-2 focus:ring-white/60"
            />
          </div>
        </div>
      </div>

      {favoriteTools.length > 0 && !search.trim() && category === 'all' && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Star className="w-4 h-4 text-amber-500 fill-current" />
            {lang === 'en' ? 'Favorites' : '즐겨찾는 도구'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {favoriteTools.map((tool) => (
              <Link
                key={tool.id}
                to={`/tool/${tool.id}`}
                className="group flex items-start gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-300/60 dark:border-amber-500/30 hover:border-indigo-400 dark:hover:border-indigo-500 shadow-xs transition-all"
              >
                <span className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <ToolIcon name={tool.icon} className="w-5 h-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    {tName(tool)}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{tDesc(tool)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {(['all', 'ha', 'general', 'developer', 'feed', 'games'] as const).map((cat) => {
          const count = cat === 'all' ? visibleBase.length : visibleBase.filter((t) => t.category === cat).length;
          const label =
            cat === 'all'
              ? lang === 'en'
                ? 'All'
                : '전체'
              : lang === 'en'
              ? CATEGORY_LABELS[cat].labelEn
              : CATEGORY_LABELS[cat].label;
          const active = category === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                active
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {label} <span className="opacity-75 text-xs ml-1">{count}</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500">
          {lang === 'en' ? 'No matching tools found.' : '검색 결과가 없습니다. 다른 키워드를 입력해 보세요.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filtered.map((tool) => {
            const isFav = favorites.includes(tool.id);
            return (
              <div
                key={tool.id}
                className="group relative flex flex-col p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <Link to={`/tool/${tool.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <span
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        tool.category === 'ha'
                          ? 'bg-sky-50 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400'
                          : tool.category === 'general'
                          ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                          : tool.category === 'developer'
                          ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : tool.category === 'games'
                          ? 'bg-pink-50 dark:bg-pink-500/15 text-pink-600 dark:text-pink-400'
                          : 'bg-orange-50 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400'
                      }`}
                    >
                      <ToolIcon name={tool.icon} className="w-5 h-5" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                        {tName(tool)}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] text-slate-400">
                          {lang === 'en' ? CATEGORY_LABELS[tool.category].labelEn : CATEGORY_LABELS[tool.category].label}
                        </span>
                        {tool.badge === 'network' && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 rounded bg-cyan-50 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-300">
                            <Wifi className="w-2.5 h-2.5" /> {lang === 'en' ? 'Server' : '서버'}
                          </span>
                        )}
                        {tool.badge === 'lan' && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 rounded bg-violet-50 dark:bg-violet-500/15 text-violet-600 dark:text-violet-300">
                            <Radio className="w-2.5 h-2.5" /> LAN
                          </span>
                        )}
                        {tool.badge === 'https' && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 rounded bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-300">
                            <ShieldAlert className="w-2.5 h-2.5" /> HTTPS
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggleFavorite(tool.id)}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      isFav ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600 hover:text-amber-400'
                    }`}
                    title={isFav ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                  >
                    <Star className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                  </button>
                </div>

                <Link
                  to={`/tool/${tool.id}`}
                  className="mt-2.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 flex-1"
                >
                  {tDesc(tool)}
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
