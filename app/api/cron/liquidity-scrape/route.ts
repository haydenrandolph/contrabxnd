import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { scrapeLiquidity } from '@/lib/liquidity/scraper';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  try {
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
      console.error('Failed to store liquidity snapshot:', error);
      return NextResponse.json(
        { error: `DB error: ${error.message}`, snapshot },
        { status: 500 },
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
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Liquidity scrape failed:', err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
