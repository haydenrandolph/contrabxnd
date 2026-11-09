// Deliberately explicit: directional price questions, ranges and arbitrary BTC
// questions cannot be assumed to have bullish Yes outcomes.
const BULLISH_YES = new Set([
  'will-bitcoin-hit-150k-by-december-31-2026',
  'will-bitcoin-hit-150k-by-june-30-2026',
  'us-national-bitcoin-reserve-before-2027',
  'will-china-unban-bitcoin-by-2027',
]);

export function bullishProbability(slug: string | null, yes: number): number | null {
  return slug && BULLISH_YES.has(slug) && Number.isFinite(yes) && yes >= 0 && yes <= 1 ? yes : null;
}

export function binaryOutcomePrices(outcomes: string, prices: string): { yes: number; no: number } | null {
  try {
    const labels: unknown = JSON.parse(outcomes);
    const values: unknown = JSON.parse(prices);
    if (!Array.isArray(labels) || !Array.isArray(values) || labels.length !== 2 || values.length !== 2) return null;
    const yesIndex = labels.findIndex(v => typeof v === 'string' && v.toLowerCase() === 'yes');
    const noIndex = labels.findIndex(v => typeof v === 'string' && v.toLowerCase() === 'no');
    if (yesIndex < 0 || noIndex < 0) return null;
    if (values.some(v => (typeof v !== 'number' && typeof v !== 'string') || String(v).trim() === '')) return null;
    const yes = Number(values[yesIndex]);
    const no = Number(values[noIndex]);
    if (![yes, no].every(v => Number.isFinite(v) && v >= 0 && v <= 1) || Math.abs(yes + no - 1) > 0.02) return null;
    return { yes, no };
  } catch {
    return null;
  }
}

export interface MarketRow {
  date: string;
  market_id: string;
  question: string;
  slug: string | null;
  outcome_yes: number;
  volume: number;
  liquidity: number;
  active: boolean;
  raw_data: Record<string, unknown>;
}

export function currentBullishMarkets(rows: MarketRow[]) {
  const seen = new Set<string>();
  return rows.flatMap(row => {
    if (seen.has(row.market_id)) return [];
    seen.add(row.market_id);
    const raw = row.raw_data;
    const end = Date.parse(String(raw?.end_date_iso ?? raw?.endDate ?? ''));
    const prices = binaryOutcomePrices(String(raw?.outcomes), String(raw?.outcomePrices));
    // Re-read labeled outcomes so older snapshots with reversed Yes/No are safe.
    if (!prices || !row.active || raw?.closed === true || raw?.active === false ||
        !isFreshDate(row.date, 2) || !Number.isFinite(end) || end <= Date.now() ||
        !Number.isFinite(row.volume) || row.volume <= 0 || !Number.isFinite(row.liquidity) || row.liquidity < 0 ||
        bullishProbability(row.slug, prices.yes) === null) return [];
    return [{ ...row, outcome_yes: prices.yes }];
  });
}
import { isFreshDate } from '../etf/math';
