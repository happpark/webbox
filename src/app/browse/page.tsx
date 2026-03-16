'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AppCard from '@/components/AppCard';
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
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
      <div className="space-y-4 mb-8">
        <SearchBar placeholder="Search apps by name, tag, or description..." />
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <CategoryFilter />
          <SortBar />
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(9).fill(0).map((_, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden animate-pulse">
              <div className="h-44 bg-white/5" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-white/5 rounded w-2/3" />
                <div className="h-3 bg-white/5 rounded w-full" />
                <div className="h-3 bg-white/5 rounded w-4/5" />
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
          <p className="text-gray-500 text-sm mb-4">{apps.length} apps found</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {apps.map((app) => (
              <AppCard
                key={app.id}
                app={app}
                onVote={handleVote}
                voted={voted.has(app.id)}
              />
            ))}
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
