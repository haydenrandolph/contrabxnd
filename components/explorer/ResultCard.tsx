'use client';

/**
 * Compact structured card rendered alongside the analyst's prose when it looks
 * up an on-chain entity (address / transaction / block / mempool / script).
 * Fed by the parsed tool-result data streamed from /api/explorer/chat.
 */

const fmtBtc = (n: number) => `${Number(n).toLocaleString('en-US', { maximumFractionDigits: 8 })} BTC`;
const fmtNum = (n: number) => Number(n).toLocaleString('en-US');
const short = (s: string, n = 10) => (typeof s === 'string' && s.length > n * 2 ? `${s.slice(0, n)}…${s.slice(-n)}` : s);
const fmtTime = (u: number) => new Date(u * 1000).toISOString().replace('T', ' ').slice(0, 16) + ' UTC';

type Data = Record<string, unknown>;

function Row({ k, v, big }: { k: string; v: React.ReactNode; big?: boolean }) {
  return (
    <div className="rc-row">
      <span className="rc-k">{k}</span>
      <span className={`rc-v ${big ? 'big' : ''}`}>{v}</span>
    </div>
  );
}

export default function ResultCard({ tool, data }: { tool: string; data: Data }) {
  let kind = '';
  let rows: React.ReactNode = null;

  if (tool === 'query_address') {
    kind = 'Address';
    rows = (
      <>
        <Row k="Address" v={<span className="rc-mono">{String(data.address)}</span>} />
        <Row k="Balance" big v={fmtBtc(data.balance_btc as number)} />
        <Row k="Received" v={fmtBtc(data.total_received_btc as number)} />
        <Row k="Sent" v={fmtBtc(data.total_sent_btc as number)} />
        <Row k="Transactions" v={fmtNum(data.tx_count as number)} />
        {(data.unconfirmed_tx_count as number) > 0 && <Row k="Unconfirmed" v={fmtNum(data.unconfirmed_tx_count as number)} />}
      </>
    );
  } else if (tool === 'query_transaction') {
    kind = 'Transaction';
    const st = (data.status ?? {}) as { confirmed?: boolean; block_height?: number };
    const vout = (data.vout ?? []) as Array<{ value: number }>;
    const outTotal = vout.reduce((s, v) => s + (v.value || 0), 0) / 1e8;
    rows = (
      <>
        <Row k="Txid" v={<span className="rc-mono">{String(data.txid)}</span>} />
        <Row k="Status" v={st.confirmed ? <span className="rc-accent">Confirmed · block {fmtNum(st.block_height ?? 0)}</span> : <span className="rc-muted">Pending</span>} />
        <Row k="Value out" big v={fmtBtc(outTotal)} />
        {data.fee_btc != null && <Row k="Fee" v={`${fmtBtc(data.fee_btc as number)} · ${data.vsize} vB`} />}
        <Row k="In / Out" v={`${((data.vin ?? []) as unknown[]).length} in · ${vout.length} out`} />
      </>
    );
  } else if (tool === 'query_block') {
    kind = 'Block';
    const extras = (data.extras ?? {}) as { pool?: { name?: string } };
    rows = (
      <>
        <Row k="Height" big v={fmtNum(data.height as number)} />
        {extras.pool?.name && <Row k="Mined by" v={String(extras.pool.name)} />}
        <Row k="Timestamp" v={fmtTime(data.timestamp as number)} />
        <Row k="Transactions" v={fmtNum(data.tx_count as number)} />
        {data.size != null && <Row k="Size" v={`${((data.size as number) / 1e6).toFixed(2)} MB`} />}
        <Row k="Hash" v={<span className="rc-mono">{short(String(data.id), 12)}</span>} />
      </>
    );
  } else if (tool === 'get_mempool') {
    kind = 'Mempool';
    const fees = (data.recommended_fees_sat_vb ?? {}) as { fastestFee?: number; hourFee?: number };
    rows = (
      <>
        <Row k="Pending" big v={`${fmtNum(data.pending_tx_count as number)} tx`} />
        <Row k="Size" v={`${data.mempool_vsize_mb} MB`} />
        <Row k="Next block" v={fees.fastestFee != null ? `${fees.fastestFee} sat/vB` : '—'} />
        <Row k="~1 hour" v={fees.hourFee != null ? `${fees.hourFee} sat/vB` : '—'} />
      </>
    );
  } else if (tool === 'decode_script') {
    kind = 'Script';
    rows = (
      <>
        <Row k="Type" big v={<span className="rc-mono">{String(data.type)}</span>} />
        <Row k="ASM" v={<span className="rc-mono" style={{ fontSize: 11 }}>{short(String(data.asm), 24)}</span>} />
      </>
    );
  } else {
    return null;
  }

  return (
    <>
      <style jsx global>{`
        .rc { border: 1px solid var(--cb-border); border-radius: var(--cb-radius); margin: 14px 0 6px; overflow: hidden; }
        .rc-head { padding: 9px 16px; border-bottom: 1px solid var(--cb-border); background: var(--cb-bg-surface); font-family: var(--cb-font-mono); font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--cb-text-dim); }
        .rc-row { display: flex; align-items: baseline; gap: 20px; padding: 10px 16px; border-bottom: 1px solid var(--cb-border); }
        .rc-row:last-child { border-bottom: none; }
        .rc-k { flex: 0 0 92px; color: var(--cb-text-muted); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; }
        .rc-v { flex: 1; color: var(--cb-text); font-size: 13.5px; line-height: 1.45; word-break: break-all; }
        .rc-v.big { font-size: 17px; font-weight: 500; letter-spacing: -0.01em; }
        .rc-mono { font-family: var(--cb-font-mono); font-size: 12px; }
        .rc-accent { color: var(--cb-accent); }
        .rc-muted { color: var(--cb-text-muted); }
      `}</style>
      <div className="rc">
        <div className="rc-head">{kind}</div>
        {rows}
      </div>
    </>
  );
}
