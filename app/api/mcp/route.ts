import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { createAdminClient } from '@/lib/supabase/server';
import { nodeJson, nodeFetch } from '@/lib/node/client';
import { decodeScript } from '@/lib/node/script';
import { lndConfigured, getInfo, getBalances, listChannels, createInvoice, decodeInvoice } from '@/lib/lightning/client';
import { PAYWALL } from '@/lib/lightning/l402';
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
interface Vout {
  scriptpubkey_address?: string;
  scriptpubkey_type?: string;
  value: number;
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
    'get_onchain_metrics',
    'Get on-chain valuation from the sovereign UTXO indexer: realized cap, realized price, MVRV ratio (with valuation label), total supply, and supply-by-age bands (HODL waves).',
    {},
    async () => {
      const data = await fetchInternal('/api/onchain');
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

  server.tool(
    'trace_funds',
    'Follow Bitcoin forward through the transaction graph from a starting txid, hop by hop along the largest spent output (the main flow). Reports where funds went and where they currently rest. Served by the Contrabxnd node.',
    {
      txid: z.string().describe('Starting transaction id (64-char hex)'),
      max_hops: z.number().int().min(1).max(10).optional().describe('How many hops to follow (default 5)'),
    },
    async ({ txid, max_hops }) => {
      if (!/^[a-fA-F0-9]{64}$/.test(txid)) return fail('txid must be a 64-character hex string.');
      const hops = max_hops ?? 5;
      const trail: unknown[] = [];
      let current = txid;
      let source: string | null = null;
      try {
        for (let i = 0; i < hops; i++) {
          const [{ data: tx, source: s }, { data: spends }] = await Promise.all([
            nodeJson<{ vout: Vout[] }>(`/api/tx/${current}`),
            nodeJson<Array<{ spent: boolean; txid: string | null }>>(`/api/tx/${current}/outspends`),
          ]);
          source = s;
          const spentIdx = spends
            .map((o, idx) => ({ o, idx }))
            .filter((x) => x.o.spent)
            .sort((a, b) => (tx.vout[b.idx]?.value ?? 0) - (tx.vout[a.idx]?.value ?? 0));
          const spentCount = spentIdx.length;
          if (spentCount === 0) {
            trail.push({ hop: i + 1, txid: current, note: 'Funds at rest — all outputs unspent.', outputs: tx.vout.length });
            break;
          }
          const top = spentIdx[0];
          const out = tx.vout[top.idx];
          trail.push({
            hop: i + 1,
            txid: current,
            followed_output: top.idx,
            address: out.scriptpubkey_address ?? out.scriptpubkey_type ?? 'unknown',
            value_btc: out.value / SATS,
            spent_in: spends[top.idx].txid,
            total_outputs: tx.vout.length,
            spent_outputs: spentCount,
            note: spentCount > 1 ? `Fan-out: ${spentCount} of ${tx.vout.length} outputs spent; following the largest.` : undefined,
          });
          const next = spends[top.idx].txid;
          if (!next) break;
          current = next;
        }
        return ok({ start: txid, hops_followed: trail.length, data_source: source, trail });
      } catch {
        return fail(`Could not trace from ${txid}.`);
      }
    },
  );

  server.tool(
    'decode_script',
    'Decode a Bitcoin script (scriptPubKey hex) into readable ASM and explain its type — P2PKH, P2SH, P2WPKH, P2WSH, P2TR, P2PK, OP_RETURN, bare multisig, or non-standard.',
    { script: z.string().describe('Script as a hex string (e.g. a scriptPubKey)') },
    async ({ script }) => {
      const decoded = decodeScript(script);
      if (!decoded) return fail('Invalid script hex. Provide an even-length hexadecimal string.');
      return ok(decoded);
    },
  );

  // ── Phase 3: Lightning (read + receive, via the Contrabxnd LND node) ──

  const lnGuard = () =>
    lndConfigured() ? null : fail('Lightning node not connected yet. Coming online soon.');

  server.tool(
    'get_node_info',
    "Get the Contrabxnd Lightning node's public info: pubkey, alias, active channel count, peers, sync status, and connect URIs.",
    {},
    async () => {
      const g = lnGuard();
      if (g) return g;
      try {
        const i = await getInfo();
        return ok({
          pubkey: i.identity_pubkey,
          alias: i.alias,
          active_channels: i.num_active_channels,
          peers: i.num_peers,
          synced_to_chain: i.synced_to_chain,
          block_height: i.block_height,
          version: i.version,
          uris: i.uris ?? [],
        });
      } catch {
        return fail('Lightning node unreachable.');
      }
    },
  );

  server.tool(
    'get_lightning_balance',
    "Get the Contrabxnd node's Lightning channel balances (local/remote/pending) and on-chain wallet balances, in satoshis.",
    {},
    async () => {
      const g = lnGuard();
      if (g) return g;
      try {
        return ok(await getBalances());
      } catch {
        return fail('Lightning node unreachable.');
      }
    },
  );

  server.tool(
    'list_channels',
    'List the active Lightning channels on the Contrabxnd node: peer pubkey, capacity, and local/remote balance per channel.',
    {},
    async () => {
      const g = lnGuard();
      if (g) return g;
      try {
        const channels = await listChannels();
        return ok({ count: channels.length, channels });
      } catch {
        return fail('Lightning node unreachable.');
      }
    },
  );

  server.tool(
    'create_invoice',
    'Generate a BOLT11 Lightning invoice on the Contrabxnd node to receive a payment. Returns the payment_request string.',
    {
      value_sat: z.number().int().positive().describe('Amount to receive, in satoshis'),
      memo: z.string().max(256).optional().describe('Optional description'),
    },
    async ({ value_sat, memo }) => {
      const g = lnGuard();
      if (g) return g;
      try {
        return ok(await createInvoice(value_sat, memo));
      } catch {
        return fail('Could not create invoice.');
      }
    },
  );

  server.tool(
    'decode_invoice',
    'Decode a BOLT11 Lightning invoice (payment request) to reveal destination, amount, description, timestamp, and expiry.',
    { payment_request: z.string().describe('BOLT11 invoice string (lnbc...)') },
    async ({ payment_request }) => {
      const g = lnGuard();
      if (g) return g;
      try {
        const d = await decodeInvoice(payment_request);
        return ok({
          destination: d.destination,
          amount_sat: Number(d.num_satoshis),
          description: d.description,
          payment_hash: d.payment_hash,
          timestamp: d.timestamp,
          expiry_sec: Number(d.expiry),
        });
      } catch {
        return fail('Could not decode invoice. Check the BOLT11 string.');
      }
    },
  );

  server.tool(
    'get_pricing',
    'List Contrabxnd resources gated behind Lightning micropayments (L402): resource name, sat price, endpoint, and how to pay. Pay the 402 invoice, then retry with Authorization: L402 <token>:<preimage>.',
    {},
    async () => {
      const items = Object.entries(PAYWALL).map(([resource, v]) => ({
        resource,
        price_sats: v.price_sats,
        description: v.description,
        endpoint: `${BASE_URL}/api/premium/${resource.replace('premium-', '')}`,
        protocol: 'L402',
      }));
      return ok({ paywalled_resources: items, how_to_pay: 'GET the endpoint → receive 402 + BOLT11 invoice → pay it → retry with header "Authorization: L402 <token>:<preimage>".' });
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
        'get_daily_brief', 'get_mining_intelligence', 'get_onchain_metrics',
        // Phase 2 — Indexer (Contrabxnd node)
        'query_address', 'query_transaction', 'query_block',
        'get_mempool_analysis', 'estimate_fee', 'get_address_history',
        'trace_funds', 'decode_script',
        // Phase 3 — Lightning (Contrabxnd LND node)
        'get_node_info', 'get_lightning_balance', 'list_channels',
        'create_invoice', 'decode_invoice',
        // Phase 6 — L402 micropayments
        'get_pricing',
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
