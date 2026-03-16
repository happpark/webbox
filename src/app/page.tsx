'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, TrendingUp, Clock } from 'lucide-react';
import AppCard from '@/components/AppCard';
import { App } from '@/types';
import { CATEGORIES } from '@/lib/data';

export default function HomePage() {
  const [featured, setFeatured] = useState<App[]>([]);
  const [trending, setTrending] = useState<App[]>([]);
  const [newest, setNewest] = useState<App[]>([]);
  const [voted, setVoted] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedVotes = JSON.parse(localStorage.getItem('webbox_votes') ?? '[]');
    setVoted(new Set(savedVotes));

    Promise.all([
      fetch('/api/apps?featured=true').then((r) => r.json()),
      fetch('/api/apps?sort=trending').then((r) => r.json()),
      fetch('/api/apps?sort=new').then((r) => r.json()),
    ]).then(([f, t, n]) => {
      setFeatured(f.apps?.slice(0, 4) ?? []);
      setTrending(t.apps?.slice(0, 6) ?? []);
      setNewest(n.apps?.slice(0, 6) ?? []);
      setLoading(false);
    });
  }, []);

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero */}
      <div className="text-center mb-16 pt-8">
        <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 text-violet-300 px-4 py-2 rounded-full text-sm mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          The App Store for Vibe-Coded Web Apps
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold text-white mb-4 leading-tight">
          Discover apps built
          <br />
          <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
            by makers like you
          </span>
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto mb-8">
          A curated gallery of web apps created with vibe coding. Find tools,
          games, and creative projects built by indie developers worldwide.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/browse"
            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            Browse All Apps <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/submit"
            className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            Submit Your App
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-16 max-w-lg mx-auto">
        {[
          { label: 'Apps', value: '500+' },
          { label: 'Makers', value: '200+' },
          { label: 'Votes', value: '12K+' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="text-center bg-white/5 border border-white/10 rounded-2xl py-4"
          >
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-gray-500 text-sm">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Categories */}
      <div className="mb-16">
        <h2 className="text-xl font-semibold text-white mb-4">
          Browse by Category
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/browse?category=${cat.slug}`}
              className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl p-4 transition-all group"
            >
              <span className="text-2xl">{cat.icon}</span>
              <div>
                <div className="text-white text-sm font-medium group-hover:text-violet-300 transition-colors">
                  {cat.name}
                </div>
                <div className="text-gray-500 text-xs">{cat.description}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Featured */}
      {(loading || featured.length > 0) && (
        <div className="mb-16">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-400" /> Featured
            </h2>
            <Link
              href="/browse?featured=true"
              className="text-violet-400 hover:text-violet-300 text-sm flex items-center gap-1"
            >
              See all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading
              ? Array(4)
                  .fill(0)
                  .map((_, i) => <SkeletonCard key={i} />)
              : featured.map((app) => (
                  <AppCard
                    key={app.id}
                    app={app}
                    onVote={handleVote}
                    voted={voted.has(app.id)}
                  />
                ))}
          </div>
        </div>
      )}

      {/* Trending */}
      <div className="mb-16">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-pink-400" /> Trending
          </h2>
          <Link
            href="/browse?sort=trending"
            className="text-violet-400 hover:text-violet-300 text-sm flex items-center gap-1"
          >
            See all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading
            ? Array(6)
                .fill(0)
                .map((_, i) => <SkeletonCard key={i} />)
            : trending.map((app) => (
                <AppCard
                  key={app.id}
                  app={app}
                  onVote={handleVote}
                  voted={voted.has(app.id)}
                />
              ))}
        </div>
      </div>

      {/* Newest */}
      <div className="mb-16">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" /> Just Launched
          </h2>
          <Link
            href="/browse?sort=new"
            className="text-violet-400 hover:text-violet-300 text-sm flex items-center gap-1"
          >
            See all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading
            ? Array(6)
                .fill(0)
                .map((_, i) => <SkeletonCard key={i} />)
            : newest.map((app) => (
                <AppCard
                  key={app.id}
                  app={app}
                  onVote={handleVote}
                  voted={voted.has(app.id)}
                />
              ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center bg-gradient-to-br from-violet-900/30 to-pink-900/20 border border-violet-500/20 rounded-3xl py-16 px-8">
        <h2 className="text-3xl font-bold text-white mb-3">
          Built something cool?
        </h2>
        <p className="text-gray-400 mb-6">
          Share your vibe-coded creation with thousands of makers and
          enthusiasts.
        </p>
        <Link
          href="/submit"
          className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-8 py-3 rounded-xl font-medium transition-colors"
        >
          Submit Your App <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden animate-pulse">
      <div className="h-44 bg-white/5" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-white/5 rounded w-2/3" />
        <div className="h-3 bg-white/5 rounded w-full" />
        <div className="h-3 bg-white/5 rounded w-4/5" />
      </div>
    </div>
  );
}
