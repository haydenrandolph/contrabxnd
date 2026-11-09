import type { SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// The database's 120-second lease exceeds both routes' 60-second maxDuration.
// A killed worker recovers by expiry; normal returns always persist an outcome.
export async function withDailyJobLease(
  db: SupabaseClient,
  job: 'analyst-predict' | 'market-brief',
  work: (day: string) => Promise<Response>,
): Promise<Response> {
  const day = new Date().toISOString().slice(0, 10);
  const unavailable = () => NextResponse.json({ error: 'Daily job lease unavailable; migration 015 required' }, { status: 503 });
  let token: string | undefined;
  let response: Response | undefined;
  try {
    const { data, error } = await db.rpc('claim_ai_job', { p_job: job, p_day: day });
    if (error || !data) return unavailable();
    if (data.status === 'completed') {
      return NextResponse.json({ status: job === 'market-brief' ? 'already_exists' : 'already_predicted', date: day });
    }
    if (data.status === 'busy') return NextResponse.json({ status: 'in_progress', date: day }, { status: 202 });
    if (data.status !== 'claimed' || typeof data.token !== 'string' || !data.token) return unavailable();
    token = data.token;
    response = await work(day);
  } catch (error) {
    if (token) throw error;
    return unavailable();
  } finally {
    if (token) {
      try {
        const { data, error } = await db.rpc('finish_ai_job', {
          p_job: job, p_day: day, p_token: token, p_completed: response?.ok === true,
        });
        if (error || data !== true) response = unavailable();
      } catch {
        response = unavailable();
      }
    }
  }
  return response!;
}
