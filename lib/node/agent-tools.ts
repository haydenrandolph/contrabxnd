/**
 * Anthropic tool definitions + executor for the conversational block explorer.
 * These wrap the sovereign node data layer (mempool API) and the pure script
 * decoder so an AI agent can answer on-chain questions in natural language.
 * All tools are READ-ONLY.
 */
import Anthropic from '@anthropic-ai/sdk';
import { nodeJson, nodeFetch } from '@/lib/node/client';
import { decodeScript } from '@/lib/node/script';

const SATS = 1e8;

export const NODE_TOOLS: Anthropic.Tool[] = [
  {
    name: 'query_address',
    description: 'Look up a Bitcoin address: confirmed balance, total received/sent, tx count, and unconfirmed activity.',
    input_schema: {
      type: 'object',
      properties: { address: { type: 'string', description: 'Bitcoin address (legacy, SegWit, or Taproot)' } },
      required: ['address'],
    },
  },
  {
    name: 'query_transaction',
    description: 'Get full details for a transaction: inputs, outputs, fee, size, and confirmation status.',
    input_schema: {
      type: 'object',
      properties: { txid: { type: 'string', description: '64-character transaction id (hex)' } },
      required: ['txid'],
    },
  },
  {
    name: 'query_block',
    description: 'Get a block by height or hash: miner pool, tx count, size, weight, difficulty, timestamp.',
    input_schema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'Block height (e.g. "840000") or 64-char block hash' } },
      required: ['id'],
    },
  },
  {
    name: 'get_mempool',
    description: 'Real-time mempool state: pending tx count, total size, accumulated fees, and recommended fee rates (sat/vB).',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_address_history',
    description: 'Recent transaction history for an address (most recent first): txid, fee, and confirmation status.',
    input_schema: {
      type: 'object',
      properties: { address: { type: 'string', description: 'Bitcoin address' } },
      required: ['address'],
    },
  },
  {
    name: 'trace_funds',
    description: 'Follow Bitcoin forward from a starting txid, hop by hop along the largest spent output, reporting where funds went and where they rest.',
    input_schema: {
      type: 'object',
      properties: {
        txid: { type: 'string', description: 'Starting transaction id' },
        max_hops: { type: 'number', description: 'How many hops to follow (default 5, max 10)' },
      },
      required: ['txid'],
    },
  },
  {
    name: 'decode_script',
    description: 'Decode a Bitcoin scriptPubKey (hex) into readable ASM and explain its type (P2PKH, P2SH, P2WPKH, P2WSH, P2TR, OP_RETURN, multisig, etc.).',
    input_schema: {
      type: 'object',
      properties: { script: { type: 'string', description: 'Script as a hex string' } },
      required: ['script'],
    },
  },
];

interface AddrStats { funded_txo_sum: number; spent_txo_sum: number; tx_count: number }
interface AddrInfo { address: string; chain_stats: AddrStats; mempool_stats: AddrStats }
interface Vout { scriptpubkey_address?: string; scriptpubkey_type?: string; value: number }

/** Execute a node tool by name; returns a JSON string for the model to read. */
export async function runNodeTool(name: string, input: Record<string, unknown>): Promise<string> {
  const j = (obj: unknown) => JSON.stringify(obj);
  try {
    switch (name) {
      case 'query_address': {
        const { data } = await nodeJson<AddrInfo>(`/api/address/${encodeURIComponent(String(input.address))}`);
        const bal = data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum;
        return j({
          address: data.address,
          balance_btc: bal / SATS,
          total_received_btc: data.chain_stats.funded_txo_sum / SATS,
          total_sent_btc: data.chain_stats.spent_txo_sum / SATS,
          tx_count: data.chain_stats.tx_count,
          unconfirmed_tx_count: data.mempool_stats.tx_count,
        });
      }
      case 'query_transaction': {
        const txid = String(input.txid);
        if (!/^[a-fA-F0-9]{64}$/.test(txid)) return j({ error: 'Invalid txid' });
        const { data } = await nodeJson<{ fee: number; weight: number; status: unknown; vin: unknown[]; vout: Vout[] }>(`/api/tx/${txid}`);
        return j({ ...data, fee_btc: (data.fee ?? 0) / SATS, vsize: Math.ceil(data.weight / 4) });
      }
      case 'query_block': {
        const id = String(input.id);
        let hash = id;
        if (/^\d+$/.test(id)) {
          const { res } = await nodeFetch(`/api/block-height/${id}`);
          if (!res.ok) return j({ error: `Block height ${id} not found` });
          hash = (await res.text()).trim();
        } else if (!/^[a-fA-F0-9]{64}$/.test(id)) {
          return j({ error: 'Provide a block height or 64-char hash' });
        }
        const { data } = await nodeJson<Record<string, unknown>>(`/api/block/${hash}`);
        return j(data);
      }
      case 'get_mempool': {
        const [mp, fees] = await Promise.all([
          nodeJson<{ count: number; vsize: number; total_fee: number }>('/api/mempool'),
          nodeJson<Record<string, number>>('/api/v1/fees/recommended'),
        ]);
        return j({
          pending_tx_count: mp.data.count,
          mempool_vsize_mb: +(mp.data.vsize / 1e6).toFixed(2),
          total_fees_btc: mp.data.total_fee / SATS,
          recommended_fees_sat_vb: fees.data,
        });
      }
      case 'get_address_history': {
        const { data } = await nodeJson<Array<{ txid: string; fee: number; status: { confirmed: boolean; block_height?: number } }>>(`/api/address/${encodeURIComponent(String(input.address))}/txs`);
        return j({
          count: data.length,
          transactions: data.slice(0, 25).map((tx) => ({ txid: tx.txid, fee_sats: tx.fee, confirmed: tx.status.confirmed, block_height: tx.status.block_height ?? null })),
        });
      }
      case 'trace_funds': {
        const txid = String(input.txid);
        if (!/^[a-fA-F0-9]{64}$/.test(txid)) return j({ error: 'Invalid txid' });
        const hops = Math.min(Math.max(Number(input.max_hops) || 5, 1), 10);
        const trail: unknown[] = [];
        let current = txid;
        for (let i = 0; i < hops; i++) {
          const [{ data: tx }, { data: spends }] = await Promise.all([
            nodeJson<{ vout: Vout[] }>(`/api/tx/${current}`),
            nodeJson<Array<{ spent: boolean; txid: string | null }>>(`/api/tx/${current}/outspends`),
          ]);
          const spent = spends.map((o, idx) => ({ o, idx })).filter((x) => x.o.spent).sort((a, b) => (tx.vout[b.idx]?.value ?? 0) - (tx.vout[a.idx]?.value ?? 0));
          if (spent.length === 0) { trail.push({ hop: i + 1, txid: current, note: 'Funds at rest — all outputs unspent.' }); break; }
          const top = spent[0];
          const out = tx.vout[top.idx];
          trail.push({ hop: i + 1, txid: current, address: out.scriptpubkey_address ?? 'unknown', value_btc: out.value / SATS, spent_in: spends[top.idx].txid, fan_out: spent.length });
          const next = spends[top.idx].txid;
          if (!next) break;
          current = next;
        }
        return j({ start: txid, trail });
      }
      case 'decode_script': {
        const decoded = decodeScript(String(input.script));
        return decoded ? j(decoded) : j({ error: 'Invalid script hex' });
      }
      default:
        return j({ error: `Unknown tool: ${name}` });
    }
  } catch {
    return j({ error: `Lookup failed for ${name}` });
  }
}
