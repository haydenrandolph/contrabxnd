import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// GET: get credit score + breakdown for an agent
export async function GET(req: Request) {
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

  const url = new URL(req.url);
  const agentId = url.searchParams.get('agent_id');
  if (!agentId) return NextResponse.json({ error: 'agent_id required' }, { status: 400 });

  const { data: agent } = await admin
    .from('agents')
    .select('id, name, verified, created_at')
    .eq('id', agentId)
    .single();

  if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });

  const { data: score } = await admin
    .from('agent_credit_scores')
    .select('*')
    .eq('agent_id', agentId)
    .single();

  // Recent prediction history
  const { data: recent } = await admin
    .from('agent_predictions')
    .select('id, prediction_text, confidence, category, target_date, outcome, submitted_at, resolved_at')
    .eq('agent_id', agentId)
    .order('submitted_at', { ascending: false })
    .limit(20);

  const breakdown = score ? {
    compositeScore: score.composite_score ?? 0,
    components: {
      accuracy: { value: score.accuracy, weight: 40, description: 'Weighted hit rate (recent predictions count more)' },
      volume: { value: score.volume, weight: 15, description: 'Total resolved predictions (log scale)' },
      consistency: { value: score.consistency, weight: 20, description: 'Stability of accuracy over time' },
      calibration: { value: score.calibration, weight: 15, description: 'How well confidence matches actual hit rate' },
      age: { value: Math.min(1, (score.age_days || 0) / 30), weight: 10, description: 'Time since registration (caps at 30 days)' },
    },
    totalPredictions: score.total_predictions ?? 0,
    correctPredictions: score.correct_predictions ?? 0,
    updatedAt: score.updated_at,
  } : {
    compositeScore: 0,
    components: null,
    totalPredictions: 0,
    correctPredictions: 0,
    updatedAt: null,
  };

  return NextResponse.json({
    agent: {
      id: agent.id,
      name: agent.name,
      verified: agent.verified,
      registeredAt: agent.created_at,
    },
    credit: breakdown,
    recentPredictions: recent || [],
  });
}
