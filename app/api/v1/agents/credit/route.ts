import { NextResponse } from 'next/server';
import { authenticateApiKey, apiResponse } from '@/lib/api-auth';
import { createAdminClient } from '@/lib/supabase/server';

// GET: get credit score for an agent
export async function GET(req: Request) {
  const auth = await authenticateApiKey(req);
  if (!auth.ok) return auth.response;

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

  return apiResponse({
    agent: { id: agent.id, name: agent.name, verified: agent.verified },
    credit: score ? {
      compositeScore: score.composite_score ?? 0,
      accuracy: score.accuracy,
      volume: score.volume,
      consistency: score.consistency,
      calibration: score.calibration,
      ageDays: score.age_days,
      totalPredictions: score.total_predictions,
      correctPredictions: score.correct_predictions,
    } : null,
  }, auth);
}
