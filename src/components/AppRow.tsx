'use client';

import Link from 'next/link';
import { ThumbsUp } from 'lucide-react';
import { App } from '@/types';
import { CATEGORIES } from '@/lib/data';

type Props = {
  app: App;
  onVote?: (appId: string) => void;
  voted?: boolean;
};

export default function AppRow({ app, onVote, voted }: Props) {
  const category = CATEGORIES.find((c) => c.id === app.category_id);
  const tagline = app.tagline.length > 40 ? app.tagline.slice(0, 40) + '…' : app.tagline;

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group">
      {/* Icon */}
      <Link href={`/apps/${app.id}`} className="shrink-0">
        <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-gray-700 to-gray-800 border border-white/10 flex items-center justify-center">
          {app.screenshot_url ? (
            <img src={app.screenshot_url} alt={app.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-lg">{category?.icon ?? '📦'}</span>
          )}
        </div>
      </Link>

      {/* Name + tagline */}
      <div className="flex-1 min-w-0">
        <Link href={`/apps/${app.id}`}>
          <span className="text-white text-sm font-medium group-hover:text-violet-300 transition-colors">
            {app.name}
          </span>
        </Link>
        <p className="text-gray-500 text-xs truncate">{tagline}</p>
      </div>

      {/* Category */}
      <span className="hidden sm:block text-xs text-gray-600 shrink-0 w-20 text-right truncate">
        {category?.icon} {category?.name}
      </span>

      {/* Vote */}
      <button
        onClick={() => onVote?.(app.id)}
        className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
          voted
            ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
            : 'bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white border border-white/10'
        }`}
      >
        <ThumbsUp className="w-3 h-3" />
        {app.votes}
      </button>
    </div>
  );
}
