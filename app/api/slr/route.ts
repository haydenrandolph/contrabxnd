import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

let cache: { data: Record<string, unknown>; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

const UNAVAILABLE = {
  date: null,
  leverage_subindex: null,
  tier1_leverage_capital: null,
  policy_signal: null,
  policy_label: null,
  policy_event: null,
};

function policyLabel(signal: number): string {
  if (signal > 0) return 'EASING';
  if (signal < 0) return 'TIGHTENING';
  return 'NEUTRAL';
}

export async function GET() {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return NextResponse.json(cache.data);
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json(UNAVAILABLE);
  }

  try {
    const { data: row, error } = await supabase
      .from('slr_snapshots')
      .select('date, leverage_subindex, tier1_leverage_capital, policy_signal, policy_event')
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (error || !row) {
      return NextResponse.json(UNAVAILABLE);
    }

    const result = {
      date: row.date,
      leverage_subindex: row.leverage_subindex,
      tier1_leverage_capital: row.tier1_leverage_capital,
      policy_signal: row.policy_signal,
      policy_label: policyLabel(row.policy_signal),
      policy_event: row.policy_event,
    };

    cache = { data: result, fetchedAt: Date.now() };
    return NextResponse.json(result);
  } catch (err) {
    console.error('SLR API error:', err);
    if (cache) return NextResponse.json(cache.data);
    return NextResponse.json(UNAVAILABLE, { status: 500 });
  }
}
