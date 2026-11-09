import type { PolymarketSnapshot, GammaMarket } from './types';
import { binaryOutcomePrices, bullishProbability } from './math';

const GAMMA_API = 'https://gamma-api.polymarket.com/markets';

export async function scrapePolymarket(): Promise<PolymarketSnapshot[]> {
  const today = new Date().toISOString().slice(0, 10);
  const snapshots: PolymarketSnapshot[] = [];

  const res = await fetch(
    `${GAMMA_API}?tag_id=21&limit=50&active=true&closed=false`,
    { cache: 'no-store', signal: AbortSignal.timeout(8000) },
  );
  if (!res.ok) throw new Error(`Polymarket API: ${res.status}`);

  const markets: GammaMarket[] = await res.json();

  for (const m of markets) {
    const prices = binaryOutcomePrices(m.outcomes, m.outcomePrices);
    const end = Date.parse(m.end_date_iso ?? m.endDate ?? '');
    if (!prices || bullishProbability(m.slug, prices.yes) === null || !m.active || m.closed ||
        !Number.isFinite(end) || end <= Date.now()) continue;
    const volume = Number.parseFloat(m.volume);
    const liquidity = Number.parseFloat(m.liquidity);
    if (!Number.isFinite(volume) || volume <= 0 || !Number.isFinite(liquidity) || liquidity < 0) continue;

    snapshots.push({
      date: today,
      market_id: String(m.id),
      question: m.question,
      slug: m.slug ?? null,
      outcome_yes: prices.yes,
      outcome_no: prices.no,
      volume,
      liquidity,
      active: m.active && !m.closed,
      source: 'polymarket:gamma',
      raw_data: m as unknown as Record<string, unknown>,
    });
  }

  return snapshots;
}
