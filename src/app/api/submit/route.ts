import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { supabase } from '@/lib/supabase';
import { runReview } from '@/lib/review';
import { createClient } from '@supabase/supabase-js';

async function getUserFromToken(token: string | null) {
  if (!token) return null;
  try {
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user } } = await client.auth.getUser(token);
    return user;
  } catch { return null; }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, tagline, description, url, screenshot_url, category_id, author_name, author_url, github_url, tags } = body;

  if (!name || !tagline || !url || !category_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Get logged-in user if available
  const token = req.headers.get('authorization')?.replace('Bearer ', '') ?? null;
  const user = await getUserFromToken(token);

  let appId: string | null = null;

  try {
    const { data, error } = await supabase.from('apps').insert({
      name: name.trim(),
      tagline: tagline.trim(),
      description: description?.trim() ?? '',
      url: url.trim(),
      screenshot_url: screenshot_url?.trim() || null,
      category_id: Number(category_id),
      author_name: author_name?.trim() || null,
      author_url: author_url?.trim() || null,
      github_url: github_url?.trim() || null,
      tags: tags ? tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
      votes: 0,
      featured: false,
      approved: false,
      review_status: 'pending',
      author_user_id: user?.id ?? null,
    }).select().single();

    if (error) throw error;
    appId = data.id;
  } catch (err) {
    console.error('Insert failed:', err);
    return NextResponse.json({ success: true, pending: true });
  }

  if (appId) {
    const id = appId;
    after(async () => { await runReview(id); });
  }

  return NextResponse.json({ success: true, appId, message: 'Submitted! Your app is being reviewed automatically.' });
}
