import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

function getUserFromRequest(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  return auth.slice(7);
}

async function verifyUser(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const client = createClient(url, key);
  const { data: { user }, error } = await client.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

export async function GET(req: NextRequest) {
  const token = getUserFromRequest(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await verifyUser(token);
  if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  const sb = getSupabaseAdmin();

  // My apps
  const { data: apps } = await sb
    .from('apps')
    .select('id, name, tagline, url, screenshot_url, category_id, votes, featured, approved, review_status, review_notes, created_at')
    .eq('author_user_id', user.id)
    .order('created_at', { ascending: false });

  if (!apps || apps.length === 0) {
    return NextResponse.json({ apps: [], stats: emptyStats(), viewsByDay: [] });
  }

  const appIds = apps.map((a) => a.id);

  // Total views per app
  const { data: viewCounts } = await sb
    .from('app_views')
    .select('app_id')
    .in('app_id', appIds);

  // Views last 7 days per app
  const since7d = new Date(Date.now() - 7 * 864e5).toISOString();
  const { data: views7d } = await sb
    .from('app_views')
    .select('app_id, viewed_at')
    .in('app_id', appIds)
    .gte('viewed_at', since7d);

  // Views prev 7 days (for trend)
  const since14d = new Date(Date.now() - 14 * 864e5).toISOString();
  const { data: viewsPrev7d } = await sb
    .from('app_views')
    .select('app_id')
    .in('app_id', appIds)
    .gte('viewed_at', since14d)
    .lt('viewed_at', since7d);

  // Views last 30 days, grouped by day (for chart)
  const since30d = new Date(Date.now() - 30 * 864e5).toISOString();
  const { data: views30d } = await sb
    .from('app_views')
    .select('app_id, viewed_at')
    .in('app_id', appIds)
    .gte('viewed_at', since30d);

  // Favorites per app
  const { data: favCounts } = await sb
    .from('favorites')
    .select('app_id')
    .in('app_id', appIds);

  // --- Aggregate ---
  const totalViews = (viewCounts ?? []).length;
  const totalViews7d = (views7d ?? []).length;
  const totalViewsPrev7d = (viewsPrev7d ?? []).length;
  const viewsTrend = totalViewsPrev7d === 0
    ? null
    : Math.round(((totalViews7d - totalViewsPrev7d) / totalViewsPrev7d) * 100);

  const totalVotes = apps.reduce((s, a) => s + (a.votes ?? 0), 0);
  const totalFavorites = (favCounts ?? []).length;

  // Per-app stats
  const viewCountMap: Record<string, number> = {};
  const views7dMap: Record<string, number> = {};
  const favMap: Record<string, number> = {};
  for (const v of viewCounts ?? []) viewCountMap[v.app_id] = (viewCountMap[v.app_id] ?? 0) + 1;
  for (const v of views7d ?? []) views7dMap[v.app_id] = (views7dMap[v.app_id] ?? 0) + 1;
  for (const f of favCounts ?? []) favMap[f.app_id] = (favMap[f.app_id] ?? 0) + 1;

  // Per-app sparklines (last 7 days by day)
  const sparklineMap: Record<string, number[]> = {};
  for (const appId of appIds) {
    const days = Array(7).fill(0);
    for (const v of views7d ?? []) {
      if (v.app_id !== appId) continue;
      const daysAgo = Math.floor((Date.now() - new Date(v.viewed_at).getTime()) / 864e5);
      if (daysAgo < 7) days[6 - daysAgo]++;
    }
    sparklineMap[appId] = days;
  }

  const appsWithStats = apps.map((a) => ({
    ...a,
    total_views: viewCountMap[a.id] ?? 0,
    views_7d: views7dMap[a.id] ?? 0,
    favorites: favMap[a.id] ?? 0,
    sparkline: sparklineMap[a.id] ?? Array(7).fill(0),
  }));

  // Daily views chart (last 30 days, all apps combined)
  const viewsByDay: { date: string; views: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 864e5);
    const dateStr = d.toISOString().slice(0, 10);
    viewsByDay.push({ date: dateStr, views: 0 });
  }
  for (const v of views30d ?? []) {
    const dateStr = new Date(v.viewed_at).toISOString().slice(0, 10);
    const entry = viewsByDay.find((d) => d.date === dateStr);
    if (entry) entry.views++;
  }

  return NextResponse.json({
    apps: appsWithStats,
    stats: {
      totalViews,
      totalViews7d,
      viewsTrend,
      totalVotes,
      totalFavorites,
      approvedCount: apps.filter((a) => a.review_status === 'approved').length,
      pendingCount: apps.filter((a) => a.review_status === 'pending').length,
      rejectedCount: apps.filter((a) => a.review_status === 'rejected').length,
    },
    viewsByDay,
  });
}

function emptyStats() {
  return {
    totalViews: 0, totalViews7d: 0, viewsTrend: null,
    totalVotes: 0, totalFavorites: 0,
    approvedCount: 0, pendingCount: 0, rejectedCount: 0,
  };
}
