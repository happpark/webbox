import Anthropic from '@anthropic-ai/sdk';
import { getSupabaseAdmin } from './supabase';
import { CATEGORIES } from './data';

const client = new Anthropic();

async function checkUrlReachable(url: string): Promise<{ ok: boolean; status?: number; error?: string }> {
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(8000), redirect: 'follow' });
    return { ok: res.status < 400, status: res.status };
  } catch {
    try {
      const res = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(8000), redirect: 'follow' });
      return { ok: res.status < 400, status: res.status };
    } catch (e2) {
      return { ok: false, error: String(e2) };
    }
  }
}

export async function runReview(appId: string): Promise<void> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('[Review] ANTHROPIC_API_KEY not set');
    return;
  }

  const sb = getSupabaseAdmin();

  const { data: app, error } = await sb.from('apps').select('*').eq('id', appId).single();
  if (error || !app) {
    console.error('[Review] App not found:', appId);
    return;
  }

  const urlCheck = await checkUrlReachable(app.url);

  const { data: existing } = await sb.from('apps').select('name, url').eq('approved', true);
  const existingList = (existing ?? []).map((a: { name: string; url: string }) => `${a.name} (${a.url})`);

  const categoryName = CATEGORIES.find((c) => c.id === app.category_id)?.name ?? 'Unknown';

  const prompt = `You are reviewing a web app submission for "Webbox" — a curated directory of web apps built by indie makers.

## Submission
- **Name**: ${app.name}
- **Tagline**: ${app.tagline}
- **Description**: ${app.description || '(none)'}
- **URL**: ${app.url}
- **Category**: ${categoryName}
- **Tags**: ${app.tags?.join(', ') || '(none)'}
- **Author**: ${app.author_name || 'anonymous'}
- **GitHub**: ${app.github_url || '(none)'}
- **URL reachability**: ${urlCheck.ok ? `✅ OK (HTTP ${urlCheck.status})` : `❌ Not reachable — ${urlCheck.error ?? `HTTP ${urlCheck.status}`}`}

## Existing approved apps (duplicate check)
${existingList.slice(0, 50).join('\n') || '(none yet)'}

## Criteria
1. URL reachable
2. Real interactive web app (not just a landing page or broken link)
3. Not spam or SEO garbage
4. Appropriate content (no adult, gambling, scam, malware)
5. Meaningful name/tagline
6. Category fits
7. Not a duplicate

Respond ONLY with this JSON:
{
  "approved": true or false,
  "score": 0-100,
  "reasons": ["reason 1", "reason 2"],
  "rejection_reason": "short message if rejected, null if approved",
  "summary": "1-2 sentence summary of what this app does"
}

Be lenient — approve if the app seems real and appropriate. Only reject clear red flags.`;

  let decision: { approved: boolean; score: number; reasons: string[]; rejection_reason: string | null; summary: string };

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    decision = JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error('[Review] Claude call failed:', e);
    await sb.from('apps').update({ review_status: 'pending', review_notes: `Auto-review error: ${String(e)}` }).eq('id', appId);
    return;
  }

  const notes = [
    `Score: ${decision.score}/100`,
    `Summary: ${decision.summary}`,
    `URL: ${urlCheck.ok ? `OK (${urlCheck.status})` : `FAILED — ${urlCheck.error ?? urlCheck.status}`}`,
    ...decision.reasons,
    decision.rejection_reason ? `Rejection: ${decision.rejection_reason}` : null,
  ].filter(Boolean).join('\n');

  await sb.from('apps').update({
    approved: decision.approved,
    review_status: decision.approved ? 'approved' : 'rejected',
    review_notes: notes,
  }).eq('id', appId);

  console.log(`[Review] "${app.name}" → ${decision.approved ? '✅ APPROVED' : '❌ REJECTED'} (${decision.score}/100)`);
}
