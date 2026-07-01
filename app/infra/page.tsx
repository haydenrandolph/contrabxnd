'use client';

import Link from 'next/link';
import InfraShell from '@/components/infra/InfraShell';

interface ToolCard {
  title: string;
  description: string;
  category: string;
  href?: string;
  comingSoon?: boolean;
}

const TOOLS: ToolCard[] = [
  { title: 'Block Explorer', description: 'Look up any address, transaction, or block through the Contrabxnd Bitcoin node.', category: 'Node', href: '/infra/explorer' },
  { title: 'Lightning', description: 'Connect to the Contrabxnd Lightning node — view channels, capacity, and generate invoices.', category: 'Node', href: '/infra/lightning' },
  { title: 'MCP Server', description: 'Connect any AI client to live Contrabxnd intelligence and node data via the Model Context Protocol.', category: 'API', href: '/infra/mcp' },
  { title: 'Agent Registry', description: 'Service discovery, credit scoring, and verifiable predictions — infrastructure built for AI agents.', category: 'Agents', href: '/infra/agents' },
  { title: 'Sats Converter', description: 'Convert between USD and satoshis at the live exchange rate.', category: 'Tool', href: '/infra/converter' },
  { title: 'DCA Calculator', description: 'Simulate dollar-cost averaging returns over any historical period.', category: 'Tool', href: '/infra/dca' },
  { title: 'Time Machine', description: 'See what your money would be worth if you had bought Bitcoin.', category: 'Tool', href: '/infra/time-machine' },
  { title: 'Wallets', description: 'Create a Contrabxnd wallet for autonomous Bitcoin — on-chain and Lightning.', category: 'Node', comingSoon: true },
  { title: 'Trading', description: 'Buy and sell Bitcoin through Contrabxnd wallets via Coinbase. AI-driven DCA and limit orders.', category: 'Exchange', comingSoon: true },
];

const Arrow = () => (
  <svg className="fml-arrow" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M7 17L17 7M17 7H7M17 7v10" />
  </svg>
);

export default function InfraPage() {
  return (
    <InfraShell
      slug=""
      title="Infrastructure"
      subtitle="Sovereign Bitcoin tooling — block explorer, Lightning, MCP, and agent infrastructure running on the Contrabxnd node."
    >
      <div className="fml-rows">
        {TOOLS.map((tool, i) => {
          const num = String(i + 1).padStart(2, '0');
          const inner = (
            <>
              <div className="fml-row-main">
                <span className="fml-row-num">{num}</span>
                <div>
                  <div className="fml-row-title">{tool.title}</div>
                  <div className="fml-row-desc">{tool.description}</div>
                </div>
              </div>
              <div className="fml-row-meta">
                <span className="fml-row-tag">{tool.comingSoon ? 'Coming Soon' : tool.category}</span>
                {!tool.comingSoon && <Arrow />}
              </div>
            </>
          );
          return tool.comingSoon ? (
            <div key={tool.title} className="fml-row fml-row-soon">{inner}</div>
          ) : (
            <Link key={tool.title} href={tool.href!} className="fml-row">{inner}</Link>
          );
        })}
      </div>
    </InfraShell>
  );
}
