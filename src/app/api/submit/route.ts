import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, tagline, description, url, screenshot_url, category_id, author_name, author_url, github_url, tags } = body;

  if (!name || !tagline || !url || !category_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

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
    }).select().single();

    if (error) throw error;
    appId = data.id;
  } catch (err) {
    console.error('Insert failed:', err);
    return NextResponse.json({ success: true, pending: true });
  }

  // Trigger async review (fire and forget — don't await)
  if (appId) {
    const origin = req.headers.get('origin') ?? req.nextUrl.origin;
    fetch(`${origin}/api/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appId }),
    }).catch((e) => console.error('Review trigger failed:', e));
  }

  return NextResponse.json({ success: true, appId, message: 'Submitted! Your app is being reviewed automatically.' });
}
