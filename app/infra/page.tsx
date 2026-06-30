'use client';

import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';

interface ToolCard {
  title: string;
  description: string;
  href?: string;
  comingSoon?: boolean;
}

const TOOLS: ToolCard[] = [
  {
    title: 'Sats Converter',
    description: 'Convert between USD and Satoshis at the current exchange rate.',
    href: '/infra/converter',
  },
  {
    title: 'DCA Calculator',
    description: 'Simulate dollar-cost averaging returns over any historical period.',
    href: '/infra/dca',
  },
  {
    title: 'Time Machine',
    description: 'See what your money would be worth if you had bought Bitcoin.',
    href: '/infra/time-machine',
  },
  {
    title: 'MCP Server',
    description: 'Connect any AI client to live Contrabxnd intelligence data via the Model Context Protocol.',
    href: '/infra/mcp',
  },
  {
    title: 'Agent Registry',
    description: 'Service discovery, credit scoring, and verifiable predictions. APIs and MCP tools built for AI agents.',
    href: '/infra/agents',
  },
  {
    title: "Block Explorer",
    description: "Look up any address, transaction, or block through the Contrabxnd Bitcoin node.",
    href: '/infra/explorer',
  },
  {
    title: "Lightning",
    description: "Connect to the Contrabxnd Lightning node — view its channels, capacity, and generate invoices.",
    href: '/infra/lightning',
  },
  {
    title: "Wallets",
    description: "Create a Contrabxnd wallet for autonomous Bitcoin sending and receiving — on-chain and Lightning.",
    comingSoon: true,
  },
  {
    title: "Trading",
    description: "Buy and sell Bitcoin through Contrabxnd wallets via Coinbase integration. AI-driven DCA and limit orders.",
    comingSoon: true,
  },
];

export default function InfraPage() {
  const { isLightMode } = useTheme();

  return (
    <>
      <style jsx global>{`
        .toolbox-page {
          background: var(--cb-bg);
          color: var(--cb-text);
          font-family: var(--cb-font-mono);
          font-size: 13px;
          line-height: 1.7;
          min-height: 100vh;
          overflow-x: hidden;
        }

        .page-header {
          max-width: 1100px;
          margin: 0 auto;
          padding: 80px 48px 0;
        }

        .page-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--cb-accent);
          margin-bottom: 16px;
        }

        .page-title {
          font-family: var(--cb-font-display, 'Inter', serif);
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 400;
          letter-spacing: -0.02em;
          line-height: 1.15;
          color: var(--cb-text);
          margin-bottom: 12px;
        }

        .page-subtitle {
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          color: var(--cb-text-muted);
          max-width: 600px;
          line-height: 1.6;
        }

        .page-divider {
          width: 100%;
          height: 1px;
          background: var(--cb-border);
          margin-top: 32px;
        }

        .toolbox-grid {
          max-width: 1100px;
          margin: 0 auto;
          padding: 48px 48px 96px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: var(--cb-border);
          border: 1px solid var(--cb-border);
          border-radius: 2px;
        }

        .toolbox-card {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 32px;
          background: var(--cb-surface);
          text-decoration: none;
          color: var(--cb-text);
          transition: background 0.15s ease;
          min-height: 180px;
        }

        a.toolbox-card:hover {
          background: var(--cb-bg);
        }

        .toolbox-card-soon {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .toolbox-card-top {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .toolbox-card-title {
          font-family: var(--cb-font-display);
          font-size: 1.4rem;
          font-weight: 400;
          letter-spacing: -0.01em;
          color: var(--cb-text);
        }

        .toolbox-card-desc {
          font-family: var(--cb-font-mono);
          font-size: 12px;
          color: var(--cb-text-muted);
          line-height: 1.6;
        }

        .toolbox-card-footer {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 24px;
          font-family: var(--cb-font-mono);
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        a.toolbox-card .toolbox-card-footer {
          color: var(--cb-accent);
        }

        .toolbox-card-soon .toolbox-card-footer {
          color: var(--cb-text-muted);
        }

        .toolbox-card-soon .toolbox-card-title {
          text-decoration: line-through;
          text-decoration-thickness: 1px;
        }

        @media (max-width: 768px) {
          .page-header { padding: 72px 24px 0; }
          .toolbox-grid {
            padding: 32px 24px 64px;
            grid-template-columns: 1fr;
            background: transparent;
            border: none;
            gap: 16px;
          }
          .toolbox-card {
            border: 1px solid var(--cb-border);
            border-radius: 2px;
            min-height: auto;
          }
        }
      `}</style>

      <div className={`toolbox-page ${isLightMode ? 'light-mode' : ''}`}>
        <SiteNav activePath="/infra" />

        <div className="page-header">
          <div className="page-label">INFRA</div>
          <h1 className="page-title">Infrastructure</h1>
          <p className="page-subtitle">Tools · Agents · APIs · Intelligence</p>
          <div className="page-divider" />
        </div>

        <div className="toolbox-grid">
          {TOOLS.map((tool) =>
            tool.comingSoon ? (
              <div key={tool.title} className="toolbox-card toolbox-card-soon">
                <div className="toolbox-card-top">
                  <div className="toolbox-card-title">{tool.title}</div>
                  <div className="toolbox-card-desc">{tool.description}</div>
                </div>
                <div className="toolbox-card-footer">Coming Soon</div>
              </div>
            ) : (
              <Link key={tool.title} href={tool.href!} className="toolbox-card">
                <div className="toolbox-card-top">
                  <div className="toolbox-card-title">{tool.title}</div>
                  <div className="toolbox-card-desc">{tool.description}</div>
                </div>
                <div className="toolbox-card-footer">
                  Open Tool
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M7 17L17 7M17 7H7M17 7v10" />
                  </svg>
                </div>
              </Link>
            )
          )}
        </div>

        <SiteFooter />
      </div>
    </>
  );
}
