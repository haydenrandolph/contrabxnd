import { NextResponse } from 'next/server';
import { nodeFetch, nodeConfigured } from '@/lib/node/client';

export const dynamic = 'force-dynamic';

/**
 * Reports whether on-chain data is currently being served by FML's sovereign
 * node or by the public mempool.space fallback. Powers the "NODE" indicator in
 * the terminal status bar.
 */
export async function GET() {
  let source: 'node' | 'public' = 'public';
  let blockHeight: number | null = null;
  let reachable = false;

  try {
    const { res, source: src } = await nodeFetch('/api/blocks/tip/height');
    source = src;
    if (res.ok) {
      reachable = true;
      const h = Number(await res.text());
      if (Number.isFinite(h)) blockHeight = h;
    }
  } catch {
    /* report defaults */
  }

  return NextResponse.json(
    {
      configured: nodeConfigured(),
      source,
      sovereign: source === 'node',
      reachable,
      blockHeight,
    },
    { headers: { 'cache-control': 'public, max-age=10, stale-while-revalidate=30' } },
  );
}
