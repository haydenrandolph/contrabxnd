import type { Metadata } from 'next';
import Link from 'next/link';
import DocsShell from '@/components/docs/DocsShell';

export const metadata: Metadata = {
  title: 'Indexer & Explorer — Contrabxnd Docs',
  description: 'Query the Bitcoin chain through the Contrabxnd sovereign node.',
};

export default function NodeDoc() {
  return (
    <DocsShell slug="node" title="Indexer & Explorer" subtitle="Sovereign on-chain queries — served from the Contrabxnd Bitcoin node.">
      <p>
        Contrabxnd runs its own Bitcoin node (bitcoind + electrs + a self-hosted mempool API).
        Block, transaction, and address reads come from that node first, with automatic
        fallback to public infrastructure so queries never hard-fail.
      </p>

      <h2>Block Explorer</h2>
      <p>
        The <Link href="/infra/explorer">explorer</Link> resolves any address, transaction id,
        block height, or block hash into a cross-linked view — served through the node.
      </p>

      <h2>Node API (proxy)</h2>
      <p>
        Read-only, mempool.space-shaped paths are proxied under <code>/api/node/*</code>
        (whitelisted). Responses carry an <code>x-node-source</code> header of{' '}
        <code>node</code> or <code>public</code>.
      </p>
      <pre><code>{`GET /api/node/address/{address}
GET /api/node/tx/{txid}
GET /api/node/block/{hash}
GET /api/node/mempool
GET /api/node/status        # { sovereign, blockHeight, reachable }`}</code></pre>

      <h2>Via MCP</h2>
      <p>
        Agents use <code>query_address</code>, <code>query_transaction</code>,{' '}
        <code>query_block</code>, <code>get_mempool_analysis</code>, <code>estimate_fee</code>,{' '}
        <code>trace_funds</code>, and <code>decode_script</code>. See the{' '}
        <Link href="/docs/mcp/tools">Tool Reference</Link>.
      </p>

      <h2>On-chain valuation</h2>
      <p>
        A sovereign UTXO indexer computes <strong>realized cap</strong>,{' '}
        <strong>realized price</strong>, <strong>MVRV</strong>, and{' '}
        <strong>supply-by-age bands</strong> from the node&apos;s own UTXO set. Read them at{' '}
        <code>/api/onchain</code> or via <code>get_onchain_metrics</code>.
      </p>
    </DocsShell>
  );
}
