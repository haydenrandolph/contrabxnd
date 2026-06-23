import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { computeCreditScore } from '@/lib/agent-credit';

// POST: resolve a prediction and recompute credit score
export async function POST(req: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { predictionId, outcome, note } = body;

  if (!predictionId || !outcome) {
    return NextResponse.json({ error: 'predictionId and outcome required' }, { status: 400 });
  }

  if (!['correct', 'incorrect', 'expired'].includes(outcome)) {
    return NextResponse.json({ error: 'outcome must be correct, incorrect, or expired' }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

  // Get prediction + verify ownership
  const { data: prediction } = await admin
    .from('agent_predictions')
    .select('id, agent_id, outcome, agents!inner(owner_id)')
    .eq('id', predictionId)
    .single();

  if (!prediction) return NextResponse.json({ error: 'Prediction not found' }, { status: 404 });

  const agentOwner = (prediction as Record<string, unknown>).agents as Record<string, string>;
  if (agentOwner.owner_id !== user.id) {
    return NextResponse.json({ error: 'Not your agent' }, { status: 403 });
  }

  if (prediction.outcome !== 'pending') {
    return NextResponse.json({ error: 'Prediction already resolved' }, { status: 400 });
  }

  // Resolve the prediction
  const { error: updateErr } = await admin
    .from('agent_predictions')
    .update({
      outcome,
      resolved_at: new Date().toISOString(),
      resolution_note: note || null,
    })
    .eq('id', predictionId);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  // Recompute credit score
  const agentId = prediction.agent_id;

  const { data: allPredictions } = await admin
    .from('agent_predictions')
    .select('confidence, outcome, submitted_at, resolved_at')
    .eq('agent_id', agentId);

  const { data: agent } = await admin
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

    await admin
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
        updated_at: new Date().toISOString(),
      });
  }

  return NextResponse.json({ resolved: true, outcome });
}
