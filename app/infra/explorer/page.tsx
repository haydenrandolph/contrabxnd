'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';

// ── mempool.space API shapes (subset we use) ──
interface AddrStats {
  funded_txo_sum: number;
  spent_txo_sum: number;
  tx_count: number;
}
interface AddrInfo {
  address: string;
  chain_stats: AddrStats;
  mempool_stats: AddrStats;
}
interface TxStatus {
  confirmed: boolean;
  block_height?: number;
  block_time?: number;
}
interface Vout {
  scriptpubkey_address?: string;
  scriptpubkey_type?: string;
  value: number;
}
interface Vin {
  is_coinbase?: boolean;
  prevout?: Vout | null;
}
interface Tx {
  txid: string;
  fee: number;
  weight: number;
  size: number;
  status: TxStatus;
  vin: Vin[];
  vout: Vout[];
}
interface Block {
  id: string;
  height: number;
  timestamp: number;
  tx_count: number;
  size: number;
  weight: number;
  difficulty: number;
  merkle_root: string;
  previousblockhash?: string;
  nonce: number;
  extras?: { pool?: { name?: string } };
}

type ResultType = 'address' | 'tx' | 'block';
interface Result {
  type: ResultType;
  source: string | null;
  address?: AddrInfo;
  addressTxs?: Tx[];
  tx?: Tx;
  block?: Block;
}

