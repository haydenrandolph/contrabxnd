import { NextResponse } from 'next/server';
import { cronGuard, validPredictionTarget } from '@/lib/audit-guards';
import Anthropic from '@anthropic-ai/sdk';
import { createAdminClient } from '@/lib/supabase/server';
import { hashPrediction } from '@/lib/agent-credit';
import { withDailyJobLease } from '@/lib/job-lease';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const ANALYST_NAME = 'Contrabxnd Analyst';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.contrabxnd.io';

async function fetchInternal(path: string, signal: AbortSignal) {
  const res = await fetch(`${BASE_URL}${path}`, { cache: 'no-store', signal: AbortSignal.any([signal, AbortSignal.timeout(10_000)]) });
  if (!res.ok) throw new Error('Internal data unavailable');
  return res.json();
}

async function ensureAnalystAgent(supabase: ReturnType<typeof createAdminClient>) {
  if (!supabase) return null;

  const { data: existing, error: lookupError } = await supabase
    .from('agents')
    .select('id')
    .eq('name', ANALYST_NAME)
    .is('owner_id', null)
    .eq('verified', true)
    .eq('status', 'active')
    .maybeSingle();

  if (lookupError) throw new Error('Analyst lookup failed');
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

  if (error || !agent) {
    return null;
  }

  const { error: creditError } = await supabase.from('agent_credit_scores').insert({ agent_id: agent.id });
  if (creditError) throw new Error('Analyst credit initialization failed');
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
  const denied = cronGuard(request);
  if (denied) return denied;

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
  }

  let stored = 0;
  try {
    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    return await withDailyJobLease(supabase, 'analyst-predict', async today => {
      const agentId = await ensureAnalystAgent(supabase);
      if (!agentId) {
        return NextResponse.json({ error: 'Failed to ensure analyst agent' }, { status: 500 });
      }

      const { data: todayPredictions, error: predictionsError } = await supabase
        .from('agent_predictions')
        .select('id')
        .eq('agent_id', agentId)
        .or(`job_day.eq.${today},and(job_day.is.null,submitted_at.gte.${today}T00:00:00Z,submitted_at.lt.${new Date(Date.parse(today) + 86400000).toISOString()})`);

      if (predictionsError) throw new Error('Prediction lookup failed');

      if (todayPredictions && todayPredictions.length >= 3) {
        return NextResponse.json({ status: 'already_predicted', date: today, count: todayPredictions.length });
      }

      const [price, signal, liquidity, fedwatch, derivatives, fearGreed, polymarket] =
        await Promise.all([
          fetchInternal('/api/price', request.signal),
          fetchInternal('/api/signal', request.signal),
          fetchInternal('/api/liquidity', request.signal),
          fetchInternal('/api/fedwatch', request.signal),
          fetchInternal('/api/derivatives', request.signal),
          fetchInternal('/api/fear-greed', request.signal),
          fetchInternal('/api/polymarket', request.signal),
        ]);

      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 10_000, maxRetries: 0 });

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

      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        messages: [
          { role: 'user', content: prompt },
          { role: 'assistant', content: '[' },
        ],
      }, { signal: request.signal });

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

      if (predictions.length !== 3 || predictions.some(p =>
        !p || typeof p.text !== 'string' || !p.text.trim() || p.text.length > 10_000 ||
        typeof p.confidence !== 'number' || !Number.isFinite(p.confidence) ||
        !validPredictionTarget(p.targetDate) || Date.parse(p.targetDate) > Date.now() + 7 * 86400000 ||
        !['price', 'macro', 'sentiment', 'derivatives'].includes(p.category))) {
        return NextResponse.json({ error: 'Invalid predictions generated', stored: 0 }, { status: 502 });
      }

      // One statement is all-or-nothing. Account for legacy partial daily output.
      const existingCount = todayPredictions?.length ?? 0;
      const rows = predictions.slice(existingCount).map((p, index) => {
        const confidence = Math.max(0.5, Math.min(0.95, p.confidence));
        const timestamp = new Date().toISOString();
        const predictionHash = hashPrediction(p.text, agentId, timestamp);

        return {
          agent_id: agentId,
          prediction_hash: predictionHash,
          prediction_text: p.text,
          confidence,
          category: p.category || 'general',
          target_date: p.targetDate,
          submitted_at: timestamp,
          outcome: 'pending',
          job_day: today,
          job_slot: existingCount + index,
        };
      });
      const { data: submitted, error: writeError } = await supabase.from('agent_predictions')
        .insert(rows).select('id, prediction_hash, prediction_text, confidence, target_date');
      if (writeError || !submitted || submitted.length !== rows.length) {
        return NextResponse.json({ error: 'Prediction write failed', stored, total: predictions.length }, { status: 503 });
      }
      stored = submitted.length;

      return NextResponse.json({
        status: 'predicted',
        date: today,
        agentId,
        predictions: submitted,
      });
    });
  } catch {
    return NextResponse.json({ error: 'Analyst prediction failed', stored }, { status: 503 });
  }
}
