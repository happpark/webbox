import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { appId } = await req.json();
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'anonymous';

  try {
    // Check if already voted
    const { data: existing } = await supabase
      .from('votes')
      .select('id')
      .eq('app_id', appId)
      .eq('voter_ip', ip)
      .single();

    if (existing) {
      // Unvote
      await supabase.from('votes').delete().eq('app_id', appId).eq('voter_ip', ip);
      await supabase.rpc('decrement_votes', { app_id: appId });
      return NextResponse.json({ voted: false });
    }

    // Vote
    await supabase.from('votes').insert({ app_id: appId, voter_ip: ip });
    await supabase.rpc('increment_votes', { app_id: appId });
    return NextResponse.json({ voted: true });
  } catch {
    return NextResponse.json({ voted: true });
  }
}
