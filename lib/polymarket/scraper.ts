import type { PolymarketSnapshot, GammaMarket } from './types';

const GAMMA_API = 'https://gamma-api.polymarket.com/markets';

const TRACKED_SLUGS = [
  'will-bitcoin-hit-150k-by-december-31-2026',
  'will-bitcoin-hit-150k-by-june-30-2026',
  'us-national-bitcoin-reserve-before-2027',
  'will-china-unban-bitcoin-by-2027',
];

export async function scrapePolymarket(): Promise<PolymarketSnapshot[]> {
  const today = new Date().toISOString().slice(0, 10);
  const snapshots: PolymarketSnapshot[] = [];

  const res = await fetch(
    `${GAMMA_API}?tag_id=21&limit=50&active=true&closed=false`,
    { cache: 'no-store' },
  );
  if (!res.ok) throw new Error(`Polymarket API: ${res.status}`);

  const markets: GammaMarket[] = await res.json();

  for (const m of markets) {
    const isBtcRelated =
      TRACKED_SLUGS.includes(m.slug) ||
      /bitcoin|btc/i.test(m.question);

    if (!isBtcRelated) continue;

    let prices: number[];
    try {
      prices = JSON.parse(m.outcomePrices);
    } catch {
      continue;
    }

    snapshots.push({
      date: today,
      market_id: String(m.id),
      question: m.question,
      slug: m.slug ?? null,
      outcome_yes: prices[0] ?? 0,
      outcome_no: prices[1] ?? 0,
      volume: parseFloat(m.volume) || 0,
      liquidity: parseFloat(m.liquidity) || 0,
      active: m.active && !m.closed,
      source: 'polymarket:gamma',
      raw_data: m as unknown as Record<string, unknown>,
    });
  }

  return snapshots;
}
