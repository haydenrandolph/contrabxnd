'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
} from '@vnedyalk0v/react19-simple-maps';
import worldAtlas from 'world-atlas/countries-110m.json';
import { useTheme } from '@/contexts/ThemeContext';
import SiteNav from '@/components/SiteNav';
import ThemeToggle from '@/components/ThemeToggle';
import { PriceAlertModal, NewsTicker, NewsModal } from '@/components/dashboard';
import type { NewsItem } from '@/lib/news/types';

// Bitcoin hub cities with geographic coordinates [longitude, latitude]
const BITCOIN_NODES = [
  // North America
  { id: 27, city: 'Vancouver', coordinates: [-123.12, 49.28] as [number, number], major: false },
  { id: 3, city: 'San Francisco', coordinates: [-122.42, 37.77] as [number, number], major: true },
  { id: 2, city: 'Los Angeles', coordinates: [-118.24, 34.05] as [number, number], major: true },
  { id: 28, city: 'Austin', coordinates: [-97.74, 30.27] as [number, number], major: false },
  { id: 5, city: 'Chicago', coordinates: [-87.63, 41.88] as [number, number], major: false },
  { id: 4, city: 'Miami', coordinates: [-80.19, 25.76] as [number, number], major: false },
  { id: 1, city: 'New York', coordinates: [-74.01, 40.71] as [number, number], major: true },
  { id: 6, city: 'Toronto', coordinates: [-79.38, 43.65] as [number, number], major: false },
  // Europe
  { id: 7, city: 'London', coordinates: [-0.13, 51.51] as [number, number], major: true },
  { id: 10, city: 'Paris', coordinates: [2.35, 48.86] as [number, number], major: false },
  { id: 8, city: 'Amsterdam', coordinates: [4.90, 52.37] as [number, number], major: false },
  { id: 9, city: 'Frankfurt', coordinates: [8.68, 50.11] as [number, number], major: true },
  { id: 11, city: 'Zurich', coordinates: [8.54, 47.38] as [number, number], major: false },
  { id: 25, city: 'Berlin', coordinates: [13.40, 52.52] as [number, number], major: false },
  { id: 26, city: 'Stockholm', coordinates: [18.07, 59.33] as [number, number], major: false },
  { id: 21, city: 'Moscow', coordinates: [37.62, 55.76] as [number, number], major: false },
  // Middle East & Africa
  { id: 24, city: 'Tel Aviv', coordinates: [34.78, 32.09] as [number, number], major: false },
  { id: 12, city: 'Dubai', coordinates: [55.27, 25.20] as [number, number], major: false },
  { id: 23, city: 'Johannesburg', coordinates: [28.04, -26.20] as [number, number], major: false },
  // Asia
  { id: 22, city: 'Mumbai', coordinates: [72.88, 19.08] as [number, number], major: false },
  { id: 13, city: 'Singapore', coordinates: [103.82, 1.35] as [number, number], major: true },
  { id: 14, city: 'Hong Kong', coordinates: [114.17, 22.32] as [number, number], major: true },
  { id: 16, city: 'Seoul', coordinates: [126.98, 37.57] as [number, number], major: false },
  { id: 15, city: 'Tokyo', coordinates: [139.69, 35.68] as [number, number], major: true },
  // Australia
  { id: 17, city: 'Sydney', coordinates: [151.21, -33.87] as [number, number], major: true },
  { id: 18, city: 'Melbourne', coordinates: [144.96, -37.81] as [number, number], major: false },
  // South America
  { id: 19, city: 'São Paulo', coordinates: [-46.63, -23.55] as [number, number], major: false },
  { id: 20, city: 'Buenos Aires', coordinates: [-58.38, -34.60] as [number, number], major: false },
];

interface Transaction {
  id: string;
  hash: string;
  amount: number;
  fromNode: typeof BITCOIN_NODES[number];
  toNode: typeof BITCOIN_NODES[number];
  timestamp: number;
  type: 'normal' | 'large' | 'whale';
}

interface Arc {
  id: string;
  from: [number, number];
  to: [number, number];
  type: 'normal' | 'large' | 'whale';
  progress: number;
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
  activeNodes: number;
  mempoolCount: number;
  priorityFee: number;
  tps: number;
}

