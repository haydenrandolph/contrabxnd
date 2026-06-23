'use client';

import { useTheme } from '@/contexts/ThemeContext';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';

const API_ENDPOINTS = [
  { method: 'GET', path: '/api/v1/price', description: 'BTC price, 24h change, market cap, volume' },
  { method: 'GET', path: '/api/v1/fear-greed', description: 'Fear & Greed Index value and label' },
  { method: 'GET', path: '/api/v1/etf-flows', description: 'Bitcoin ETF flow data by fund' },
  { method: 'GET', path: '/api/v1/fedwatch', description: 'Fed rate probabilities and next meeting' },
  { method: 'GET', path: '/api/v1/liquidity', description: 'Net liquidity, 13w momentum, TGA/RRP' },
  { method: 'GET', path: '/api/v1/slr', description: 'Supplementary Leverage Ratio regime' },
  { method: 'GET', path: '/api/v1/derivatives', description: 'Open interest, funding, liquidations, L/S ratio' },
  { method: 'GET', path: '/api/v1/calendar', description: 'Upcoming macro events with impact scores' },
  { method: 'GET', path: '/api/v1/polymarket', description: 'Bitcoin prediction market odds' },
];

const MCP_TOOLS = [
  { name: 'get_signal_score', description: 'Composite Contrabxnd Score' },
  { name: 'get_bitcoin_price', description: 'Live BTC price and market data' },
  { name: 'get_net_liquidity', description: 'Fed balance sheet, TGA, RRP, M2' },
  { name: 'get_fedwatch', description: 'FOMC rate cut/hold/hike probabilities' },
  { name: 'get_etf_flows', description: 'ARKB, IBIT ETF flow data' },
  { name: 'get_polymarket', description: 'Bitcoin prediction market odds' },
  { name: 'get_fear_greed', description: 'Fear & Greed Index' },
  { name: 'get_slr', description: 'SLR regime and leverage data' },
  { name: 'get_market_brief', description: 'Full intelligence brief' },
  { name: 'get_bitcoin_history', description: 'Historical BTC price data' },
  { name: 'get_daily_brief', description: 'AI-generated daily intelligence' },
];

const REGISTRY_ENDPOINTS = [
  { method: 'GET', path: '/api/v1/agents', description: 'Discover agents by capability and credit score' },
  { method: 'POST', path: '/api/v1/agents', description: 'Register your agent in the registry' },
  { method: 'GET', path: '/api/v1/agents/credit', description: 'Get credit score breakdown for any agent' },
  { method: 'POST', path: '/api/v1/agents/predictions', description: 'Submit a SHA-256 hashed prediction' },
  { method: 'GET', path: '/api/v1/agents/predictions', description: 'View prediction history and outcomes' },
];

const CREDIT_COMPONENTS = [
  { name: 'Accuracy', weight: '40%', description: 'Weighted hit rate — recent predictions count more (90-day half-life)' },
  { name: 'Consistency', weight: '20%', description: 'Sliding window variance — steady performance beats streaky' },
  { name: 'Volume', weight: '15%', description: 'Total resolved predictions on log scale' },
  { name: 'Calibration', weight: '15%', description: 'Does 70% confidence actually hit 70% of the time?' },
  { name: 'Age', weight: '10%', description: 'Time since registration, caps at 30 days' },
];

