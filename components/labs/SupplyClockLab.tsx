'use client';

import { useState, useEffect } from 'react';
import Lab from './Lab';

const HALVING_INTERVAL = 210_000;
const MAX_SUPPLY = 21_000_000;

/** Circulating supply (BTC) implied by the current block height. */
function minedSupply(height: number): number {
  let sats = 0;
  let reward = 50 * 1e8;
  let remaining = height + 1; // blocks 0..height inclusive
  while (reward > 0 && remaining > 0) {
    const inEpoch = Math.min(remaining, HALVING_INTERVAL);
    sats += inEpoch * reward;
    remaining -= inEpoch;
    reward = Math.floor(reward / 2);
  }
  return sats / 1e8;
}

const fmt = (n: number, d = 0) => n.toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: d });

export default function SupplyClockLab() {
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/node/blocks/tip/height', { cache: 'no-store' });
        if (res.ok) setHeight(parseInt(await res.text(), 10));
      } catch { /* ignore */ }
    };
    load();
    const i = setInterval(load, 30_000);
    return () => clearInterval(i);
  }, []);

  const epoch = height != null ? Math.floor(height / HALVING_INTERVAL) : 0;
  const reward = 50 / 2 ** epoch;
  const supply = height != null ? minedSupply(height) : 0;
  const pct = (supply / MAX_SUPPLY) * 100;
  const nextHalving = (epoch + 1) * HALVING_INTERVAL;
  const blocksToHalving = height != null ? nextHalving - height : 0;
  const daysToHalving = (blocksToHalving * 10) / 60 / 24;

  return (
    <Lab
      title="The supply clock"
      note={
        <>
          Nobody decides this number — it&apos;s enforced by every node on the network. At block{' '}
          <strong>{fmt(nextHalving)}</strong> the reward halves again, and the last satoshi won&apos;t
          be mined until around the year <strong>2140</strong>. That hard cap of 21 million is the
          whole point.
        </>
      }
    >
      <style jsx global>{`
        .sc-big { font-family: var(--cb-font-mono); font-size: 30px; font-weight: 500; letter-spacing: -0.01em; color: var(--cb-text); line-height: 1.1; }
        .sc-big small { font-size: 14px; color: var(--cb-text-muted); font-weight: 400; margin-left: 6px; }
        .sc-sub { font-family: var(--cb-font-mono); font-size: 11px; color: var(--cb-text-muted); margin-top: 4px; }
        .sc-bar { height: 8px; border-radius: 4px; background: var(--cb-border); overflow: hidden; margin: 16px 0 6px; }
        .sc-bar span { display: block; height: 100%; background: var(--cb-accent); transition: width 0.6s ease; }
        .sc-pct { font-family: var(--cb-font-mono); font-size: 11px; color: var(--cb-accent); }
        .sc-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 20px; }
        .sc-cell span { display: block; font-family: var(--cb-font-mono); font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--cb-text-dim); margin-bottom: 4px; }
        .sc-cell div { font-family: var(--cb-font-mono); font-size: 15px; color: var(--cb-text); }
        @media (max-width: 480px) { .sc-grid { grid-template-columns: 1fr 1fr; } }
      `}</style>

      {height == null ? (
        <div style={{ color: 'var(--cb-text-muted)', fontFamily: 'var(--cb-font-mono)', fontSize: 13 }}>Reading the chain height…</div>
      ) : (
        <>
          <div className="sc-big">{fmt(supply, 0)}<small>/ 21,000,000 BTC</small></div>
          <div className="sc-sub">circulating supply mined so far</div>
          <div className="sc-bar"><span style={{ width: `${pct}%` }} /></div>
          <div className="sc-pct">{pct.toFixed(2)}% of all bitcoin that will ever exist</div>

          <div className="sc-grid">
            <div className="sc-cell"><span>Block height</span><div>{fmt(height)}</div></div>
            <div className="sc-cell"><span>Block reward</span><div>{reward} BTC</div></div>
            <div className="sc-cell"><span>Next halving in</span><div>~{fmt(daysToHalving, 0)} days</div></div>
          </div>
        </>
      )}
    </Lab>
  );
}
