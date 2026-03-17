import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    try {
      const sb = getSupabase();
      await sb.auth.exchangeCodeForSession(code);
    } catch (e) {
      console.error(e);
    }
  }

  return NextResponse.redirect(`${origin}/`);
}
