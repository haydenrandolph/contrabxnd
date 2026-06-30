import { NextResponse } from 'next/server';
import { lndConfigured, getInfo, listChannels } from '@/lib/lightning/client';

export const dynamic = 'force-dynamic';

let cache: { data: unknown; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 60 * 1000;

/**
 * Public-safe Lightning node info for the /infra/lightning page: identity,
 * alias, channel count, total public capacity, connect URIs. Deliberately does
 * NOT expose balances (those are sensitive and live behind the authed MCP).
 */
export async function GET() {
  if (!lndConfigured()) {
    return NextResponse.json({ configured: false });
  }
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return NextResponse.json(cache.data);
  }
  try {
    const [info, channels] = await Promise.all([getInfo(), listChannels().catch(() => [])]);
    const totalCapacity = channels.reduce((s, c) => s + c.capacity_sat, 0);
    const data = {
      configured: true,
      online: info.synced_to_chain,
      alias: info.alias,
      pubkey: info.identity_pubkey,
      num_channels: info.num_active_channels,
      num_peers: info.num_peers,
      total_capacity_sat: totalCapacity,
      block_height: info.block_height,
      uris: info.uris ?? [],
      version: info.version,
    };
    cache = { data, fetchedAt: Date.now() };
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ configured: true, online: false, error: 'Lightning node unreachable' });
  }
}
