import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import type { MeetingForecast } from '@/lib/fedwatch/types';

export const dynamic = 'force-dynamic';

let cache: { data: Record<string, unknown>; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

/* ---------------------------------------------------------------------------
 * Scoring helpers
 * -------------------------------------------------------------------------*/

/** Clamp a value between -100 and +100 */
function clamp(v: number): number {
  return Math.max(-100, Math.min(100, Math.round(v)));
}

/** Map a value linearly from [inLow, inHigh] to [outLow, outHigh] */
function linearMap(val: number, inLow: number, inHigh: number, outLow: number, outHigh: number): number {
  return outLow + ((val - inLow) / (inHigh - inLow)) * (outHigh - outLow);
}

function scoreLabel(score: number): string {
  if (score > 50) return 'BULLISH';
  if (score >= 20) return 'LEAN BULL';
  if (score >= -20) return 'NEUTRAL';
  if (score >= -50) return 'LEAN BEAR';
  return 'BEARISH';
}

function formatMillions(v: number): string {
  if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(1)}T`;
  if (Math.abs(v) >= 1e3) return `$${(v / 1e3).toFixed(0)}B`;
  return `$${v.toFixed(0)}M`;
}

/* ---------------------------------------------------------------------------
 * Component types
 * -------------------------------------------------------------------------*/

interface ComponentResult {
  score: number;
  weight: number;
  detail: string;
}

/* ---------------------------------------------------------------------------
 * Main handler
 * -------------------------------------------------------------------------*/

export async function GET() {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return NextResponse.json(cache.data);
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({
      score: null,
      label: null,
      components: {},
      timestamp: new Date().toISOString(),
    });
  }

  try {
    // Fetch all data sources in parallel
    const [etfResult, liquidityResult, fedwatchResult, fearGreedResult, slrResult] =
      await Promise.allSettled([
        fetchEtfData(supabase),
        fetchLiquidityData(supabase),
        fetchFedwatchData(supabase),
        fetchFearGreedData(),
        fetchSlrData(supabase),
      ]);

    // Build components map with their default weights
    const components: Record<string, ComponentResult> = {};
    let totalActiveWeight = 0;

    const tryAdd = (
      key: string,
      weight: number,
      result: PromiseSettledResult<ComponentResult | null>,
    ) => {
      if (result.status === 'fulfilled' && result.value != null) {
        components[key] = { ...result.value, weight };
        totalActiveWeight += weight;
      }
    };

    tryAdd('etf_flows', 0.30, etfResult);
    tryAdd('net_liquidity', 0.25, liquidityResult);
    tryAdd('fedwatch', 0.20, fedwatchResult);
    tryAdd('fear_greed', 0.10, fearGreedResult);
    tryAdd('slr', 0.10, slrResult);

    // TGA is derived from the liquidity result
    if (liquidityResult.status === 'fulfilled' && liquidityResult.value != null) {
      const tgaComponent = deriveTgaComponent(supabase);
      const tgaResult = await tgaComponent;
      if (tgaResult) {
        components['tga'] = { ...tgaResult, weight: 0.05 };
        totalActiveWeight += 0.05;
      }
    }

    // If no components have data, return null score
    if (totalActiveWeight === 0) {
      return NextResponse.json({
        score: null,
        label: null,
        components: {},
        timestamp: new Date().toISOString(),
      });
    }

    // Redistribute weights proportionally and compute weighted score
    let weightedSum = 0;
    for (const comp of Object.values(components)) {
      const adjustedWeight = comp.weight / totalActiveWeight;
      comp.weight = Math.round(adjustedWeight * 100) / 100; // round for display
      weightedSum += comp.score * adjustedWeight;
    }

    const score = clamp(weightedSum);
    const label = scoreLabel(score);

    const result = {
      score,
      label,
      components,
      timestamp: new Date().toISOString(),
    };

    cache = { data: result, fetchedAt: Date.now() };
    return NextResponse.json(result);
  } catch (err) {
    console.error('Signal API error:', err);
    if (cache) return NextResponse.json(cache.data);
    return NextResponse.json(
      { score: null, label: null, components: {}, timestamp: new Date().toISOString() },
      { status: 500 },
    );
  }
}

/* ---------------------------------------------------------------------------
 * Data fetchers
 * -------------------------------------------------------------------------*/

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchEtfData(supabase: any): Promise<ComponentResult | null> {
  // Get the two most recent dates
  const { data: dates, error: datesErr } = await supabase
    .from('etf_snapshots')
    .select('date')
    .order('date', { ascending: false })
    .limit(20);

  if (datesErr || !dates?.length) return null;

  const uniqueDates = [...new Set(dates.map((d: { date: string }) => d.date))].slice(0, 2);
  if (uniqueDates.length < 2) return null;

  const [today, yesterday] = uniqueDates;

  const { data: snapshots, error: snapErr } = await supabase
    .from('etf_snapshots')
    .select('ticker, date, nav_per_share, shares_outstanding')
    .in('date', [today, yesterday]);

  if (snapErr || !snapshots?.length) return null;

  type Row = { ticker: string; date: string; nav_per_share: number; shares_outstanding: number };
  const byTickerDate = new Map<string, Row>();
  for (const s of snapshots as Row[]) {
    byTickerDate.set(`${s.ticker}:${s.date}`, s);
  }

  const tickers = [...new Set((snapshots as Row[]).map((s) => s.ticker))];
  let netFlow = 0;
  for (const ticker of tickers) {
    const curr = byTickerDate.get(`${ticker}:${today}`);
    const prev = byTickerDate.get(`${ticker}:${yesterday}`);
    if (curr && prev) {
      netFlow += (curr.shares_outstanding - prev.shares_outstanding) * curr.nav_per_share;
    }
  }

  // Scale: +500M = +100, -500M = -100
  const score = clamp(linearMap(netFlow, -500, 500, -100, 100));
  const sign = netFlow >= 0 ? '+' : '';
  const detail = `${sign}${formatMillions(netFlow)} net inflow`;

  return { score, weight: 0, detail };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchLiquidityData(supabase: any): Promise<ComponentResult | null> {
  const { data: latest } = await supabase
    .from('liquidity_snapshots')
    .select('date, net_liquidity')
    .order('date', { ascending: false })
    .limit(1)
    .single();

  if (!latest || latest.net_liquidity == null) return null;

  // Get 13-week-ago row
  const latestDate = new Date(latest.date);
  const momentumDate = new Date(latestDate);
  momentumDate.setDate(momentumDate.getDate() - 91);
  const momentumDateStr = momentumDate.toISOString().split('T')[0];

  const { data: oldRow } = await supabase
    .from('liquidity_snapshots')
    .select('net_liquidity')
    .lte('date', momentumDateStr)
    .order('date', { ascending: false })
    .limit(1)
    .single();

  if (!oldRow || oldRow.net_liquidity == null || oldRow.net_liquidity === 0) return null;

  const momentum = (latest.net_liquidity - oldRow.net_liquidity) / Math.abs(oldRow.net_liquidity);

  // Scale: +5% = +100, -5% = -100
  const score = clamp(linearMap(momentum, -0.05, 0.05, -100, 100));
  const pct = (momentum * 100).toFixed(1);
  const detail = `${formatMillions(latest.net_liquidity)} (${momentum >= 0 ? '+' : ''}${pct}% 13w)`;

  return { score, weight: 0, detail };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchFedwatchData(supabase: any): Promise<ComponentResult | null> {
  const { data: row } = await supabase
    .from('fedwatch_snapshots')
    .select('meetings')
    .order('date', { ascending: false })
    .limit(1)
    .single();

  if (!row || !row.meetings) return null;

  const meetings = row.meetings as MeetingForecast[];
  if (meetings.length === 0) return null;

  const first = meetings[0];
  const cutProb = first.cut_probability;

  // Scale: cut_prob 1.0 = +100, 0.0 = -100, 0.5 = 0
  const score = clamp(linearMap(cutProb, 0, 1, -100, 100));
  const pctStr = (cutProb * 100).toFixed(0);
  const dateLabel = first.meeting_date
    ? new Date(first.meeting_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : 'next';
  const detail = `${pctStr}% cut prob ${dateLabel}`;

  return { score, weight: 0, detail };
}

async function fetchFearGreedData(): Promise<ComponentResult | null> {
  try {
    const res = await fetch('https://api.alternative.me/fng/?limit=1');
    if (!res.ok) return null;

    const data = await res.json();
    const entry = data?.data?.[0];
    if (!entry) return null;

    const value = parseInt(entry.value, 10);
    if (isNaN(value)) return null;

    // CONTRARIAN: low fear = buy signal
    // value 0 = +100, value 50 = 0, value 100 = -100
    const score = clamp(linearMap(value, 0, 100, 100, -100));
    const label = entry.value_classification ?? '';
    const detail = `${value} ${label}`;

    return { score, weight: 0, detail };
  } catch {
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchSlrData(supabase: any): Promise<ComponentResult | null> {
  const { data: row } = await supabase
    .from('slr_snapshots')
    .select('policy_signal, leverage_subindex')
    .order('date', { ascending: false })
    .limit(1)
    .single();

  if (!row) return null;

  const policySignal = row.policy_signal ?? 0;
  const leverageSubindex = row.leverage_subindex ?? 0;

  // policy_signal * 50 + leverage_subindex * -50 (negative subindex = loose = bullish)
  const score = clamp(policySignal * 50 + leverageSubindex * -50);

  let label = 'NEUTRAL';
  if (policySignal > 0) label = 'EASING';
  else if (policySignal < 0) label = 'TIGHTENING';
  const detail = `${label} regime`;

  return { score, weight: 0, detail };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function deriveTgaComponent(supabase: any): Promise<ComponentResult | null> {
  const { data: latest } = await supabase
    .from('liquidity_snapshots')
    .select('date, tga_balance')
    .order('date', { ascending: false })
    .limit(1)
    .single();

  if (!latest || latest.tga_balance == null) return null;

  // Get row from ~7 days ago
  const latestDate = new Date(latest.date);
  const trendDate = new Date(latestDate);
  trendDate.setDate(trendDate.getDate() - 7);
  const trendDateStr = trendDate.toISOString().split('T')[0];

  const { data: weekRow } = await supabase
    .from('liquidity_snapshots')
    .select('tga_balance')
    .lte('date', trendDateStr)
    .order('date', { ascending: false })
    .limit(1)
    .single();

  if (!weekRow || weekRow.tga_balance == null || weekRow.tga_balance === 0) return null;

  const change = (latest.tga_balance - weekRow.tga_balance) / Math.abs(weekRow.tga_balance);
  let trend: string;
  let score: number;

  if (change < -0.01) {
    trend = 'falling';
    score = 50;
  } else if (change > 0.01) {
    trend = 'rising';
    score = -50;
  } else {
    trend = 'flat';
    score = 0;
  }

  return { score, weight: 0, detail: `TGA ${trend}` };
}
