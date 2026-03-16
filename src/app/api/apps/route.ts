import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { SEED_APPS, CATEGORIES } from '@/lib/data';
import { App } from '@/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const sort = searchParams.get('sort') ?? 'trending';
  const q = searchParams.get('q');
  const featured = searchParams.get('featured');

  try {
    let query = supabase
      .from('apps')
      .select('*, category:categories(*)')
      .eq('approved', true);

    if (category) {
      const cat = CATEGORIES.find((c) => c.slug === category);
      if (cat) query = query.eq('category_id', cat.id);
    }

    if (q) {
      query = query.or(`name.ilike.%${q}%,tagline.ilike.%${q}%,description.ilike.%${q}%`);
    }

    if (featured === 'true') {
      query = query.eq('featured', true);
    }

    if (sort === 'new') {
      query = query.order('created_at', { ascending: false });
    } else {
      query = query.order('votes', { ascending: false });
    }

    const { data, error } = await query.limit(50);

    if (error) throw error;

    return NextResponse.json({ apps: data });
  } catch {
    // Supabase not configured, return seed data
    let apps = SEED_APPS.map((app, i) => ({
      ...app,
      id: `seed-${i}`,
      created_at: new Date(Date.now() - i * 86400000).toISOString(),
      category: CATEGORIES.find((c) => c.id === app.category_id),
    })) as App[];

    if (category) {
      const cat = CATEGORIES.find((c) => c.slug === category);
      if (cat) apps = apps.filter((a) => a.category_id === cat.id);
    }

    if (q) {
      const lower = q.toLowerCase();
      apps = apps.filter(
        (a) =>
          a.name.toLowerCase().includes(lower) ||
          a.tagline.toLowerCase().includes(lower)
      );
    }

    if (featured === 'true') apps = apps.filter((a) => a.featured);

    if (sort === 'new') {
      apps.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else {
      apps.sort((a, b) => b.votes - a.votes);
    }

    return NextResponse.json({ apps });
  }
}
