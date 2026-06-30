import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { createAdminClient } from '@/lib/supabase/server';
import { nodeJson, nodeFetch } from '@/lib/node/client';
import crypto from 'crypto';
import { z } from 'zod';

// ── Node indexer types (mempool.space API shape) ──
interface AddrStats {
  funded_txo_count: number;
  funded_txo_sum: number;
  spent_txo_count: number;
  spent_txo_sum: number;
  tx_count: number;
}
interface AddrInfo {
  address: string;
  chain_stats: AddrStats;
  mempool_stats: AddrStats;
}
interface TxStatus {
  confirmed: boolean;
  block_height?: number;
  block_time?: number;
}
interface AddrTx {
  txid: string;
  fee: number;
  status: TxStatus;
}

const SATS = 1e8;
const ok = (obj: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(obj, null, 2) }] });
const fail = (msg: string) => ({ content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }, null, 2) }], isError: true });

export const dynamic = 'force-dynamic';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.contrabxnd.io';

function hashKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

async function validateApiKey(req: Request): Promise<boolean> {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer cbx_')) return false;

  const key = auth.slice(7);
  const keyHash = hashKey(key);

  const supabase = createAdminClient();
  if (!supabase) return false;

  const { data } = await supabase
    .from('api_keys')
    .select('id')
    .eq('key_hash', keyHash)
    .is('revoked_at', null)
    .limit(1)
    .single();

  if (!data) return false;

  supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id)
    .then(() => {});

  return true;
}

