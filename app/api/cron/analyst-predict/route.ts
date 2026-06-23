import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createAdminClient } from '@/lib/supabase/server';
import { hashPrediction } from '@/lib/agent-credit';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const ANALYST_NAME = 'Contrabxnd Analyst';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.contrabxnd.io';

async function fetchInternal(path: string) {
  const res = await fetch(`${BASE_URL}${path}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

async function ensureAnalystAgent(supabase: ReturnType<typeof createAdminClient>) {
  if (!supabase) return null;

  const { data: existing } = await supabase
    .from('agents')
    .select('id')
    .eq('name', ANALYST_NAME)
    .eq('status', 'active')
    .maybeSingle();

  if (existing) return existing.id;

  const { data: agent, error } = await supabase
    .from('agents')
    .insert({
      owner_id: null,
      name: ANALYST_NAME,
      description: 'First-party AI analyst. Generates daily market intelligence, macro analysis, and directional predictions from live Contrabxnd signal data.',
      endpoint: `${BASE_URL}/api/cron/analyst-predict`,
      capabilities: ['market_analysis', 'price_prediction', 'macro_analysis', 'sentiment_analysis', 'derivatives_analysis'],
      pricing_model: 'free',
      verified: true,
      featured: true,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to register analyst:', error.message);
    return null;
  }

  await supabase.from('agent_credit_scores').insert({ agent_id: agent.id });
  return agent.id;
}

const PREDICTION_SCHEMA = `[
  {
    "text": "BTC will be above $105,000 by 2026-06-30",
    "confidence": 0.72,
    "category": "price",
    "targetDate": "2026-06-30T00:00:00Z"
  }
]`;

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

  const agentId = await ensureAnalystAgent(supabase);
  if (!agentId) {
    return NextResponse.json({ error: 'Failed to ensure analyst agent' }, { status: 500 });
  }

  const today = new Date().toISOString().split('T')[0];

  const { data: todayPredictions } = await supabase
    .from('agent_predictions')
    .select('id')
    .eq('agent_id', agentId)
    .gte('submitted_at', `${today}T00:00:00Z`)
    .lt('submitted_at', `${today}T23:59:59Z`);

  if (todayPredictions && todayPredictions.length >= 3) {
    return NextResponse.json({ status: 'already_predicted', date: today, count: todayPredictions.length });
  }

  const [price, signal, liquidity, fedwatch, derivatives, fearGreed, polymarket] =
    await Promise.all([
      fetchInternal('/api/price'),
      fetchInternal('/api/signal'),
      fetchInternal('/api/liquidity'),
      fetchInternal('/api/fedwatch'),
      fetchInternal('/api/derivatives'),
      fetchInternal('/api/fear-greed'),
      fetchInternal('/api/polymarket'),
    ]);

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const currentPrice = price?.price || price?.data?.price;

  const prompt = `You are the Contrabxnd Analyst. Based on the live data below, generate exactly 3 specific, verifiable predictions about Bitcoin.

CURRENT DATE: ${today}
CURRENT BTC PRICE: $${currentPrice?.toLocaleString() || 'unknown'}

LIVE DATA:
${JSON.stringify({ price, signal, liquidity, fedwatch, derivatives, fearGreed, polymarket }, null, 2)}

Generate exactly 3 predictions. Each must be:
- Specific and falsifiable (a clear threshold that can be checked)
- Have a target date 1-7 days from now
- Include a confidence score between 0.5 and 0.95
- Cover different categories: one "price" prediction, one "macro" prediction, one "sentiment" or "derivatives" prediction

Respond with ONLY a valid JSON array (no markdown, no code fences) matching this schema:
${PREDICTION_SCHEMA}

Categories: "price", "macro", "sentiment", "derivatives"

Rules:
- Price predictions must state a specific price level and direction (above/below $X)
- Macro predictions should reference liquidity, rate expectations, or ETF flows
- Sentiment/derivatives predictions should reference Fear & Greed levels, funding rates, or open interest direction
- Be realistic — don't predict extreme moves unless data strongly supports it
- Confidence should reflect actual uncertainty in the data`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      messages: [
        { role: 'user', content: prompt },
        { role: 'assistant', content: '[' },
      ],
    });

    const rawText = response.content[0].type === 'text' ? response.content[0].text : '';
    const text = ('[' + rawText).replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const predictions: Array<{
      text: string;
      confidence: number;
      category: string;
      targetDate: string;
    }> = JSON.parse(text);

    if (!Array.isArray(predictions) || predictions.length === 0) {
      return NextResponse.json({ error: 'No predictions generated' }, { status: 502 });
    }

    const submitted = [];
    for (const p of predictions.slice(0, 3)) {
      const confidence = Math.max(0.5, Math.min(0.95, p.confidence));
      const timestamp = new Date().toISOString();
      const predictionHash = hashPrediction(p.text, agentId, timestamp);

      const { data, error } = await supabase
        .from('agent_predictions')
        .insert({
          agent_id: agentId,
          prediction_hash: predictionHash,
          prediction_text: p.text,
          confidence,
          category: p.category || 'general',
          target_date: p.targetDate,
          outcome: 'pending',
        })
        .select('id, prediction_hash, prediction_text, confidence, target_date')
        .single();

      if (!error && data) submitted.push(data);
    }

    return NextResponse.json({
      status: 'predicted',
      date: today,
      agentId,
      predictions: submitted,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Analyst prediction failed:', err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
