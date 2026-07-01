import type { Metadata } from 'next';
import Link from 'next/link';
import DocsShell from '@/components/docs/DocsShell';

export const metadata: Metadata = {
  title: 'Docs — Contrabxnd',
  description: 'Developer documentation for the Contrabxnd Bitcoin intelligence platform: MCP server, node indexer, Lightning, L402, and agent infrastructure.',
};

export default function DocsOverview() {
  return (
    <DocsShell slug="" title="Documentation" subtitle="Everything you need to build on Contrabxnd — the Bitcoin intelligence platform running on a sovereign node.">
      <p>
        Contrabxnd exposes its intelligence and on-chain data through a machine-readable{' '}
        <Link href="/docs/mcp">MCP server</Link>, a public API, and a set of node-powered
        tools. Everything below is served from FML&apos;s own Bitcoin node — block, transaction,
        and address data are sovereign, with automatic fallback for resilience.
      </p>

      <h2>What&apos;s here</h2>
      <ul>
        <li><Link href="/docs/quickstart">Quickstart</Link> — get an API key and make your first call.</li>
        <li><Link href="/docs/mcp">MCP Server</Link> — connect any AI client to live data and node tools.</li>
        <li><Link href="/docs/mcp/tools">Tool Reference</Link> — every MCP tool, grouped by capability.</li>
        <li><Link href="/docs/node">Indexer &amp; Explorer</Link> — query the chain through the Contrabxnd node.</li>
        <li><Link href="/docs/lightning">Lightning &amp; L402</Link> — invoices, node info, and micropayment paywalls.</li>
        <li><Link href="/docs/agents">Agent Registry</Link> — discovery, credit, and verifiable predictions.</li>
      </ul>

      <h2>Principles</h2>
      <p>
        <strong>Sovereign by default.</strong> On-chain reads come from our node, not a
        third-party aggregator. <strong>Composable.</strong> Every signal is available as an
        MCP tool and an API endpoint. <strong>Pay-per-use where it counts.</strong> Premium
        data can be gated behind Lightning micropayments via <Link href="/docs/lightning">L402</Link>.
      </p>
    </DocsShell>
  );
}
