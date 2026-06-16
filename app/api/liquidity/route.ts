import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

let cache: { data: Record<string, unknown>; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

const UNAVAILABLE = {
  date: null,
  net_liquidity: null,
  fed_balance_sheet: null,
  tga_balance: null,
  reverse_repo: null,
  m2: null,
  sofr: null,
  effr: null,
  momentum_13w: null,
  tga_trend: null,
  rrp_trend: null,
};

type LiquidityRow = {
  date: string;
  net_liquidity: number | null;
  fed_balance_sheet: number | null;
  tga_balance: number | null;
  reverse_repo: number | null;
  m2: number | null;
  sofr: number | null;
  effr: number | null;
};

function computeTrend(current: number | null, previous: number | null): string | null {
  if (current == null || previous == null || previous === 0) return null;
  const change = (current - previous) / Math.abs(previous);
  if (change < -0.01) return 'falling';
  if (change > 0.01) return 'rising';
  return 'flat';
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
    // Get the latest row
    const { data: latest, error: latestErr } = await supabase
      .from('liquidity_snapshots')
      .select('date, net_liquidity, fed_balance_sheet, tga_balance, reverse_repo, m2, sofr, effr')
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (latestErr || !latest) {
      return NextResponse.json(UNAVAILABLE);
    }

    const current = latest as LiquidityRow;

    // Compute the date ~91 days ago for 13-week momentum
    const latestDate = new Date(current.date);
    const momentumDate = new Date(latestDate);
    momentumDate.setDate(momentumDate.getDate() - 91);
    const momentumDateStr = momentumDate.toISOString().split('T')[0];

    // Compute the date ~7 days ago for trend calculation
    const trendDate = new Date(latestDate);
    trendDate.setDate(trendDate.getDate() - 7);
    const trendDateStr = trendDate.toISOString().split('T')[0];

    // Fetch 13-week-ago row (closest to 91 days ago, looking back)
    const { data: oldRow } = await supabase
      .from('liquidity_snapshots')
      .select('date, net_liquidity')
      .lte('date', momentumDateStr)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    // Fetch 7-day-ago row for trends
    const { data: weekRow } = await supabase
      .from('liquidity_snapshots')
      .select('date, tga_balance, reverse_repo')
      .lte('date', trendDateStr)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    // Compute momentum
    let momentum_13w: number | null = null;
    if (oldRow && current.net_liquidity != null && oldRow.net_liquidity != null && oldRow.net_liquidity !== 0) {
      momentum_13w = (current.net_liquidity - oldRow.net_liquidity) / Math.abs(oldRow.net_liquidity);
      momentum_13w = Math.round(momentum_13w * 1000) / 1000; // 3 decimal places
    }

    // Compute trends
    const tga_trend = weekRow
      ? computeTrend(current.tga_balance, weekRow.tga_balance)
      : null;
    const rrp_trend = weekRow
      ? computeTrend(current.reverse_repo, weekRow.reverse_repo)
      : null;

    const result = {
      date: current.date,
      net_liquidity: current.net_liquidity,
      fed_balance_sheet: current.fed_balance_sheet,
      tga_balance: current.tga_balance,
      reverse_repo: current.reverse_repo,
      m2: current.m2,
      sofr: current.sofr,
      effr: current.effr,
      momentum_13w,
      tga_trend,
      rrp_trend,
    };

    cache = { data: result, fetchedAt: Date.now() };
    return NextResponse.json(result);
  } catch (err) {
    console.error('Liquidity API error:', err);
    if (cache) return NextResponse.json(cache.data);
    return NextResponse.json(UNAVAILABLE, { status: 500 });
  }
}
