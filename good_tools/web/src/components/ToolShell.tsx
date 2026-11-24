import { useEffect } from 'react';
import { rememberTool, shareTool } from '../utils/toolNavigation';
import { toolAvailability, useEnvironment } from '../utils/capabilities';
import { CopyButton } from './CopyButton';
import { Link } from 'react-router-dom';
import { ArrowLeft, Star, Wifi, ShieldAlert } from 'lucide-react';
import type { ToolMeta } from '../data/tools';
import { ToolIcon } from './ToolIcon';

interface ToolShellProps {
  lang: 'ko' | 'en';
  tool: ToolMeta;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  children: React.ReactNode;
}

export function ToolShell({ lang, tool, isFavorite, onToggleFavorite, children }: ToolShellProps) {
  useEffect(() => { rememberTool(tool.id); }, [tool.id]);
  const en = lang === 'en';
  const link = shareTool(tool.id);
  const avail = toolAvailability(tool.id, useEnvironment());
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <Link
            to="/"
            className="mt-0.5 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={en ? 'Back to dashboard' : '대시보드로 돌아가기'}
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                <ToolIcon name={tool.icon} className="w-4 h-4" />
              </span>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                {en ? tool.nameEn || tool.name : tool.name}
              </h1>
              {tool.badge === 'network' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300">
                  <Wifi className="w-3 h-3" /> {en ? 'Server proxy' : '서버 프록시'}
                </span>
              )}
              {tool.badge === 'https' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300">
                  <ShieldAlert className="w-3 h-3" /> {en ? 'HTTPS recommended' : 'HTTPS 권장'}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{en ? tool.shortDescEn || tool.shortDesc : tool.shortDesc}</p>
          </div>
        </div>

        {link && <CopyButton text={link} label={en ? "Copy tool link" : "도구 링크 복사"} />}
        <button
          type="button"
          onClick={onToggleFavorite}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
            isFavorite
              ? 'border-amber-400/50 bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-300'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
          <span>{isFavorite ? (en ? 'Favorited' : '즐겨찾기됨') : (en ? 'Favorite' : '즐겨찾기')}</span>
        </button>
      </div>

      {avail.level !== 'ok' && (
        <div role="note" className={`flex items-start gap-2 p-3 rounded-xl text-xs ${avail.level === 'blocked'
          ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300'
          : 'bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-200'}`}>
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{en ? avail.en : avail.ko}</span>
        </div>
      )}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xs">
        {children}
      </div>
    </div>
  );
}
