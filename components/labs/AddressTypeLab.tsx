'use client';

import { useState } from 'react';
import Lab from './Lab';

interface Decoded { name: string; std: string; note: string }

function decode(raw: string): Decoded | null {
  const a = raw.trim();
  if (!a) return null;
  if (/^bc1p/i.test(a)) return { name: 'Taproot', std: 'P2TR · Bech32m', note: 'Newest format (2021). Better privacy and smart-contract features. Starts with bc1p.' };
  if (/^bc1q/i.test(a)) return { name: 'Native SegWit', std: 'P2WPKH · Bech32', note: 'Today’s default. Lowest fees, most efficient. Starts with bc1q.' };
  if (/^bc1/i.test(a)) return { name: 'SegWit (Bech32)', std: 'Bech32 witness', note: 'A witness-program address. Modern, low-fee format.' };
  if (/^3/.test(a)) return { name: 'Nested SegWit', std: 'P2SH · Base58', note: 'Transitional format from 2017. A script hash — often wraps SegWit. Starts with 3.' };
  if (/^1/.test(a)) return { name: 'Legacy', std: 'P2PKH · Base58', note: 'The original 2009 format. Still valid, but higher fees. Starts with 1.' };
  if (/^(tb1|[mn2])/i.test(a)) return { name: 'Testnet', std: 'test network', note: 'A testnet address — play money, not real bitcoin.' };
  return null;
}

const EXAMPLES: { label: string; addr: string }[] = [
  { label: 'Legacy', addr: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' },
  { label: 'P2SH', addr: '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy' },
  { label: 'SegWit', addr: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq' },
  { label: 'Taproot', addr: 'bc1p5cyxnuxmeuwuvkwfem96l4wr09xnw8j5c6l0z7fu3z2m4c6y6pxq3zqk4a' },
];

export default function AddressTypeLab() {
  const [value, setValue] = useState('');
  const decoded = decode(value);
  const touched = value.trim().length > 0;

  return (
    <Lab
      title="Decode any address format"
      note={
        <>
          One wallet, from one seed phrase, can hand out all of these formats — they all point back to
          keys only you hold. The prefix tells you the <strong>type</strong>: <code>1</code> legacy,
          <code> 3</code> script, <code>bc1q</code> SegWit, <code>bc1p</code> Taproot. Newer formats
          mean lower fees, which is why modern wallets default to <strong>bc1q</strong>.
        </>
      }
    >
      <style jsx global>{`
        .at-input { width: 100%; box-sizing: border-box; background: var(--cb-bg); border: 1px solid var(--cb-border); border-radius: var(--cb-radius); color: var(--cb-text); font-family: var(--cb-font-mono); font-size: 12px; padding: 10px 12px; }
        .at-input:focus { outline: none; border-color: var(--cb-accent); }
        .at-ex { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0; }
        .at-chip { background: transparent; border: 1px solid var(--cb-border); border-radius: var(--cb-radius); color: var(--cb-text-muted); font-family: var(--cb-font-mono); font-size: 10px; padding: 4px 10px; cursor: pointer; transition: border-color 0.15s ease, color 0.15s ease; }
        .at-chip:hover { border-color: var(--cb-accent); color: var(--cb-accent); }
        .at-out { border: 1px solid var(--cb-border); border-radius: var(--cb-radius); padding: 14px 16px; margin-top: 4px; }
        .at-name { font-family: var(--cb-font-mono); font-size: 17px; color: var(--cb-accent); }
        .at-std { font-family: var(--cb-font-mono); font-size: 11px; color: var(--cb-text-dim); text-transform: uppercase; letter-spacing: 0.08em; margin-top: 3px; }
        .at-note { font-size: 13px; line-height: 1.55; color: var(--cb-text-muted); margin-top: 10px; }
        .at-none { font-family: var(--cb-font-mono); font-size: 12px; color: var(--cb-text-dim); margin-top: 4px; }
      `}</style>

      <input
        className="at-input"
        placeholder="Paste a Bitcoin address to identify its type…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        spellCheck={false}
      />

      <div className="at-ex">
        {EXAMPLES.map((ex) => (
          <button key={ex.addr} className="at-chip" onClick={() => setValue(ex.addr)}>{ex.label}</button>
        ))}
      </div>

      {decoded ? (
        <div className="at-out">
          <div className="at-name">{decoded.name}</div>
          <div className="at-std">{decoded.std}</div>
          <div className="at-note">{decoded.note}</div>
        </div>
      ) : touched ? (
        <div className="at-none">Unrecognized prefix — that doesn&apos;t look like a Bitcoin address.</div>
      ) : null}
    </Lab>
  );
}
