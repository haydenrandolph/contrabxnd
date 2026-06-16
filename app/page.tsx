'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import SiteNav from '@/components/SiteNav';
import ThemeToggle from '@/components/ThemeToggle';
import { PriceAlertModal, NewsTicker, NewsModal } from '@/components/dashboard';
import type { NewsItem } from '@/lib/news/types';

// Node cities for transaction route labels in the feed
const CITIES = [
  'New York', 'San Francisco', 'Los Angeles', 'Austin', 'Chicago', 'Miami',
  'Toronto', 'Vancouver', 'London', 'Paris', 'Amsterdam', 'Frankfurt',
  'Zurich', 'Berlin', 'Stockholm', 'Moscow', 'Tel Aviv', 'Dubai',
  'Johannesburg', 'Mumbai', 'Singapore', 'Hong Kong', 'Seoul', 'Tokyo',
  'Sydney', 'Melbourne', 'São Paulo', 'Buenos Aires',
];

const CHART_PAIRS = [
  { id: 'usd', label: 'BTC / USD', symbol: 'BITSTAMP:BTCUSD' },
  { id: 'gold', label: 'BTC / GOLD', symbol: 'BITSTAMP:BTCUSD/OANDA:XAUUSD' },
  { id: 'spx', label: 'BTC / SPX', symbol: 'BITSTAMP:BTCUSD/SP:SPX' },
  { id: 'dxy', label: 'BTC / DXY', symbol: 'BITSTAMP:BTCUSD/TVC:DXY' },
];

interface Transaction {
  id: string;
  hash: string;
  amount: number;
  fromCity: string;
  toCity: string;
  timestamp: number;
  type: 'normal' | 'large' | 'whale';
}

interface Block {
  height: number;
  txCount: number;
  timestamp: number;
  hash: string;
}

interface NetworkData {
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
  blockHeight: number;
  hashRate: number;
  mempoolCount: number;
  priorityFee: number;
}

interface FearGreedData {
  value: number | null;
  label: string | null;
}

interface EtfFlowData {
  source: string;
  date: string | null;
  funds: Array<{ ticker: string; name: string; flow: number | null }>;
  netFlow: number | null;
}

interface SignalData {
  score: number;
  label: string;
  components: Record<string, { score: number; weight: number; detail: string }>;
}

interface FedWatchData {
  date: string | null;
  current_rate: number | null;
  next_meeting: { date: string; cut: number; hold: number; hike: number } | null;
}

interface LiquidityData {
  date: string | null;
  net_liquidity: number | null;
  momentum_13w: number | null;
  tga_trend: string | null;
  rrp_trend: string | null;
}

interface SlrData {
  date: string | null;
  policy_signal: number | null;
  policy_label: string | null;
  leverage_subindex: number | null;
}

