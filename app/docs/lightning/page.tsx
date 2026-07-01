import type { Metadata } from 'next';
import Link from 'next/link';
import DocsShell from '@/components/docs/DocsShell';

export const metadata: Metadata = {
  title: 'Lightning & L402 — Contrabxnd Docs',
  description: 'Lightning node access and L402 micropayment paywalls on Contrabxnd.',
};

export default function LightningDoc() {
  return (
    <DocsShell slug="lightning" title="Lightning & L402" subtitle="Node access, invoices, and Lightning-native paywalls.">
      <h2>Lightning node</h2>
      <p>
        Contrabxnd runs an LND node reachable through the MCP server. Read tools cover node
        identity, balances, and channels; invoice tools let agents receive payments.
      </p>
      <ul>
        <li><code>get_node_info</code> — pubkey, alias, channels, peers, connect URIs</li>
        <li><code>get_lightning_balance</code> — channel + on-chain balances</li>
        <li><code>list_channels</code> — active channels</li>
        <li><code>create_invoice</code> — generate a BOLT11 invoice</li>
        <li><code>decode_invoice</code> — inspect a payment request</li>
      </ul>
      <p>
        Public node status (no balances) is at <code>/api/lightning/info</code> and rendered on
        the <Link href="/infra/lightning">Lightning page</Link>.
      </p>

      <h2>L402 paywalls</h2>
      <p>
        Premium resources are gated with <strong>L402</strong>, the Lightning-native HTTP 402
        protocol. The flow:
      </p>
      <ul>
        <li>Request the resource with no auth → <code>402</code> with a{' '}
          <code>WWW-Authenticate: L402 macaroon=&quot;…&quot;, invoice=&quot;lnbc…&quot;</code> header.</li>
        <li>Pay the invoice to obtain the preimage.</li>
        <li>Retry with <code>Authorization: L402 &lt;token&gt;:&lt;preimage&gt;</code>.</li>
        <li>The server verifies <code>sha256(preimage) == payment_hash</code> and serves the resource.</li>
      </ul>
      <pre><code>{`GET /api/premium/report        # 402 + invoice, then serve on valid preimage`}</code></pre>
      <p>Discover paywalled resources and prices with the <code>get_pricing</code> MCP tool.</p>
    </DocsShell>
  );
}
