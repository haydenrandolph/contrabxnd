import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

let cache: { data: unknown; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function GET() {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return NextResponse.json(cache.data);
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ brief: null });
  }

  const { data: row, error } = await supabase
    .from('market_briefs')
    .select('date, score, score_label, headline, summary, sections')
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !row) {
    return NextResponse.json({ brief: null });
  }

  const result = { brief: row };
  cache = { data: result, fetchedAt: Date.now() };
  return NextResponse.json(result);
}
