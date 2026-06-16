import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

const FRED_BASE = 'https://api.stlouisfed.org/fred/series/observations';
const FRED_TGA_SERIES = 'WTREGEN';
const NYFED_RRP = 'https://markets.newyorkfed.org/api/rp/reverserepo/propositions/search.json';

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createServiceClient(url, key);
}

async function fetchFredHistory(
  seriesId: string,
  apiKey: string,
  startDate: string,
  endDate: string
): Promise<Array<{ date: string; value: number }>> {
  const url = `${FRED_BASE}?series_id=${seriesId}&observation_start=${startDate}&observation_end=${endDate}&sort_order=asc&file_type=json&api_key=${apiKey}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`FRED ${seriesId}: ${res.status}`);
  const data = await res.json();
  return (data.observations || [])
    .filter((o: { value: string }) => o.value !== '.')
    .map((o: { date: string; value: string }) => ({
      date: o.date,
      value: parseFloat(o.value),
    }));
}

async function fetchFredTGA(
  apiKey: string,
  startDate: string,
  endDate: string
): Promise<Array<{ date: string; value: number }>> {
  return fetchFredHistory(FRED_TGA_SERIES, apiKey, startDate, endDate);
}

async function fetchNYFedRRP(
  startDate: string,
  endDate: string
): Promise<Array<{ date: string; value: number }>> {
  const results: Array<{ date: string; value: number }> = [];
  const url = `${NYFED_RRP}?startDate=${startDate}&endDate=${endDate}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return results;
  const data = await res.json();
  const ops = data?.repo?.operations || [];

  for (const op of ops) {
    const val = parseFloat(op.totalAmtAccepted);
    if (!isNaN(val) && op.operationDate) {
      results.push({ date: op.operationDate, value: val });
    }
  }

  return results;
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const fredKey = process.env.FRED_API_KEY;
  if (!fredKey) {
    return NextResponse.json({ error: 'FRED_API_KEY not set' }, { status: 500 });
  }

  const sb = supabaseAdmin();
  const endDate = new Date().toISOString().slice(0, 10);
  const startDate = '2022-01-01';

  const stats = { liquidity: 0, slr: 0, errors: [] as string[] };

  try {
    // Fetch all FRED series in parallel
    const [walcl, wresbal, m2, nfci, qbpbs] = await Promise.all([
      fetchFredHistory('WALCL', fredKey, startDate, endDate),
      fetchFredHistory('WRESBAL', fredKey, startDate, endDate),
      fetchFredHistory('M2SL', fredKey, startDate, endDate),
      fetchFredHistory('NFCILEVERAGE', fredKey, startDate, endDate),
      fetchFredHistory('QBPBSLEVK', fredKey, startDate, endDate),
    ]);

    // Fetch TGA from FRED (WTREGEN — weekly, in millions)
    const tga = await fetchFredTGA(fredKey, startDate, endDate);

    // Fetch NY Fed RRP
    const rrp = await fetchNYFedRRP(startDate, endDate);

    // Build date-keyed maps
    const walclMap = new Map(walcl.map(d => [d.date, d.value]));
    const wresbalMap = new Map(wresbal.map(d => [d.date, d.value]));
    const m2Map = new Map(m2.map(d => [d.date, d.value]));
    const tgaMap = new Map(tga.map(d => [d.date, d.value]));
    const rrpMap = new Map(rrp.map(d => [d.date, d.value]));

    // FRED weekly data needs forward-filling to daily
    // Collect all unique dates across all sources
    const allDates = new Set<string>();
    for (const arr of [walcl, wresbal, m2, tga, rrp]) {
      for (const d of arr) allDates.add(d.date);
    }
    const sortedDates = [...allDates].sort();

    // Forward-fill weekly/monthly FRED data
    function forwardFill(map: Map<string, number>, dates: string[]): Map<string, number> {
      const filled = new Map<string, number>();
      let lastVal: number | null = null;
      for (const d of dates) {
        if (map.has(d)) lastVal = map.get(d)!;
        if (lastVal !== null) filled.set(d, lastVal);
      }
      return filled;
    }

    const walclFilled = forwardFill(walclMap, sortedDates);
    const wresbalFilled = forwardFill(wresbalMap, sortedDates);
    const m2Filled = forwardFill(m2Map, sortedDates);
    const tgaFilled = forwardFill(tgaMap, sortedDates);

    // Build liquidity snapshots for all dates where we have RRP (daily anchor)
    const liquidityRows: Array<Record<string, unknown>> = [];
    const dailyDates = new Set([...rrpMap.keys()]);

    for (const date of [...dailyDates].sort()) {
      const fedBs = walclFilled.get(date) ?? null;
      const tgaBal = tgaFilled.get(date) ?? null;
      const rrpBal = rrpMap.get(date) ?? null;
      const bankRes = wresbalFilled.get(date) ?? null;
      const m2Val = m2Filled.get(date) ?? null;

      // FRED data (WALCL, WTREGEN, M2) is in millions; NY Fed RRP is in raw dollars
      const tgaMillions = tgaBal;
      const rrpMillions = rrpBal ? rrpBal / 1_000_000 : null;

      const netLiquidity =
        fedBs != null && tgaMillions != null && rrpMillions != null
          ? fedBs - tgaMillions - rrpMillions
          : null;

      liquidityRows.push({
        date,
        fed_balance_sheet: fedBs,
        tga_balance: tgaMillions,
        reverse_repo: rrpMillions,
        bank_reserves: bankRes,
        m2: m2Val,
        net_liquidity: netLiquidity,
        source: 'backfill:fred+treasury+nyfed',
      });
    }

    // Upsert liquidity in batches
    const BATCH_SIZE = 500;
    for (let i = 0; i < liquidityRows.length; i += BATCH_SIZE) {
      const batch = liquidityRows.slice(i, i + BATCH_SIZE);
      const { error } = await sb
        .from('liquidity_snapshots')
        .upsert(batch, { onConflict: 'date' });
      if (error) stats.errors.push(`liquidity batch ${i}: ${error.message}`);
      else stats.liquidity += batch.length;
    }

    // Build SLR snapshots from NFCI leverage data
    const nfciMap = new Map(nfci.map(d => [d.date, d.value]));
    const qbpbsMap = new Map(qbpbs.map(d => [d.date, d.value]));

    const slrRows: Array<Record<string, unknown>> = [];
    for (const { date, value } of nfci) {
      slrRows.push({
        date,
        leverage_subindex: value,
        tier1_leverage_capital: qbpbsMap.get(date) ?? null,
        policy_signal: 0,
        policy_event: null,
        source: 'backfill:fred',
      });
    }

    for (let i = 0; i < slrRows.length; i += BATCH_SIZE) {
      const batch = slrRows.slice(i, i + BATCH_SIZE);
      const { error } = await sb
        .from('slr_snapshots')
        .upsert(batch, { onConflict: 'date' });
      if (error) stats.errors.push(`slr batch ${i}: ${error.message}`);
      else stats.slr += batch.length;
    }
  } catch (err) {
    stats.errors.push(err instanceof Error ? err.message : String(err));
  }

  return NextResponse.json({
    success: stats.errors.length === 0,
    stats: {
      liquidity_rows: stats.liquidity,
      slr_rows: stats.slr,
      date_range: `${startDate} to ${endDate}`,
    },
    errors: stats.errors.length > 0 ? stats.errors : undefined,
  });
}
