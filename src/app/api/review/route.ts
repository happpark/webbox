import { NextRequest, NextResponse } from 'next/server';
import { runReview } from '@/lib/review';

export async function POST(req: NextRequest) {
  const { appId } = await req.json();
  if (!appId) return NextResponse.json({ error: 'Missing appId' }, { status: 400 });

  await runReview(appId);
  return NextResponse.json({ ok: true });
}
