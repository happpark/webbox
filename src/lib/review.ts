import Anthropic from '@anthropic-ai/sdk';
import { getSupabaseAdmin } from './supabase';
import { CATEGORIES } from './data';

const client = new Anthropic();

// ── Security helpers ────────────────────────────────────────────────────────

const SUSPICIOUS_TLDS = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top', '.click', '.download', '.zip', '.mov'];
const SUSPICIOUS_PATTERNS = [
  /^https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/,  // raw IP
  /[<>'"]/,                                              // injection chars in URL
  /%[0-9a-f]{2}%[0-9a-f]{2}%[0-9a-f]{2}/i,            // heavy URL encoding
  /\.exe$|\.dmg$|\.apk$|\.bat$|\.ps1$/i,               // direct executable
];

function checkUrlSecurity(url: string): { safe: boolean; flags: string[] } {
  const flags: string[] = [];

  try {
    const parsed = new URL(url);

    // Must be HTTPS
    if (parsed.protocol !== 'https:') {
      flags.push('Not using HTTPS — insecure connection');
    }

    // Suspicious TLD
    const tldMatch = SUSPICIOUS_TLDS.find((tld) => parsed.hostname.endsWith(tld));
    if (tldMatch) flags.push(`Suspicious TLD: ${tldMatch}`);

    // Raw IP address
    if (SUSPICIOUS_PATTERNS[0].test(url)) flags.push('URL points to raw IP address (no domain)');

    // Injection chars
    if (SUSPICIOUS_PATTERNS[1].test(parsed.pathname + parsed.search)) flags.push('URL contains suspicious characters');

    // Heavy encoding
    if (SUSPICIOUS_PATTERNS[2].test(url)) flags.push('URL contains suspicious percent-encoding');

    // Direct executable
    if (SUSPICIOUS_PATTERNS[3].test(parsed.pathname)) flags.push('URL points directly to an executable file');

    // Excessively long URL
    if (url.length > 300) flags.push('Unusually long URL');

  } catch {
    flags.push('Malformed URL — could not parse');
  }

  return { safe: flags.length === 0, flags };
}

async function checkUrlReachable(url: string): Promise<{
  ok: boolean;
  status?: number;
  finalUrl?: string;
  error?: string;
}> {
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(8000), redirect: 'follow' });
    return { ok: res.status < 400, status: res.status, finalUrl: res.url };
  } catch {
    try {
      const res = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(8000), redirect: 'follow' });
      return { ok: res.status < 400, status: res.status, finalUrl: res.url };
    } catch (e2) {
      return { ok: false, error: String(e2) };
    }
  }
}

async function checkGoogleSafeBrowsing(url: string): Promise<{ safe: boolean; threats: string[] }> {
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
  if (!apiKey) return { safe: true, threats: [] }; // skip if not configured

  try {
    const res = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: { clientId: 'webbox', clientVersion: '1.0' },
          threatInfo: {
            threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
            platformTypes: ['ANY_PLATFORM'],
            threatEntryTypes: ['URL'],
            threatEntries: [{ url }],
          },
        }),
        signal: AbortSignal.timeout(5000),
      }
    );
    const data = await res.json();
    if (data.matches && data.matches.length > 0) {
      const threats = data.matches.map((m: { threatType: string }) => m.threatType);
      return { safe: false, threats };
    }
  } catch (e) {
    console.error('[Review] Safe Browsing check failed:', e);
  }
  return { safe: true, threats: [] };
}

// ── Main review ─────────────────────────────────────────────────────────────

