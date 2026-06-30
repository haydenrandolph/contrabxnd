'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';

interface LnInfo {
  configured: boolean;
  online?: boolean;
  alias?: string;
  pubkey?: string;
  num_channels?: number;
  num_peers?: number;
  total_capacity_sat?: number;
  block_height?: number;
  uris?: string[];
  version?: string;
}

const fmtSats = (s: number) => `${s.toLocaleString('en-US')} sats`;
const fmtBtc = (s: number) => `${(s / 1e8).toLocaleString('en-US', { maximumFractionDigits: 8 })} BTC`;

export default function LightningPage() {
  const { isLightMode } = useTheme();
  const [info, setInfo] = useState<LnInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/lightning/info')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setInfo(d))
      .catch(() => setInfo(null))
      .finally(() => setLoading(false));
  }, []);

  const uri = info?.uris?.[0] ?? null;
  const connectTarget = uri ?? info?.pubkey ?? '';

  return (
    <>
      <style jsx global>{`
        .tool-page { background: var(--cb-bg); color: var(--cb-text); font-family: var(--cb-font-mono); font-size: 13px; line-height: 1.7; min-height: 100vh; overflow-x: hidden; }
        .page-header { max-width: 760px; margin: 0 auto; padding: 80px 48px 0; }
        .page-label { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--cb-accent); margin-bottom: 16px; }
        .page-label a { color: var(--cb-text-muted); text-decoration: none; transition: color 0.15s ease; }
        .page-label a:hover { color: var(--cb-text); }
        .page-title { font-family: var(--cb-font-display, 'Cormorant Garamond', serif); font-size: clamp(2rem, 4vw, 3rem); font-weight: 400; letter-spacing: -0.02em; line-height: 1.15; margin-bottom: 12px; }
        .page-subtitle { font-family: 'Space Mono', monospace; font-size: 13px; color: var(--cb-text-muted); max-width: 600px; }
        .page-divider { width: 100%; height: 1px; background: var(--cb-border); margin-top: 32px; }
        .tool-content { max-width: 760px; margin: 0 auto; padding: 40px 48px 96px; }

        .ln-status { display: inline-flex; align-items: center; gap: 7px; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--cb-text-muted); margin-bottom: 24px; }
        .ln-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--cb-text-muted); }
        .ln-dot.online { background: var(--cb-accent); }

        .ln-card { border: 1px solid var(--cb-border); border-radius: 2px; margin-bottom: 20px; }
        .ln-card-head { padding: 12px 16px; border-bottom: 1px solid var(--cb-border); font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--cb-text-muted); }
        .ln-row { display: flex; gap: 16px; padding: 11px 16px; border-bottom: 1px solid var(--cb-border); }
        .ln-row:last-child { border-bottom: none; }
        .ln-key { flex: 0 0 150px; color: var(--cb-text-muted); font-size: 11px; letter-spacing: 0.04em; text-transform: uppercase; }
        .ln-val { flex: 1; word-break: break-all; }
        .ln-val.big { font-size: 18px; }

        .ln-connect { padding: 16px; }
        .ln-connect-uri { background: var(--cb-bg); border: 1px solid var(--cb-border); border-radius: 2px; padding: 12px 14px; word-break: break-all; font-size: 12px; color: var(--cb-text-muted); margin: 10px 0; }
        .ln-btn { background: var(--cb-text); color: var(--cb-bg); border: none; border-radius: 2px; font-family: var(--cb-font-mono); font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; padding: 9px 18px; cursor: pointer; transition: opacity 0.15s ease; }
        .ln-btn:hover { opacity: 0.85; }

        .ln-empty { border: 1px solid var(--cb-border); border-left: 2px solid var(--cb-accent); border-radius: 2px; padding: 20px; color: var(--cb-text-muted); }
        .ln-empty h3 { color: var(--cb-text); font-family: var(--cb-font-display, serif); font-weight: 400; font-size: 20px; margin: 0 0 8px; }

        .ln-note { font-size: 11px; color: var(--cb-text-muted); margin-top: 8px; }

        @media (max-width: 768px) {
          .page-header { padding: 72px 24px 0; }
          .tool-content { padding: 28px 24px 64px; }
          .ln-key { flex-basis: 110px; }
        }
      `}</style>

      <div className={`tool-page ${isLightMode ? 'light-mode' : ''}`}>
        <SiteNav activePath="/infra" />

        <div className="page-header">
          <div className="page-label"><a href="/infra">INFRA</a> / LIGHTNING</div>
          <h1 className="page-title">Lightning</h1>
          <p className="page-subtitle">Connect to the Contrabxnd Lightning node — open a channel, view capacity, and pay invoices over the Lightning Network.</p>
          <div className="page-divider" />
        </div>

        <div className="tool-content">
          {loading ? (
            <div style={{ color: 'var(--cb-text-muted)' }}>Loading node status…</div>
          ) : !info?.configured || !info?.online ? (
            <div className="ln-empty">
              <h3>Lightning node coming online</h3>
              <p>The Contrabxnd Lightning node is being connected. Soon you&apos;ll be able to open a channel to it, generate invoices, and settle micropayments for premium data and agent services over Lightning.</p>
            </div>
          ) : (
            <>
              <div className="ln-status">
                <span className="ln-dot online" /> Node online · synced at block {info.block_height?.toLocaleString()}
              </div>

              <div className="ln-card">
                <div className="ln-card-head">Node</div>
                <div className="ln-row"><div className="ln-key">Alias</div><div className="ln-val">{info.alias || '—'}</div></div>
                <div className="ln-row"><div className="ln-key">Capacity</div><div className="ln-val big">{info.total_capacity_sat != null ? fmtBtc(info.total_capacity_sat) : '—'}</div></div>
                <div className="ln-row"><div className="ln-key">Capacity (sats)</div><div className="ln-val">{info.total_capacity_sat != null ? fmtSats(info.total_capacity_sat) : '—'}</div></div>
                <div className="ln-row"><div className="ln-key">Channels</div><div className="ln-val">{info.num_channels ?? 0} active · {info.num_peers ?? 0} peers</div></div>
                <div className="ln-row"><div className="ln-key">Pubkey</div><div className="ln-val">{info.pubkey}</div></div>
                {info.version && <div className="ln-row"><div className="ln-key">Version</div><div className="ln-val">{info.version.split(' ')[0]}</div></div>}
              </div>

              {connectTarget && (
                <div className="ln-card">
                  <div className="ln-card-head">Open a channel to us</div>
                  <div className="ln-connect">
                    <div className="ln-connect-uri">{connectTarget}</div>
                    <button
                      className="ln-btn"
                      onClick={() => { navigator.clipboard.writeText(connectTarget); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                    >
                      {copied ? 'Copied' : 'Copy connect string'}
                    </button>
                    <div className="ln-note">
                      {uri ? 'Paste this into your Lightning wallet to peer and open a channel.' : 'No public URI advertised — peering requires the node pubkey plus a reachable address (clearnet or Tor).'}
                    </div>
                  </div>
                </div>
              )}

              <p className="ln-note">
                Invoice creation, decoding, and balance queries are available to AI agents and integrations via the{' '}
                <a href="/infra/mcp" style={{ color: 'var(--cb-accent)', textDecoration: 'none' }}>MCP server</a> (Phase 3 tools).
              </p>
            </>
          )}
        </div>

        <SiteFooter />
      </div>
    </>
  );
}
