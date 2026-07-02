'use client';

import { useState, useEffect } from 'react';
import Lab from './Lab';

interface Fees {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  economyFee: number;
  minimumFee: number;
}

// A typical single-input, two-output native SegWit spend.
const TYPICAL_VSIZE = 141;

const TIERS: { key: keyof Fees; label: string; eta: string }[] = [
  { key: 'fastestFee', label: 'Next block', eta: '~10 min' },
  { key: 'halfHourFee', label: 'Medium', eta: '~30 min' },
  { key: 'hourFee', label: 'Slow', eta: '~1 hour' },
  { key: 'economyFee', label: 'Economy', eta: 'hours+' },
];

export default function FeeLab() {
  const [fees, setFees] = useState<Fees | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/node/v1/fees/recommended', { cache: 'no-store' });
        if (res.ok) setFees(await res.json());
      } catch { /* ignore */ }
    };
    load();
    const i = setInterval(load, 20_000);
    return () => clearInterval(i);
  }, []);

  return (
    <Lab
      title="What a transaction costs right now"
      note={
        <>
          Fees are a live <strong>auction for block space</strong>, not a fixed percentage. You pay
          per <strong>vByte</strong> (the size of your transaction), not per dollar sent — so moving
          $5 or $5 million costs the same. Pick a slower tier when the mempool is quiet and you&apos;ll
          pay far less.
        </>
      }
    >
      <style jsx global>{`
        .fl-rows { display: flex; flex-direction: column; }
        .fl-row { display: grid; grid-template-columns: 1fr auto auto; align-items: baseline; gap: 14px; padding: 12px 0; border-top: 1px solid var(--cb-border); }
        .fl-row:first-child { border-top: none; }
        .fl-label { font-family: var(--cb-font-mono); font-size: 13px; color: var(--cb-text); }
        .fl-eta { font-family: var(--cb-font-mono); font-size: 10px; color: var(--cb-text-dim); text-transform: uppercase; letter-spacing: 0.08em; }
        .fl-rate { font-family: var(--cb-font-mono); font-size: 13px; color: var(--cb-text-muted); text-align: right; }
        .fl-cost { font-family: var(--cb-font-mono); font-size: 14px; color: var(--cb-accent); text-align: right; min-width: 92px; }
        .fl-first .fl-label, .fl-first .fl-cost { font-weight: 600; }
        .fl-caption { font-family: var(--cb-font-mono); font-size: 10px; color: var(--cb-text-dim); margin-top: 12px; letter-spacing: 0.04em; }
      `}</style>

      {!fees ? (
        <div style={{ color: 'var(--cb-text-muted)', fontFamily: 'var(--cb-font-mono)', fontSize: 13 }}>Reading the mempool…</div>
      ) : (
        <>
          <div className="fl-rows">
            {TIERS.map((t, i) => {
              const rate = fees[t.key];
              const cost = rate * TYPICAL_VSIZE;
              return (
                <div className={`fl-row ${i === 0 ? 'fl-first' : ''}`} key={t.key}>
                  <span className="fl-label">{t.label} <span className="fl-eta">· {t.eta}</span></span>
                  <span className="fl-rate">{rate} sat/vB</span>
                  <span className="fl-cost">{cost.toLocaleString('en-US')} sats</span>
                </div>
              );
            })}
          </div>
          <div className="fl-caption">Cost estimated for a typical {TYPICAL_VSIZE} vByte send · live from the mempool</div>
        </>
      )}
    </Lab>
  );
}
