import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import type { EtfFlowResponse } from '@/lib/etf/types';

let cache: { data: EtfFlowResponse; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000;

const FUND_NAMES: Record<string, string> = {
  IBIT: 'BlackRock',
  FBTC: 'Fidelity',
  GBTC: 'Grayscale',
  ARKB: 'ARK/21Shares',
  BITB: 'Bitwise',
  HODL: 'VanEck',
  BRRR: 'Valkyrie',
  EZBC: 'Franklin',
  BTCO: 'Invesco',
  BTCW: 'WisdomTree',
};

const UNAVAILABLE: EtfFlowResponse = {
  source: 'unavailable',
  date: null,
  funds: Object.entries(FUND_NAMES).slice(0, 5).map(([ticker, name]) => ({ ticker, name, flow: null })),
  netFlow: null,
};

async function getFlowsFromSupabase(): Promise<EtfFlowResponse | null> {
  const supabase = createAdminClient();
  if (!supabase) return null;

  // Get the two most recent distinct dates that have snapshot data
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
    .select('ticker, date, nav_per_share, shares_outstanding, total_net_assets')
    .in('date', [today, yesterday])
    .order('ticker');

  if (snapErr || !snapshots?.length) return null;

  type SnapshotRow = {
    ticker: string;
    date: string;
    nav_per_share: number;
    shares_outstanding: number;
    total_net_assets: number;
  };

  const byTickerDate = new Map<string, SnapshotRow>();
  for (const s of snapshots as SnapshotRow[]) {
    byTickerDate.set(`${s.ticker}:${s.date}`, s);
  }

  const tickers = [...new Set((snapshots as SnapshotRow[]).map(s => s.ticker))];

  const funds = tickers.map(ticker => {
    const curr = byTickerDate.get(`${ticker}:${today}`);
    const prev = byTickerDate.get(`${ticker}:${yesterday}`);

    let flow: number | null = null;
    if (curr && prev) {
      // flow = change in shares × current NAV
      flow = (curr.shares_outstanding - prev.shares_outstanding) * curr.nav_per_share;
    }

    return {
      ticker,
      name: FUND_NAMES[ticker] ?? ticker,
      flow,
    };
  });

  const netFlow = funds.reduce((sum, f) => sum + (f.flow ?? 0), 0);

  return {
    source: 'contrabxnd',
    date: today,
    funds,
    netFlow,
  };
}

export async function GET() {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return NextResponse.json(cache.data);
  }

  // Try own data first
  const ownData = await getFlowsFromSupabase();
  if (ownData && ownData.funds.length > 0) {
    cache = { data: ownData, fetchedAt: Date.now() };
    return NextResponse.json(ownData);
  }

  // Fallback to SoSoValue if we have a key
  const apiKey = process.env.SOSOVALUE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(UNAVAILABLE);
  }

  try {
    const res = await fetch('https://api.sosovalue.com/api/v1/etf?category=btc', {
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Accept': 'application/json' },
    });

    if (!res.ok) throw new Error(`SoSoValue API error: ${res.status}`);

    const raw = await res.json();

    let funds: Array<{ ticker: string; name: string; flow: number | null }> = [];
    let netFlow: number | null = null;
    let date: string | null = null;

    if (raw?.data && Array.isArray(raw.data)) {
      funds = raw.data
        .filter((f: { ticker?: string }) => f.ticker && FUND_NAMES[f.ticker])
        .map((f: { ticker: string; netFlow?: number; dailyFlow?: number; flow?: number }) => ({
          ticker: f.ticker,
          name: FUND_NAMES[f.ticker] || f.ticker,
          flow: f.netFlow ?? f.dailyFlow ?? f.flow ?? null,
        }));

      netFlow = funds.reduce((sum, f) => sum + (f.flow ?? 0), 0);
      date = raw.date ?? raw.data[0]?.date ?? null;
    }

    if (funds.length === 0) throw new Error('No fund data');

    const data: EtfFlowResponse = { source: 'sosovalue', date, funds, netFlow };
    cache = { data, fetchedAt: Date.now() };
    return NextResponse.json(data);
  } catch (error) {
    console.warn('ETF flow fetch failed:', error);
    if (cache) return NextResponse.json(cache.data);
    return NextResponse.json(UNAVAILABLE);
  }
}
