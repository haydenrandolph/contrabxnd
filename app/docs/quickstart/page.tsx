import type { Metadata } from 'next';
import Link from 'next/link';
import DocsShell from '@/components/docs/DocsShell';

export const metadata: Metadata = {
  title: 'Quickstart — Contrabxnd Docs',
  description: 'Get a Contrabxnd API key and make your first request.',
};

export default function QuickstartDoc() {
  return (
    <DocsShell slug="quickstart" title="Quickstart" subtitle="Get a key and make your first call in under a minute.">
      <h2>1. Get an API key</h2>
      <p>
        Sign in and generate a key from the <Link href="/infra/mcp">MCP page</Link>. Keys are
        prefixed <code>cbx_</code> and shown once — store it securely.
      </p>

      <h2>2. Call the REST API</h2>
      <p>Public signal endpoints need no auth:</p>
      <pre><code>{`curl https://www.contrabxnd.io/api/signal
curl https://www.contrabxnd.io/api/hashrate
curl https://www.contrabxnd.io/api/onchain`}</code></pre>

      <h2>3. Connect the MCP server</h2>
      <p>Point any MCP-compatible client at the server with your key:</p>
      <pre><code>{`{
  "mcpServers": {
    "contrabxnd": {
      "url": "https://www.contrabxnd.io/api/mcp",
      "headers": { "Authorization": "Bearer cbx_YOUR_KEY" }
    }
  }
}`}</code></pre>
      <p>
        From there, an agent can call <code>get_signal_score</code>, <code>query_address</code>,
        <code>get_mining_intelligence</code>, and more. See the{' '}
        <Link href="/docs/mcp/tools">Tool Reference</Link>.
      </p>
    </DocsShell>
  );
}
