import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { recomputeAgentCreditScore } from '@/lib/agent-credit';
import { isOperator } from '@/lib/audit-guards';

// POST: resolve a prediction and recompute credit score
export async function POST(req: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isOperator(user.id)) return NextResponse.json({ error: 'Operator scope required' }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  const { predictionId, outcome } = body;
  // Keep the shipped `note` field; resolutionNote is the explicit evidence name.
  const note = body.resolutionNote ?? body.note;

  if (typeof predictionId !== 'string' || !predictionId || typeof outcome !== 'string') {
    return NextResponse.json({ error: 'predictionId and outcome required' }, { status: 400 });
  }

  if (!['correct', 'incorrect', 'expired'].includes(outcome)) {
    return NextResponse.json({ error: 'outcome must be correct, incorrect, or expired' }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

  // Operators can resolve other agents, never award credit to their own agents.
  const { data: prediction, error: predictionError } = await admin
    .from('agent_predictions')
    .select('id, agent_id, outcome, target_date, submitted_at, resolution_note, agents!inner(owner_id)')
    .eq('id', predictionId)
    .single();

  if (predictionError && predictionError.code !== 'PGRST116') return NextResponse.json({ error: 'Could not load prediction' }, { status: 503 });
  if (!prediction) return NextResponse.json({ error: 'Prediction not found' }, { status: 404 });

  const agentOwner = (prediction as Record<string, unknown>).agents as Record<string, string>;
  if (!agentOwner?.owner_id || agentOwner.owner_id === user.id) {
    return NextResponse.json({ error: 'Cannot resolve your own agent predictions' }, { status: 403 });
  }

  // This is an operator attestation, not automatic verification of the cited source.
  if (typeof note !== 'string' || note.length > 2000 ||
      note.trim().length < 40 || note.trim().split(/\s+/).length < 6) {
    return NextResponse.json({ error: 'A substantive resolutionNote is required: cite target-time evidence and explain the outcome, or why it cannot be determined' }, { status: 400 });
  }

  const target = Date.parse(prediction.target_date);
  const submitted = Date.parse(prediction.submitted_at);
  if (!Number.isFinite(target) || !Number.isFinite(submitted) || target <= submitted || target > Date.now()) {
    return NextResponse.json({ error: 'Prediction is not eligible for resolution' }, { status: 400 });
  }

  // An identical operator retry can repair a score write that failed after resolution.
  const retry = prediction.outcome === outcome && prediction.resolution_note === note.trim();
  if (prediction.outcome !== 'pending' && !retry) {
    return NextResponse.json({ error: 'Prediction already resolved' }, { status: 400 });
  }

  if (!retry) {
    const { data: updated, error: updateErr } = await admin
      .from('agent_predictions')
      .update({
        outcome,
        resolved_at: new Date().toISOString(),
        resolution_note: note.trim(),
      })
      .eq('id', predictionId)
      .eq('outcome', 'pending')
      .select('id')
      .maybeSingle();

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });
    if (!updated) return NextResponse.json({ error: 'Prediction already resolved' }, { status: 409 });
  }

  // Recompute credit score
  try {
    await recomputeAgentCreditScore(admin, prediction.agent_id);
  } catch {
    return NextResponse.json({ error: 'Prediction resolved but credit score update failed; retry the identical request', resolved: true, score_updated: false, outcome }, { status: 503 });
  }

  return NextResponse.json({ resolved: true, score_updated: true, outcome });
}
