'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Eye, ThumbsUp, Star, Clock, CheckCircle, XCircle, AlertCircle,
  TrendingUp, TrendingDown, Minus, ExternalLink, BarChart2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getSupabase } from '@/lib/supabase';
import { CATEGORIES } from '@/lib/data';
import { timeAgo } from '@/lib/utils';

interface AppStat {
  id: string;
  name: string;
  tagline: string;
  url: string;
  screenshot_url: string | null;
  category_id: number;
  votes: number;
  featured: boolean;
  approved: boolean;
  review_status: 'pending' | 'approved' | 'rejected';
  review_notes: string | null;
  created_at: string;
  total_views: number;
  views_7d: number;
  favorites: number;
  sparkline: number[];
}

interface Stats {
  totalViews: number;
  totalViews7d: number;
  viewsTrend: number | null;
  totalVotes: number;
  totalFavorites: number;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
}

interface DashboardData {
  apps: AppStat[];
  stats: Stats;
  viewsByDay: { date: string; views: number }[];
}

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  const w = 56, h = 24;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - (v / max) * h;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={pts} fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function StatusBadge({ status }: { status: AppStat['review_status'] }) {
  if (status === 'approved') return (
    <span className="inline-flex items-center gap-1 text-xs bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full">
      <CheckCircle className="w-3 h-3" /> Approved
    </span>
  );
  if (status === 'rejected') return (
    <span className="inline-flex items-center gap-1 text-xs bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full">
      <XCircle className="w-3 h-3" /> Rejected
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-yellow-500/15 text-yellow-400 px-2 py-0.5 rounded-full">
      <Clock className="w-3 h-3" /> Pending
    </span>
  );
}

