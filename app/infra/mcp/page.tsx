'use client';

import { useState, useEffect, useCallback } from 'react';
import InfraShell from '@/components/infra/InfraShell';
import { createBrowserClient } from '@supabase/ssr';

interface ApiKey {
  id: string;
  key_prefix: string;
  name: string;
  last_used_at: string | null;
  created_at: string;
  revoked_at: string | null;
}

function useAuth() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ? { id: data.user.id, email: data.user.email } : null);
      setLoading(false);
    });
  }, []);

  return { user, loading };
}

export default function McpPage() {
  const { user, loading: authLoading } = useAuth();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    const res = await fetch('/api/keys');
    if (res.ok) {
      const data = await res.json();
      setKeys(data.keys || []);
    }
  }, []);

  useEffect(() => {
    if (user) fetchKeys();
  }, [user, fetchKeys]);

  const generateKey = async () => {
    setGenerating(true);
    setError(null);
    setNewKey(null);
    const res = await fetch('/api/keys', { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      setNewKey(data.key);
      fetchKeys();
    } else {
      setError(data.error);
    }
    setGenerating(false);
  };

  const revokeKey = async (id: string) => {
    await fetch('/api/keys', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchKeys();
    if (newKey) setNewKey(null);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const activeKeys = keys.filter(k => !k.revoked_at);

  const configJson = `{
  "mcpServers": {
    "contrabxnd": {
      "url": "https://www.contrabxnd.io/api/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}`;

  return (
    <>
      <style jsx global>{`
        .mcp-section {
          margin-bottom: 48px;
        }
        .mcp-section-title {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--cb-text-muted);
          margin-bottom: 16px;
        }
        .mcp-tools-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1px;
          background: var(--cb-border);
          border: 1px solid var(--cb-border);
          border-radius: var(--cb-radius);
          overflow: hidden;
        }
        .mcp-tool-item {
          padding: 12px 16px;
          background: var(--cb-surface);
        }
        .mcp-tool-name {
          font-size: 12px;
          font-weight: 700;
          color: var(--cb-text);
          font-family: 'JetBrains Mono', monospace;
        }
        .mcp-tool-desc {
          font-size: 11px;
          color: var(--cb-text-muted);
          margin-top: 2px;
        }

        .mcp-code-block {
          background: var(--cb-surface);
          border: 1px solid var(--cb-border);
          border-radius: var(--cb-radius);
          padding: 16px 20px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          line-height: 1.6;
          overflow-x: auto;
          white-space: pre;
          color: var(--cb-text);
          position: relative;
        }
        .mcp-code-copy {
          position: absolute;
          top: 8px;
          right: 8px;
          background: var(--cb-bg);
          border: 1px solid var(--cb-border);
          border-radius: var(--cb-radius);
          padding: 4px 10px;
          font-size: 10px;
          font-family: 'JetBrains Mono', monospace;
          color: var(--cb-text-muted);
          cursor: pointer;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .mcp-code-copy:hover { color: var(--cb-text); }

        .mcp-auth-box {
          background: var(--cb-surface);
          border: 1px solid var(--cb-border);
          border-radius: var(--cb-radius);
          padding: 24px;
        }
        .mcp-auth-signin {
          text-align: center;
          padding: 32px;
        }
        .mcp-auth-signin a {
          color: var(--cb-accent);
          text-decoration: none;
          font-weight: 700;
        }
        .mcp-btn {
          background: var(--cb-text);
          color: var(--cb-bg);
          border: none;
          border-radius: var(--cb-radius);
          padding: 8px 20px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
        }
        .mcp-btn:hover { opacity: 0.85; }
        .mcp-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .mcp-btn-danger {
          background: transparent;
          color: #ef4444;
          border: 1px solid #ef4444;
          padding: 4px 12px;
          font-size: 10px;
        }

        .mcp-new-key {
          margin-top: 16px;
          padding: 16px;
          background: var(--cb-bg);
          border: 1px solid var(--cb-accent);
          border-radius: var(--cb-radius);
        }
        .mcp-new-key-label {
          font-size: 10px;
          color: var(--cb-accent);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 8px;
        }
        .mcp-new-key-value {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          word-break: break-all;
          color: var(--cb-text);
          margin-bottom: 8px;
        }
        .mcp-new-key-warn {
          font-size: 11px;
          color: var(--cb-text-muted);
        }

        .mcp-key-list {
          margin-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .mcp-key-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px;
          background: var(--cb-bg);
          border: 1px solid var(--cb-border);
          border-radius: var(--cb-radius);
        }
        .mcp-key-prefix {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: var(--cb-text);
        }
        .mcp-key-meta {
          font-size: 10px;
          color: var(--cb-text-muted);
        }
        .mcp-error {
          color: #ef4444;
          font-size: 12px;
          margin-top: 8px;
        }

        .mcp-roadmap {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .mcp-roadmap-phase {
          border: 1px solid var(--cb-border);
          border-radius: var(--cb-radius);
          overflow: hidden;
        }
        .mcp-roadmap-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: var(--cb-surface);
          border-bottom: 1px solid var(--cb-border);
        }
        .mcp-roadmap-phase-label {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .mcp-roadmap-phase-tag {
          font-size: 9px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--cb-text-muted);
          background: var(--cb-bg);
          padding: 2px 8px;
          border-radius: var(--cb-radius);
          border: 1px solid var(--cb-border);
        }
        .mcp-roadmap-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--cb-text);
        }
        .mcp-roadmap-status {
          font-size: 9px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--cb-text-muted);
        }
        .mcp-roadmap-status.soon {
          color: var(--cb-accent);
        }
        .mcp-roadmap-status.live {
          color: var(--cb-bg);
          background: var(--cb-accent);
          padding: 2px 6px;
          border-radius: var(--cb-radius);
        }
        .mcp-roadmap-tools {
          display: flex;
          flex-direction: column;
        }
        .mcp-roadmap-tool {
          display: flex;
          align-items: baseline;
          gap: 12px;
          padding: 8px 16px;
          border-bottom: 1px solid var(--cb-border);
          opacity: 0.5;
        }
        .mcp-roadmap-tool:last-child {
          border-bottom: none;
        }
        .mcp-roadmap-tool-name {
          font-size: 11px;
          font-weight: 700;
          color: var(--cb-text);
          font-family: 'JetBrains Mono', monospace;
          white-space: nowrap;
          min-width: 160px;
        }
        .mcp-roadmap-tool-desc {
          font-size: 11px;
          color: var(--cb-text-muted);
        }

        @media (max-width: 768px) {
          .mcp-tools-grid { grid-template-columns: 1fr; }
          .mcp-roadmap-tool { flex-direction: column; gap: 2px; }
          .mcp-roadmap-tool-name { min-width: auto; }
          .mcp-code-block { font-size: 10px; padding: 12px 14px; white-space: pre-wrap; word-break: break-all; }
          .mcp-new-key-value { font-size: 11px; }
          .mcp-key-row { flex-direction: column; align-items: flex-start; gap: 8px; }
          .mcp-auth-box { padding: 16px; }
          .mcp-roadmap-header { flex-direction: column; align-items: flex-start; gap: 6px; }
        }
      `}</style>

      <InfraShell
        slug="mcp"
        title="MCP Server"
        subtitle="Connect any AI client to live Contrabxnd intelligence and node data via the Model Context Protocol."
      >
        <div>
          {/* Available Tools */}
          <div className="mcp-section">
            <div className="mcp-section-title">Available Tools</div>
            <div className="mcp-tools-grid">
              {[
                ['get_signal_score', 'Composite Contrabxnd Score'],
                ['get_bitcoin_price', 'Live BTC price and market data'],
                ['get_net_liquidity', 'Fed balance sheet, TGA, RRP, M2'],
                ['get_fedwatch', 'FOMC rate cut/hold/hike probabilities'],
                ['get_etf_flows', 'ARKB, IBIT ETF flow data'],
                ['get_polymarket', 'Bitcoin prediction market odds'],
                ['get_fear_greed', 'Fear and Greed Index'],
                ['get_slr', 'SLR regime and leverage data'],
                ['get_mining_intelligence', 'Hash Ribbon, difficulty ribbon, next adjustment'],
                ['get_onchain_metrics', 'Realized price, MVRV, HODL waves (sovereign indexer)'],
                ['get_market_brief', 'Full intelligence brief (all signals)'],
                ['get_bitcoin_history', 'Historical BTC price data'],
                ['get_daily_brief', 'AI-generated daily intelligence brief'],
              ].map(([name, desc]) => (
                <div key={name} className="mcp-tool-item">
                  <div className="mcp-tool-name">{name}</div>
                  <div className="mcp-tool-desc">{desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* API Key */}
          <div className="mcp-section">
            <div className="mcp-section-title">API Key</div>
            <div className="mcp-auth-box">
              {authLoading ? (
                <div style={{ color: 'var(--cb-text-muted)' }}>Loading...</div>
              ) : !user ? (
                <div className="mcp-auth-signin">
                  <p style={{ marginBottom: 16, color: 'var(--cb-text-muted)' }}>
                    Sign in to generate an API key for the MCP server.
                  </p>
                  <a href="/account" className="mcp-btn" style={{ textDecoration: 'none', color: 'var(--cb-bg)' }}>
                    Sign In
                  </a>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--cb-text-muted)', fontSize: 12 }}>
                      {user.email} — {activeKeys.length}/3 keys
                    </span>
                    <button
                      className="mcp-btn"
                      onClick={generateKey}
                      disabled={generating || activeKeys.length >= 3}
                    >
                      {generating ? 'Generating...' : 'Generate Key'}
                    </button>
                  </div>

                  {error && <div className="mcp-error">{error}</div>}

                  {newKey && (
                    <div className="mcp-new-key">
                      <div className="mcp-new-key-label">Your new API key (shown once)</div>
                      <div className="mcp-new-key-value">{newKey}</div>
                      <button
                        className="mcp-btn"
                        style={{ marginBottom: 8 }}
                        onClick={() => copyToClipboard(newKey, 'key')}
                      >
                        {copied === 'key' ? 'Copied' : 'Copy Key'}
                      </button>
                      <div className="mcp-new-key-warn">
                        Save this key now. It cannot be retrieved after you leave this page.
                      </div>
                    </div>
                  )}

                  {activeKeys.length > 0 && (
                    <div className="mcp-key-list">
                      {activeKeys.map(k => (
                        <div key={k.id} className="mcp-key-row">
                          <div>
                            <div className="mcp-key-prefix">{k.key_prefix}</div>
                            <div className="mcp-key-meta">
                              Created {new Date(k.created_at).toLocaleDateString()}
                              {k.last_used_at && ` — Last used ${new Date(k.last_used_at).toLocaleDateString()}`}
                            </div>
                          </div>
                          <button className="mcp-btn mcp-btn-danger" onClick={() => revokeKey(k.id)}>
                            Revoke
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Configuration */}
          <div className="mcp-section">
            <div className="mcp-section-title">Configuration</div>
            <p style={{ color: 'var(--cb-text-muted)', marginBottom: 16 }}>
              Add this to your Claude Desktop config file or any MCP-compatible client:
            </p>
            <div className="mcp-code-block">
              <button
                className="mcp-code-copy"
                onClick={() => copyToClipboard(configJson, 'config')}
              >
                {copied === 'config' ? 'Copied' : 'Copy'}
              </button>
              {configJson}
            </div>
            <p style={{ color: 'var(--cb-text-muted)', marginTop: 16, fontSize: 12 }}>
              Config file locations: macOS <code style={{ background: 'var(--cb-surface)', padding: '2px 6px', borderRadius: 2 }}>~/Library/Application Support/Claude/claude_desktop_config.json</code>
              {' '}Windows <code style={{ background: 'var(--cb-surface)', padding: '2px 6px', borderRadius: 2 }}>%APPDATA%\Claude\claude_desktop_config.json</code>
            </p>
          </div>

          {/* Endpoint */}
          <div className="mcp-section">
            <div className="mcp-section-title">Endpoint</div>
            <div className="mcp-code-block">
POST https://www.contrabxnd.io/api/mcp
Authorization: Bearer cbx_your_key_here
Content-Type: application/json
Accept: application/json, text/event-stream</div>
          </div>

          {/* Roadmap */}
          <div className="mcp-section">
            <div className="mcp-section-title">Roadmap</div>
            <div className="mcp-roadmap">
              {[
                {
                  phase: 'Phase 2',
                  title: 'Indexer',
                  status: 'live',
                  tools: [
                    ['query_address', 'Balance, total received/sent, tx count for any address'],
                    ['query_transaction', 'Full tx details: inputs, outputs, fee, confirmations'],
                    ['query_block', 'Block header, miner pool, size, weight, difficulty'],
                    ['get_mempool_analysis', 'Real-time mempool depth and fee distribution'],
                    ['estimate_fee', 'Smart fee estimation from node mempool'],
                    ['get_address_history', 'Recent transaction history for any address'],
                    ['trace_funds', 'Follow BTC forward through the transaction graph'],
                    ['decode_script', 'Decode and explain any Bitcoin script'],
                  ],
                },
                {
                  phase: 'Phase 3',
                  title: 'Lightning',
                  status: 'live',
                  tools: [
                    ['get_node_info', 'Contrabxnd node pubkey, alias, channel count, URIs'],
                    ['get_lightning_balance', 'Channel + on-chain balances'],
                    ['list_channels', 'Active channels with balance and peer info'],
                    ['create_invoice', 'Generate a BOLT11 Lightning invoice'],
                    ['decode_invoice', 'Decode BOLT11 to see amount, description, expiry'],
                  ],
                },
                {
                  phase: 'Phase 4',
                  title: 'Wallets',
                  status: 'planned',
                  tools: [
                    ['create_wallet', 'Create a Contrabxnd wallet (on-chain + Lightning)'],
                    ['get_balance', 'Combined on-chain and Lightning balance'],
                    ['send_bitcoin', 'Send on-chain BTC with fee selection'],
                    ['receive_lightning', 'Create invoice for incoming Lightning payment'],
                    ['send_lightning', 'Pay Lightning invoice from wallet balance'],
                    ['export_xpub', 'Export wallet xpub for watch-only access'],
                  ],
                },
                {
                  phase: 'Phase 5',
                  title: 'Trading',
                  status: 'planned',
                  tools: [
                    ['buy_bitcoin', 'Buy BTC via Coinbase into Contrabxnd wallet'],
                    ['sell_bitcoin', 'Sell BTC from wallet, settle to bank'],
                    ['place_limit_order', 'Place a limit buy/sell on exchange'],
                    ['auto_dca', 'Set up recurring buys at any interval'],
                    ['get_trade_history', 'Past trades with P&L'],
                  ],
                },
                {
                  phase: 'Phase 6',
                  title: 'L402 Micropayments',
                  status: 'live',
                  tools: [
                    ['get_pricing', 'List paywalled resources and their sat prices'],
                    ['GET /api/premium/*', 'L402-gated endpoints: 402 + invoice, pay, retry with preimage'],
                  ],
                },
              ].map(({ phase, title, status, tools }) => (
                <div key={phase} className="mcp-roadmap-phase">
                  <div className="mcp-roadmap-header">
                    <div className="mcp-roadmap-phase-label">
                      <span className="mcp-roadmap-phase-tag">{phase}</span>
                      <span className="mcp-roadmap-title">{title}</span>
                    </div>
                    <span className={`mcp-roadmap-status ${status === 'coming soon' ? 'soon' : status === 'live' ? 'live' : ''}`}>
                      {status}
                    </span>
                  </div>
                  <div className="mcp-roadmap-tools">
                    {tools.map(([name, desc]) => (
                      <div key={name} className="mcp-roadmap-tool">
                        <span className="mcp-roadmap-tool-name">{name}</span>
                        <span className="mcp-roadmap-tool-desc">{desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </InfraShell>
    </>
  );
}
