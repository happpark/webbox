'use client';

import Link from 'next/link';
import { ExternalLink, ThumbsUp, Github } from 'lucide-react';
import { App, Category } from '@/types';
import { CATEGORIES } from '@/lib/data';
import { timeAgo } from '@/lib/utils';

type Props = {
  app: App;
  onVote?: (appId: string) => void;
  voted?: boolean;
};

export default function AppCard({ app, onVote, voted }: Props) {
  const category = CATEGORIES.find((c) => c.id === app.category_id);

  return (
    <div className="group relative bg-white/5 hover:bg-white/8 border border-white/10 hover:border-white/20 rounded-2xl overflow-hidden transition-all duration-200">
      {/* Screenshot / Placeholder */}
      <div className="relative h-44 bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
        {app.screenshot_url ? (
          <img
            src={app.screenshot_url}
            alt={app.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl opacity-30">{category?.icon ?? '📦'}</span>
          </div>
        )}
        {app.featured && (
          <div className="absolute top-3 left-3 bg-violet-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
            Featured
          </div>
        )}
        <a
          href={app.url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <Link href={`/apps/${app.id}`} className="hover:text-violet-300 transition-colors">
            <h3 className="font-semibold text-white text-sm leading-tight">{app.name}</h3>
          </Link>
          {category && (
            <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300`}>
              {category.icon} {category.name}
            </span>
          )}
        </div>

        <p className="text-gray-400 text-xs leading-relaxed mb-3 line-clamp-2">{app.tagline}</p>

        {app.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {app.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-xs bg-white/5 text-gray-500 px-2 py-0.5 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {app.author_name && <span>{app.author_name}</span>}
            <span>·</span>
            <span>{timeAgo(app.created_at)}</span>
            {app.github_url && (
              <>
                <span>·</span>
                <a href={app.github_url} target="_blank" rel="noopener noreferrer" className="hover:text-gray-300 transition-colors">
                  <Github className="w-3 h-3" />
                </a>
              </>
            )}
          </div>

          <button
            onClick={() => onVote?.(app.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              voted
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10'
            }`}
          >
            <ThumbsUp className="w-3 h-3" />
            {app.votes}
          </button>
        </div>
      </div>
    </div>
  );
}
