import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Star, Sparkles, Wifi, ShieldAlert } from 'lucide-react';
import { TOOLS, CATEGORY_LABELS, type ToolCategory } from '../data/tools';
import { ToolIcon } from '../components/ToolIcon';

interface HomePageProps {
  favorites: string[];
  toggleFavorite: (id: string) => void;
}

export function HomePage({ favorites, toggleFavorite }: HomePageProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'all' | ToolCategory>('all');

  const filtered = TOOLS.filter((t) => {
    if (category !== 'all' && t.category !== category) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.shortDesc.toLowerCase().includes(q) ||
      t.keywords.some((k) => k.toLowerCase().includes(q))
    );
  });

  const favoriteTools = favorites
    .map((id) => TOOLS.find((t) => t.id === id))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-xs text-xs font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Home Assistant 올인원 유틸리티 스위트
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Good Tools — 온라인 도구 모음
          </h1>
          <p className="mt-2 text-sm sm:text-base text-blue-100">
            광고·추적 없이 로컬 Home Assistant 안에서 안전하고 빠르게 동작하는 일상·개발자·피드 유틸리티 모음입니다.
          </p>

          <div className="mt-5 relative max-w-lg">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="도구 검색 (예: 바코드, 자막, Base64, 로또, 체크섬, RSS)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 text-sm shadow-sm outline-none focus:ring-2 focus:ring-white/60"
            />
          </div>
        </div>
      </div>

      {/* Favorites shelf */}
      {favoriteTools.length > 0 && !search.trim() && category === 'all' && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Star className="w-4 h-4 text-amber-500 fill-current" />
            즐겨찾는 도구
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
                    {tool.name}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                    {tool.shortDesc}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Category tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {(['all', 'general', 'developer', 'feed'] as const).map((cat) => {
          const count = cat === 'all' ? TOOLS.length : TOOLS.filter((t) => t.category === cat).length;
          const label = cat === 'all' ? '전체' : CATEGORY_LABELS[cat].label;
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

      {/* Tool Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500">
          검색 결과가 없습니다. 다른 키워드를 입력해 보세요.
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
                        tool.category === 'general'
                          ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                          : tool.category === 'developer'
                          ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : 'bg-orange-50 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400'
                      }`}
                    >
                      <ToolIcon name={tool.icon} className="w-5 h-5" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                        {tool.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] text-slate-400">
                          {CATEGORY_LABELS[tool.category].label}
                        </span>
                        {tool.badge === 'network' && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.2 rounded bg-cyan-50 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-300">
                            <Wifi className="w-2.5 h-2.5" /> 프록시
                          </span>
                        )}
                        {tool.badge === 'https' && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-300">
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
                      isFav
                        ? 'text-amber-500'
                        : 'text-slate-300 dark:text-slate-600 hover:text-amber-400'
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
                  {tool.shortDesc}
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
