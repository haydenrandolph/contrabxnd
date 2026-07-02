'use client';

import { useState, useEffect, useCallback } from 'react';
import Lab from './Lab';

interface Block {
  id: string;
  height: number;
  timestamp: number;
  tx_count: number;
  size: number;
  nonce: number;
  extras?: { pool?: { name?: string } };
}

const ago = (t: number) => {
  const s = Math.max(0, Math.floor(Date.now() / 1000 - t));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m ago`;
};

/** Splits a block hash into its leading-zero run and the remainder. */
function splitHash(hash: string): [string, string] {
  const m = hash.match(/^(0+)/);
  const zeros = m ? m[1] : '';
  return [zeros, hash.slice(zeros.length)];
}

export default function LiveBlockLab() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/node/v1/blocks', { cache: 'no-store' });
      if (res.ok) setBlocks(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const i = setInterval(load, 30_000);
    return () => clearInterval(i);
  }, [load]);

  const tip = blocks[0];
  const [zeros, rest] = tip ? splitHash(tip.id) : ['', ''];

  return (
    <Lab
      title="Watch a real block"
      note={
        <>
          See those <strong>leading zeros</strong> at the start of the hash? A miner tried
          quintillions of nonces to find a block hash that small — that&apos;s the <strong>proof of
          work</strong>. Every block above is a real block on the Bitcoin timechain, served live from
          the Contrabxnd node.
        </>
      }
    >
      <style jsx global>{`
        .lbl-tip { border: 1px solid var(--cb-border); border-radius: var(--cb-radius); padding: 16px; margin-bottom: 16px; }
        .lbl-tip-top { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
        .lbl-height { font-family: var(--cb-font-mono); font-size: 22px; font-weight: 500; color: var(--cb-text); }
        .lbl-age { font-family: var(--cb-font-mono); font-size: 11px; color: var(--cb-text-muted); }
        .lbl-hashlabel { font-family: var(--cb-font-mono); font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--cb-text-dim); margin-bottom: 4px; }
        .lbl-hash { font-family: var(--cb-font-mono); font-size: 12px; word-break: break-all; line-height: 1.5; color: var(--cb-text-muted); }
        .lbl-hash .z { color: var(--cb-accent); font-weight: 700; }
        .lbl-meta { display: flex; flex-wrap: wrap; gap: 18px; margin-top: 14px; }
        .lbl-meta div { font-family: var(--cb-font-mono); font-size: 12px; color: var(--cb-text); }
        .lbl-meta span { color: var(--cb-text-muted); font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; display: block; margin-bottom: 2px; }
        .lbl-recent { display: flex; flex-direction: column; }
        .lbl-recent-h { font-family: var(--cb-font-mono); font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--cb-text-dim); margin-bottom: 6px; }
        .lbl-row { display: flex; justify-content: space-between; gap: 12px; padding: 7px 0; border-top: 1px solid var(--cb-border); font-family: var(--cb-font-mono); font-size: 12px; }
        .lbl-row .h { color: var(--cb-accent); }
        .lbl-row .m { color: var(--cb-text-muted); }
      `}</style>

      {loading && !tip ? (
        <div style={{ color: 'var(--cb-text-muted)', fontFamily: 'var(--cb-font-mono)', fontSize: 13 }}>Fetching the latest block…</div>
      ) : tip ? (
        <>
          <div className="lbl-tip">
            <div className="lbl-tip-top">
              <span className="lbl-height">Block {tip.height.toLocaleString()}</span>
              <span className="lbl-age">{ago(tip.timestamp)}</span>
            </div>
            <div className="lbl-hashlabel">Block hash</div>
            <div className="lbl-hash"><span className="z">{zeros}</span>{rest}</div>
            <div className="lbl-meta">
              <div><span>Mined by</span>{tip.extras?.pool?.name ?? 'Unknown'}</div>
              <div><span>Transactions</span>{tip.tx_count.toLocaleString()}</div>
              <div><span>Size</span>{(tip.size / 1e6).toFixed(2)} MB</div>
              <div><span>Nonce</span>{tip.nonce.toLocaleString()}</div>
            </div>
          </div>

          <div className="lbl-recent">
            <div className="lbl-recent-h">Recent blocks (the chain)</div>
            {blocks.slice(0, 6).map((b) => (
              <div className="lbl-row" key={b.id}>
                <span className="h">#{b.height.toLocaleString()}</span>
                <span className="m">{b.tx_count.toLocaleString()} txs · {ago(b.timestamp)}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div style={{ color: 'var(--cb-text-muted)', fontFamily: 'var(--cb-font-mono)', fontSize: 13 }}>Couldn&apos;t reach the node right now.</div>
      )}
    </Lab>
  );
}
