import { NextResponse } from 'next/server';
import { cronGuard } from '@/lib/audit-guards';
import { createAdminClient } from '@/lib/supabase/server';
import { scrapeLiquidity } from '@/lib/liquidity/scraper';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request: Request) {
  const denied = cronGuard(request);
  if (denied) return denied;

  try {
    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const snapshot = await scrapeLiquidity();

    const { error } = await supabase.from('liquidity_snapshots').upsert(
      {
        date: snapshot.date,
        fed_balance_sheet: snapshot.fed_balance_sheet,
        tga_balance: snapshot.tga_balance,
        reverse_repo: snapshot.reverse_repo,
        bank_reserves: snapshot.bank_reserves,
        m2: snapshot.m2,
        net_liquidity: snapshot.net_liquidity,
        sofr: snapshot.sofr,
        effr: snapshot.effr,
        source: snapshot.source,
        raw_data: snapshot.raw_data,
      },
      { onConflict: 'date' },
    );

    if (error) {
      return NextResponse.json(
        { error: 'Liquidity snapshot write failed' },
        { status: 503 },
      );
    }

    return NextResponse.json({
      status: 'stored',
      date: snapshot.date,
      net_liquidity: snapshot.net_liquidity,
      fed_balance_sheet: snapshot.fed_balance_sheet,
      tga_balance: snapshot.tga_balance,
      reverse_repo: snapshot.reverse_repo,
      sofr: snapshot.sofr,
      effr: snapshot.effr,
    });
  } catch {
    return NextResponse.json({ error: 'Liquidity ingestion failed' }, { status: 503 });
  }
}
