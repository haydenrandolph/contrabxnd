import { NextResponse } from 'next/server';
import { cronGuard } from '@/lib/audit-guards';
import Anthropic from '@anthropic-ai/sdk';
import { createAdminClient } from '@/lib/supabase/server';
import { withDailyJobLease } from '@/lib/job-lease';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.contrabxnd.io';

async function fetchInternal(path: string, signal: AbortSignal) {
  const res = await fetch(`${BASE_URL}${path}`, { cache: 'no-store', signal: AbortSignal.any([signal, AbortSignal.timeout(10_000)]) });
  if (!res.ok) throw new Error('Internal data unavailable');
  return res.json();
}

export async function GET(request: Request) {
  const denied = cronGuard(request);
  if (denied) return denied;

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
  }

  try {
    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    return await withDailyJobLease(supabase, 'market-brief', async today => {
      const { data: existing, error: lookupError } = await supabase
        .from('market_briefs')
        .select('id')
        .eq('date', today)
        .maybeSingle();

      if (lookupError) throw new Error('Brief lookup failed');
      if (existing) {
        return NextResponse.json({ status: 'already_exists', date: today });
      }

      // Fetch all signal data
      const [signal, liquidity, fedwatch, etf, polymarket, fearGreed, slr, price] =
        await Promise.all([
          fetchInternal('/api/signal', request.signal),
          fetchInternal('/api/liquidity', request.signal),
          fetchInternal('/api/fedwatch', request.signal),
          fetchInternal('/api/etf-flows', request.signal),
          fetchInternal('/api/polymarket', request.signal),
          fetchInternal('/api/fear-greed', request.signal),
          fetchInternal('/api/slr', request.signal),
          fetchInternal('/api/price', request.signal),
        ]);

      const signalData = { signal, liquidity, fedwatch, etf, polymarket, fearGreed, slr, price };

      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 10_000, maxRetries: 0 });

      const prompt = `You are the Contrabxnd Analyst generating the daily Bitcoin Intelligence Brief for ${today}.

LIVE DATA:
${JSON.stringify(signalData, null, 2)}

Generate a structured intelligence brief. Respond with ONLY valid JSON (no markdown, no code fences) in this exact format:

{
  "headline": "One sharp sentence summarizing today's signal (max 100 chars)",
  "summary": "2-3 sentence executive summary of market conditions and what the data implies. Reference specific numbers.",
  "sections": [
    {
      "title": "Signal Overview",
      "body": "Analysis of the composite Contrabxnd Score and what it means. Reference the score value and key drivers."
    },
    {
      "title": "Macro Liquidity",
      "body": "Net liquidity trend, Fed balance sheet, TGA, RRP. What the 13-week momentum tells us."
    },
    {
      "title": "Rate Expectations",
      "body": "FedWatch probabilities for the next FOMC meeting. What the market is pricing."
    },
    {
      "title": "Institutional Flow",
      "body": "ETF flow data — ARKB, IBIT. What institutional demand looks like."
    },
    {
      "title": "Market Sentiment",
      "body": "Fear & Greed, Polymarket prediction markets. What the crowd thinks."
    },
    {
      "title": "Outlook",
      "body": "What this all means together. Key levels to watch. What would change the picture."
    }
  ]
}

Rules:
- Be direct and data-driven. No fluff, no emojis.
- Reference specific numbers from the data.
- If a data source is null/unavailable, acknowledge it briefly and move on.
- Never give financial advice. Frame as analysis.
- Each section body should be 2-4 sentences max.
- The headline should be punchy and specific.`;

      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        messages: [
          { role: 'user', content: prompt },
          { role: 'assistant', content: '{' },
        ],
      }, { signal: request.signal });

      const rawText = response.content[0].type === 'text' ? response.content[0].text : '';
      const text = ('{' + rawText).replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      const brief = JSON.parse(text);
      if (!brief || typeof brief.headline !== 'string' || !brief.headline.trim() ||
        typeof brief.summary !== 'string' || !brief.summary.trim() ||
        !Array.isArray(brief.sections) || brief.sections.length === 0 ||
        brief.sections.some((section: { title?: unknown; body?: unknown } | null) =>
          !section || typeof section.title !== 'string' || typeof section.body !== 'string')) {
        return NextResponse.json({ error: 'Invalid brief generated' }, { status: 502 });
      }

      const score = signal?.score ?? null;
      const scoreLabel = signal?.label ?? null;

      const { error } = await supabase.from('market_briefs').upsert(
        {
          date: today,
          score,
          score_label: scoreLabel,
          headline: brief.headline,
          summary: brief.summary,
          sections: brief.sections,
          signal_data: signalData,
        },
        { onConflict: 'date' },
      );

      if (error) {
        return NextResponse.json({ error: 'Market brief write failed' }, { status: 503 });
      }

      return NextResponse.json({
        status: 'generated',
        date: today,
        headline: brief.headline,
        sections_count: brief.sections.length,
      });
    });
  } catch {
    return NextResponse.json({ error: 'Market brief generation failed' }, { status: 503 });
  }
}
