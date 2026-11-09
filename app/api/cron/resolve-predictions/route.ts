import { NextResponse } from 'next/server';
import { cronGuard } from '@/lib/audit-guards';
import { createAdminClient } from '@/lib/supabase/server';
import { recomputeAgentCreditScore } from '@/lib/agent-credit';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request) {
  const denied = cronGuard(request);
  if (denied) return denied;

  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

  const now = new Date().toISOString();
  const cutoff = new Date(Date.parse(now) - 2 * 86400000).toISOString();
  // There is no stored, validated target-time evaluation for pending predictions.
  // Neither free text, current snapshots nor coarse daily candles prove an outcome.
  const { data: pending, error: fetchErr } = await supabase.from('agent_predictions')
    .select('id, agent_id')
    .eq('outcome', 'pending')
    .lt('target_date', cutoff)
    .order('target_date', { ascending: true })
    .order('id', { ascending: true })
    .limit(50);
  if (fetchErr || !pending) return NextResponse.json({ error: 'Could not load pending predictions' }, { status: 503 });

  const expired: string[] = [];
  const failed: string[] = [];
  const agentsToRecompute = new Set<string>();
  for (const p of pending) {
    const { data: updated, error } = await supabase.from('agent_predictions')
      .update({
        outcome: 'expired',
        resolved_at: now,
        resolution_note: 'Expired after the two-day operator review window without validated target-time evidence. Outcome not determined; no credit awarded.',
      })
      .eq('id', p.id)
      .eq('outcome', 'pending')
      .select('id')
      .maybeSingle();
    if (error) failed.push(p.id);
    else if (updated) {
      expired.push(p.id);
      agentsToRecompute.add(p.agent_id);
    }
  }

  const scoreFailures: string[] = [];
  for (const agentId of agentsToRecompute) {
    try {
      await recomputeAgentCreditScore(supabase, agentId);
    } catch {
      scoreFailures.push(agentId);
    }
  }

  // Count the actual due backlog, not just the 50-row expiration batch.
  const { data: review, count, error: reviewError } = await supabase.from('agent_predictions')
    .select('id', { count: 'exact' })
    .eq('outcome', 'pending')
    .lte('target_date', now)
    .order('target_date', { ascending: true })
    .order('id', { ascending: true })
    .limit(50);
  const incomplete = failed.length > 0 || scoreFailures.length > 0 || !!reviewError || count == null;
  return NextResponse.json({
    status: incomplete ? 'incomplete' : count ? 'needs_review' : expired.length ? 'expired' : 'nothing_to_resolve',
    resolved: expired.length,
    expired: expired.length,
    awarded: 0,
    pending_remaining: reviewError ? null : count,
    needs_review: reviewError ? null : count,
    review_ids: reviewError ? [] : (review || []).map(p => p.id),
    review_ids_truncated: count == null ? null : count > (review || []).length,
    details: expired.map(id => ({ id, outcome: 'expired' })),
    failed_predictions: failed,
    score_failures: scoreFailures,
    ...(reviewError || count == null ? { error: 'Could not count review backlog' } : {}),
  }, { status: incomplete ? 503 : 200 });
}