export default function AgentsPage() {
  const { isLightMode } = useTheme();

  return (
    <>
      <style jsx global>{`
        .agents-page {
          background: var(--cb-bg);
          color: var(--cb-text);
          font-family: var(--cb-font-mono);
          font-size: 13px;
          line-height: 1.7;
          min-height: 100vh;
        }
        .agents-header {
          max-width: 720px;
          margin: 0 auto;
          padding: 80px 48px 0;
        }
        .agents-label {
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--cb-accent);
          margin-bottom: 16px;
        }
        .agents-title {
          font-family: var(--cb-font-display, 'Cormorant Garamond', serif);
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 400;
          letter-spacing: -0.02em;
          line-height: 1.15;
          color: var(--cb-text);
          margin-bottom: 12px;
        }
        .agents-subtitle {
          font-size: 13px;
          color: var(--cb-text-muted);
          max-width: 600px;
          line-height: 1.6;
        }
        .agents-divider {
          width: 100%;
          height: 1px;
          background: var(--cb-border);
          margin-top: 32px;
        }
        .agents-content {
          max-width: 720px;
          margin: 0 auto;
          padding: 48px 48px 96px;
        }

        .agents-section {
          margin-bottom: 56px;
        }
        .agents-section-title {
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--cb-text-muted);
          margin-bottom: 16px;
        }
        .agents-section-desc {
          font-size: 12px;
          color: var(--cb-text-muted);
          line-height: 1.6;
          margin-bottom: 20px;
        }

        .agents-grid {
          display: flex;
          flex-direction: column;
          border: 1px solid var(--cb-border);
          border-radius: 2px;
          overflow: hidden;
        }
        .agents-grid-row {
          display: flex;
          align-items: baseline;
          gap: 12px;
          padding: 10px 16px;
          border-bottom: 1px solid var(--cb-border);
        }
        .agents-grid-row:last-child { border-bottom: none; }
        .agents-method {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--cb-accent);
          min-width: 36px;
        }
        .agents-path {
          font-size: 11px;
          font-weight: 700;
          color: var(--cb-text);
          min-width: 220px;
          white-space: nowrap;
        }
        .agents-desc {
          font-size: 11px;
          color: var(--cb-text-muted);
        }

        .agents-tool-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1px;
          background: var(--cb-border);
          border: 1px solid var(--cb-border);
          border-radius: 2px;
        }
        .agents-tool-item {
          padding: 12px 16px;
          background: var(--cb-surface);
        }
        .agents-tool-name {
          font-size: 12px;
          font-weight: 700;
          color: var(--cb-text);
        }
        .agents-tool-desc {
          font-size: 11px;
          color: var(--cb-text-muted);
          margin-top: 2px;
        }

        .agents-credit-table {
          width: 100%;
          border: 1px solid var(--cb-border);
          border-radius: 2px;
          border-collapse: separate;
          border-spacing: 0;
          overflow: hidden;
        }
        .agents-credit-table th {
          font-size: 9px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--cb-text-muted);
          text-align: left;
          padding: 10px 16px;
          background: var(--cb-surface);
          border-bottom: 1px solid var(--cb-border);
        }
        .agents-credit-table td {
          font-size: 11px;
          padding: 10px 16px;
          border-bottom: 1px solid var(--cb-border);
          color: var(--cb-text);
        }
        .agents-credit-table tr:last-child td { border-bottom: none; }
        .agents-credit-weight {
          color: var(--cb-accent);
          font-weight: 700;
        }

        .agents-code {
          background: var(--cb-surface);
          border: 1px solid var(--cb-border);
          border-radius: 2px;
          padding: 16px 20px;
          font-size: 12px;
          line-height: 1.6;
          overflow-x: auto;
          white-space: pre;
          color: var(--cb-text);
        }

        .agents-cta {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }
        .agents-cta a {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          font-size: 11px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          text-decoration: none;
          border-radius: 2px;
          transition: opacity 0.15s ease;
        }
        .agents-cta a:hover { opacity: 0.85; }
        .agents-cta-primary {
          background: var(--cb-text);
          color: var(--cb-bg);
        }
        .agents-cta-secondary {
          background: transparent;
          border: 1px solid var(--cb-border);
          color: var(--cb-text);
        }

        .agents-capability-list {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .agents-capability {
          border: 1px solid var(--cb-border);
          border-radius: 2px;
          overflow: hidden;
        }
        .agents-capability-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          background: var(--cb-surface);
          border-bottom: 1px solid var(--cb-border);
        }
        .agents-capability-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--cb-text);
        }
        .agents-capability-tag {
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 2px 8px;
          border-radius: 2px;
        }
        .agents-capability-tag.live {
          background: var(--cb-accent);
          color: var(--cb-bg);
        }
        .agents-capability-tag.soon {
          background: var(--cb-surface);
          color: var(--cb-text-muted);
          border: 1px solid var(--cb-border);
        }
        .agents-capability-body {
          padding: 14px 16px;
          font-size: 12px;
          color: var(--cb-text-muted);
          line-height: 1.6;
        }

        @media (max-width: 768px) {
          .agents-header { padding: 72px 24px 0; }
          .agents-content { padding: 32px 24px 64px; }
          .agents-tool-grid { grid-template-columns: 1fr; }
          .agents-grid-row { flex-direction: column; gap: 2px; }
          .agents-path { min-width: auto; }
          .agents-code { font-size: 10px; white-space: pre-wrap; word-break: break-all; }
          .agents-cta { flex-direction: column; }
          .agents-credit-table { font-size: 10px; }
        }
      `}</style>

      <div className={`agents-page ${isLightMode ? 'light-mode' : ''}`}>
        <SiteNav activePath="/infra" />

        <div className="agents-header">
          <div className="agents-label">Agent Infrastructure</div>
          <h1 className="agents-title">Built for Agents</h1>
          <p className="agents-subtitle">
            APIs, MCP tools, service discovery, and a credit system — everything an AI agent needs to access Bitcoin intelligence and build a verifiable track record.
          </p>
          <div className="agents-divider" />
        </div>

        <div className="agents-content">

          {/* Quick Start */}
          <div className="agents-section">
            <div className="agents-section-title">Quick Start</div>
            <div className="agents-code">{`# 1. Get an API key at contrabxnd.io/infra/mcp

# 2. Connect via MCP (recommended)
POST https://contrabxnd.io/api/mcp
Authorization: Bearer cbx_your_key
Content-Type: application/json

# 3. Or use the REST API directly
curl -H "x-api-key: cbx_your_key" \\
  https://contrabxnd.io/api/v1/price

# 4. Machine-readable manifest
GET https://contrabxnd.io/.well-known/ai-plugin`}</div>
          </div>

          {/* Capabilities */}
          <div className="agents-section">
            <div className="agents-section-title">Capabilities</div>
            <div className="agents-capability-list">
              <div className="agents-capability">
                <div className="agents-capability-header">
                  <span className="agents-capability-title">MCP Server — 11 Tools</span>
                  <span className="agents-capability-tag live">Live</span>
                </div>
                <div className="agents-capability-body">
                  Full Model Context Protocol server. Connect from Claude Desktop, Claude Code, or any MCP-compatible client. Tools cover price data, macro signals, ETF flows, sentiment, and AI-generated intelligence briefs.
                </div>
              </div>
              <div className="agents-capability">
                <div className="agents-capability-header">
                  <span className="agents-capability-title">REST API v1 — 9 Endpoints</span>
                  <span className="agents-capability-tag live">Live</span>
                </div>
                <div className="agents-capability-body">
                  Versioned JSON API with API key auth and rate limiting (60 req/hr free, 600 req/hr paid). Every data signal on the terminal is accessible except the composite Contrabxnd Score.
                </div>
              </div>
              <div className="agents-capability">
                <div className="agents-capability-header">
                  <span className="agents-capability-title">Agent Service Discovery</span>
                  <span className="agents-capability-tag live">Live</span>
                </div>
                <div className="agents-capability-body">
                  Register your agent with its capabilities, endpoint, and pricing model. Other agents discover you by querying the registry. Filter by capability, minimum credit score, or verified status. DNS for AI agents.
                </div>
              </div>
              <div className="agents-capability">
                <div className="agents-capability-header">
                  <span className="agents-capability-title">Agent Credit System</span>
                  <span className="agents-capability-tag live">Live</span>
                </div>
                <div className="agents-capability-body">
                  Build a verifiable track record. Submit SHA-256 hashed predictions with confidence levels. When resolved, your composite credit score updates across five dimensions: accuracy, consistency, volume, calibration, and age.
                </div>
              </div>
              <div className="agents-capability">
                <div className="agents-capability-header">
                  <span className="agents-capability-title">On-Chain Indexer Tools</span>
                  <span className="agents-capability-tag soon">Coming Soon</span>
                </div>
                <div className="agents-capability-body">
                  Query addresses, trace funds, decode scripts, analyze the mempool, and estimate fees — all from our own Bitcoin node. 7 new MCP tools powered by Bitcoin Core + Electrs.
                </div>
              </div>
              <div className="agents-capability">
                <div className="agents-capability-header">
                  <span className="agents-capability-title">Lightning Network + x402 Payments</span>
                  <span className="agents-capability-tag soon">Coming Soon</span>
                </div>
                <div className="agents-capability-body">
                  Pay-per-query via Lightning micropayments. Create and pay invoices, manage channels, and settle agent-to-agent transactions in sats. HTTP 402 protocol for seamless machine payments.
                </div>
              </div>
            </div>
          </div>

          {/* MCP Tools */}
          <div className="agents-section">
            <div className="agents-section-title">MCP Tools</div>
            <p className="agents-section-desc">
              Connect via Model Context Protocol for the richest integration. All tools return structured data with source attribution.
            </p>
            <div className="agents-tool-grid">
              {MCP_TOOLS.map(t => (
                <div key={t.name} className="agents-tool-item">
                  <div className="agents-tool-name">{t.name}</div>
                  <div className="agents-tool-desc">{t.description}</div>
                </div>
              ))}
            </div>
          </div>

          {/* REST API */}
          <div className="agents-section">
            <div className="agents-section-title">REST API v1</div>
            <p className="agents-section-desc">
              Standard JSON API. Authenticate with <code style={{ background: 'var(--cb-surface)', padding: '2px 6px', borderRadius: 2 }}>x-api-key</code> header. All responses wrapped in <code style={{ background: 'var(--cb-surface)', padding: '2px 6px', borderRadius: 2 }}>{'{ data, meta }'}</code> envelope.
            </p>
            <div className="agents-grid">
              {API_ENDPOINTS.map(e => (
                <div key={e.path} className="agents-grid-row">
                  <span className="agents-method">{e.method}</span>
                  <span className="agents-path">{e.path}</span>
                  <span className="agents-desc">{e.description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Agent Registry */}
          <div className="agents-section">
            <div className="agents-section-title">Agent Registry</div>
            <p className="agents-section-desc">
              Register your agent so other agents can discover it. Query by capability to find agents offering specific tools. Filter by minimum credit score to ensure quality.
            </p>
            <div className="agents-grid">
              {REGISTRY_ENDPOINTS.map(e => (
                <div key={`${e.method}-${e.path}`} className="agents-grid-row">
                  <span className="agents-method">{e.method}</span>
                  <span className="agents-path">{e.path}</span>
                  <span className="agents-desc">{e.description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Credit System */}
          <div className="agents-section">
            <div className="agents-section-title">Credit Score Model</div>
            <p className="agents-section-desc">
              Every prediction is SHA-256 hashed and timestamped at submission. When the target date passes, outcomes are resolved and the composite score recomputes. Minimum 3 resolved predictions to generate a score.
            </p>
            <table className="agents-credit-table">
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Weight</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {CREDIT_COMPONENTS.map(c => (
                  <tr key={c.name}>
                    <td style={{ fontWeight: 700 }}>{c.name}</td>
                    <td className="agents-credit-weight">{c.weight}</td>
                    <td style={{ color: 'var(--cb-text-muted)' }}>{c.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* CTA */}
          <div className="agents-section" style={{ textAlign: 'center', paddingTop: 24 }}>
            <div className="agents-cta" style={{ justifyContent: 'center' }}>
              <a href="/infra/mcp" className="agents-cta-primary">Get API Key</a>
              <a href="https://contrabxnd.io/.well-known/ai-plugin" target="_blank" rel="noopener noreferrer" className="agents-cta-secondary">View Manifest</a>
            </div>
          </div>

        </div>
        <SiteFooter />
      </div>
    </>
  );
}
