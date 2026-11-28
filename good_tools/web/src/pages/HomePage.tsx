import { recentTools } from '../utils/toolNavigation';
import { toolAvailability, useEnvironment } from '../utils/capabilities';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Star, Wifi, ShieldAlert, Radio } from 'lucide-react';
import { TOOLS, type ToolCategory } from '../data/tools';
import { getToolDesc, getToolName, SHELL_STRINGS, type LangMode } from '../data/locales';
import { ToolIcon } from '../components/ToolIcon';

interface HomePageProps {
  favorites: string[];
  toggleFavorite: (id: string) => void;
  hiddenTools: string[];
  lang: LangMode;
}

export function HomePage({ favorites, toggleFavorite, hiddenTools, lang }: HomePageProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'all' | ToolCategory>('all');
  const env = useEnvironment();

  const visibleBase = TOOLS.filter((t) => !hiddenTools.includes(t.id));

  const recent = recentTools().map(id => visibleBase.find(t => t.id === id)).filter(t => !!t);
  const filtered = visibleBase.filter((t) => {
    if (category !== 'all' && t.category !== category) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      (t.nameEn || '').toLowerCase().includes(q) ||
      t.shortDesc.toLowerCase().includes(q) ||
          t.shortDescEn?.toLowerCase().includes(q) ||
      t.keywords.some((k) => k.toLowerCase().includes(q))
    );
  });

  const favoriteTools = favorites
    .map((id) => TOOLS.find((t) => t.id === id))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  const s = SHELL_STRINGS[lang];
  const tName = (t: (typeof TOOLS)[number]) => getToolName(t, lang);
  const tDesc = (t: (typeof TOOLS)[number]) => getToolDesc(t, lang);

  return (
    <div className="space-y-6">
      <div className="hero-banner relative overflow-hidden rounded-2xl p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Good Tools
          </h1>
          <p className="mt-1.5 text-sm sm:text-base text-white/85">
            {s.subtitle}
          </p>

          <div className="mt-5 relative max-w-lg">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={s.searchPlaceholder}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 text-sm shadow-sm outline-none focus:ring-2 focus:ring-white/60"
            />
          </div>
        </div>
      </div>

      {recent.length > 0 && !search && category === 'all' && (
        <section className="space-y-2">
          <h2 className="font-semibold">{s.recent}</h2>
          <div className="flex flex-wrap gap-2">{recent.map(t =>
            <Link key={t.id} to={'/tool/' + t.id} className="rounded-lg border px-3 py-2 text-sm">{tName(t)}</Link>
          )}</div>
        </section>
      )}
      {favoriteTools.length > 0 && !search.trim() && category === 'all' && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Star className="w-4 h-4 text-amber-500 fill-current" />
            {s.favorites}
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
          const label = cat === 'all' ? s.all : s.categories[cat];
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
          {s.noResults}
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
                      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-0.5">
                        <span className="whitespace-nowrap text-[11px] text-slate-400">
                          {s.categories[tool.category]}
                        </span>
                        {tool.badge === 'network' && (
                          <span className="inline-flex items-center gap-0.5 whitespace-nowrap text-[10px] px-1.5 rounded bg-cyan-50 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-300">
                            <Wifi className="w-2.5 h-2.5" /> {s.server}
                          </span>
                        )}
                        {tool.badge === 'lan' && (
                          <span className="inline-flex items-center gap-0.5 whitespace-nowrap text-[10px] px-1.5 rounded bg-violet-50 dark:bg-violet-500/15 text-violet-600 dark:text-violet-300">
                            <Radio className="w-2.5 h-2.5" /> LAN
                          </span>
                        )}
                        {tool.badge === 'https' && (
                          <span className="inline-flex items-center gap-0.5 whitespace-nowrap text-[10px] px-1.5 rounded bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-300">
                            <ShieldAlert className="w-2.5 h-2.5" /> HTTPS
                          </span>
                        )}
                        {(() => {
                          const avail = toolAvailability(tool.id, env);
                          if (avail.level === 'ok') return null;
                          return (
                            <span title={lang === 'ko' ? avail.ko : avail.en}
                              className={`whitespace-nowrap text-[10px] px-1.5 rounded ${avail.level === 'blocked'
                                ? 'bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-300'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300'}`}>
                              {avail.level === 'blocked' ? s.unavailableHere : s.limited}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggleFavorite(tool.id)}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      isFav ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600 hover:text-amber-400'
                    }`}
                    title={isFav ? s.removeFavorite : s.addFavorite}
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