async function fetchInternal(path: string) {
  const res = await fetch(`${BASE_URL}${path}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json();
}

function createServer() {
  const server = new McpServer({
    name: 'contrabxnd',
    version: '1.0.0',
  });

  server.tool(
    'get_signal_score',
    'Get the composite Contrabxnd Score (-100 bearish to +100 bullish) with all component breakdowns',
    {},
    async () => {
      const data = await fetchInternal('/api/signal');
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
    },
  );

  server.tool(
    'get_bitcoin_price',
    'Get current Bitcoin price, 24h change, and market data',
    {},
    async () => {
      const data = await fetchInternal('/api/price');
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
    },
  );

  server.tool(
    'get_net_liquidity',
    'Get net liquidity data: Fed balance sheet (WALCL), TGA, reverse repo, M2, bank reserves, 13-week momentum',
    {},
    async () => {
      const data = await fetchInternal('/api/liquidity');
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
    },
  );

  server.tool(
    'get_fedwatch',
    'Get FedWatch rate probabilities: cut/hold/hike odds for upcoming FOMC meetings, current fed funds rate',
    {},
    async () => {
      const data = await fetchInternal('/api/fedwatch');
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
    },
  );

  server.tool(
    'get_etf_flows',
    'Get Bitcoin ETF flow data: ARKB, IBIT shares outstanding, NAV, net inflows/outflows',
    {},
    async () => {
      const data = await fetchInternal('/api/etf-flows');
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
    },
  );

  server.tool(
    'get_polymarket',
    'Get Polymarket prediction market data for Bitcoin: market questions, Yes/No probabilities, volume, avg bull probability',
    {},
    async () => {
      const data = await fetchInternal('/api/polymarket');
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
    },
  );

  server.tool(
    'get_fear_greed',
    'Get Bitcoin Fear & Greed Index (0-100): 0-25 extreme fear, 75-100 extreme greed',
    {},
    async () => {
      const data = await fetchInternal('/api/fear-greed');
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
    },
  );

  server.tool(
    'get_slr',
    'Get SLR (Supplementary Leverage Ratio) regime data: policy signal, leverage subindex, easing/tightening status',
    {},
    async () => {
      const data = await fetchInternal('/api/slr');
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
    },
  );

  server.tool(
    'get_market_brief',
    'Get a comprehensive market intelligence brief combining all signals: score, liquidity, FedWatch, ETF flows, Polymarket, fear & greed, SLR',
    {},
    async () => {
      const [signal, liquidity, fedwatch, etf, polymarket, fearGreed, slr, price] = await Promise.allSettled([
        fetchInternal('/api/signal'),
        fetchInternal('/api/liquidity'),
        fetchInternal('/api/fedwatch'),
        fetchInternal('/api/etf-flows'),
        fetchInternal('/api/polymarket'),
        fetchInternal('/api/fear-greed'),
        fetchInternal('/api/slr'),
        fetchInternal('/api/price'),
      ]);

      const brief = {
        timestamp: new Date().toISOString(),
        price: price.status === 'fulfilled' ? price.value : null,
        signal: signal.status === 'fulfilled' ? signal.value : null,
        liquidity: liquidity.status === 'fulfilled' ? liquidity.value : null,
        fedwatch: fedwatch.status === 'fulfilled' ? fedwatch.value : null,
        etf_flows: etf.status === 'fulfilled' ? etf.value : null,
        polymarket: polymarket.status === 'fulfilled' ? polymarket.value : null,
        fear_greed: fearGreed.status === 'fulfilled' ? fearGreed.value : null,
        slr: slr.status === 'fulfilled' ? slr.value : null,
      };

      return { content: [{ type: 'text' as const, text: JSON.stringify(brief, null, 2) }] };
    },
  );

  server.tool(
    'get_bitcoin_history',
    'Get historical Bitcoin price data for a date range',
    { start_date: z.string().describe('Start date (YYYY-MM-DD)'), end_date: z.string().describe('End date (YYYY-MM-DD)') },
    async ({ start_date, end_date }) => {
      const data = await fetchInternal(`/api/bitcoin-history?start=${start_date}&end=${end_date}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
    },
  );

  server.tool(
    'get_mining_intelligence',
    'Get hash rate and difficulty intelligence: Hash Ribbon state (miner capitulation/recovery bottom signal), 30d/60d hashrate MAs, Difficulty Ribbon compression, and the next difficulty-adjustment forecast.',
    {},
    async () => {
      const data = await fetchInternal('/api/hashrate');
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
    },
  );

  server.tool(
    'get_daily_brief',
    'Get the latest AI-generated daily intelligence brief: headline, summary, and section-by-section analysis',
    {},
    async () => {
      const data = await fetchInternal('/api/brief');
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
    },
  );

  // ── Phase 2: Indexer tools (query the blockchain through the Contrabxnd node) ──

  server.tool(
    'query_address',
    'Look up any Bitcoin address: confirmed balance, total received/sent, transaction count, and unconfirmed (mempool) activity. Served by the Contrabxnd node.',
    { address: z.string().describe('Bitcoin address (legacy, SegWit, or Taproot)') },
    async ({ address }) => {
      try {
        const { data, source } = await nodeJson<AddrInfo>(`/api/address/${encodeURIComponent(address)}`);
        const cs = data.chain_stats;
        const ms = data.mempool_stats;
        const balanceSats = cs.funded_txo_sum - cs.spent_txo_sum;
        return ok({
          address: data.address,
          balance_btc: balanceSats / SATS,
          balance_sats: balanceSats,
          total_received_btc: cs.funded_txo_sum / SATS,
          total_sent_btc: cs.spent_txo_sum / SATS,
          tx_count: cs.tx_count,
          unconfirmed_tx_count: ms.tx_count,
          unconfirmed_balance_sats: ms.funded_txo_sum - ms.spent_txo_sum,
          data_source: source,
        });
      } catch {
        return fail(`Could not look up address "${address}". Check that it is a valid Bitcoin address.`);
      }
    },
  );

  server.tool(
    'query_transaction',
    'Get full details for a transaction: inputs, outputs, fee, size, and confirmation status. Served by the Contrabxnd node.',
    { txid: z.string().describe('64-character transaction id (hex)') },
    async ({ txid }) => {
      if (!/^[a-fA-F0-9]{64}$/.test(txid)) return fail('txid must be a 64-character hex string.');
      try {
        const { data, source } = await nodeJson<{ fee: number; status: TxStatus; weight: number }>(`/api/tx/${txid}`);
        return ok({ ...data, fee_btc: (data.fee ?? 0) / SATS, vsize: Math.ceil(data.weight / 4), data_source: source });
      } catch {
        return fail(`Transaction ${txid} not found.`);
      }
    },
  );

  server.tool(
    'query_block',
    'Get a block by height or hash: header, miner pool (if known), tx count, size, weight, and difficulty. Served by the Contrabxnd node.',
    { id: z.string().describe('Block height (e.g. "840000") or 64-char block hash') },
    async ({ id }) => {
      try {
        let hash = id;
        if (/^\d+$/.test(id)) {
          const { res } = await nodeFetch(`/api/block-height/${id}`);
          if (!res.ok) return fail(`Block height ${id} not found.`);
          hash = (await res.text()).trim();
        } else if (!/^[a-fA-F0-9]{64}$/.test(id)) {
          return fail('Provide a numeric block height or a 64-character block hash.');
        }
        const { data, source } = await nodeJson<Record<string, unknown>>(`/api/block/${hash}`);
        return ok({ ...data, data_source: source });
      } catch {
        return fail(`Block "${id}" not found.`);
      }
    },
  );

  server.tool(
    'get_mempool_analysis',
    'Real-time mempool state: pending transaction count, total size, accumulated fees, and recommended fee rates by priority. Served by the Contrabxnd node.',
    {},
    async () => {
      try {
        const [mp, fees] = await Promise.all([
          nodeJson<{ count: number; vsize: number; total_fee: number }>('/api/mempool'),
          nodeJson<Record<string, number>>('/api/v1/fees/recommended'),
        ]);
        return ok({
          pending_tx_count: mp.data.count,
          mempool_vsize_mb: +(mp.data.vsize / 1e6).toFixed(2),
          total_fees_btc: mp.data.total_fee / SATS,
          recommended_fees_sat_vb: fees.data,
          data_source: mp.source,
        });
      } catch {
        return fail('Could not read mempool state from the node.');
      }
    },
  );

  server.tool(
    'estimate_fee',
    'Smart fee estimation (sat/vB) for next-block, 30-minute, 1-hour, and economy confirmation targets, from the Contrabxnd node mempool.',
    {},
    async () => {
      try {
        const { data, source } = await nodeJson<Record<string, number>>('/api/v1/fees/recommended');
        return ok({ fees_sat_vb: data, data_source: source });
      } catch {
        return fail('Could not estimate fees from the node.');
      }
    },
  );

  server.tool(
    'get_address_history',
    'Recent transaction history for an address (most recent first, up to 50): txid, fee, and confirmation status. Served by the Contrabxnd node.',
    { address: z.string().describe('Bitcoin address') },
    async ({ address }) => {
      try {
        const { data, source } = await nodeJson<AddrTx[]>(`/api/address/${encodeURIComponent(address)}/txs`);
        return ok({
          address,
          count: data.length,
          transactions: data.map((tx) => ({
            txid: tx.txid,
            fee_sats: tx.fee,
            confirmed: tx.status.confirmed,
            block_height: tx.status.block_height ?? null,
            block_time: tx.status.block_time ?? null,
          })),
          data_source: source,
        });
      } catch {
        return fail(`Could not load history for address "${address}".`);
      }
    },
  );

  return server;
}

