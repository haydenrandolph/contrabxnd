import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import type { MeetingForecast } from '@/lib/fedwatch/types';
import { getMiningIntelligence } from '@/lib/hashrate';
import { getBitcoinPrice } from '@/lib/price';
import { etfFlowDollars, isFreshDate, scoreEtfFlow } from '@/lib/etf/math';
import { currentBullishMarkets } from '@/lib/polymarket/math';
import { liquidityInputsFresh } from '@/lib/liquidity/math';
import { validMeetingForecast } from '@/lib/fedwatch/math';
import { FOMC_DATES } from '@/lib/fedwatch/calendar';

export const dynamic = 'force-dynamic';

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
    const [etfResult, liquidityResult, fedwatchResult, fearGreedResult, slrResult, polymarketResult, hashRibbonResult, onchainResult] =
      await Promise.allSettled([
        fetchEtfData(supabase),
        fetchLiquidityData(supabase),
        fetchFedwatchData(supabase),
        fetchFearGreedData(),
        fetchSlrData(supabase),
        fetchPolymarketData(supabase),
        fetchHashRibbonData(),
        fetchOnchainData(supabase),
      ]);

    // Build components map with their default weights
    const components: Record<string, ComponentResult> = {};
    let totalActiveWeight = 0;

    const tryAdd = (
      key: string,
      weight: number,
      result: PromiseSettledResult<ComponentResult | null>,
    ) => {
      if (result.status === 'fulfilled' && result.value != null && Number.isFinite(result.value.score)) {
        components[key] = { ...result.value, weight };
        totalActiveWeight += weight;
      }
    };

    tryAdd('etf_flows', 0.25, etfResult);
    tryAdd('net_liquidity', 0.25, liquidityResult);
    tryAdd('fedwatch', 0.20, fedwatchResult);
    tryAdd('polymarket', 0.10, polymarketResult);
    tryAdd('fear_greed', 0.10, fearGreedResult);
    tryAdd('slr', 0.05, slrResult);
    tryAdd('hash_ribbon', 0.05, hashRibbonResult);
    tryAdd('mvrv', 0.10, onchainResult);

    // TGA is derived from the liquidity result
    if (liquidityResult.status === 'fulfilled' && liquidityResult.value != null) {
      const tgaComponent = deriveTgaComponent(supabase);
      const tgaResult = await tgaComponent;
      if (tgaResult) {
        components['tga'] = { ...tgaResult, weight: 0.05 };
        totalActiveWeight += 0.05;
      }
    }

    // Require at least three components and half of the configured weight.
    if (Object.keys(components).length < 3 || totalActiveWeight < 1.25 * 0.5) {
      return NextResponse.json({
        score: null,
        label: null,
        components,
        coverage: totalActiveWeight / 1.25,
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
      coverage: totalActiveWeight / 1.25,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error('Signal API error:', err);
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
  if (!isFreshDate(today, 5) || !isFreshDate(yesterday, 9) ||
      Date.parse(String(today)) - Date.parse(String(yesterday)) > 5 * 86_400_000) return null;

  const { data: snapshots, error: snapErr } = await supabase
    .from('etf_snapshots')
    .select('ticker, date, nav_per_share, shares_outstanding, total_net_assets')
    .in('date', [today, yesterday]);

  if (snapErr || !snapshots?.length) return null;

  type Row = { ticker: string; date: string; nav_per_share: number; shares_outstanding: number; total_net_assets: number };
  const byTickerDate = new Map<string, Row>();
  for (const s of snapshots as Row[]) {
    byTickerDate.set(`${s.ticker}:${s.date}`, s);
  }

  const tickers = [...new Set((snapshots as Row[]).map((s) => s.ticker))];
  let netFlow = 0;
  let pairs = 0;
  for (const ticker of tickers) {
    const curr = byTickerDate.get(`${ticker}:${today}`);
    const prev = byTickerDate.get(`${ticker}:${yesterday}`);
    if (curr && prev) {
      const flow = etfFlowDollars(curr, prev);
      if (flow !== null) { netFlow += flow; pairs++; }
    }
  }

  // Scale: +500M = +100, -500M = -100
  if (pairs < 2 || pairs !== tickers.length) return null;
  const score = scoreEtfFlow(netFlow);
  const sign = netFlow >= 0 ? '+' : '';
  const detail = `${sign}${formatMillions(netFlow / 1_000_000)} net flow (${pairs} tracked funds)`;

  return { score, weight: 0, detail };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchLiquidityData(supabase: any): Promise<ComponentResult | null> {
  const { data: latest } = await supabase
    .from('liquidity_snapshots')
    .select('date, net_liquidity, raw_data')
    .order('date', { ascending: false })
    .limit(1)
    .single();

  if (!latest || !Number.isFinite(latest.net_liquidity) || !isFreshDate(latest.date, 10) ||
      !liquidityInputsFresh(latest.raw_data)) return null;

  // Get 13-week-ago row
  const latestDate = new Date(latest.date);
  const momentumDate = new Date(latestDate);
  momentumDate.setDate(momentumDate.getDate() - 91);
  const momentumDateStr = momentumDate.toISOString().split('T')[0];

  const { data: oldRow } = await supabase
    .from('liquidity_snapshots')
    .select('date, net_liquidity')
    .lte('date', momentumDateStr)
    .order('date', { ascending: false })
    .limit(1)
    .single();

  if (!oldRow || !Number.isFinite(oldRow.net_liquidity) || oldRow.net_liquidity === 0 ||
      !isFreshDate(oldRow.date, 14, momentumDate.getTime())) return null;

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
    .select('date, meetings')
    .order('date', { ascending: false })
    .limit(1)
    .single();

  if (!row || !row.meetings || !isFreshDate(row.date, 4)) return null;

  const meetings = row.meetings as MeetingForecast[];
  if (meetings.length === 0) return null;

  const first = meetings.filter(m => m.meeting_date > new Date().toISOString().slice(0, 10))
    .sort((a, b) => a.meeting_date.localeCompare(b.meeting_date))[0];
  if (!first || !validMeetingForecast(first) ||
      first.meeting_date !== FOMC_DATES.find(d => d > new Date().toISOString().slice(0, 10))) return null;
  if (!first || !Number.isFinite(first.cut_probability) || first.cut_probability < 0 || first.cut_probability > 1) return null;
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

    const value = Number(entry.value);
    if (entry.value == null || String(entry.value).trim() === '' || !Number.isFinite(value) || value < 0 || value > 100 ||
        !isFreshDate(new Date(Number(entry.timestamp) * 1000).toISOString(), 2)) return null;

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
    .select('date, policy_signal, leverage_subindex, raw_data')
    .order('date', { ascending: false })
    .limit(1)
    .single();

  if (!row || !isFreshDate(row.date, 14) || !Number.isFinite(row.policy_signal) ||
      ![-1, 0, 1].includes(row.policy_signal) || !Number.isFinite(row.leverage_subindex) ||
      !isFreshDate(row.raw_data?.fred?.nfci_leverage_date, 14)) return null;
  const entries = row.raw_data?.rss_entries as Array<{ pubDate: string }> | undefined;
  if (!entries?.some(entry => isFreshDate(entry.pubDate, 30))) return null;

  const policySignal = row.policy_signal;
  const leverageSubindex = row.leverage_subindex;

  // policy_signal * 50 + leverage_subindex * -50 (negative subindex = loose = bullish)
  const score = clamp(policySignal * 50 + leverageSubindex * -50);

  let label = 'NEUTRAL';
  if (policySignal > 0) label = 'EASING';
  else if (policySignal < 0) label = 'TIGHTENING';
  const detail = `${label} regime`;

  return { score, weight: 0, detail };
}

async function fetchHashRibbonData(): Promise<ComponentResult | null> {
  try {
    const m = await getMiningIntelligence();
    return { score: m.score, weight: 0, detail: m.detail };
  } catch {
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchOnchainData(supabase: any): Promise<ComponentResult | null> {
  const { data: row } = await supabase
    .from('onchain_snapshots')
    .select('date, realized_cap, total_supply')
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!row?.realized_cap || !row?.total_supply || !isFreshDate(row.date, 2)) return null;

  const priceResult = await getBitcoinPrice();
  const price = priceResult?.data.price;
  if (!price || priceResult?.stale) return null;

  const supply = Number(row.total_supply);
  const realizedCap = Number(row.realized_cap);
  if (![supply, realizedCap].every(v => Number.isFinite(v) && v > 0)) return null;
  const mvrv = (price * supply) / realizedCap;
  // MVRV ~0.8 = deep value (bullish), ~3.5 = cycle-top territory (bearish).
  const score = clamp(linearMap(mvrv, 0.8, 3.5, 100, -100));
  let label = 'fair value';
  if (mvrv < 1) label = 'undervalued';
  else if (mvrv > 3.2) label = 'overvalued';
  const detail = `MVRV ${mvrv.toFixed(2)} (${label})`;
  return { score, weight: 0, detail };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchPolymarketData(supabase: any): Promise<ComponentResult | null> {
  const { data: rows } = await supabase
    .from('polymarket_snapshots')
    .select('date, market_id, question, outcome_yes, volume, liquidity, slug, active, raw_data')
    .order('date', { ascending: false })
    .limit(200);

  if (!rows?.length) return null;

  const markets = currentBullishMarkets(rows);

  if (markets.length < 2) return null;

  // Volume-weighted average of "Yes" probabilities for bullish Bitcoin markets
  let totalVol = 0;
  let weightedYes = 0;
  for (const m of markets) {
    totalVol += m.volume;
    weightedYes += m.outcome_yes * m.volume;
  }

  if (totalVol === 0) return null;

  const avgYes = weightedYes / totalVol;

  // avgYes 0.0 → -100 (market thinks nothing bullish happens), 1.0 → +100
  const score = clamp(linearMap(avgYes, 0, 1, -100, 100));
  const pct = (avgYes * 100).toFixed(0);
  const detail = `${pct}% avg bull prob (${markets.length} markets)`;

  return { score, weight: 0, detail };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function deriveTgaComponent(supabase: any): Promise<ComponentResult | null> {
  const { data: latest } = await supabase
    .from('liquidity_snapshots')
    .select('date, tga_balance, raw_data')
    .order('date', { ascending: false })
    .limit(1)
    .single();

  if (!latest || !Number.isFinite(latest.tga_balance) || !isFreshDate(latest.date, 5) ||
      !isFreshDate(latest.raw_data?.tga?.record_date, 5)) return null;

  // Get row from ~7 days ago
  const latestDate = new Date(latest.date);
  const trendDate = new Date(latestDate);
  trendDate.setDate(trendDate.getDate() - 7);
  const trendDateStr = trendDate.toISOString().split('T')[0];

  const { data: weekRow } = await supabase
    .from('liquidity_snapshots')
    .select('date, tga_balance')
    .lte('date', trendDateStr)
    .order('date', { ascending: false })
    .limit(1)
    .single();

  if (!weekRow || !Number.isFinite(weekRow.tga_balance) || weekRow.tga_balance === 0 ||
      !isFreshDate(weekRow.date, 5, trendDate.getTime())) return null;

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
