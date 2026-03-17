import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getSupabase } from '@/lib/supabase';
import { CATEGORIES } from '@/lib/data';

const client = new Anthropic();

async function checkUrlReachable(url: string): Promise<{ ok: boolean; status?: number; error?: string }> {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(8000),
      redirect: 'follow',
    });
    return { ok: res.status < 400, status: res.status };
  } catch (e) {
    // HEAD might be blocked — try GET
    try {
      const res = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(8000),
        redirect: 'follow',
      });
      return { ok: res.status < 400, status: res.status };
    } catch (e2) {
      return { ok: false, error: String(e2) };
    }
  }
}

async function getExistingAppNames(): Promise<string[]> {
  try {
    const sb = getSupabase();
    const { data } = await sb.from('apps').select('name, url').eq('approved', true);
    return (data ?? []).map((a: { name: string; url: string }) => `${a.name} (${a.url})`);
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  const { appId } = await req.json();
  if (!appId) return NextResponse.json({ error: 'Missing appId' }, { status: 400 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
  }

  let sb;
  try {
    sb = getSupabase();
  } catch {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  // Fetch the submission
  const { data: app, error } = await sb.from('apps').select('*').eq('id', appId).single();
  if (error || !app) return NextResponse.json({ error: 'App not found' }, { status: 404 });

  // 1. URL reachability check
  const urlCheck = await checkUrlReachable(app.url);

  // 2. Existing apps for duplicate check
  const existingApps = await getExistingAppNames();

  // 3. Category name
  const categoryName = CATEGORIES.find((c) => c.id === app.category_id)?.name ?? 'Unknown';

  // 4. Claude review
  const prompt = `You are reviewing a web app submission for "Webbox" — a curated directory of web apps built by indie makers.

## Submission details
- **Name**: ${app.name}
- **Tagline**: ${app.tagline}
- **Description**: ${app.description || '(not provided)'}
- **URL**: ${app.url}
- **Category selected**: ${categoryName}
- **Tags**: ${app.tags?.join(', ') || '(none)'}
- **Author**: ${app.author_name || '(anonymous)'}
- **GitHub**: ${app.github_url || '(none)'}
- **URL reachability**: ${urlCheck.ok ? `✅ Reachable (HTTP ${urlCheck.status})` : `❌ Not reachable — ${urlCheck.error ?? `HTTP ${urlCheck.status}`}`}

## Already approved apps (for duplicate detection)
${existingApps.length > 0 ? existingApps.slice(0, 50).join('\n') : '(none yet)'}

## Review criteria — evaluate each:
1. **URL reachable**: Is the app URL actually accessible?
2. **Real web app**: Is this a genuine interactive web app (not a landing page only, not a broken link, not a placeholder)?
3. **Not spam**: Is the submission free from spam, SEO garbage, or promotional nonsense?
4. **Appropriate content**: No adult content, gambling, scams, malware, or illegal content?
5. **Description quality**: Is the name/tagline meaningful and descriptive (not just "My App" or "cool thing")?
6. **Category fit**: Does the selected category (${categoryName}) reasonably match the app?
7. **Not duplicate**: Is this a new app not already in the directory?

## Decision
Respond in this exact JSON format:
{
  "approved": true or false,
  "score": 0-100,
  "reasons": ["reason 1", "reason 2"],
  "rejection_reason": "short human-readable rejection message if rejected, null if approved",
  "suggested_category": "category name if the selected one is wrong, null if correct",
  "summary": "1-2 sentence summary of what this app does"
}

Be reasonably lenient — if the URL is reachable and the app seems real and appropriate, approve it. Only reject if there are clear red flags.`;

  let decision: {
    approved: boolean;
    score: number;
    reasons: string[];
    rejection_reason: string | null;
    suggested_category: string | null;
    summary: string;
  };

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    decision = JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error('Claude review failed:', e);
    // If Claude fails, leave as pending for manual review
    await sb.from('apps').update({
      review_status: 'pending',
      review_notes: `Auto-review failed: ${String(e)}`,
    }).eq('id', appId);
    return NextResponse.json({ status: 'pending', error: 'Review service unavailable' });
  }

  // Update the app with review result
  const reviewNotes = [
    `Score: ${decision.score}/100`,
    `Summary: ${decision.summary}`,
    `URL check: ${urlCheck.ok ? 'OK' : 'FAILED'}`,
    ...decision.reasons,
    decision.rejection_reason ? `Rejection reason: ${decision.rejection_reason}` : null,
    decision.suggested_category ? `Suggested category: ${decision.suggested_category}` : null,
  ].filter(Boolean).join('\n');

  await sb.from('apps').update({
    approved: decision.approved,
    review_status: decision.approved ? 'approved' : 'rejected',
    review_notes: reviewNotes,
  }).eq('id', appId);

  console.log(`[Review] App "${app.name}" (${appId}): ${decision.approved ? '✅ APPROVED' : '❌ REJECTED'} — score ${decision.score}/100`);

  return NextResponse.json({
    approved: decision.approved,
    score: decision.score,
    review_notes: reviewNotes,
  });
}
