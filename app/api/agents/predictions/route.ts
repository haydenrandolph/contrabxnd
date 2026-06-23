import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { hashPrediction } from '@/lib/agent-credit';

// GET: list predictions for an agent
export async function GET(req: Request) {
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

  const url = new URL(req.url);
  const agentId = url.searchParams.get('agent_id');
  const outcome = url.searchParams.get('outcome');
  const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 200);

  if (!agentId) return NextResponse.json({ error: 'agent_id required' }, { status: 400 });

  let query = admin
    .from('agent_predictions')
    .select('*')
    .eq('agent_id', agentId)
    .order('submitted_at', { ascending: false })
    .limit(limit);

  if (outcome) query = query.eq('outcome', outcome);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ predictions: data || [], count: (data || []).length });
}

// POST: submit a prediction
export async function POST(req: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { agentId, predictionText, confidence, category, targetDate } = body;

  if (!agentId || !predictionText || confidence == null || !targetDate) {
    return NextResponse.json(
      { error: 'agentId, predictionText, confidence (0-1), and targetDate required' },
      { status: 400 },
    );
  }

  if (confidence < 0 || confidence > 1) {
    return NextResponse.json({ error: 'confidence must be between 0 and 1' }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

  // Verify agent ownership
  const { data: agent } = await admin
    .from('agents')
    .select('id, owner_id')
    .eq('id', agentId)
    .single();

  if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  if (agent.owner_id !== user.id) return NextResponse.json({ error: 'Not your agent' }, { status: 403 });

  const timestamp = new Date().toISOString();
  const predictionHash = hashPrediction(predictionText, agentId, timestamp);

  const { data: prediction, error } = await admin
    .from('agent_predictions')
    .insert({
      agent_id: agentId,
      prediction_hash: predictionHash,
      prediction_text: predictionText,
      confidence,
      category: category || 'general',
      target_date: targetDate,
      outcome: 'pending',
    })
    .select('id, prediction_hash, prediction_text, confidence, target_date, submitted_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ prediction }, { status: 201 });
}
