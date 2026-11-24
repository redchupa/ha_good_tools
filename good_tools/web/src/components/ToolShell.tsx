import { Link } from 'react-router-dom';
import { ArrowLeft, Star, Wifi, ShieldAlert } from 'lucide-react';
import type { ToolMeta } from '../data/tools';
import { ToolIcon } from './ToolIcon';

interface ToolShellProps {
  tool: ToolMeta;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  children: React.ReactNode;
}

export function ToolShell({ tool, isFavorite, onToggleFavorite, children }: ToolShellProps) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <Link
            to="/"
            className="mt-0.5 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="대시보드로 돌아가기"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                <ToolIcon name={tool.icon} className="w-4 h-4" />
              </span>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                {tool.name}
              </h1>
              {tool.badge === 'network' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300">
                  <Wifi className="w-3 h-3" /> 서버 프록시
                </span>
              )}
              {tool.badge === 'https' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300">
                  <ShieldAlert className="w-3 h-3" /> HTTPS 권장
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{tool.shortDesc}</p>
          </div>
        </div>

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
          <span>{isFavorite ? '즐겨찾기됨' : '즐겨찾기'}</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xs">
        {children}
      </div>
    </div>
  );
}
