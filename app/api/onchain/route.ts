import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getBitcoinPrice } from '@/lib/price';

export const dynamic = 'force-dynamic';

function mvrvLabel(mvrv: number): string {
  if (mvrv < 1) return 'UNDERVALUED';
  if (mvrv < 1.5) return 'ACCUMULATION';
  if (mvrv < 2.4) return 'FAIR VALUE';
  if (mvrv < 3.2) return 'ELEVATED';
  return 'OVERVALUED';
}

/**
 * On-chain valuation: reads the latest aggregates produced by the sovereign
 * UTXO indexer (Supabase) and derives realized price / market cap / MVRV live
 * against the current spot price. Returns { pending: true } until the indexer
 * has run at least once.
 */
export async function GET() {
  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ pending: true, reason: 'no database' });

  const { data: row } = await supabase
    .from('onchain_snapshots')
    .select('date, block_height, total_supply, realized_cap, realized_price, supply_bands, source')
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!row || !row.realized_cap || !row.total_supply) {
    return NextResponse.json({ pending: true, reason: 'indexer has not run yet' });
  }

  const priceResult = await getBitcoinPrice();
  const price = priceResult?.data.price ?? null;

  const realizedPrice = Number(row.realized_price ?? row.realized_cap / row.total_supply);
  const marketCap = price != null ? price * Number(row.total_supply) : null;
  const mvrv = marketCap != null ? marketCap / Number(row.realized_cap) : null;

  return NextResponse.json({
    pending: false,
    date: row.date,
    block_height: row.block_height,
    total_supply: Number(row.total_supply),
    realized_cap: Number(row.realized_cap),
    realized_price: realizedPrice,
    market_cap: marketCap,
    spot_price: price,
    mvrv: mvrv != null ? +mvrv.toFixed(3) : null,
    mvrv_label: mvrv != null ? mvrvLabel(mvrv) : null,
    supply_bands: row.supply_bands ?? null,
    source: row.source,
  });
}
