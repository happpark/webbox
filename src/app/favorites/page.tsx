'use client';

import { useEffect, useState } from 'react';
import { Star, LogIn } from 'lucide-react';
import Link from 'next/link';
import { App } from '@/types';
import { CATEGORIES } from '@/lib/data';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/context/AuthContext';

export default function FavoritesPage() {
  const [apps, setApps] = useState<App[]>([]);
  const [allApps, setAllApps] = useState<App[]>([]);
  const [appsLoading, setAppsLoading] = useState(true);
  const { favorites, toggle, ready } = useFavorites();
  const { user, loading: authLoading, signInWithGoogle } = useAuth();

  useEffect(() => {
    fetch('/api/apps')
      .then((r) => r.json())
      .then((data) => {
        setAllApps(data.apps ?? []);
        setAppsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!ready || appsLoading) return;
    setApps(allApps.filter((a) => favorites.has(a.id)));
  }, [favorites, allApps, ready, appsLoading]);

  const loading = authLoading || !ready || appsLoading;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <Star className="w-7 h-7 text-yellow-400 fill-yellow-400" />
            Favorites
          </h1>
          <p className="text-gray-400">
            {user ? `Signed in as ${user.user_metadata?.full_name ?? user.email}` : 'Sign in to sync across devices'}
          </p>
        </div>
        {!authLoading && !user && (
          <button
            onClick={signInWithGoogle}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Sign in with Google
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {Array(6).fill(0).map((_, i) => (
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
          <Star className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <h3 className="text-white text-xl font-semibold mb-2">No favorites yet</h3>
          <p className="text-gray-500 mb-6">Star apps you love to save them here.</p>
          <Link href="/browse" className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
            Browse Apps
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {apps.map((app) => {
            const category = CATEGORIES.find((c) => c.id === app.category_id);
            const tagline = app.tagline.length > 38 ? app.tagline.slice(0, 38) + '…' : app.tagline;
            return (
              <div key={app.id} className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-white/5 transition-colors group">
                <a href={`/apps/${app.id}`} className="flex items-center gap-2.5 flex-1 min-w-0">
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
                <button
                  onClick={() => toggle(app.id)}
                  className="shrink-0 p-1 rounded-lg text-yellow-400 hover:text-gray-500 transition-colors"
                >
                  <Star className="w-3.5 h-3.5 fill-yellow-400" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
