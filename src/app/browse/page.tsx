'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CATEGORIES } from '@/lib/data';
import CategoryFilter from '@/components/CategoryFilter';
import SortBar from '@/components/SortBar';
import SearchBar from '@/components/SearchBar';
import { App } from '@/types';

function BrowseContent() {
  const searchParams = useSearchParams();
  const [apps, setApps] = useState<App[]>([]);
  const [voted, setVoted] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const category = searchParams.get('category');
  const sort = searchParams.get('sort') ?? 'trending';
  const q = searchParams.get('q');

  useEffect(() => {
    const savedVotes = JSON.parse(localStorage.getItem('webbox_votes') ?? '[]');
    setVoted(new Set(savedVotes));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (sort) params.set('sort', sort);
    if (q) params.set('q', q);

    fetch(`/api/apps?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setApps(data.apps ?? []);
        setLoading(false);
      });
  }, [category, sort, q]);

  function handleVote(appId: string) {
    setVoted((prev) => {
      const next = new Set(prev);
      if (next.has(appId)) next.delete(appId);
      else next.add(appId);
      localStorage.setItem('webbox_votes', JSON.stringify([...next]));
      return next;
    });
    fetch('/api/vote', {
      method: 'POST',
      body: JSON.stringify({ appId }),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Browse Apps</h1>
        <p className="text-gray-400">
          {q
            ? `Search results for "${q}"`
            : category
            ? `Browsing ${category} apps`
            : 'All vibe-coded web apps'}
        </p>
      </div>

      {/* Filters */}
      <div className="space-y-4 mb-6">
        <SearchBar placeholder="Search apps by name, tag, or description..." />
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <CategoryFilter />
          <SortBar />
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-3 gap-2">
          {Array(18).fill(0).map((_, i) => (
            <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 animate-pulse">
              <div className="w-9 h-9 rounded-lg bg-white/10 shrink-0" />
              <div className="flex-1 space-y-1.5 min-w-0">
                <div className="h-2.5 bg-white/10 rounded w-3/4" />
                <div className="h-2 bg-white/5 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : apps.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-white text-xl font-semibold mb-2">No apps found</h3>
          <p className="text-gray-500">
            {q ? `No results for "${q}". Try a different search.` : 'No apps in this category yet.'}
          </p>
        </div>
      ) : (
        <>
          <p className="text-gray-600 text-xs mb-3">{apps.length} apps</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {apps.map((app) => {
              const category = CATEGORIES.find((c) => c.id === app.category_id);
              const tagline = app.tagline.length > 38 ? app.tagline.slice(0, 38) + '…' : app.tagline;
              return (
                <a
                  key={app.id}
                  href={`/apps/${app.id}`}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-white/5 transition-colors group"
                >
                  <div className="w-9 h-9 rounded-lg overflow-hidden bg-gradient-to-br from-gray-700 to-gray-800 border border-white/10 shrink-0 flex items-center justify-center">
                    {app.screenshot_url ? (
                      <img src={app.screenshot_url} alt={app.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-base">{category?.icon ?? '📦'}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-xs font-medium leading-tight truncate group-hover:text-violet-300 transition-colors">{app.name}</p>
                    <p className="text-gray-500 text-xs leading-tight mt-0.5 truncate">{tagline}</p>
                  </div>
                </a>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense>
      <BrowseContent />
    </Suspense>
  );
}
