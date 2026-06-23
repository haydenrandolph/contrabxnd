import { NextResponse } from 'next/server';
import { authenticateApiKey, apiResponse } from '@/lib/api-auth';
import { createAdminClient } from '@/lib/supabase/server';
import { hashPrediction } from '@/lib/agent-credit';

// GET: list predictions for an agent
export async function GET(req: Request) {
  const auth = await authenticateApiKey(req);
  if (!auth.ok) return auth.response;

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

  const url = new URL(req.url);
  const agentId = url.searchParams.get('agent_id');
  if (!agentId) return NextResponse.json({ error: 'agent_id required' }, { status: 400 });

  const { data, error } = await admin
    .from('agent_predictions')
    .select('id, prediction_hash, prediction_text, confidence, category, target_date, outcome, submitted_at, resolved_at')
    .eq('agent_id', agentId)
    .order('submitted_at', { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return apiResponse({ predictions: data || [], count: (data || []).length }, auth);
}

// POST: submit a prediction via API key
export async function POST(req: Request) {
  const auth = await authenticateApiKey(req);
  if (!auth.ok) return auth.response;

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

  const body = await req.json();
  const { agentId, predictionText, confidence, category, targetDate } = body;

  if (!agentId || !predictionText || confidence == null || !targetDate) {
    return NextResponse.json(
      { error: 'agentId, predictionText, confidence (0-1), and targetDate required' },
      { status: 400 },
    );
  }

  // Verify agent ownership via API key user
  const { data: agent } = await admin
    .from('agents')
    .select('id, owner_id')
    .eq('id', agentId)
    .single();

  if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  if (agent.owner_id !== auth.userId) return NextResponse.json({ error: 'Not your agent' }, { status: 403 });

  const timestamp = new Date().toISOString();
  const predHash = hashPrediction(predictionText, agentId, timestamp);

  const { data: prediction, error } = await admin
    .from('agent_predictions')
    .insert({
      agent_id: agentId,
      prediction_hash: predHash,
      prediction_text: predictionText,
      confidence,
      category: category || 'general',
      target_date: targetDate,
      outcome: 'pending',
    })
    .select('id, prediction_hash, confidence, target_date, submitted_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return apiResponse({ prediction }, auth);
}
