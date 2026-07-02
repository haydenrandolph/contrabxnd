'use client';

import { useState } from 'react';
import Lab from './Lab';

interface Stats { funded_txo_sum: number; spent_txo_sum: number; tx_count: number }
interface AddrInfo { address: string; chain_stats: Stats; mempool_stats: Stats }

const EXAMPLES: { label: string; addr: string }[] = [
  { label: "Satoshi's genesis address", addr: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' },
  { label: 'Bitfinex cold wallet', addr: 'bc1qgdjqv0av3q56jvd82tkdjpy7gdp9ut8tlqmgrpmv24sq90ecnvqqjwvw97' },
];

const fmtBtc = (sats: number) => `${(sats / 1e8).toLocaleString('en-US', { maximumFractionDigits: 8 })} BTC`;
const fmtNum = (n: number) => n.toLocaleString('en-US');

export default function AddressLookupLab() {
  const [value, setValue] = useState('');
  const [info, setInfo] = useState<AddrInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const lookup = async (addr: string) => {
    const a = addr.trim();
    if (!a) return;
    setLoading(true);
    setError('');
    setInfo(null);
    try {
      const res = await fetch(`/api/node/address/${a}`, { cache: 'no-store' });
      if (!res.ok) { setError('Address not found or invalid.'); }
      else setInfo(await res.json());
    } catch { setError('Could not reach the node.'); }
    setLoading(false);
  };

  const balance = info ? info.chain_stats.funded_txo_sum - info.chain_stats.spent_txo_sum : 0;
  const received = info ? info.chain_stats.funded_txo_sum : 0;
  const txCount = info ? info.chain_stats.tx_count + info.mempool_stats.tx_count : 0;

  return (
    <Lab
      title="Look up any address on the chain"
      note={
        <>
          Every balance is <strong>public and verifiable</strong> — you don&apos;t trust a bank&apos;s
          statement, you check the ledger yourself. Self-custody means <em>you</em> hold the keys to
          an address like these. Anyone can watch an address, but only the keyholder can spend from it.
        </>
      }
    >
      <style jsx global>{`
        .al-form { display: flex; gap: 8px; margin-bottom: 12px; }
        .al-input { flex: 1; min-width: 0; background: var(--cb-bg); border: 1px solid var(--cb-border); border-radius: var(--cb-radius); color: var(--cb-text); font-family: var(--cb-font-mono); font-size: 12px; padding: 9px 12px; }
        .al-input:focus { outline: none; border-color: var(--cb-accent); }
        .al-ex { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
        .al-chip { background: transparent; border: 1px solid var(--cb-border); border-radius: var(--cb-radius); color: var(--cb-text-muted); font-family: var(--cb-font-mono); font-size: 10px; padding: 4px 10px; cursor: pointer; transition: border-color 0.15s ease, color 0.15s ease; }
        .al-chip:hover { border-color: var(--cb-accent); color: var(--cb-accent); }
        .al-err { font-family: var(--cb-font-mono); font-size: 12px; color: #e05a4a; }
        .al-result { border: 1px solid var(--cb-border); border-radius: var(--cb-radius); overflow: hidden; }
        .al-addr { font-family: var(--cb-font-mono); font-size: 11px; color: var(--cb-text-muted); padding: 10px 14px; border-bottom: 1px solid var(--cb-border); word-break: break-all; background: var(--cb-bg-surface); }
        .al-row { display: flex; justify-content: space-between; align-items: baseline; padding: 11px 14px; border-bottom: 1px solid var(--cb-border); }
        .al-row:last-child { border-bottom: none; }
        .al-k { font-family: var(--cb-font-mono); font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--cb-text-muted); }
        .al-v { font-family: var(--cb-font-mono); font-size: 14px; color: var(--cb-text); }
        .al-v.big { font-size: 17px; color: var(--cb-accent); }
      `}</style>

      <form
        className="al-form"
        onSubmit={(e) => { e.preventDefault(); lookup(value); }}
      >
        <input
          className="al-input"
          placeholder="Paste a Bitcoin address…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          spellCheck={false}
        />
        <button type="submit" className="lab-btn" disabled={loading || !value.trim()}>
          {loading ? '…' : 'Look up'}
        </button>
      </form>

      <div className="al-ex">
        {EXAMPLES.map((ex) => (
          <button key={ex.addr} className="al-chip" onClick={() => { setValue(ex.addr); lookup(ex.addr); }}>
            {ex.label}
          </button>
        ))}
      </div>

      {error && <div className="al-err">{error}</div>}

      {info && (
        <div className="al-result">
          <div className="al-addr">{info.address}</div>
          <div className="al-row"><span className="al-k">Balance</span><span className="al-v big">{fmtBtc(balance)}</span></div>
          <div className="al-row"><span className="al-k">Total received</span><span className="al-v">{fmtBtc(received)}</span></div>
          <div className="al-row"><span className="al-k">Transactions</span><span className="al-v">{fmtNum(txCount)}</span></div>
        </div>
      )}
    </Lab>
  );
}
