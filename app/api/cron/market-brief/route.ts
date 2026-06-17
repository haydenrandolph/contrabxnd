import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.contrabxnd.io';

async function fetchInternal(path: string) {
  const res = await fetch(`${BASE_URL}${path}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const today = new Date().toISOString().split('T')[0];

  // Check if brief already generated today
  const { data: existing } = await supabase
    .from('market_briefs')
    .select('id')
    .eq('date', today)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ status: 'already_exists', date: today });
  }

  // Fetch all signal data
  const [signal, liquidity, fedwatch, etf, polymarket, fearGreed, slr, price] =
    await Promise.all([
      fetchInternal('/api/signal'),
      fetchInternal('/api/liquidity'),
      fetchInternal('/api/fedwatch'),
      fetchInternal('/api/etf-flows'),
      fetchInternal('/api/polymarket'),
      fetchInternal('/api/fear-greed'),
      fetchInternal('/api/slr'),
      fetchInternal('/api/price'),
    ]);

  const signalData = { signal, liquidity, fedwatch, etf, polymarket, fearGreed, slr, price };

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [
        { role: 'user', content: prompt },
        { role: 'assistant', content: '{' },
      ],
    });

    const rawText = response.content[0].type === 'text' ? response.content[0].text : '';
    const text = ('{' + rawText).replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const brief = JSON.parse(text);

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
      return NextResponse.json({ error: `DB error: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({
      status: 'generated',
      date: today,
      headline: brief.headline,
      sections_count: brief.sections.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Market brief generation failed:', err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
