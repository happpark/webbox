'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { App } from '@/types';
import { CATEGORIES } from '@/lib/data';

export default function HomePage() {
  const [apps, setApps] = useState<App[]>([]);

  useEffect(() => {
    fetch('/api/apps?sort=trending')
      .then((r) => r.json())
      .then((data) => setApps(data.apps ?? []));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero */}
      <div className="text-center mb-12 pt-8">
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

      {/* Icon Mosaic */}
      <div className="relative">
        {/* Edge fade overlay */}
        <div className="absolute inset-0 pointer-events-none z-10"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 40%, rgb(10,10,15) 85%)',
          }}
        />
        <div className="flex flex-wrap justify-center gap-2 sm:gap-2.5 max-w-4xl mx-auto">
          {apps.length === 0
            ? Array(60).fill(0).map((_, i) => (
                <div
                  key={i}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/5 animate-pulse"
                />
              ))
            : apps.map((app, i) => <AppIcon key={app.id} app={app} index={i} />)}
        </div>
      </div>

      {/* CTA bottom */}
      <div className="text-center mt-12">
        <Link
          href="/browse"
          className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 text-sm transition-colors"
        >
          See all apps <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

function AppIcon({ app, index }: { app: App; index: number }) {
  const category = CATEGORIES.find((c) => c.id === app.category_id);
  const sizes = ['w-12 h-12', 'w-14 h-14', 'w-16 h-16', 'w-14 h-14', 'w-12 h-12'];
  const size = sizes[index % sizes.length];

  return (
    <Link href={`/apps/${app.id}`} title={app.name} className="group relative">
      <div
        className={`${size} rounded-2xl overflow-hidden border border-white/10 group-hover:border-violet-500/50 group-hover:scale-110 transition-all duration-200 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center`}
      >
        {app.screenshot_url ? (
          <img
            src={app.screenshot_url}
            alt={app.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-2xl">{category?.icon ?? '📦'}</span>
        )}
      </div>
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 border border-white/10 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
        {app.name}
      </div>
    </Link>
  );
}
