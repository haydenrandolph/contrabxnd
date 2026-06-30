import { NextRequest, NextResponse } from 'next/server';
import { nodeFetch } from '@/lib/node/client';

export const dynamic = 'force-dynamic';

/**
 * Proxy to the Contrabxnd Bitcoin node's mempool API (node-first, public
 * fallback). Keeps the node hostname + Cloudflare Access credentials
 * server-side and gives the browser a single sovereign origin to call.
 *
 * Only whitelisted mempool.space-shaped paths are forwarded — this is NOT an
 * open proxy. The path passed to /api/node/<...> maps 1:1 onto /api/<...> on
 * the upstream mempool API.
 */
const ALLOW: RegExp[] = [
  /^v1\/blocks(\/\d+)?$/, // recent blocks, optionally from a start height
  /^blocks\/tip\/height$/,
  /^mempool$/,
  /^mempool\/recent$/,
  /^v1\/fees\/recommended$/,
  /^v1\/fees\/mempool-blocks$/,
  /^v1\/mining\/hashrate\/[0-9]+[dwmy]?$/, // e.g. 3d, 1w, 1m
  /^v1\/difficulty-adjustment$/,
  /^address\/[a-zA-Z0-9]+$/,
  /^address\/[a-zA-Z0-9]+\/txs(\/(chain|mempool))?$/,
  /^tx\/[a-fA-F0-9]{64}$/,
  /^tx\/[a-fA-F0-9]{64}\/(status|hex|outspends)$/,
  /^block\/[a-fA-F0-9]{64}$/,
  /^block\/[a-fA-F0-9]{64}\/txs(\/\d+)?$/,
  /^block-height\/\d+$/,
];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const subPath = (path ?? []).join('/');

  if (!ALLOW.some((re) => re.test(subPath))) {
    return NextResponse.json({ error: 'Path not allowed' }, { status: 400 });
  }

  try {
    const { res, source } = await nodeFetch(`/api/${subPath}`);
    const body = await res.text();
    const contentType = res.headers.get('content-type') ?? 'application/json';
    return new NextResponse(body, {
      status: res.status,
      headers: {
        'content-type': contentType,
        'x-node-source': source,
        // Short edge cache so the 15s homepage polling doesn't hammer the node.
        'cache-control': 'public, max-age=5, stale-while-revalidate=15',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Upstream unavailable' }, { status: 502 });
  }
}