export default function TerminalPage() {
  const [networkData, setNetworkData] = useState<NetworkData>({
    price: 0, change24h: 0, marketCap: 0, volume24h: 0,
    blockHeight: 0, hashRate: 0, mempoolCount: 0, priorityFee: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recentBlocks, setRecentBlocks] = useState<Block[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [chartPair, setChartPair] = useState('usd');
  const [fearGreed, setFearGreed] = useState<FearGreedData>({ value: null, label: null });
  const [etfFlows, setEtfFlows] = useState<EtfFlowData | null>(null);
  const [sidebarTab, setSidebarTab] = useState<'macro' | 'flows' | 'network'>('macro');
  const [signalData, setSignalData] = useState<SignalData | null>(null);
  const [fedwatchData, setFedwatchData] = useState<FedWatchData | null>(null);
  const [liquidityData, setLiquidityData] = useState<LiquidityData | null>(null);
  const [slrData, setSlrData] = useState<SlrData | null>(null);
  const { isLightMode } = useTheme();
  const wsRef = useRef<WebSocket | null>(null);
  const seenTxIds = useRef<Set<string>>(new Set());
  const chartRef = useRef<HTMLDivElement>(null);

  const feedItems = useMemo(() => {
    const items: Array<{
      id: string;
      kind: 'tx' | 'block';
      timestamp: number;
      tx?: Transaction;
      block?: Block;
    }> = [];
    transactions.forEach(tx => items.push({ id: tx.id, kind: 'tx', timestamp: tx.timestamp, tx }));
    recentBlocks.forEach(block => items.push({ id: `blk-${block.height}`, kind: 'block', timestamp: block.timestamp * 1000, block }));
    return items.sort((a, b) => b.timestamp - a.timestamp).slice(0, 40);
  }, [transactions, recentBlocks]);

  // ── Data fetching ──

  const fetchPriceData = useCallback(async () => {
    try {
      const res = await fetch('/api/price');
      if (!res.ok) throw new Error('fail');
      const data = await res.json();
      if (data.price) {
        setNetworkData(prev => ({
          ...prev, price: data.price, change24h: data.change24h ?? 0,
          marketCap: data.marketCap ?? 0, volume24h: data.volume24h ?? 0,
        }));
      }
    } catch { /* retry next interval */ }
  }, []);

  const fetchNetworkData = useCallback(async () => {
    try {
      const [blocksRes, mempoolRes, feesRes, hashRateRes] = await Promise.all([
        fetch('https://mempool.space/api/v1/blocks').catch(() => null),
        fetch('https://mempool.space/api/mempool').catch(() => null),
        fetch('https://mempool.space/api/v1/fees/recommended').catch(() => null),
        fetch('https://mempool.space/api/v1/mining/hashrate/3d').catch(() => null),
      ]);
      if (blocksRes) {
        const blocks = await blocksRes.json();
        if (blocks?.length > 0) {
          setNetworkData(prev => ({ ...prev, blockHeight: blocks[0].height }));
          setRecentBlocks(blocks.slice(0, 6).map((b: { height: number; tx_count: number; timestamp: number; id: string }) => ({
            height: b.height, txCount: b.tx_count, timestamp: b.timestamp, hash: b.id,
          })));
        }
      }
      if (mempoolRes) { const m = await mempoolRes.json(); if (m) setNetworkData(prev => ({ ...prev, mempoolCount: m.count || 0 })); }
      if (feesRes) { const f = await feesRes.json(); if (f) setNetworkData(prev => ({ ...prev, priorityFee: f.fastestFee || 0 })); }
      if (hashRateRes) { const h = await hashRateRes.json(); if (h?.currentHashrate) setNetworkData(prev => ({ ...prev, hashRate: h.currentHashrate / 1e18 })); }
    } catch { /* retry next interval */ }
  }, []);

  const processTransaction = useCallback((txData: { txid: string; value: number }) => {
    const fromIdx = Math.floor(Math.random() * CITIES.length);
    let toIdx = Math.floor(Math.random() * CITIES.length);
    while (toIdx === fromIdx) toIdx = Math.floor(Math.random() * CITIES.length);
    const amount = txData.value / 100000000;
    let type: 'normal' | 'large' | 'whale';
    if (amount < 1) type = 'normal'; else if (amount < 10) type = 'large'; else type = 'whale';
    const txId = txData.txid.slice(0, 9);
    setTransactions(prev => [{
      id: txId, hash: txData.txid, amount,
      fromCity: CITIES[fromIdx], toCity: CITIES[toIdx],
      timestamp: Date.now(), type,
    }, ...prev.slice(0, 29)]);
  }, []);

  const fetchRecentTransactions = useCallback(async () => {
    try {
      const res = await fetch('https://mempool.space/api/mempool/recent');
      if (!res.ok) return;
      const txs: Array<{ txid: string; value: number }> = await res.json();
      let count = 0;
      for (const tx of txs) {
        if (!seenTxIds.current.has(tx.txid) && count < 5) {
          seenTxIds.current.add(tx.txid);
          setTimeout(() => processTransaction(tx), count * 400);
          count++;
        }
      }
      if (seenTxIds.current.size > 500) {
        seenTxIds.current = new Set(Array.from(seenTxIds.current).slice(-250));
      }
    } catch { /* retry */ }
  }, [processTransaction]);

  // ── Effects ──

  useEffect(() => { fetchPriceData(); fetchNetworkData(); }, [fetchPriceData, fetchNetworkData]);
  useEffect(() => { const i = setInterval(fetchPriceData, 30000); return () => clearInterval(i); }, [fetchPriceData]);
  useEffect(() => { const i = setInterval(fetchNetworkData, 15000); return () => clearInterval(i); }, [fetchNetworkData]);

  useEffect(() => {
    const fetchFG = async () => {
      try {
        const res = await fetch('/api/fear-greed');
        if (res.ok) { const d = await res.json(); if (d.value !== null) setFearGreed(d); }
      } catch { /* silent */ }
    };
    fetchFG();
    const i = setInterval(fetchFG, 5 * 60 * 1000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    const fetchETF = async () => {
      try {
        const res = await fetch('/api/etf-flows');
        if (res.ok) setEtfFlows(await res.json());
      } catch { /* silent */ }
    };
    fetchETF();
    const i = setInterval(fetchETF, 5 * 60 * 1000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    const fetchMacro = async () => {
      const fetches = [
        fetch('/api/signal').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/fedwatch').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/liquidity').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/slr').then(r => r.ok ? r.json() : null).catch(() => null),
      ];
      const [sig, fed, liq, slr] = await Promise.all(fetches);
      if (sig && sig.score !== undefined) setSignalData(sig);
      if (fed) setFedwatchData(fed);
      if (liq) setLiquidityData(liq);
      if (slr) setSlrData(slr);
    };
    fetchMacro();
    const i = setInterval(fetchMacro, 5 * 60 * 1000);
    return () => clearInterval(i);
  }, []);

  // WebSocket
  useEffect(() => {
    let txPoll: NodeJS.Timeout;
    const connect = () => {
      try {
        const ws = new WebSocket('wss://mempool.space/api/v1/ws');
        wsRef.current = ws;
        ws.onopen = () => {
          setWsConnected(true);
          ws.send(JSON.stringify({ action: 'want', data: ['blocks', 'stats', 'mempool-blocks'] }));
          fetchRecentTransactions();
          txPoll = setInterval(fetchRecentTransactions, 2000);
        };
        ws.onmessage = (e) => {
          try {
            const d = JSON.parse(e.data);
            if (d.block) { setNetworkData(prev => ({ ...prev, blockHeight: d.block.height || prev.blockHeight })); fetchRecentTransactions(); }
            if (d.mempoolInfo) setNetworkData(prev => ({ ...prev, mempoolCount: d.mempoolInfo.size || prev.mempoolCount }));
            if (d.fees) setNetworkData(prev => ({ ...prev, priorityFee: d.fees.fastestFee || prev.priorityFee }));
          } catch { /* ignore */ }
        };
        ws.onclose = () => { setWsConnected(false); clearInterval(txPoll); setTimeout(connect, 3000); };
        ws.onerror = () => ws.close();
      } catch {
        setWsConnected(false);
        fetchRecentTransactions();
        txPoll = setInterval(fetchRecentTransactions, 2000);
      }
    };
    connect();
    return () => { clearInterval(txPoll); wsRef.current?.close(); };
  }, [fetchRecentTransactions]);

  // TradingView chart — reloads when pair changes
  const activeSymbol = CHART_PAIRS.find(p => p.id === chartPair)?.symbol ?? CHART_PAIRS[0].symbol;

  useEffect(() => {
    if (!chartRef.current) return;
    const container = chartRef.current;
    container.innerHTML = '';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.width = '100%';
    widgetDiv.style.height = '100%';
    container.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: activeSymbol,
      interval: 'D',
      timezone: 'Etc/UTC',
      theme: isLightMode ? 'light' : 'dark',
      style: '1',
      locale: 'en',
      hide_legend: false,
      allow_symbol_change: false,
      save_image: false,
      backgroundColor: isLightMode ? '#f5f3f0' : '#0a0a0a',
      gridColor: isLightMode ? '#e0dcd4' : '#1a1a1a',
      withdateranges: true,
      support_host: 'https://www.tradingview.com',
    });
    container.appendChild(script);

    return () => { container.innerHTML = ''; };
  }, [activeSymbol, isLightMode]);

  // ── Helpers ──

  const fmtNum = (n: number, d = 2) => {
    if (n >= 1e12) return (n / 1e12).toFixed(d) + 'T';
    if (n >= 1e9) return (n / 1e9).toFixed(d) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(d) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(d) + 'K';
    return n.toFixed(d);
  };

  const fmtPrice = (p: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(p);

  const fmtAgo = (ms: number) => {
    const s = Math.floor((Date.now() - ms) / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m`;
    return `${Math.floor(m / 60)}h`;
  };

  const fmtFlow = (flow: number) => {
    const abs = Math.abs(flow);
    const v = abs >= 1e9 ? `$${(abs / 1e9).toFixed(1)}B` : abs >= 1e6 ? `$${(abs / 1e6).toFixed(1)}M` : `$${abs.toFixed(0)}`;
    return flow >= 0 ? `+${v}` : `-${v}`;
  };

  const skel = (w: string) => <span className="skeleton" style={{ width: w, height: '1em', display: 'inline-block' }} />;

  const fmtTrillion = (n: number | null | undefined) => {
    if (n == null) return '—';
    const abs = Math.abs(n);
    if (abs >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
    if (abs >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
    if (abs >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
    return `$${n.toFixed(0)}`;
  };

  const scoreLabel = (score: number): string => {
    if (score >= 50) return 'BULLISH';
    if (score >= 15) return 'LEAN BULL';
    if (score > -15) return 'NEUTRAL';
    if (score > -50) return 'LEAN BEAR';
    return 'BEARISH';
  };

  const scoreBarWidth = (score: number): number => ((score + 100) / 200) * 100;

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Space+Mono:wght@400;700&display=swap');

        .terminal {
          background: var(--cb-bg);
          color: var(--cb-text);
          font-family: 'Space Mono', monospace;
          font-size: 13px;
          height: 100vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .terminal-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding-top: 48px;
          min-height: 0;
        }

        .terminal-body {
          flex: 1;
          display: flex;
          min-height: 0;
        }

        /* ── Chart ── */

        .chart-panel {
          flex: 1;
          position: relative;
          min-width: 0;
          overflow: hidden;
        }

        .chart-pairs {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          z-index: 10;
          display: flex;
          gap: 0;
          background: var(--cb-bg);
          border-bottom: 1px solid var(--cb-border);
        }

        .chart-pair-btn {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 10px 20px;
          background: transparent;
          border: none;
          border-right: 1px solid var(--cb-border);
          color: var(--cb-text-muted);
          cursor: pointer;
          transition: color 0.15s ease, background 0.15s ease;
        }

        .chart-pair-btn:hover {
          color: var(--cb-text);
        }

        .chart-pair-btn.active {
          color: var(--cb-accent);
          background: var(--cb-surface);
        }

        .chart-embed {
          position: absolute;
          top: 37px;
          left: 0;
          right: 0;
          bottom: 0;
        }

        .chart-embed .tradingview-widget-container__widget {
          width: 100%;
          height: 100%;
        }

        /* ── Sidebar ── */

        .terminal-sidebar {
          width: 360px;
          border-left: 1px solid var(--cb-border);
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          background: var(--cb-bg);
        }

        .terminal-sidebar::-webkit-scrollbar { width: 4px; }
        .terminal-sidebar::-webkit-scrollbar-track { background: transparent; }
        .terminal-sidebar::-webkit-scrollbar-thumb { background: var(--cb-border); border-radius: 2px; }

        .sidebar-section {
          border-bottom: 1px solid var(--cb-border);
        }

        .sidebar-section-title {
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--cb-text-muted);
          padding: 12px 24px;
          border-bottom: 1px solid var(--cb-border);
        }

        /* Price */

        .sidebar-price { padding: 24px; }

        .price-pair {
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--cb-text-muted);
          margin-bottom: 8px;
        }

        .price-row {
          display: flex;
          align-items: baseline;
          gap: 12px;
        }

        .price-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--cb-text);
          line-height: 1;
        }

        .price-change { font-size: 13px; font-weight: 600; }
        .price-change.positive { color: #22c55e; }
        .price-change.negative { color: #ef4444; }

        .alert-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 16px;
          padding: 8px 16px;
          background: transparent;
          border: 1px solid var(--cb-border);
          border-radius: 2px;
          color: var(--cb-text-muted);
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          transition: border-color 0.15s ease, color 0.15s ease;
        }

        .alert-btn:hover { border-color: var(--cb-accent); color: var(--cb-accent); }
        .alert-btn svg { width: 12px; height: 12px; }

        /* Metrics */

        .metrics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1px;
          background: var(--cb-border);
        }

        .metric-cell {
          background: var(--cb-bg);
          padding: 12px 16px;
        }

        .metric-label {
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--cb-text-muted);
          margin-bottom: 4px;
        }

        .metric-value {
          font-size: 14px;
          font-weight: 700;
          color: var(--cb-text);
          font-variant-numeric: tabular-nums;
        }

        /* Sentiment */

        .sentiment-content { padding: 16px 24px; }

        .fg-row {
          display: flex;
          align-items: baseline;
          gap: 12px;
          margin-bottom: 10px;
        }

        .fg-value { font-size: 1.5rem; font-weight: 700; color: var(--cb-accent); line-height: 1; }
        .fg-label { font-size: 12px; color: var(--cb-text-muted); text-transform: uppercase; letter-spacing: 0.08em; }

        .fg-bar { width: 100%; height: 4px; background: var(--cb-surface); border-radius: 2px; overflow: hidden; }
        .fg-bar-fill { height: 100%; background: var(--cb-accent); border-radius: 2px; transition: width 0.6s ease; }
        .fg-unavailable { font-size: 11px; color: var(--cb-text-muted); font-style: italic; }

        /* ETF Flows */

        .etf-content { padding: 0; }

        .etf-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 24px;
          border-bottom: 1px solid var(--cb-border);
        }

        .etf-row:last-child { border-bottom: none; }
        .etf-row.net-row { background: var(--cb-surface); }

        .etf-ticker { font-size: 12px; font-weight: 700; color: var(--cb-text); min-width: 50px; }
        .etf-name { flex: 1; font-size: 10px; color: var(--cb-text-muted); margin-left: 12px; }
        .etf-flow { font-size: 12px; font-weight: 700; font-variant-numeric: tabular-nums; }
        .etf-flow.positive { color: #22c55e; }
        .etf-flow.negative { color: #ef4444; }
        .etf-flow.unavailable { color: var(--cb-text-muted); font-weight: 400; font-style: italic; }

        .etf-setup-note {
          padding: 16px 24px;
          font-size: 10px;
          color: var(--cb-text-muted);
          line-height: 1.6;
        }

        /* Score */

        .score-section { padding: 16px 24px; }

        .score-header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-bottom: 4px;
        }

        .score-label-title {
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--cb-text-muted);
        }

        .score-number {
          font-size: 24px;
          font-weight: 700;
          color: var(--cb-text);
          font-variant-numeric: tabular-nums;
          line-height: 1;
        }

        .score-bar {
          width: 100%;
          height: 4px;
          background: var(--cb-surface);
          border-radius: 2px;
          overflow: hidden;
          margin-top: 8px;
          margin-bottom: 8px;
        }

        .score-bar-fill {
          height: 100%;
          background: var(--cb-accent);
          border-radius: 2px;
          transition: width 0.6s ease;
        }

        .score-signal-label {
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--cb-text-muted);
          text-align: right;
        }

        .score-calibrating {
          font-size: 11px;
          color: var(--cb-text-muted);
          font-style: italic;
        }

        /* Tab bar */

        .sidebar-tabs {
          display: flex;
          border-bottom: 1px solid var(--cb-border);
        }

        .sidebar-tab-btn {
          flex: 1;
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 12px 0;
          background: transparent;
          border: none;
          border-bottom: 1px solid transparent;
          color: var(--cb-text-muted);
          cursor: pointer;
          transition: color 0.15s ease, border-color 0.15s ease;
          min-height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sidebar-tab-btn:hover {
          color: var(--cb-text);
        }

        .sidebar-tab-btn.active {
          color: var(--cb-accent);
          border-bottom-color: var(--cb-accent);
        }

        .tab-content {
          min-height: 0;
        }

        /* Macro rows */

        .macro-row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          padding: 10px 24px;
          border-bottom: 1px solid var(--cb-border);
        }

        .macro-row:last-child { border-bottom: none; }

        .macro-label {
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--cb-text-muted);
          flex-shrink: 0;
        }

        .macro-value-group {
          display: flex;
          align-items: baseline;
          gap: 8px;
          text-align: right;
        }

        .macro-value {
          font-size: 13px;
          font-variant-numeric: tabular-nums;
          color: var(--cb-text);
        }

        .macro-detail {
          font-size: 10px;
          color: var(--cb-text-muted);
        }

        .macro-detail.positive { color: #22c55e; }
        .macro-detail.negative { color: #ef4444; }

        /* Feed */

        .sidebar-feed {
          flex: 1;
          overflow-y: auto;
          min-height: 0;
        }

        .sidebar-feed::-webkit-scrollbar { width: 4px; }
        .sidebar-feed::-webkit-scrollbar-track { background: transparent; }
        .sidebar-feed::-webkit-scrollbar-thumb { background: var(--cb-border); border-radius: 2px; }

        .feed-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 10px 24px;
          border-bottom: 1px solid var(--cb-border);
          cursor: pointer;
          transition: background 0.1s ease;
        }

        .feed-item:hover { background: var(--cb-surface); }

        .feed-badge {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          min-width: 28px;
          padding: 2px 0;
          color: var(--cb-text-muted);
        }

        .feed-badge.block { color: var(--cb-accent); }
        .feed-badge.whale { color: var(--cb-accent); }

        .feed-body { flex: 1; min-width: 0; }
        .feed-primary { font-size: 12px; color: var(--cb-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .feed-secondary { font-size: 10px; color: var(--cb-text-muted); margin-top: 2px; }
        .feed-time { font-size: 10px; color: var(--cb-text-muted); white-space: nowrap; padding-top: 2px; }

        .feed-empty {
          padding: 24px;
          text-align: center;
          color: var(--cb-text-muted);
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        /* ── Status bar ── */

        .terminal-status {
          height: 32px;
          border-top: 1px solid var(--cb-border);
          display: flex;
          align-items: center;
          padding: 0 24px;
          gap: 24px;
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--cb-text-muted);
          background: var(--cb-surface);
          flex-shrink: 0;
        }

        .status-live { display: flex; align-items: center; gap: 6px; }

        .status-dot {
          width: 6px; height: 6px; border-radius: 50%;
          animation: livePulse 2s ease infinite;
        }

        @keyframes livePulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

        .status-sep { color: var(--cb-border); }

        /* ── Modals ── */

        .modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0, 0, 0, 0.7);
          z-index: 200;
          display: flex; align-items: center; justify-content: center;
          padding: 24px;
        }

        .modal {
          background: var(--cb-bg);
          border: 1px solid var(--cb-border);
          border-radius: 2px;
          width: 100%; max-width: 480px;
          overflow: hidden;
        }

        .modal-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid var(--cb-border);
        }

        .modal-title { font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--cb-text-muted); }

        .modal-close {
          background: none; border: none; color: var(--cb-text-muted);
          cursor: pointer; padding: 4px; display: flex;
          transition: color 0.15s ease;
        }

        .modal-close:hover { color: var(--cb-text); }
        .modal-close svg { width: 16px; height: 16px; }

        .modal-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 14px 24px; border-bottom: 1px solid var(--cb-border);
        }
        .modal-row:last-child { border-bottom: none; }

        .modal-label { font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--cb-text-muted); }
        .modal-value { font-size: 13px; color: var(--cb-text); text-align: right; max-width: 60%; overflow: hidden; text-overflow: ellipsis; }
        .modal-value.highlight { color: var(--cb-accent); font-weight: 700; font-size: 18px; }
        .modal-value.hash { font-size: 11px; word-break: break-all; }

        .modal-route { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--cb-text); }
        .modal-route svg { width: 14px; height: 14px; stroke: var(--cb-accent); }

        .modal-footer { padding: 20px 24px; border-top: 1px solid var(--cb-border); }

        .modal-link {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          width: 100%; padding: 12px 24px;
          background: transparent; border: 1px solid var(--cb-border); border-radius: 2px;
          color: var(--cb-text); font-family: 'Space Mono', monospace;
          font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase;
          text-decoration: none; cursor: pointer; transition: all 0.15s ease;
        }

        .modal-link:hover { background: var(--cb-accent); border-color: var(--cb-accent); color: #fff; }

        /* ── Util ── */

        .skeleton { background: var(--cb-surface); border-radius: 2px; animation: shimmer 1.5s ease-in-out infinite; }
        @keyframes shimmer { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }

        /* ── Mobile ── */

        @media (max-width: 1024px) {
          .terminal-body { flex-direction: column; }
          .chart-panel { height: 40vh; min-height: 250px; }
          .terminal-sidebar { width: 100%; border-left: none; border-top: 1px solid var(--cb-border); flex: 1; }
        }

        @media (max-width: 768px) {
          .terminal-status { padding: 0 16px; gap: 16px; font-size: 9px; overflow-x: auto; }
          .sidebar-price { padding: 16px; }
          .price-value { font-size: 1.5rem; }
          .feed-item { padding: 10px 16px; }
          .metric-cell { padding: 10px 12px; }
          .chart-pair-btn { padding: 8px 12px; font-size: 9px; }
        }
      `}</style>

      <div className="terminal">
        <ThemeToggle />
        <SiteNav activePath="/" liveIndicator={{ connected: wsConnected }} />

        <div className="terminal-content">
          <NewsTicker onItemClick={(item) => setSelectedNews(item)} isLightMode={isLightMode} />

          <div className="terminal-body">
            {/* ── Chart ── */}
            <div className="chart-panel">
              <div className="chart-pairs">
                {CHART_PAIRS.map(p => (
                  <button
                    key={p.id}
                    className={`chart-pair-btn ${chartPair === p.id ? 'active' : ''}`}
                    onClick={() => setChartPair(p.id)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div ref={chartRef} className="chart-embed tradingview-widget-container" />
            </div>

            {/* ── Sidebar ── */}
            <div className="terminal-sidebar">
              {/* 1. Price (unchanged) */}
              <div className="sidebar-section">
                <div className="sidebar-price">
                  <div className="price-pair">BTC / USD</div>
                  <div className="price-row">
                    {networkData.price === 0 ? skel('160px') : (
                      <>
                        <span className="price-value">{fmtPrice(networkData.price)}</span>
                        <span className={`price-change ${networkData.change24h >= 0 ? 'positive' : 'negative'}`}>
                          {networkData.change24h >= 0 ? '+' : ''}{networkData.change24h.toFixed(2)}%
                        </span>
                      </>
                    )}
                  </div>
                  <button className="alert-btn" onClick={() => setShowAlertModal(true)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                    </svg>
                    Set Alert
                  </button>
                </div>
              </div>

              {/* 2. Contrabxnd Score (hero) */}
              <div className="sidebar-section">
                <div className="score-section">
                  <div className="score-header">
                    <span className="score-label-title">Contrabxnd Score</span>
                    {signalData ? (
                      <span className="score-number">{signalData.score > 0 ? '+' : ''}{signalData.score}</span>
                    ) : null}
                  </div>
                  {signalData ? (
                    <>
                      <div className="score-bar">
                        <div className="score-bar-fill" style={{ width: `${scoreBarWidth(signalData.score)}%` }} />
                      </div>
                      <div className="score-signal-label">{signalData.label || scoreLabel(signalData.score)}</div>
                    </>
                  ) : (
                    <span className="score-calibrating">CALIBRATING...</span>
                  )}
                </div>
              </div>

              {/* 3. Tab bar */}
              <div className="sidebar-tabs">
                <button
                  className={`sidebar-tab-btn ${sidebarTab === 'macro' ? 'active' : ''}`}
                  onClick={() => setSidebarTab('macro')}
                >
                  Macro
                </button>
                <button
                  className={`sidebar-tab-btn ${sidebarTab === 'flows' ? 'active' : ''}`}
                  onClick={() => setSidebarTab('flows')}
                >
                  Flows
                </button>
                <button
                  className={`sidebar-tab-btn ${sidebarTab === 'network' ? 'active' : ''}`}
                  onClick={() => setSidebarTab('network')}
                >
                  Network
                </button>
              </div>

              {/* 4. Tab content */}
              <div className="sidebar-section tab-content">
                {sidebarTab === 'macro' && (
                  <>
                    {/* Net Liquidity */}
                    <div className="macro-row">
                      <span className="macro-label">Net Liquidity</span>
                      <div className="macro-value-group">
                        <span className="macro-value">
                          {liquidityData?.net_liquidity != null ? fmtTrillion(liquidityData.net_liquidity) : '—'}
                        </span>
                        {liquidityData?.momentum_13w != null && (
                          <span className={`macro-detail ${liquidityData.momentum_13w >= 0 ? 'positive' : 'negative'}`}>
                            {liquidityData.momentum_13w >= 0 ? '↑' : '↓'} {Math.abs(liquidityData.momentum_13w * 100).toFixed(1)}% 13w
                          </span>
                        )}
                      </div>
                    </div>

                    {/* FedWatch */}
                    <div className="macro-row">
                      <span className="macro-label">FedWatch</span>
                      <div className="macro-value-group">
                        <span className="macro-value">
                          {fedwatchData?.next_meeting?.cut != null
                            ? `${Math.round(fedwatchData.next_meeting.cut)}% CUT`
                            : '—'}
                        </span>
                        {fedwatchData?.next_meeting?.date && (
                          <span className="macro-detail">
                            {new Date(fedwatchData.next_meeting.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* SLR Regime */}
                    <div className="macro-row">
                      <span className="macro-label">SLR Regime</span>
                      <div className="macro-value-group">
                        <span className="macro-value">
                          {slrData?.policy_label != null ? slrData.policy_label.toUpperCase() : '—'}
                        </span>
                      </div>
                    </div>

                    {/* Fear & Greed (moved from Sentiment section) */}
                    <div className="macro-row" style={{ flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', width: '100%' }}>
                        <span className="macro-label">Fear &amp; Greed</span>
                        <div className="macro-value-group">
                          {fearGreed.value !== null ? (
                            <>
                              <span className="macro-value" style={{ color: 'var(--cb-accent)' }}>{fearGreed.value}</span>
                              <span className="macro-detail">{fearGreed.label}</span>
                            </>
                          ) : (
                            <span className="macro-value">—</span>
                          )}
                        </div>
                      </div>
                      {fearGreed.value !== null && (
                        <div className="fg-bar" style={{ width: '100%' }}>
                          <div className="fg-bar-fill" style={{ width: `${fearGreed.value}%` }} />
                        </div>
                      )}
                    </div>
                  </>
                )}

                {sidebarTab === 'flows' && (
                  <div className="etf-content">
                    {etfFlows?.date && (
                      <div style={{ padding: '8px 24px 0', fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--cb-text-muted)' }}>
                        {etfFlows.date}
                      </div>
                    )}
                    {etfFlows && etfFlows.source !== 'unavailable' ? (
                      <>
                        {etfFlows.funds.map((fund) => (
                          <div key={fund.ticker} className="etf-row">
                            <span className="etf-ticker">{fund.ticker}</span>
                            <span className="etf-name">{fund.name}</span>
                            <span className={`etf-flow ${fund.flow === null ? 'unavailable' : fund.flow >= 0 ? 'positive' : 'negative'}`}>
                              {fund.flow !== null ? fmtFlow(fund.flow) : '—'}
                            </span>
                          </div>
                        ))}
                        {etfFlows.netFlow !== null && (
                          <div className="etf-row net-row">
                            <span className="etf-ticker">NET</span>
                            <span className="etf-name">All Funds</span>
                            <span className={`etf-flow ${etfFlows.netFlow >= 0 ? 'positive' : 'negative'}`}>{fmtFlow(etfFlows.netFlow)}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="etf-setup-note">
                        Add SOSOVALUE_API_KEY to .env.local to enable ETF flow data.
                      </div>
                    )}
                  </div>
                )}

                {sidebarTab === 'network' && (
                  <div className="metrics-grid">
                    <div className="metric-cell">
                      <div className="metric-label">Block</div>
                      <div className="metric-value">{networkData.blockHeight === 0 ? skel('70px') : networkData.blockHeight.toLocaleString()}</div>
                    </div>
                    <div className="metric-cell">
                      <div className="metric-label">Hash Rate</div>
                      <div className="metric-value">{networkData.hashRate === 0 ? skel('60px') : `${networkData.hashRate.toFixed(1)} EH/s`}</div>
                    </div>
                    <div className="metric-cell">
                      <div className="metric-label">Mempool</div>
                      <div className="metric-value">{networkData.mempoolCount === 0 ? skel('50px') : fmtNum(networkData.mempoolCount, 0)}</div>
                    </div>
                    <div className="metric-cell">
                      <div className="metric-label">Fee</div>
                      <div className="metric-value">{networkData.priorityFee === 0 ? skel('50px') : `${networkData.priorityFee} sat/vB`}</div>
                    </div>
                    <div className="metric-cell">
                      <div className="metric-label">Mkt Cap</div>
                      <div className="metric-value">{networkData.marketCap === 0 ? skel('60px') : `$${fmtNum(networkData.marketCap)}`}</div>
                    </div>
                    <div className="metric-cell">
                      <div className="metric-label">24h Vol</div>
                      <div className="metric-value">{networkData.volume24h === 0 ? skel('60px') : `$${fmtNum(networkData.volume24h)}`}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* 5. Feed (always visible) */}
              <div className="sidebar-section" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderBottom: 'none' }}>
                <div className="sidebar-section-title">Feed</div>
                <div className="sidebar-feed">
                  {feedItems.length === 0 ? (
                    <div className="feed-empty">Awaiting data...</div>
                  ) : feedItems.map((item) => {
                    if (item.kind === 'tx' && item.tx) {
                      const tx = item.tx;
                      return (
                        <div key={item.id} className="feed-item" onClick={() => setSelectedTx(tx)}>
                          <span className={`feed-badge ${tx.type === 'whale' ? 'whale' : ''}`}>TX</span>
                          <div className="feed-body">
                            <div className="feed-primary">{tx.amount < 1 ? tx.amount.toFixed(4) : tx.amount.toFixed(2)} BTC</div>
                            <div className="feed-secondary">{tx.fromCity} → {tx.toCity}</div>
                          </div>
                          <span className="feed-time">{fmtAgo(tx.timestamp)}</span>
                        </div>
                      );
                    }
                    if (item.kind === 'block' && item.block) {
                      const block = item.block;
                      return (
                        <div key={item.id} className="feed-item" onClick={() => setSelectedBlock(block)}>
                          <span className="feed-badge block">BLK</span>
                          <div className="feed-body">
                            <div className="feed-primary">#{block.height.toLocaleString()}</div>
                            <div className="feed-secondary">{block.txCount.toLocaleString()} transactions</div>
                          </div>
                          <span className="feed-time">{fmtAgo(block.timestamp * 1000)}</span>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Status Bar ── */}
        <div className="terminal-status">
          <div className="status-live">
            <span className="status-dot" style={{ background: wsConnected ? '#22c55e' : '#f59e0b' }} />
            <span>{wsConnected ? 'Live' : 'Connecting'}</span>
          </div>
          <span className="status-sep">│</span>
          <span>BLK {networkData.blockHeight > 0 ? networkData.blockHeight.toLocaleString() : '—'}</span>
          <span className="status-sep">│</span>
          <span>MEMPOOL {networkData.mempoolCount > 0 ? fmtNum(networkData.mempoolCount, 0) : '—'}</span>
          <span className="status-sep">│</span>
          <span>FEE {networkData.priorityFee > 0 ? `${networkData.priorityFee} sat/vB` : '—'}</span>
          {fearGreed.value !== null && (
            <><span className="status-sep">│</span><span>F&G {fearGreed.value} {fearGreed.label?.toUpperCase()}</span></>
          )}
        </div>

        {/* ── Modals ── */}
        {selectedTx && (
          <div className="modal-overlay" onClick={() => setSelectedTx(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <span className="modal-title">Transaction</span>
                <button className="modal-close" onClick={() => setSelectedTx(null)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div className="modal-body">
                <div className="modal-row"><span className="modal-label">Amount</span><span className="modal-value highlight">{selectedTx.amount < 1 ? selectedTx.amount.toFixed(6) : selectedTx.amount.toFixed(4)} BTC</span></div>
                <div className="modal-row"><span className="modal-label">USD Value</span><span className="modal-value">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(selectedTx.amount * networkData.price)}</span></div>
                <div className="modal-row">
                  <span className="modal-label">Route</span>
                  <div className="modal-route">
                    <span>{selectedTx.fromCity}</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    <span>{selectedTx.toCity}</span>
                  </div>
                </div>
                <div className="modal-row"><span className="modal-label">Type</span><span className="modal-value">{selectedTx.type === 'whale' ? 'Whale' : selectedTx.type === 'large' ? 'Large' : 'Standard'}</span></div>
                <div className="modal-row"><span className="modal-label">Hash</span><span className="modal-value hash">{selectedTx.hash}</span></div>
              </div>
              <div className="modal-footer">
                <a href={`https://mempool.space/tx/${selectedTx.hash}`} target="_blank" rel="noopener noreferrer" className="modal-link">View on Mempool.space ↗</a>
              </div>
            </div>
          </div>
        )}

        {selectedBlock && (
          <div className="modal-overlay" onClick={() => setSelectedBlock(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <span className="modal-title">Block</span>
                <button className="modal-close" onClick={() => setSelectedBlock(null)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div className="modal-body">
                <div className="modal-row"><span className="modal-label">Height</span><span className="modal-value highlight">#{selectedBlock.height.toLocaleString()}</span></div>
                <div className="modal-row"><span className="modal-label">Transactions</span><span className="modal-value">{selectedBlock.txCount.toLocaleString()}</span></div>
                <div className="modal-row"><span className="modal-label">Mined</span><span className="modal-value">{fmtAgo(selectedBlock.timestamp * 1000)} ago</span></div>
                <div className="modal-row"><span className="modal-label">Timestamp</span><span className="modal-value">{new Date(selectedBlock.timestamp * 1000).toLocaleString()}</span></div>
                <div className="modal-row"><span className="modal-label">Hash</span><span className="modal-value hash">{selectedBlock.hash}</span></div>
              </div>
              <div className="modal-footer">
                <a href={`https://mempool.space/block/${selectedBlock.hash}`} target="_blank" rel="noopener noreferrer" className="modal-link">View on Mempool.space ↗</a>
              </div>
            </div>
          </div>
        )}

        <PriceAlertModal isOpen={showAlertModal} onClose={() => setShowAlertModal(false)} currentPrice={networkData.price} />
        <NewsModal item={selectedNews} onClose={() => setSelectedNews(null)} isLightMode={isLightMode} />
      </div>
    </>
  );
}
