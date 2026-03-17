'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getSupabase } from '@/lib/supabase';

const LS_KEY = 'webbox_favorites';

export function useFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  // Load favorites
  useEffect(() => {
    if (user) {
      // Load from Supabase
      try {
        const sb = getSupabase();
        sb.from('favorites')
          .select('app_id')
          .eq('user_id', user.id)
          .then(({ data }) => {
            const ids = (data ?? []).map((r: { app_id: string }) => r.app_id);
            // Merge any localStorage favorites not yet synced
            const local: string[] = JSON.parse(localStorage.getItem(LS_KEY) ?? '[]');
            const merged = Array.from(new Set([...ids, ...local]));
            if (local.length > 0) {
              // Upsert local favorites to Supabase then clear localStorage
              const rows = local.map((app_id) => ({ user_id: user.id, app_id }));
              sb.from('favorites').upsert(rows, { onConflict: 'user_id,app_id' }).then(() => {
                localStorage.removeItem(LS_KEY);
              });
            }
            setFavorites(new Set(merged));
            setReady(true);
          });
      } catch {
        setReady(true);
      }
    } else {
      // Load from localStorage
      const local: string[] = JSON.parse(localStorage.getItem(LS_KEY) ?? '[]');
      setFavorites(new Set(local));
      setReady(true);
    }
  }, [user]);

  const toggle = useCallback(async (appId: string) => {
    const isFav = favorites.has(appId);
    setFavorites((prev) => {
      const next = new Set(prev);
      if (isFav) next.delete(appId);
      else next.add(appId);
      return next;
    });

    if (user) {
      try {
        const sb = getSupabase();
        if (isFav) {
          await sb.from('favorites').delete().eq('user_id', user.id).eq('app_id', appId);
        } else {
          await sb.from('favorites').upsert({ user_id: user.id, app_id: appId }, { onConflict: 'user_id,app_id' });
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      // Persist to localStorage
      setFavorites((current) => {
        localStorage.setItem(LS_KEY, JSON.stringify([...current]));
        return current;
      });
    }
  }, [user, favorites]);

  return { favorites, toggle, ready };
}
