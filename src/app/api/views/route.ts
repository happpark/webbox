import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { appId } = await req.json();
  if (!appId) return NextResponse.json({ ok: false }, { status: 400 });

  try {
    const sb = getSupabaseAdmin();
    await sb.from('app_views').insert({ app_id: appId });
  } catch (e) {
    console.error('[Views]', e);
  }

  return NextResponse.json({ ok: true });
}