function StatCard({
  icon: Icon, label, value, sub, trend,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  trend?: number | null;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 bg-violet-500/15 rounded-xl flex items-center justify-center">
          <Icon className="w-4.5 h-4.5 text-violet-400" />
        </div>
        {trend !== undefined && trend !== null && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </span>
        )}
        {trend === null && (
          <span className="flex items-center gap-0.5 text-xs text-gray-600">
            <Minus className="w-3 h-3" /> —
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-white">{value.toLocaleString()}</p>
      <p className="text-gray-500 text-sm mt-0.5">{label}</p>
      {sub && <p className="text-gray-600 text-xs mt-1">{sub}</p>}
    </div>
  );
}

const CHART_TOOLTIP_STYLE = {
  backgroundColor: '#0a0a0a',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  color: '#fff',
  fontSize: 12,
};

export default function MyAppsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/');
      return;
    }
    (async () => {
      const { data: session } = await getSupabase().auth.getSession();
      const token = session.session?.access_token;
      if (!token) return;
      const res = await fetch('/api/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setData(await res.json());
      }
      setLoading(false);
    })();
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 animate-pulse space-y-6">
        <div className="h-8 bg-white/5 rounded w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => <div key={i} className="h-28 bg-white/5 rounded-2xl" />)}
        </div>
        <div className="h-52 bg-white/5 rounded-2xl" />
      </div>
    );
  }

  if (!data) return null;
  const { apps, stats, viewsByDay } = data;

  const chartData = viewsByDay.map((d) => ({
    date: d.date.slice(5),
    views: d.views,
  }));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">My Apps</h1>
          <p className="text-gray-500 text-sm mt-1">Analytics for your submitted apps</p>
        </div>
        <Link
          href="/submit"
          className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          + Submit App
        </Link>
      </div>

      {apps.length === 0 ? (
        <div className="text-center py-24 text-gray-500">
          <BarChart2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium text-gray-400">No apps yet</p>
          <p className="text-sm mt-1 mb-6">Submit your first app to see analytics here.</p>
          <Link href="/submit" className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors">
            Submit App
          </Link>
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard icon={Eye} label="Total Views" value={stats.totalViews} sub={`${stats.totalViews7d} this week`} trend={stats.viewsTrend} />
            <StatCard icon={ThumbsUp} label="Total Votes" value={stats.totalVotes} />
            <StatCard icon={Star} label="Favorites" value={stats.totalFavorites} />
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex items-start gap-2 mb-3">
                <div className="w-9 h-9 bg-violet-500/15 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-4.5 h-4.5 text-violet-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{apps.length}</p>
              <p className="text-gray-500 text-sm mt-0.5">Apps submitted</p>
              <div className="flex gap-2 mt-2">
                <span className="text-xs text-green-400">{stats.approvedCount} live</span>
                <span className="text-xs text-yellow-400">{stats.pendingCount} pending</span>
                {stats.rejectedCount > 0 && <span className="text-xs text-red-400">{stats.rejectedCount} rejected</span>}
              </div>
            </div>
          </div>

          {/* Views chart */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-white font-semibold">Views over time</h2>
                <p className="text-gray-500 text-xs mt-0.5">Last 30 days · all apps combined</p>
              </div>
              <div className="text-right">
                <p className="text-white font-bold text-lg">{stats.totalViews7d.toLocaleString()}</p>
                <p className="text-gray-500 text-xs">this week</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} interval={4} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
                <Area type="monotone" dataKey="views" stroke="#7c3aed" strokeWidth={2} fill="url(#viewsGrad)" dot={false} activeDot={{ r: 4, fill: '#7c3aed' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Per-app table */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10">
              <h2 className="text-white font-semibold">Your Apps</h2>
            </div>
            <div className="divide-y divide-white/5">
              {apps.map((app) => {
                const cat = CATEGORIES.find((c) => c.id === app.category_id);
                return (
                  <div key={app.id} className="px-6 py-4 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-start gap-4">
                      {/* Thumbnail */}
                      <div className="w-12 h-12 shrink-0 rounded-xl overflow-hidden bg-gray-800 flex items-center justify-center">
                        {app.screenshot_url ? (
                          <img src={app.screenshot_url} alt={app.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl opacity-40">{cat?.icon ?? '📦'}</span>
                        )}
                      </div>

                      {/* Main info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-white font-medium truncate">{app.name}</span>
                          <StatusBadge status={app.review_status} />
                          {app.featured && (
                            <span className="text-xs bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full">Featured</span>
                          )}
                        </div>
                        <p className="text-gray-500 text-sm truncate">{app.tagline}</p>
                        {app.review_status === 'rejected' && app.review_notes && (
                          <p className="text-red-400/70 text-xs mt-1 flex items-start gap-1">
                            <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                            {app.review_notes}
                          </p>
                        )}
                        <p className="text-gray-700 text-xs mt-1">{timeAgo(app.created_at)}</p>
                      </div>

                      {/* Stats */}
                      <div className="hidden sm:flex items-center gap-6 shrink-0">
                        <div className="text-center">
                          <p className="text-white text-sm font-semibold">{app.total_views.toLocaleString()}</p>
                          <p className="text-gray-600 text-xs">views</p>
                        </div>
                        <div className="text-center">
                          <p className="text-white text-sm font-semibold">{app.views_7d}</p>
                          <p className="text-gray-600 text-xs">7d views</p>
                        </div>
                        <div className="text-center">
                          <p className="text-white text-sm font-semibold">{app.votes}</p>
                          <p className="text-gray-600 text-xs">votes</p>
                        </div>
                        <div className="text-center">
                          <p className="text-white text-sm font-semibold">{app.favorites}</p>
                          <p className="text-gray-600 text-xs">saves</p>
                        </div>
                        <Sparkline data={app.sparkline} />
                        <a
                          href={app.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-white transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>

                    {/* Mobile stats */}
                    <div className="flex sm:hidden items-center gap-4 mt-3 text-xs text-gray-500">
                      <span><span className="text-white font-medium">{app.total_views}</span> views</span>
                      <span><span className="text-white font-medium">{app.votes}</span> votes</span>
                      <span><span className="text-white font-medium">{app.favorites}</span> saves</span>
                      <a href={app.url} target="_blank" rel="noopener noreferrer" className="ml-auto text-gray-600 hover:text-white">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
