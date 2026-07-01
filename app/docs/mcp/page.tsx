import type { Metadata } from 'next';
import Link from 'next/link';
import DocsShell from '@/components/docs/DocsShell';

export const metadata: Metadata = {
  title: 'MCP Server — Contrabxnd Docs',
  description: 'Connect any AI client to Contrabxnd via the Model Context Protocol.',
};

export default function McpDoc() {
  return (
    <DocsShell slug="mcp" title="MCP Server" subtitle="Turn Contrabxnd into tools any MCP-compatible agent can call.">
      <p>
        The Model Context Protocol (MCP) is an open standard that lets AI agents use external
        tools. Contrabxnd&apos;s MCP server exposes market intelligence, on-chain node queries,
        Lightning, and pricing as callable tools over a single authenticated endpoint.
      </p>

      <h2>Endpoint</h2>
      <pre><code>https://www.contrabxnd.io/api/mcp</code></pre>

      <h2>Authentication</h2>
      <p>
        Every request needs an API key in the <code>Authorization</code> header as a bearer
        token. Generate one on the <Link href="/infra/mcp">MCP page</Link> (keys are prefixed{' '}
        <code>cbx_</code>, sha-256 hashed at rest, and revocable).
      </p>
      <pre><code>Authorization: Bearer cbx_YOUR_KEY</code></pre>

      <h2>Client config</h2>
      <pre><code>{`{
  "mcpServers": {
    "contrabxnd": {
      "url": "https://www.contrabxnd.io/api/mcp",
      "headers": { "Authorization": "Bearer cbx_YOUR_KEY" }
    }
  }
}`}</code></pre>

      <h2>Capabilities</h2>
      <ul>
        <li><strong>Intelligence</strong> — composite Contrabxnd Score, macro signals, ETF flows, sentiment.</li>
        <li><strong>Indexer</strong> — address / transaction / block lookups, fund tracing, script decoding.</li>
        <li><strong>Mining &amp; on-chain</strong> — hash ribbon, difficulty, MVRV, realized price.</li>
        <li><strong>Lightning</strong> — node info, balances, channels, invoices.</li>
        <li><strong>L402</strong> — discover paywalled resources and their sat prices.</li>
      </ul>
      <p>See the full <Link href="/docs/mcp/tools">Tool Reference</Link>.</p>
    </DocsShell>
  );
}
