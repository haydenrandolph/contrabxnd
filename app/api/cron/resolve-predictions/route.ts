import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { computeCreditScore } from '@/lib/agent-credit';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.contrabxnd.io';

async function fetchInternal(path: string) {
  const res = await fetch(`${BASE_URL}${path}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

function evaluatePricePrediction(text: string, currentPrice: number): 'correct' | 'incorrect' | 'expired' {
  const aboveMatch = text.match(/(?:above|over|higher than|exceed)\s*\$?([\d,]+)/i);
  const belowMatch = text.match(/(?:below|under|lower than|drop to)\s*\$?([\d,]+)/i);

  if (aboveMatch) {
    const target = parseFloat(aboveMatch[1].replace(/,/g, ''));
    return currentPrice > target ? 'correct' : 'incorrect';
  }
  if (belowMatch) {
    const target = parseFloat(belowMatch[1].replace(/,/g, ''));
    return currentPrice < target ? 'correct' : 'incorrect';
  }

  return 'expired';
}

function evaluateSentimentPrediction(text: string, fgValue: number): 'correct' | 'incorrect' | 'expired' {
  const aboveMatch = text.match(/(?:above|over|exceed|reach)\s*(\d+)/i);
  const belowMatch = text.match(/(?:below|under|drop to|fall)\s*(\d+)/i);

  if (aboveMatch) {
    const target = parseInt(aboveMatch[1]);
    return fgValue > target ? 'correct' : 'incorrect';
  }
  if (belowMatch) {
    const target = parseInt(belowMatch[1]);
    return fgValue < target ? 'correct' : 'incorrect';
  }

  if (/greed/i.test(text)) return fgValue > 55 ? 'correct' : 'incorrect';
  if (/fear/i.test(text)) return fgValue < 45 ? 'correct' : 'incorrect';

  return 'expired';
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const now = new Date().toISOString();

  const { data: pending, error: fetchErr } = await supabase
    .from('agent_predictions')
    .select('id, agent_id, prediction_text, category, target_date, confidence')
    .eq('outcome', 'pending')
    .lte('target_date', now)
    .order('target_date', { ascending: true })
    .limit(50);

  if (fetchErr || !pending || pending.length === 0) {
    return NextResponse.json({ status: 'nothing_to_resolve', count: 0 });
  }

  const [priceData, fgData] = await Promise.all([
    fetchInternal('/api/price'),
    fetchInternal('/api/fear-greed'),
  ]);

  const currentPrice = priceData?.price || priceData?.data?.price || 0;
  const fgValue = fgData?.data?.[0]?.value || fgData?.value || 50;

  const resolved: Array<{ id: string; outcome: string }> = [];
  const agentsToRecompute = new Set<string>();

  for (const p of pending) {
    let outcome: 'correct' | 'incorrect' | 'expired';

    if (p.category === 'price' && currentPrice > 0) {
      outcome = evaluatePricePrediction(p.prediction_text, currentPrice);
    } else if (p.category === 'sentiment' && fgValue) {
      outcome = evaluateSentimentPrediction(p.prediction_text, Number(fgValue));
    } else {
      const daysPast = (Date.now() - new Date(p.target_date).getTime()) / 86400000;
      if (daysPast > 2) {
        outcome = 'expired';
      } else {
        continue;
      }
    }

    const { error: updateErr } = await supabase
      .from('agent_predictions')
      .update({
        outcome,
        resolved_at: now,
        resolution_note: `Auto-resolved. Price: $${currentPrice}, F&G: ${fgValue}`,
      })
      .eq('id', p.id);

    if (!updateErr) {
      resolved.push({ id: p.id, outcome });
      agentsToRecompute.add(p.agent_id);
    }
  }

  for (const agentId of agentsToRecompute) {
    const { data: allPredictions } = await supabase
      .from('agent_predictions')
      .select('confidence, outcome, submitted_at, resolved_at')
      .eq('agent_id', agentId);

    const { data: agent } = await supabase
      .from('agents')
      .select('created_at')
      .eq('id', agentId)
      .single();

    if (allPredictions && agent) {
      const score = computeCreditScore(
        allPredictions as Array<{
          confidence: number;
          outcome: 'correct' | 'incorrect' | 'expired' | 'pending';
          submitted_at: string;
          resolved_at: string | null;
        }>,
        agent.created_at,
      );

      await supabase
        .from('agent_credit_scores')
        .upsert({
          agent_id: agentId,
          accuracy: score.accuracy,
          volume: score.volume,
          consistency: score.consistency,
          calibration: score.calibration,
          age_days: score.ageDays,
          composite_score: score.compositeScore,
          total_predictions: score.totalPredictions,
          correct_predictions: score.correctPredictions,
          updated_at: now,
        });
    }
  }

  return NextResponse.json({
    status: 'resolved',
    resolved: resolved.length,
    pending_remaining: pending.length - resolved.length,
    details: resolved,
  });
}