export default function DashboardPage() {
  const [networkData, setNetworkData] = useState<NetworkData>({
    price: 0,
    change24h: 0,
    marketCap: 0,
    volume24h: 0,
    blockHeight: 0,
    hashRate: 0,
    activeNodes: 17543,
    mempoolCount: 0,
    priorityFee: 0,
    tps: 4.2,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recentBlocks, setRecentBlocks] = useState<Block[]>([]);
  const [arcs, setArcs] = useState<Arc[]>([]);
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const { isLightMode } = useTheme();
  const wsRef = useRef<WebSocket | null>(null);
  const seenTxIds = useRef<Set<string>>(new Set());

  // Fetch price data via our API proxy (avoids CORS issues with CoinGecko)
  const fetchPriceData = useCallback(async () => {
    try {
      const response = await fetch('/api/price');
      if (!response.ok) throw new Error('Price fetch failed');
      const data = await response.json();
      if (data.price) {
        setNetworkData(prev => ({
          ...prev,
          price: data.price,
          change24h: data.change24h ?? 0,
          marketCap: data.marketCap ?? 0,
          volume24h: data.volume24h ?? 0,
        }));
      }
    } catch (error) {
      console.warn('Price fetch failed:', error);
      // Will retry on next interval
    }
  }, []);

  // Fetch network data from Mempool.space
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
        if (blocks && blocks.length > 0) {
          setNetworkData(prev => ({
            ...prev,
            blockHeight: blocks[0].height,
          }));
          setRecentBlocks(
            blocks.slice(0, 6).map((b: { height: number; tx_count: number; timestamp: number; id: string }) => ({
              height: b.height,
              txCount: b.tx_count,
              timestamp: b.timestamp,
              hash: b.id,
            }))
          );
        }
      }

      if (mempoolRes) {
        const mempool = await mempoolRes.json();
        if (mempool) {
          setNetworkData(prev => ({
            ...prev,
            mempoolCount: mempool.count || 0,
          }));
        }
      }

      if (feesRes) {
        const fees = await feesRes.json();
        if (fees) {
          setNetworkData(prev => ({
            ...prev,
            priorityFee: fees.fastestFee || 0,
          }));
        }
      }

      if (hashRateRes) {
        const hashData = await hashRateRes.json();
        if (hashData && hashData.currentHashrate) {
          setNetworkData(prev => ({
            ...prev,
            hashRate: hashData.currentHashrate / 1e18, // Convert to EH/s
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching network data:', error);
    }
  }, []);

  // Process incoming transaction and create arc animation
  const processTransaction = useCallback((txData: { txid: string; value: number }) => {
    // Pick random source and destination nodes
    const fromIndex = Math.floor(Math.random() * BITCOIN_NODES.length);
    let toIndex = Math.floor(Math.random() * BITCOIN_NODES.length);
    while (toIndex === fromIndex) {
      toIndex = Math.floor(Math.random() * BITCOIN_NODES.length);
    }

    const fromNode = BITCOIN_NODES[fromIndex];
    const toNode = BITCOIN_NODES[toIndex];
    const amount = txData.value / 100000000; // Convert satoshis to BTC

    // Determine transaction type based on amount
    let type: 'normal' | 'large' | 'whale';
    if (amount < 1) {
      type = 'normal';
    } else if (amount < 10) {
      type = 'large';
    } else {
      type = 'whale';
    }

    const txId = txData.txid.slice(0, 9);

    const tx: Transaction = {
      id: txId,
      hash: txData.txid,
      amount,
      fromNode,
      toNode,
      timestamp: Date.now(),
      type,
    };

    // Add arc animation
    const arc: Arc = {
      id: txId,
      from: fromNode.coordinates,
      to: toNode.coordinates,
      type,
      progress: 0,
    };

    setArcs(prev => [...prev.slice(-15), arc]);

    // Remove arc after animation completes
    setTimeout(() => {
      setArcs(prev => prev.filter(a => a.id !== txId));
    }, 2000);

    setTransactions(prev => [tx, ...prev.slice(0, 19)]);
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchPriceData();
    fetchNetworkData();
  }, [fetchPriceData, fetchNetworkData]);

  // Price refresh interval (30s)
  useEffect(() => {
    const interval = setInterval(fetchPriceData, 30000);
    return () => clearInterval(interval);
  }, [fetchPriceData]);

  // Network data refresh interval (15s)
  useEffect(() => {
    const interval = setInterval(fetchNetworkData, 15000);
    return () => clearInterval(interval);
  }, [fetchNetworkData]);

  // Fetch real transactions from mempool.space
  const fetchRecentTransactions = useCallback(async () => {
    try {
      const response = await fetch('https://mempool.space/api/mempool/recent');
      if (!response.ok) return;

      const txs: Array<{ txid: string; value: number; fee: number }> = await response.json();

      // Process new transactions we haven't seen
      let newTxCount = 0;
      for (const tx of txs) {
        if (!seenTxIds.current.has(tx.txid) && newTxCount < 5) {
          seenTxIds.current.add(tx.txid);
          // Stagger the animations
          setTimeout(() => {
            processTransaction({ txid: tx.txid, value: tx.value });
          }, newTxCount * 400);
          newTxCount++;
        }
      }

      // Keep seen set from growing too large
      if (seenTxIds.current.size > 500) {
        const entries = Array.from(seenTxIds.current);
        seenTxIds.current = new Set(entries.slice(-250));
      }
    } catch {
      // Silently fail - will retry on next poll
    }
  }, [processTransaction]);

  // WebSocket connection to Mempool.space for real-time stats + poll for transactions
  useEffect(() => {
    let txPollInterval: NodeJS.Timeout;

    const connectWebSocket = () => {
      try {
        const ws = new WebSocket('wss://mempool.space/api/v1/ws');
        wsRef.current = ws;

        ws.onopen = () => {
          setWsConnected(true);
          // Subscribe to blocks and mempool data
          ws.send(JSON.stringify({ action: 'want', data: ['blocks', 'stats', 'mempool-blocks'] }));

          // Poll for real transactions every 2 seconds
          fetchRecentTransactions();
          txPollInterval = setInterval(fetchRecentTransactions, 2000);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            // Handle block data
            if (data.block) {
              setNetworkData(prev => ({
                ...prev,
                blockHeight: data.block.height || prev.blockHeight,
              }));
              // Fetch transactions immediately on new block
              fetchRecentTransactions();
            }

            // Handle mempool info
            if (data.mempoolInfo) {
              setNetworkData(prev => ({
                ...prev,
                mempoolCount: data.mempoolInfo.size || prev.mempoolCount,
              }));
            }

            // Handle fee estimates
            if (data.fees) {
              setNetworkData(prev => ({
                ...prev,
                priorityFee: data.fees.fastestFee || prev.priorityFee,
              }));
            }
          } catch {
            // Ignore parse errors
          }
        };

        ws.onclose = () => {
          setWsConnected(false);
          clearInterval(txPollInterval);
          // Reconnect after 3 seconds
          setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch {
        setWsConnected(false);
        // Fallback: just poll for transactions without WebSocket
        fetchRecentTransactions();
        txPollInterval = setInterval(fetchRecentTransactions, 2000);
      }
    };

    connectWebSocket();

    return () => {
      clearInterval(txPollInterval);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [fetchRecentTransactions]);

  const formatNumber = (num: number, decimals: number = 2) => {
    if (num >= 1e12) return (num / 1e12).toFixed(decimals) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(decimals) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(decimals) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(decimals) + 'K';
    return num.toFixed(decimals);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp * 1000) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Space+Mono:wght@400;700&display=swap');

        .dashboard-page {
          background: #0a0a0a;
          color: #e8e4dc;
          font-family: 'Space Mono', monospace;
          min-height: 100vh;
          overflow-x: hidden;
        }

        .dashboard-page.light-mode {
          background: #e8e4dc;
          color: #0a0a0a;
        }

        .dashboard-container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          padding-top: 70px;
          overflow: auto;
        }

        .map-section {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .map-container {
          position: relative;
          width: 100%;
          max-width: 1000px;
          aspect-ratio: 16/9;
          background:
            radial-gradient(ellipse at center, rgba(181, 103, 58, 0.03) 0%, transparent 70%),
            linear-gradient(180deg, #0d0d0d 0%, #0a0a0a 100%);
          border: 1px solid #1a1a1a;
          border-radius: 4px;
          overflow: hidden;
        }

        .dashboard-page.light-mode .map-container {
          background:
            radial-gradient(ellipse at center, rgba(181, 103, 58, 0.05) 0%, transparent 70%),
            linear-gradient(180deg, #f5f3f0 0%, #e8e4dc 100%);
          border-color: #c8c4bc;
        }

        .map-container svg {
          position: absolute;
          inset: 0;
          z-index: 1;
        }

        .major-node {
          filter: drop-shadow(0 0 6px rgba(247, 147, 26, 0.6));
          animation: nodePulse 2s ease-in-out infinite;
        }

        @keyframes nodePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .sonar-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          z-index: 2;
          opacity: 0.8;
        }

        .sonar-rings {
          position: absolute;
          width: 80%;
          height: 80%;
          border-radius: 50%;
        }

        .sonar-ring {
          position: absolute;
          inset: 0;
          border: 1px solid rgba(181, 103, 58, 0.1);
          border-radius: 50%;
          animation: sonarPulse 4s ease-out infinite;
        }

        .sonar-ring:nth-child(2) { animation-delay: 1s; }
        .sonar-ring:nth-child(3) { animation-delay: 2s; }
        .sonar-ring:nth-child(4) { animation-delay: 3s; }

        @keyframes sonarPulse {
          0% { transform: scale(0.3); opacity: 0.6; }
          100% { transform: scale(1); opacity: 0; }
        }

        .radar-sweep {
          position: absolute;
          width: 80%;
          height: 80%;
          background: conic-gradient(
            from 0deg,
            transparent 0deg,
            rgba(181, 103, 58, 0.15) 30deg,
            transparent 60deg
          );
          border-radius: 50%;
          animation: radarSweep 5s linear infinite;
        }

        @keyframes radarSweep {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .node-dot {
          position: absolute;
          width: 6px;
          height: 6px;
          background: #b5673a;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          cursor: pointer;
          transition: all 0.2s ease;
          z-index: 10;
        }

        .node-dot.major {
          width: 10px;
          height: 10px;
          box-shadow: 0 0 10px rgba(181, 103, 58, 0.5);
        }

        .node-dot:hover {
          transform: translate(-50%, -50%) scale(1.5);
          box-shadow: 0 0 15px rgba(181, 103, 58, 0.8);
        }

        .node-label {
          position: absolute;
          transform: translate(-50%, -150%);
          background: rgba(0, 0, 0, 0.9);
          padding: 4px 8px;
          font-size: 9px;
          letter-spacing: 0.1em;
          white-space: nowrap;
          border: 1px solid #b5673a;
          pointer-events: none;
          z-index: 20;
        }

        .tx-ping {
          position: absolute;
          width: 40px;
          height: 40px;
          transform: translate(-50%, -50%);
          pointer-events: none;
          z-index: 5;
        }

        .tx-ping::before,
        .tx-ping::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
          animation: pingExpand 2s ease-out forwards;
        }

        .tx-ping.normal::before,
        .tx-ping.normal::after { border: 2px solid #22c55e; }
        .tx-ping.large::before,
        .tx-ping.large::after { border: 2px solid #f59e0b; }
        .tx-ping.whale::before,
        .tx-ping.whale::after { border: 3px solid #a855f7; }

        .tx-ping::after { animation-delay: 0.3s; }

        @keyframes pingExpand {
          0% { transform: scale(0.2); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }

        /* Arc animation styles */
        .tx-arc {
          fill: none;
          stroke-linecap: round;
          animation: arcPulse 2s ease-out forwards;
        }

        .tx-arc.normal {
          stroke: #22c55e;
          stroke-width: 1.5;
          filter: drop-shadow(0 0 4px rgba(34, 197, 94, 0.6));
        }

        .tx-arc.large {
          stroke: #f59e0b;
          stroke-width: 2;
          filter: drop-shadow(0 0 6px rgba(245, 158, 11, 0.6));
        }

        .tx-arc.whale {
          stroke: #a855f7;
          stroke-width: 3;
          filter: drop-shadow(0 0 10px rgba(168, 85, 247, 0.8));
        }

        @keyframes arcPulse {
          0% {
            stroke-dashoffset: 1000;
            opacity: 1;
          }
          70% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
          100% {
            stroke-dashoffset: 0;
            opacity: 0;
          }
        }

        .arc-endpoint {
          animation: endpointPulse 2s ease-out forwards;
        }

        .arc-endpoint.normal { fill: #22c55e; }
        .arc-endpoint.large { fill: #f59e0b; }
        .arc-endpoint.whale { fill: #a855f7; }

        @keyframes endpointPulse {
          0% { r: 0; opacity: 0; }
          20% { r: 6; opacity: 1; }
          70% { r: 6; opacity: 1; }
          100% { r: 8; opacity: 0; }
        }

        .price-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2rem;
          padding: 1rem 2rem;
          background: #0d0d0d;
          border-bottom: 1px solid #1a1a1a;
        }

        .dashboard-page.light-mode .price-header {
          background: #f5f3f0;
          border-bottom-color: #c8c4bc;
        }

        .price-label {
          font-size: 10px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: #b5673a;
        }

        .price-display {
          display: flex;
          align-items: baseline;
          gap: 1rem;
        }

        .price-value {
          font-size: 2rem;
          font-weight: 700;
          color: #e8e4dc;
        }

        .dashboard-page.light-mode .price-value {
          color: #0a0a0a;
        }

        .price-change {
          font-size: 14px;
          font-weight: 600;
        }

        .price-change.positive { color: #22c55e; }
        .price-change.negative { color: #ef4444; }

        .set-alert-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: transparent;
          border: 1px solid #F7931A;
          color: #F7931A;
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          margin-left: 1.5rem;
          transition: all 0.2s ease;
        }

        .set-alert-btn:hover {
          background: #F7931A;
          color: #fff;
        }

        .set-alert-btn svg {
          width: 14px;
          height: 14px;
        }

        .corner-stat {
          position: absolute;
          padding: 1rem;
          z-index: 10;
        }

        .corner-stat.top-left { top: 0; left: 0; }
        .corner-stat.top-right { top: 0; right: 0; text-align: right; }
        .corner-stat.bottom-left { bottom: 0; left: 0; }
        .corner-stat.bottom-right { bottom: 0; right: 0; text-align: right; }

        .stat-label {
          font-size: 9px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #5a5a5a;
          margin-bottom: 0.25rem;
        }

        .stat-value {
          font-size: 16px;
          color: #e8e4dc;
        }

        .dashboard-page.light-mode .stat-label {
          color: #8a8a8a;
        }

        .dashboard-page.light-mode .stat-value {
          color: #0a0a0a;
        }

        .sidebar {
          background: #0d0d0d;
          border-top: 1px solid #1a1a1a;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 0;
          overflow: hidden;
        }

        .dashboard-page.light-mode .sidebar {
          background: #f5f3f0;
          border-top-color: #c8c4bc;
        }

        .sidebar-section {
          padding: 1.5rem;
          border-right: 1px solid #1a1a1a;
        }

        .dashboard-page.light-mode .sidebar-section {
          border-right-color: #c8c4bc;
        }

        .sidebar-section:last-child {
          border-right: none;
        }

        .sidebar-title {
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #5a5a5a;
          margin-bottom: 1rem;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .metric-card {
          background: #141414;
          padding: 1rem;
          border: 1px solid #1a1a1a;
        }

        .dashboard-page.light-mode .metric-card {
          background: #ffffff;
          border-color: #c8c4bc;
        }

        .metric-label {
          font-size: 9px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #5a5a5a;
          margin-bottom: 0.5rem;
        }

        .metric-value {
          font-size: 14px;
          color: #e8e4dc;
        }

        .dashboard-page.light-mode .metric-label {
          color: #8a8a8a;
        }

        .dashboard-page.light-mode .metric-value {
          color: #0a0a0a;
        }

        .feed-container {
          max-height: 300px;
          overflow-y: auto;
          padding: 0 1.5rem 1.5rem;
        }

        .feed-container::-webkit-scrollbar {
          width: 4px;
        }

        .feed-container::-webkit-scrollbar-track {
          background: #0a0a0a;
        }

        .feed-container::-webkit-scrollbar-thumb {
          background: #3a3a3a;
          border-radius: 2px;
        }

        .tx-item {
          display: block;
          padding: 0.75rem 0;
          border-bottom: 1px solid #1a1a1a;
          animation: fadeIn 0.3s ease;
          text-decoration: none;
          color: inherit;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .dashboard-page.light-mode .tx-item {
          border-bottom-color: #c8c4bc;
        }

        .tx-item:hover {
          background: rgba(181, 103, 58, 0.1);
        }

        .tx-item:hover .tx-hash {
          color: #b5673a;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .tx-hash {
          font-size: 10px;
          color: #5a5a5a;
          font-family: 'Space Mono', monospace;
        }

        .tx-details {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 0.25rem;
        }

        .tx-location {
          font-size: 11px;
          color: #8a8a8a;
        }

        .tx-amount {
          font-size: 12px;
          font-weight: 700;
        }

        .tx-amount.normal { color: #22c55e; }
        .tx-amount.large { color: #f59e0b; }
        .tx-amount.whale { color: #a855f7; }

        .blocks-container {
          max-height: 280px;
          overflow-y: auto;
        }

        .block-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
          border-bottom: 1px solid #1a1a1a;
          text-decoration: none;
          color: inherit;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .dashboard-page.light-mode .block-item {
          border-bottom-color: #c8c4bc;
        }

        .block-item:hover {
          background: rgba(181, 103, 58, 0.1);
        }

        .block-item:hover .block-height {
          color: #F7931A;
        }

        .block-item:last-child {
          border-bottom: none;
        }

        .block-height {
          font-size: 12px;
          color: #b5673a;
        }

        .block-txs {
          font-size: 10px;
          color: #5a5a5a;
        }

        .block-time {
          font-size: 10px;
          color: #3a3a3a;
        }

        /* Transaction Modal */
        .tx-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(4px);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          animation: modalFadeIn 0.2s ease;
        }

        .dashboard-page.light-mode .tx-modal-overlay {
          background: rgba(255, 255, 255, 0.8);
        }

        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .tx-modal {
          background: #0d0d0d;
          border: 1px solid #2a2a2a;
          border-radius: 8px;
          max-width: 500px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          animation: modalSlideIn 0.2s ease;
        }

        .dashboard-page.light-mode .tx-modal {
          background: #ffffff;
          border-color: #c8c4bc;
        }

        @keyframes modalSlideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .tx-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #1a1a1a;
        }

        .dashboard-page.light-mode .tx-modal-header {
          border-bottom-color: #e0dcd4;
        }

        .tx-modal-title {
          font-size: 12px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #b5673a;
        }

        .tx-modal-close {
          width: 32px;
          height: 32px;
          background: transparent;
          border: 1px solid #3a3a3a;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .tx-modal-close:hover {
          background: #F7931A;
          border-color: #F7931A;
        }

        .tx-modal-close svg {
          width: 16px;
          height: 16px;
          stroke: #8a8a8a;
        }

        .tx-modal-close:hover svg {
          stroke: #fff;
        }

        .dashboard-page.light-mode .tx-modal-close {
          border-color: #c8c4bc;
        }

        .dashboard-page.light-mode .tx-modal-close svg {
          stroke: #5a5a5a;
        }

        .tx-modal-body {
          padding: 1.5rem;
        }

        .tx-modal-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 1rem 0;
          border-bottom: 1px solid #1a1a1a;
        }

        .dashboard-page.light-mode .tx-modal-row {
          border-bottom-color: #e0dcd4;
        }

        .tx-modal-row:last-child {
          border-bottom: none;
        }

        .tx-modal-label {
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #5a5a5a;
        }

        .dashboard-page.light-mode .tx-modal-label {
          color: #8a8a8a;
        }

        .tx-modal-value {
          font-size: 14px;
          color: #e8e4dc;
          text-align: right;
          word-break: break-all;
          max-width: 60%;
        }

        .dashboard-page.light-mode .tx-modal-value {
          color: #0a0a0a;
        }

        .tx-modal-value.hash {
          font-size: 11px;
          font-family: 'Space Mono', monospace;
          color: #8a8a8a;
        }

        .tx-modal-value.amount {
          font-size: 18px;
          font-weight: 700;
        }

        .tx-modal-value.amount.normal { color: #22c55e; }
        .tx-modal-value.amount.large { color: #f59e0b; }
        .tx-modal-value.amount.whale { color: #a855f7; }

        .tx-modal-route {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #e8e4dc;
          font-size: 13px;
        }

        .dashboard-page.light-mode .tx-modal-route {
          color: #0a0a0a;
        }

        .tx-modal-route svg {
          width: 16px;
          height: 16px;
          stroke: #b5673a;
        }

        .tx-modal-footer {
          padding: 1.5rem;
          border-top: 1px solid #1a1a1a;
        }

        .dashboard-page.light-mode .tx-modal-footer {
          border-top-color: #e0dcd4;
        }

        .tx-modal-link {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.75rem 1.5rem;
          background: transparent;
          border: 1px solid #3a3a3a;
          border-radius: 4px;
          color: #e8e4dc;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .tx-modal-link:hover {
          background: #F7931A;
          border-color: #F7931A;
          color: #fff;
        }

        .dashboard-page.light-mode .tx-modal-link {
          border-color: #c8c4bc;
          color: #0a0a0a;
        }

        .tx-modal-link svg {
          width: 14px;
          height: 14px;
        }

        @media (max-width: 1024px) {
          .dashboard-container {
            flex-direction: column;
          }

          .map-section {
            padding: 1rem;
          }

          .map-container {
            aspect-ratio: 16/10;
          }

          .sidebar {
            grid-template-columns: 1fr;
          }

          .sidebar-section {
            border-right: none;
            border-bottom: 1px solid #1a1a1a;
          }

          .sidebar-section:last-child {
            border-bottom: none;
          }

          .feed-container {
            max-height: 250px;
          }

          .blocks-container {
            max-height: 200px;
          }

          .price-header {
            flex-direction: column;
            gap: 0.75rem;
            padding: 1rem 1.5rem;
            text-align: center;
          }

          .price-display {
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
          }

          .price-value {
            font-size: 1.75rem;
          }

          .set-alert-btn {
            margin-left: 0;
            margin-top: 0.5rem;
          }
        }
      `}</style>

      <div className={`dashboard-page ${isLightMode ? 'light-mode' : ''}`}>
        <ThemeToggle />
        <SiteNav activePath="/dashboard" liveIndicator={{ connected: wsConnected }} />

        <div className="dashboard-container">
          <div className="price-header">
            <div className="price-label">Bitcoin Network</div>
            <div className="price-display">
              <span className="price-value">{formatPrice(networkData.price)}</span>
              <span className={`price-change ${networkData.change24h >= 0 ? 'positive' : 'negative'}`}>
                {(networkData.change24h ?? 0) >= 0 ? '+' : ''}{(networkData.change24h ?? 0).toFixed(2)}%
              </span>
              <button className="set-alert-btn" onClick={() => setShowAlertModal(true)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                Set Alert
              </button>
            </div>
          </div>

          <NewsTicker
            onItemClick={(item) => setSelectedNews(item)}
            isLightMode={isLightMode}
          />

          <div className="map-section">
            <div className="map-container">
              <ComposableMap
                projection="geoMercator"
                projectionConfig={{
                  scale: 120,
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  center: [10, 20] as any,
                }}
                style={{
                  width: '100%',
                  height: '100%',
                }}
              >
                <Geographies geography={worldAtlas}>
                  {({ geographies }) =>
                    geographies.map((geo, index) => (
                      <Geography
                        key={`geo-${index}`}
                        geography={geo}
                        fill={isLightMode ? '#d8d4cc' : '#1a1a1a'}
                        stroke="#b5673a"
                        strokeWidth={0.5}
                        style={{
                          default: { outline: 'none' },
                          hover: { outline: 'none', fill: isLightMode ? '#c8c4bc' : '#2a2a2a' },
                          pressed: { outline: 'none' },
                        }}
                      />
                    ))
                  }
                </Geographies>
                {BITCOIN_NODES.map((node) => (
                  <Marker
                    key={node.id}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    coordinates={node.coordinates as any}
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                  >
                    <circle
                      r={node.major ? 5 : 3}
                      fill="#b5673a"
                      stroke="#F7931A"
                      strokeWidth={node.major ? 2 : 1}
                      style={{ cursor: 'pointer' }}
                      className={node.major ? 'major-node' : ''}
                    />
                    {hoveredNode === node.id && (
                      <text
                        textAnchor="middle"
                        y={-12}
                        style={{
                          fontFamily: 'Space Mono, monospace',
                          fontSize: '10px',
                          fill: '#e8e4dc',
                          background: '#000',
                        }}
                      >
                        {node.city}
                      </text>
                    )}
                  </Marker>
                ))}
                {/* Transaction arcs */}
                {arcs.map((arc) => (
                  <Line
                    key={arc.id}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    from={arc.from as any}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    to={arc.to as any}
                    stroke={arc.type === 'whale' ? '#a855f7' : arc.type === 'large' ? '#f59e0b' : '#22c55e'}
                    strokeWidth={arc.type === 'whale' ? 2 : arc.type === 'large' ? 1.5 : 1}
                    strokeLinecap="round"
                    className={`tx-arc ${arc.type}`}
                    style={{
                      strokeDasharray: 1000,
                    }}
                  />
                ))}
                {/* Arc endpoints (destination pulses) */}
                {arcs.map((arc) => (
                  <Marker
                    key={`${arc.id}-end`}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    coordinates={arc.to as any}
                  >
                    <circle
                      className={`arc-endpoint ${arc.type}`}
                      r={4}
                    />
                  </Marker>
                ))}
              </ComposableMap>

              <div className="sonar-overlay">
                <div className="radar-sweep"></div>
                <div className="sonar-rings">
                  <div className="sonar-ring"></div>
                  <div className="sonar-ring"></div>
                  <div className="sonar-ring"></div>
                  <div className="sonar-ring"></div>
                </div>
              </div>

              <div className="corner-stat top-left">
                <div className="stat-label">Block Height</div>
                <div className="stat-value">{networkData.blockHeight.toLocaleString()}</div>
              </div>

              <div className="corner-stat top-right">
                <div className="stat-label">Hash Rate</div>
                <div className="stat-value">{networkData.hashRate.toFixed(1)} EH/s</div>
              </div>

              <div className="corner-stat bottom-left">
                <div className="stat-label">Active Nodes</div>
                <div className="stat-value">{networkData.activeNodes.toLocaleString()}</div>
              </div>

              <div className="corner-stat bottom-right">
                <div className="stat-label">TPS</div>
                <div className="stat-value">{networkData.tps.toFixed(1)}</div>
              </div>
            </div>
          </div>

          <div className="sidebar">
            {/* Column 1: Network Metrics */}
            <div className="sidebar-section">
              <div className="sidebar-title">Network Metrics</div>
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-label">Market Cap</div>
                  <div className="metric-value">${formatNumber(networkData.marketCap)}</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">24h Volume</div>
                  <div className="metric-value">${formatNumber(networkData.volume24h)}</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Mempool</div>
                  <div className="metric-value">{formatNumber(networkData.mempoolCount, 0)}</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Priority Fee</div>
                  <div className="metric-value">{networkData.priorityFee} sat/vB</div>
                </div>
              </div>
            </div>

            {/* Column 2: Live Transactions */}
            <div className="sidebar-section">
              <div className="sidebar-title">Live Transactions</div>
              <div className="feed-container">
                {transactions.map(tx => (
                  <div
                    key={tx.id}
                    className="tx-item"
                    onClick={() => setSelectedTx(tx)}
                  >
                    <div className="tx-hash">{tx.hash.slice(0, 16)}...</div>
                    <div className="tx-details">
                      <span className="tx-location">{tx.fromNode.city} → {tx.toNode.city}</span>
                      <span className={`tx-amount ${tx.type}`}>
                        {tx.amount < 1 ? tx.amount.toFixed(4) : tx.amount.toFixed(2)} BTC
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 3: Recent Blocks */}
            <div className="sidebar-section">
              <div className="sidebar-title">Recent Blocks</div>
              <div className="blocks-container">
                {recentBlocks.map(block => (
                  <div
                    key={block.height}
                    className="block-item"
                    onClick={() => setSelectedBlock(block)}
                  >
                    <div>
                      <div className="block-height">#{block.height}</div>
                      <div className="block-txs">{block.txCount} txs</div>
                    </div>
                    <div className="block-time">{formatTimeAgo(block.timestamp)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Detail Modal */}
        {selectedTx && (
          <div className="tx-modal-overlay" onClick={() => setSelectedTx(null)}>
            <div className="tx-modal" onClick={(e) => e.stopPropagation()}>
              <div className="tx-modal-header">
                <span className="tx-modal-title">Transaction Details</span>
                <button className="tx-modal-close" onClick={() => setSelectedTx(null)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              <div className="tx-modal-body">
                <div className="tx-modal-row">
                  <span className="tx-modal-label">Amount</span>
                  <span className={`tx-modal-value amount ${selectedTx.type}`}>
                    {selectedTx.amount < 1 ? selectedTx.amount.toFixed(6) : selectedTx.amount.toFixed(4)} BTC
                  </span>
                </div>
                <div className="tx-modal-row">
                  <span className="tx-modal-label">USD Value</span>
                  <span className="tx-modal-value">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(selectedTx.amount * networkData.price)}
                  </span>
                </div>
                <div className="tx-modal-row">
                  <span className="tx-modal-label">Route</span>
                  <div className="tx-modal-route">
                    <span>{selectedTx.fromNode.city}</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                    <span>{selectedTx.toNode.city}</span>
                  </div>
                </div>
                <div className="tx-modal-row">
                  <span className="tx-modal-label">Type</span>
                  <span className={`tx-modal-value amount ${selectedTx.type}`}>
                    {selectedTx.type === 'whale' ? 'Whale' : selectedTx.type === 'large' ? 'Large' : 'Standard'}
                  </span>
                </div>
                <div className="tx-modal-row">
                  <span className="tx-modal-label">Transaction Hash</span>
                  <span className="tx-modal-value hash">{selectedTx.hash}</span>
                </div>
              </div>
              <div className="tx-modal-footer">
                <a
                  href={`https://mempool.space/tx/${selectedTx.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tx-modal-link"
                >
                  View on Mempool.space
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Block Detail Modal */}
        {selectedBlock && (
          <div className="tx-modal-overlay" onClick={() => setSelectedBlock(null)}>
            <div className="tx-modal" onClick={(e) => e.stopPropagation()}>
              <div className="tx-modal-header">
                <span className="tx-modal-title">Block Details</span>
                <button className="tx-modal-close" onClick={() => setSelectedBlock(null)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              <div className="tx-modal-body">
                <div className="tx-modal-row">
                  <span className="tx-modal-label">Block Height</span>
                  <span className="tx-modal-value" style={{ color: '#F7931A', fontWeight: 700, fontSize: '18px' }}>
                    #{selectedBlock.height.toLocaleString()}
                  </span>
                </div>
                <div className="tx-modal-row">
                  <span className="tx-modal-label">Transactions</span>
                  <span className="tx-modal-value">
                    {selectedBlock.txCount.toLocaleString()} txs
                  </span>
                </div>
                <div className="tx-modal-row">
                  <span className="tx-modal-label">Mined</span>
                  <span className="tx-modal-value">
                    {formatTimeAgo(selectedBlock.timestamp)}
                  </span>
                </div>
                <div className="tx-modal-row">
                  <span className="tx-modal-label">Timestamp</span>
                  <span className="tx-modal-value">
                    {new Date(selectedBlock.timestamp * 1000).toLocaleString()}
                  </span>
                </div>
                <div className="tx-modal-row">
                  <span className="tx-modal-label">Block Hash</span>
                  <span className="tx-modal-value hash">{selectedBlock.hash}</span>
                </div>
              </div>
              <div className="tx-modal-footer">
                <a
                  href={`https://mempool.space/block/${selectedBlock.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tx-modal-link"
                >
                  View on Mempool.space
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        )}

        <PriceAlertModal
          isOpen={showAlertModal}
          onClose={() => setShowAlertModal(false)}
          currentPrice={networkData.price}
        />

        <NewsModal
          item={selectedNews}
          onClose={() => setSelectedNews(null)}
          isLightMode={isLightMode}
        />
      </div>
    </>
  );
}