async function handleMcpRequest(req: Request): Promise<Response> {
  const server = createServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  await server.connect(transport);

  try {
    return await transport.handleRequest(req);
  } finally {
    await transport.close();
    await server.close();
  }
}

async function authGuard(req: Request): Promise<Response | null> {
  const valid = await validateApiKey(req);
  if (!valid) {
    return new Response(
      JSON.stringify({ jsonrpc: '2.0', error: { code: -32001, message: 'Invalid or missing API key. Get one at https://contrabxnd.io/infra/mcp' }, id: null }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }
  return null;
}

export async function POST(req: Request) {
  const denied = await authGuard(req);
  if (denied) return denied;
  return handleMcpRequest(req);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  if (!url.searchParams.has('sessionId')) {
    return new Response(JSON.stringify({
      name: 'contrabxnd',
      version: '1.0.0',
      description: 'Contrabxnd Bitcoin Intelligence Platform - MCP Server. Get your API key at https://contrabxnd.io/infra/mcp',
      tools: [
        'get_signal_score', 'get_bitcoin_price', 'get_net_liquidity',
        'get_fedwatch', 'get_etf_flows', 'get_polymarket',
        'get_fear_greed', 'get_slr', 'get_market_brief', 'get_bitcoin_history',
        'get_daily_brief', 'get_mining_intelligence',
        // Phase 2 — Indexer (Contrabxnd node)
        'query_address', 'query_transaction', 'query_block',
        'get_mempool_analysis', 'estimate_fee', 'get_address_history',
      ],
    }), { headers: { 'Content-Type': 'application/json' } });
  }
  const denied = await authGuard(req);
  if (denied) return denied;
  return handleMcpRequest(req);
}

export async function DELETE(req: Request) {
  const denied = await authGuard(req);
  if (denied) return denied;
  return handleMcpRequest(req);
}