export async function runReview(appId: string): Promise<void> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('[Review] ANTHROPIC_API_KEY not set');
    return;
  }

  const sb = getSupabaseAdmin();
  const { data: app, error } = await sb.from('apps').select('*').eq('id', appId).single();
  if (error || !app) { console.error('[Review] App not found:', appId); return; }

  // Run all checks in parallel
  const [urlCheck, safeBrowsing, { data: existing }] = await Promise.all([
    checkUrlReachable(app.url),
    checkGoogleSafeBrowsing(app.url),
    sb.from('apps').select('name, url').eq('approved', true),
  ]);

  const securityCheck = checkUrlSecurity(app.url);

  // Redirect hijack detection: submitted URL redirects to completely different domain
  let redirectFlag = '';
  if (urlCheck.finalUrl && urlCheck.finalUrl !== app.url) {
    try {
      const submittedHost = new URL(app.url).hostname.replace(/^www\./, '');
      const finalHost = new URL(urlCheck.finalUrl).hostname.replace(/^www\./, '');
      if (!finalHost.endsWith(submittedHost) && !submittedHost.endsWith(finalHost)) {
        redirectFlag = `URL redirects to different domain: ${urlCheck.finalUrl}`;
      }
    } catch { /* ignore */ }
  }

  // Hard reject on critical security flags — skip Claude
  const criticalFlags = [
    ...(!safeBrowsing.safe ? [`⚠️ Google Safe Browsing: ${safeBrowsing.threats.join(', ')}`] : []),
    ...(redirectFlag ? [`⚠️ ${redirectFlag}`] : []),
    ...(securityCheck.flags.filter((f) =>
      f.includes('raw IP') || f.includes('executable') || f.includes('Malformed')
    ).map((f) => `⚠️ ${f}`)),
  ];

  if (criticalFlags.length > 0) {
    const notes = ['Score: 0/100', 'AUTO-REJECTED: Critical security flags', ...criticalFlags].join('\n');
    await sb.from('apps').update({ approved: false, review_status: 'rejected', review_notes: notes }).eq('id', appId);
    console.log(`[Review] "${app.name}" → ❌ SECURITY REJECTED\n${criticalFlags.join('\n')}`);
    return;
  }

  const existingList = (existing ?? []).map((a: { name: string; url: string }) => `${a.name} (${a.url})`);
  const categoryName = CATEGORIES.find((c) => c.id === app.category_id)?.name ?? 'Unknown';

  const securitySummary = [
    `HTTPS: ${app.url.startsWith('https') ? '✅' : '❌'}`,
    `Safe Browsing: ${safeBrowsing.safe ? '✅ Clean' : `❌ ${safeBrowsing.threats.join(', ')}`}`,
    `URL flags: ${securityCheck.flags.length === 0 ? '✅ None' : securityCheck.flags.join(', ')}`,
    `Redirect: ${redirectFlag || '✅ None'}`,
  ].join('\n');

  const prompt = `You are reviewing a web app submission for "Webbox" — a curated directory of indie-made web apps.

## Submission
- **Name**: ${app.name}
- **Tagline**: ${app.tagline}
- **Description**: ${app.description || '(none)'}
- **URL**: ${app.url}
- **Category**: ${categoryName}
- **Tags**: ${app.tags?.join(', ') || '(none)'}
- **Author**: ${app.author_name || 'anonymous'}
- **GitHub**: ${app.github_url || '(none)'}

## Automated checks
- **Reachability**: ${urlCheck.ok ? `✅ OK (HTTP ${urlCheck.status})` : `❌ Failed — ${urlCheck.error ?? `HTTP ${urlCheck.status}`}`}
${securitySummary}

## Existing approved apps (duplicate check)
${existingList.slice(0, 50).join('\n') || '(none yet)'}

## Review criteria
### Quality
1. URL is reachable
2. Real interactive web app (not just a landing page or placeholder)
3. Not spam / SEO content farm
4. Meaningful, descriptive name and tagline
5. Category fits the app
6. Not a duplicate of an existing listing

### Security
7. No phishing indicators (fake login pages, impersonating known brands)
8. No social engineering (false urgency, fake prizes, "you've been selected")
9. No crypto scams / fake investment / get-rich-quick schemes
10. No drive-by downloads or forced installs
11. No data harvesting without clear consent
12. No malware, adware, or browser hijacking patterns in description
13. Not a redirect/shortlink to a suspicious destination

Respond ONLY with this JSON (no other text):
{
  "approved": true or false,
  "score": 0-100,
  "security_score": 0-100,
  "quality_score": 0-100,
  "reasons": ["reason 1", "reason 2"],
  "security_flags": ["flag 1"] or [],
  "rejection_reason": "short human-readable reason if rejected, null if approved",
  "summary": "1-2 sentence summary of what this app does"
}

Approve if the app seems legitimate, safe, and real. Reject if there are clear quality or security red flags.`;

  let decision: {
    approved: boolean;
    score: number;
    security_score: number;
    quality_score: number;
    reasons: string[];
    security_flags: string[];
    rejection_reason: string | null;
    summary: string;
  };

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 768,
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
    `Score: ${decision.score}/100 (Quality: ${decision.quality_score}/100, Security: ${decision.security_score}/100)`,
    `Summary: ${decision.summary}`,
    `── Automated checks ──`,
    `Reachability: ${urlCheck.ok ? `OK (${urlCheck.status})` : `FAILED`}`,
    securitySummary,
    `── Claude analysis ──`,
    ...decision.reasons,
    ...(decision.security_flags.length > 0 ? [`Security flags: ${decision.security_flags.join(', ')}`] : []),
    decision.rejection_reason ? `Rejection: ${decision.rejection_reason}` : null,
  ].filter(Boolean).join('\n');

  await sb.from('apps').update({
    approved: decision.approved,
    review_status: decision.approved ? 'approved' : 'rejected',
    review_notes: notes,
  }).eq('id', appId);

  console.log(`[Review] "${app.name}" → ${decision.approved ? '✅ APPROVED' : '❌ REJECTED'} (${decision.score}/100, security: ${decision.security_score}/100)`);
}
