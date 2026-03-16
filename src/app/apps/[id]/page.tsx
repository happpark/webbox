'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Github, ThumbsUp, Tag } from 'lucide-react';
import { App } from '@/types';
import { CATEGORIES, SEED_APPS } from '@/lib/data';
import { timeAgo } from '@/lib/utils';

export default function AppDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [app, setApp] = useState<App | null>(null);
  const [voted, setVoted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedVotes = JSON.parse(localStorage.getItem('webbox_votes') ?? '[]');
    setVoted(savedVotes.includes(id));

    // Try to fetch from API, fall back to seed data
    fetch(`/api/apps`)
      .then((r) => r.json())
      .then((data) => {
        const found = data.apps?.find((a: App) => a.id === id);
        if (found) {
          setApp(found);
        } else {
          // Not found
          router.push('/browse');
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id, router]);

  function handleVote() {
    const savedVotes = JSON.parse(localStorage.getItem('webbox_votes') ?? '[]');
    if (voted) {
      localStorage.setItem('webbox_votes', JSON.stringify(savedVotes.filter((v: string) => v !== id)));
    } else {
      localStorage.setItem('webbox_votes', JSON.stringify([...savedVotes, id]));
    }
    setVoted(!voted);
    if (app) setApp({ ...app, votes: app.votes + (voted ? -1 : 1) });
    fetch('/api/vote', {
      method: 'POST',
      body: JSON.stringify({ appId: id }),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 animate-pulse">
        <div className="h-8 bg-white/5 rounded w-32 mb-8" />
        <div className="h-64 bg-white/5 rounded-2xl mb-6" />
        <div className="h-8 bg-white/5 rounded w-1/2 mb-4" />
        <div className="h-4 bg-white/5 rounded w-full mb-2" />
        <div className="h-4 bg-white/5 rounded w-4/5" />
      </div>
    );
  }

  if (!app) return null;

  const category = CATEGORIES.find((c) => c.id === app.category_id);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link
        href="/browse"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Browse
      </Link>

      {/* Screenshot */}
      <div className="relative h-64 sm:h-80 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl overflow-hidden mb-8">
        {app.screenshot_url ? (
          <img src={app.screenshot_url} alt={app.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-8xl opacity-20">{category?.icon ?? '📦'}</span>
          </div>
        )}
        {app.featured && (
          <div className="absolute top-4 left-4 bg-violet-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
            ⭐ Featured
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-6 items-start">
        {/* Main content */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {category && (
              <span className="text-xs bg-white/10 text-gray-300 px-3 py-1 rounded-full">
                {category.icon} {category.name}
              </span>
            )}
            <span className="text-gray-500 text-xs">{timeAgo(app.created_at)}</span>
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">{app.name}</h1>
          <p className="text-gray-300 text-lg mb-4">{app.tagline}</p>
          <p className="text-gray-400 leading-relaxed mb-6">{app.description}</p>

          {app.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {app.tags.map((tag) => (
                <span key={tag} className="flex items-center gap-1 text-sm bg-white/5 text-gray-400 px-3 py-1 rounded-full border border-white/10">
                  <Tag className="w-3 h-3" /> {tag}
                </span>
              ))}
            </div>
          )}

          {app.author_name && (
            <p className="text-gray-500 text-sm">
              By{' '}
              {app.author_url ? (
                <a href={app.author_url} target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300">
                  {app.author_name}
                </a>
              ) : (
                <span className="text-gray-400">{app.author_name}</span>
              )}
            </p>
          )}
        </div>

        {/* Action sidebar */}
        <div className="w-full sm:w-60 shrink-0 space-y-3">
          <a
            href={app.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-violet-600 hover:bg-violet-500 text-white py-3 rounded-xl font-medium transition-colors"
          >
            <ExternalLink className="w-4 h-4" /> Visit App
          </a>

          <button
            onClick={handleVote}
            className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-medium transition-all border ${
              voted
                ? 'bg-violet-500/20 text-violet-300 border-violet-500/30'
                : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10'
            }`}
          >
            <ThumbsUp className="w-4 h-4" />
            {voted ? 'Voted' : 'Vote'} · {app.votes}
          </button>

          {app.github_url && (
            <a
              href={app.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 py-3 rounded-xl font-medium transition-colors"
            >
              <Github className="w-4 h-4" /> View Source
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
