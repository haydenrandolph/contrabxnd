import type { LiquiditySnapshot } from './types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

/** Parse a numeric string, returning null on failure. */
function safeParseFloat(value: string | undefined | null): number | null {
  if (!value || value === '.') return null;
  const n = parseFloat(value);
  return isNaN(n) ? null : n;
}

// ---------------------------------------------------------------------------
// 1. Treasury General Account (TGA) — Treasury Fiscal Data API (no auth)
// ---------------------------------------------------------------------------

interface TgaResult {
  tga_balance: number | null; // in millions USD
  raw: unknown;
}

async function fetchTGA(): Promise<TgaResult> {
  try {
    // Request the last 30 days of TGA closing balances to ensure we get data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const since = thirtyDaysAgo.toISOString().split('T')[0];

    const url =
      `https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/dts/operating_cash_balance` +
      `?filter=account_type:eq:Treasury General Account (TGA) Closing Balance,record_date:gte:${since}` +
      `&sort=-record_date&page[size]=5`;

    const res = await fetch(url, {
      headers: { 'User-Agent': BROWSER_UA, Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) throw new Error(`Treasury API ${res.status}`);

    const data = await res.json();
    const record = data?.data?.[0];

    if (!record) {
      console.warn('TGA: No records returned');
      return { tga_balance: null, raw: data };
    }

    // Treasury API reports in millions USD (dataFormat "$1,000,000")
    const rawValue = safeParseFloat(
      record.open_today_bal ?? record.close_today_bal,
    );

    const tga_balance = rawValue;

    return { tga_balance, raw: record };
  } catch (err) {
    console.error('TGA fetch failed:', err);
    return { tga_balance: null, raw: { error: String(err) } };
  }
}

// ---------------------------------------------------------------------------
// 2. Reverse Repo (RRP) — NY Fed Markets API (no auth)
// ---------------------------------------------------------------------------

interface RrpResult {
  reverse_repo: number | null; // in millions USD
  raw: unknown;
}

async function fetchRRP(): Promise<RrpResult> {
  try {
    const url =
      'https://markets.newyorkfed.org/api/rp/all/all/results/lastTwoWeeks.json';

    const res = await fetch(url, {
      headers: { 'User-Agent': BROWSER_UA, Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) throw new Error(`NY Fed RRP API ${res.status}`);

    const data = await res.json();

    // The response contains repo operations. We want the overnight reverse-repo
    // aggregate. The structure has `repo.operations[]` — look for the most recent
    // overnight RRP entry with totalAmtAccepted.
    const operations = data?.repo?.operations;

    if (!Array.isArray(operations) || operations.length === 0) {
      console.warn('RRP: No operations returned');
      return { reverse_repo: null, raw: data };
    }

    // Find the most recent overnight reverse-repo operation
    // Operations are typically sorted by date descending.
    // Look for operationType containing "Reverse Repo" or note "RRP"
    let latestRrp: number | null = null;
    let latestRecord: unknown = null;

    for (const op of operations) {
      // NY Fed reports totalAmtAccepted in raw dollars. Convert to millions
      // to match FRED/Treasury units. Filter for Reverse Repo operations.
      if (op.operationType !== 'Reverse Repo') continue;
      const total = safeParseFloat(op.totalAmtAccepted);
      if (total !== null) {
        latestRrp = Math.round((total / 1_000_000) * 100) / 100;
        latestRecord = op;
        break;
      }
    }

    return { reverse_repo: latestRrp, raw: latestRecord ?? operations[0] };
  } catch (err) {
    console.error('RRP fetch failed:', err);
    return { reverse_repo: null, raw: { error: String(err) } };
  }
}

// ---------------------------------------------------------------------------
// 3. FRED series — requires FRED_API_KEY
// ---------------------------------------------------------------------------

interface FredSeriesResult {
  value: number | null; // in millions USD (as-is from FRED)
  date: string | null;
  raw: unknown;
}

async function fetchFredSeries(
  seriesId: string,
  apiKey: string,
): Promise<FredSeriesResult> {
  try {
    const url =
      `https://api.stlouisfed.org/fred/series/observations` +
      `?series_id=${seriesId}&sort_order=desc&limit=1&file_type=json&api_key=${apiKey}`;

    const res = await fetch(url, { cache: 'no-store' });

    if (!res.ok) throw new Error(`FRED ${seriesId} ${res.status}`);

    const data = await res.json();
    const obs = data?.observations?.[0];

    if (!obs) {
      console.warn(`FRED ${seriesId}: No observations`);
      return { value: null, date: null, raw: data };
    }

    const value = safeParseFloat(obs.value);
    return { value, date: obs.date ?? null, raw: obs };
  } catch (err) {
    console.error(`FRED ${seriesId} fetch failed:`, err);
    return { value: null, date: null, raw: { error: String(err) } };
  }
}

// ---------------------------------------------------------------------------
// 4. SOFR / EFFR rates — NY Fed (no auth)
// ---------------------------------------------------------------------------

interface RatesResult {
  sofr: number | null;
  effr: number | null;
  raw: unknown;
}

async function fetchRates(): Promise<RatesResult> {
  try {
    const url = 'https://markets.newyorkfed.org/api/rates/all/latest.json';

    const res = await fetch(url, {
      headers: { 'User-Agent': BROWSER_UA, Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) throw new Error(`NY Fed Rates API ${res.status}`);

    const data = await res.json();
    const refRates = data?.refRates;

    let sofr: number | null = null;
    let effr: number | null = null;

    if (Array.isArray(refRates)) {
      for (const rate of refRates) {
        if (rate.type === 'SOFR') {
          sofr = safeParseFloat(rate.percentRate);
        } else if (rate.type === 'EFFR') {
          effr = safeParseFloat(rate.percentRate);
        }
      }
    }

    return { sofr, effr, raw: refRates ?? data };
  } catch (err) {
    console.error('Rates fetch failed:', err);
    return { sofr: null, effr: null, raw: { error: String(err) } };
  }
}

// ---------------------------------------------------------------------------
// 5. Main scraper — assemble the full LiquiditySnapshot
// ---------------------------------------------------------------------------

export async function scrapeLiquidity(): Promise<LiquiditySnapshot> {
  const today = new Date().toISOString().split('T')[0];
  const fredKey = process.env.FRED_API_KEY;

  // Kick off all independent fetches in parallel
  const [tgaResult, rrpResult, ratesResult, walclResult, wresbalResult, m2Result] =
    await Promise.all([
      fetchTGA(),
      fetchRRP(),
      fetchRates(),
      fredKey
        ? fetchFredSeries('WALCL', fredKey)
        : (console.warn('FRED_API_KEY not set — skipping WALCL, WRESBAL, M2SL'),
          Promise.resolve({ value: null, date: null, raw: { skipped: 'no FRED_API_KEY' } } as FredSeriesResult)),
      fredKey
        ? fetchFredSeries('WRESBAL', fredKey)
        : Promise.resolve({ value: null, date: null, raw: { skipped: 'no FRED_API_KEY' } } as FredSeriesResult),
      fredKey
        ? fetchFredSeries('M2SL', fredKey)
        : Promise.resolve({ value: null, date: null, raw: { skipped: 'no FRED_API_KEY' } } as FredSeriesResult),
    ]);

  // Compute net liquidity only when all three components are available
  let net_liquidity: number | null = null;

  if (
    walclResult.value !== null &&
    tgaResult.tga_balance !== null &&
    rrpResult.reverse_repo !== null
  ) {
    net_liquidity =
      Math.round(
        (walclResult.value - tgaResult.tga_balance - rrpResult.reverse_repo) * 100,
      ) / 100;
  }

  return {
    date: today,
    fed_balance_sheet: walclResult.value,
    tga_balance: tgaResult.tga_balance,
    reverse_repo: rrpResult.reverse_repo,
    bank_reserves: wresbalResult.value,
    m2: m2Result.value,
    net_liquidity,
    sofr: ratesResult.sofr,
    effr: ratesResult.effr,
    source: 'fred+treasury+nyfed',
    raw_data: {
      walcl: walclResult.raw,
      walcl_date: walclResult.date,
      tga: tgaResult.raw,
      rrp: rrpResult.raw,
      wresbal: wresbalResult.raw,
      wresbal_date: wresbalResult.date,
      m2: m2Result.raw,
      m2_date: m2Result.date,
      rates: ratesResult.raw,
    },
  };
}