const SATS = 1e8;
const fmtBtc = (sats: number) => {
  const btc = sats / SATS;
  return `${btc.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 8 })} BTC`;
};
const fmtNum = (n: number) => n.toLocaleString('en-US');
const fmtTime = (unix: number) => new Date(unix * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
const short = (s: string, n = 10) => (s.length > n * 2 ? `${s.slice(0, n)}…${s.slice(-n)}` : s);

function detectType(q: string): ResultType | null {
  const v = q.trim();
  if (/^\d+$/.test(v)) return 'block'; // block height
  if (/^0{8,}[a-f0-9]{56}$/i.test(v)) return 'block'; // block hash (leading zeros)
  if (/^[a-f0-9]{64}$/i.test(v)) return 'tx'; // txid
  if (/^(bc1|tb1|[13]|[mn2])[a-zA-Z0-9]{10,}$/.test(v)) return 'address';
  return null;
}

export default function ExplorerPage() {
  const { isLightMode } = useTheme();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const run = useCallback(async (raw: string) => {
    const q = raw.trim();
    if (!q) return;
    const type = detectType(q);
    if (!type) {
      setError('Unrecognized input. Enter a Bitcoin address, transaction id, block height, or block hash.');
      setResult(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (type === 'address') {
        const [aRes, txRes] = await Promise.all([
          fetch(`/api/node/address/${q}`),
          fetch(`/api/node/address/${q}/txs`),
        ]);
        if (!aRes.ok) throw new Error('Address not found');
        const address: AddrInfo = await aRes.json();
        const addressTxs: Tx[] = txRes.ok ? await txRes.json() : [];
        setResult({ type, source: aRes.headers.get('x-node-source'), address, addressTxs });
      } else if (type === 'tx') {
        const res = await fetch(`/api/node/tx/${q}`);
        if (!res.ok) throw new Error('Transaction not found');
        setResult({ type, source: res.headers.get('x-node-source'), tx: await res.json() });
      } else {
        let hash = q;
        if (/^\d+$/.test(q)) {
          const hRes = await fetch(`/api/node/block-height/${q}`);
          if (!hRes.ok) throw new Error('Block height not found');
          hash = (await hRes.text()).trim();
        }
        const res = await fetch(`/api/node/block/${hash}`);
        if (!res.ok) throw new Error('Block not found');
        setResult({ type, source: res.headers.get('x-node-source'), block: await res.json() });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lookup failed');
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const lookup = useCallback((q: string) => { setQuery(q); run(q); }, [run]);

  // Prefill with the latest block height as a friendly default
  useEffect(() => {
    fetch('/api/node/blocks/tip/height')
      .then((r) => (r.ok ? r.text() : null))
      .then((h) => { if (h && !query) setQuery(h.trim()); })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = (e: React.FormEvent) => { e.preventDefault(); run(query); };

  return (
    <>
      <style jsx global>{`
        .tool-page { background: var(--cb-bg); color: var(--cb-text); font-family: var(--cb-font-mono); font-size: 13px; line-height: 1.7; min-height: 100vh; overflow-x: hidden; }
        .page-header { max-width: 860px; margin: 0 auto; padding: 80px 48px 0; }
        .page-label { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--cb-accent); margin-bottom: 16px; }
        .page-label a { color: var(--cb-text-muted); text-decoration: none; transition: color 0.15s ease; }
        .page-label a:hover { color: var(--cb-text); }
        .page-title { font-family: var(--cb-font-display, 'Inter', serif); font-size: clamp(2rem, 4vw, 3rem); font-weight: 400; letter-spacing: -0.02em; line-height: 1.15; margin-bottom: 12px; }
        .page-subtitle { font-family: 'JetBrains Mono', monospace; font-size: 13px; color: var(--cb-text-muted); max-width: 600px; }
        .page-divider { width: 100%; height: 1px; background: var(--cb-border); margin-top: 32px; }
        .tool-content { max-width: 860px; margin: 0 auto; padding: 40px 48px 96px; }

        .ex-search { display: flex; gap: 8px; }
        .ex-input { flex: 1; background: var(--cb-bg); border: 1px solid var(--cb-border); border-radius: 2px; color: var(--cb-text); font-family: var(--cb-font-mono); font-size: 13px; padding: 12px 14px; outline: none; transition: border-color 0.15s ease; }
        .ex-input:focus { border-color: var(--cb-accent); }
        .ex-btn { background: var(--cb-text); color: var(--cb-bg); border: none; border-radius: 2px; font-family: var(--cb-font-mono); font-size: 12px; letter-spacing: 0.06em; text-transform: uppercase; padding: 0 22px; cursor: pointer; transition: opacity 0.15s ease; }
        .ex-btn:hover { opacity: 0.85; }
        .ex-btn:disabled { opacity: 0.4; cursor: default; }
        .ex-hint { margin-top: 10px; font-size: 11px; color: var(--cb-text-muted); }

        .ex-error { margin-top: 24px; border: 1px solid var(--cb-border); border-left: 2px solid var(--cb-accent); border-radius: 2px; padding: 14px 16px; color: var(--cb-text-muted); font-size: 12px; }

        .ex-result { margin-top: 28px; border: 1px solid var(--cb-border); border-radius: 2px; }
        .ex-result-head { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid var(--cb-border); }
        .ex-result-kind { font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--cb-text-muted); }
        .ex-badge { font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; padding: 2px 7px; border-radius: 2px; }
        .ex-badge.node { background: var(--cb-accent); color: var(--cb-bg); }
        .ex-badge.public { border: 1px solid var(--cb-border); color: var(--cb-text-muted); }

        .ex-row { display: flex; gap: 16px; padding: 11px 16px; border-bottom: 1px solid var(--cb-border); }
        .ex-row:last-child { border-bottom: none; }
        .ex-key { flex: 0 0 150px; color: var(--cb-text-muted); font-size: 11px; letter-spacing: 0.04em; text-transform: uppercase; }
        .ex-val { flex: 1; word-break: break-all; }
        .ex-val.big { font-size: 15px; }
        .ex-link { color: var(--cb-text); text-decoration: none; border-bottom: 1px dotted var(--cb-border); cursor: pointer; }
        .ex-link:hover { color: var(--cb-accent); border-bottom-color: var(--cb-accent); }
        .ex-confirmed { color: var(--cb-accent); }
        .ex-pending { color: var(--cb-text-muted); }

        .ex-sub { padding: 12px 16px; border-bottom: 1px solid var(--cb-border); font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--cb-text-muted); }
        .ex-io { padding: 9px 16px; border-bottom: 1px solid var(--cb-border); display: flex; justify-content: space-between; gap: 16px; font-size: 12px; }
        .ex-io:last-child { border-bottom: none; }
        .ex-io-addr { word-break: break-all; color: var(--cb-text-muted); }
        .ex-io-val { flex: 0 0 auto; white-space: nowrap; }
        .ex-txlist-item { padding: 10px 16px; border-bottom: 1px solid var(--cb-border); display: flex; justify-content: space-between; gap: 16px; }
        .ex-txlist-item:last-child { border-bottom: none; }

        @media (max-width: 768px) {
          .page-header { padding: 72px 24px 0; }
          .tool-content { padding: 28px 24px 64px; }
          .ex-key { flex-basis: 96px; }
        }
      `}</style>

      <div className={`tool-page ${isLightMode ? 'light-mode' : ''}`}>
        <SiteNav activePath="/infra" />

        <div className="page-header">
          <div className="page-label"><a href="/infra">INFRA</a> / BLOCK EXPLORER</div>
          <h1 className="page-title">Block Explorer</h1>
          <p className="page-subtitle">Look up any Bitcoin address, transaction, or block — served live from the Contrabxnd sovereign node.</p>
          <div className="page-divider" />
        </div>

        <div className="tool-content">
          <form className="ex-search" onSubmit={onSubmit}>
            <input
              className="ex-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Address · txid · block height · block hash"
              spellCheck={false}
              autoComplete="off"
            />
            <button className="ex-btn" type="submit" disabled={loading}>{loading ? '…' : 'Search'}</button>
          </form>
          <div className="ex-hint">Try a block height like <span className="ex-link" onClick={() => lookup('840000')}>840000</span>, or the genesis coinbase address <span className="ex-link" onClick={() => lookup('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')}>1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa</span>.</div>

          {error && <div className="ex-error">{error}</div>}

          {result && <ResultView result={result} lookup={lookup} />}
        </div>

        <SiteFooter />
      </div>
    </>
  );
}

function SourceBadge({ source }: { source: string | null }) {
  if (source === 'node') return <span className="ex-badge node">● Node</span>;
  return <span className="ex-badge public">Public</span>;
}

function ResultView({ result, lookup }: { result: Result; lookup: (q: string) => void }) {
  if (result.type === 'address' && result.address) {
    const a = result.address;
    const balance = a.chain_stats.funded_txo_sum - a.chain_stats.spent_txo_sum;
    const unconfirmed = a.mempool_stats.funded_txo_sum - a.mempool_stats.spent_txo_sum;
    const txs = result.addressTxs ?? [];
    return (
      <div className="ex-result">
        <div className="ex-result-head"><span className="ex-result-kind">Address</span><SourceBadge source={result.source} /></div>
        <div className="ex-row"><div className="ex-key">Address</div><div className="ex-val">{a.address}</div></div>
        <div className="ex-row"><div className="ex-key">Balance</div><div className="ex-val big">{fmtBtc(balance)}</div></div>
        {unconfirmed !== 0 && <div className="ex-row"><div className="ex-key">Unconfirmed</div><div className="ex-val">{fmtBtc(unconfirmed)}</div></div>}
        <div className="ex-row"><div className="ex-key">Received</div><div className="ex-val">{fmtBtc(a.chain_stats.funded_txo_sum)}</div></div>
        <div className="ex-row"><div className="ex-key">Sent</div><div className="ex-val">{fmtBtc(a.chain_stats.spent_txo_sum)}</div></div>
        <div className="ex-row"><div className="ex-key">Transactions</div><div className="ex-val">{fmtNum(a.chain_stats.tx_count)}</div></div>
        {txs.length > 0 && <div className="ex-sub">Recent transactions ({txs.length})</div>}
        {txs.map((tx) => (
          <div className="ex-txlist-item" key={tx.txid}>
            <span className="ex-io-addr"><span className="ex-link" onClick={() => lookup(tx.txid)}>{short(tx.txid, 12)}</span></span>
            <span className="ex-io-val">{tx.status.confirmed ? <span className="ex-confirmed">#{fmtNum(tx.status.block_height ?? 0)}</span> : <span className="ex-pending">pending</span>}</span>
          </div>
        ))}
      </div>
    );
  }

  if (result.type === 'tx' && result.tx) {
    const tx = result.tx;
    const outTotal = tx.vout.reduce((s, v) => s + v.value, 0);
    const vsize = Math.ceil(tx.weight / 4);
    return (
      <div className="ex-result">
        <div className="ex-result-head"><span className="ex-result-kind">Transaction</span><SourceBadge source={result.source} /></div>
        <div className="ex-row"><div className="ex-key">Txid</div><div className="ex-val">{tx.txid}</div></div>
        <div className="ex-row"><div className="ex-key">Status</div><div className="ex-val">{tx.status.confirmed ? <span className="ex-confirmed">Confirmed · block {fmtNum(tx.status.block_height ?? 0)}</span> : <span className="ex-pending">Pending (mempool)</span>}</div></div>
        {tx.status.block_time && <div className="ex-row"><div className="ex-key">Time</div><div className="ex-val">{fmtTime(tx.status.block_time)}</div></div>}
        <div className="ex-row"><div className="ex-key">Value out</div><div className="ex-val big">{fmtBtc(outTotal)}</div></div>
        <div className="ex-row"><div className="ex-key">Fee</div><div className="ex-val">{fmtBtc(tx.fee)} · {(tx.fee / vsize).toFixed(1)} sat/vB</div></div>
        <div className="ex-row"><div className="ex-key">Size</div><div className="ex-val">{fmtNum(vsize)} vB ({fmtNum(tx.size)} B)</div></div>
        <div className="ex-sub">Inputs ({tx.vin.length})</div>
        {tx.vin.map((vin, i) => (
          <div className="ex-io" key={i}>
            <span className="ex-io-addr">{vin.is_coinbase ? 'Coinbase (newly minted)' : vin.prevout?.scriptpubkey_address ? <span className="ex-link" onClick={() => lookup(vin.prevout!.scriptpubkey_address!)}>{vin.prevout.scriptpubkey_address}</span> : 'unknown'}</span>
            <span className="ex-io-val">{vin.prevout ? fmtBtc(vin.prevout.value) : ''}</span>
          </div>
        ))}
        <div className="ex-sub">Outputs ({tx.vout.length})</div>
        {tx.vout.map((v, i) => (
          <div className="ex-io" key={i}>
            <span className="ex-io-addr">{v.scriptpubkey_address ? <span className="ex-link" onClick={() => lookup(v.scriptpubkey_address!)}>{v.scriptpubkey_address}</span> : (v.scriptpubkey_type ?? 'unknown')}</span>
            <span className="ex-io-val">{fmtBtc(v.value)}</span>
          </div>
        ))}
      </div>
    );
  }

  if (result.type === 'block' && result.block) {
    const b = result.block;
    return (
      <div className="ex-result">
        <div className="ex-result-head"><span className="ex-result-kind">Block</span><SourceBadge source={result.source} /></div>
        <div className="ex-row"><div className="ex-key">Height</div><div className="ex-val big">{fmtNum(b.height)}</div></div>
        <div className="ex-row"><div className="ex-key">Hash</div><div className="ex-val">{b.id}</div></div>
        <div className="ex-row"><div className="ex-key">Timestamp</div><div className="ex-val">{fmtTime(b.timestamp)}</div></div>
        {b.extras?.pool?.name && <div className="ex-row"><div className="ex-key">Mined by</div><div className="ex-val">{b.extras.pool.name}</div></div>}
        <div className="ex-row"><div className="ex-key">Transactions</div><div className="ex-val">{fmtNum(b.tx_count)}</div></div>
        <div className="ex-row"><div className="ex-key">Size</div><div className="ex-val">{(b.size / 1e6).toFixed(2)} MB · {fmtNum(b.weight)} WU</div></div>
        <div className="ex-row"><div className="ex-key">Difficulty</div><div className="ex-val">{b.difficulty.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div></div>
        <div className="ex-row"><div className="ex-key">Merkle root</div><div className="ex-val">{b.merkle_root}</div></div>
        {b.previousblockhash && <div className="ex-row"><div className="ex-key">Previous</div><div className="ex-val"><span className="ex-link" onClick={() => lookup(b.previousblockhash!)}>{short(b.previousblockhash, 16)}</span></div></div>}
        <div className="ex-row"><div className="ex-key">Nonce</div><div className="ex-val">{fmtNum(b.nonce)}</div></div>
      </div>
    );
  }

  return null;
}
