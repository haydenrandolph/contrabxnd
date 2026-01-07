'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';

// Bitcoin hub cities with coordinates (percentage-based for map positioning)
// Adjusted to match the fla-shop.com world map SVG (viewBox 0 0 2000 1280)
const BITCOIN_NODES = [
  // North America
  { id: 1, city: 'New York', x: 24, y: 35, major: true },
  { id: 2, city: 'Los Angeles', x: 11, y: 40, major: true },
  { id: 3, city: 'San Francisco', x: 9, y: 38, major: true },
  { id: 4, city: 'Miami', x: 22, y: 44, major: false },
  { id: 5, city: 'Chicago', x: 20, y: 35, major: false },
  { id: 6, city: 'Toronto', x: 23, y: 33, major: false },
  { id: 27, city: 'Vancouver', x: 10, y: 32, major: false },
  { id: 28, city: 'Austin', x: 16, y: 42, major: false },
  // Europe
  { id: 7, city: 'London', x: 45, y: 30, major: true },
  { id: 8, city: 'Amsterdam', x: 47, y: 28, major: false },
  { id: 9, city: 'Frankfurt', x: 48, y: 30, major: true },
  { id: 10, city: 'Paris', x: 46, y: 32, major: false },
  { id: 11, city: 'Zurich', x: 48, y: 33, major: false },
  { id: 25, city: 'Berlin', x: 49, y: 28, major: false },
  { id: 26, city: 'Stockholm', x: 50, y: 22, major: false },
  { id: 21, city: 'Moscow', x: 55, y: 25, major: false },
  // Middle East & Africa
  { id: 24, city: 'Tel Aviv', x: 54, y: 40, major: false },
  { id: 12, city: 'Dubai', x: 58, y: 44, major: false },
  { id: 23, city: 'Johannesburg', x: 52, y: 68, major: false },
  // Asia
  { id: 22, city: 'Mumbai', x: 63, y: 46, major: false },
  { id: 13, city: 'Singapore', x: 70, y: 55, major: true },
  { id: 14, city: 'Hong Kong', x: 73, y: 44, major: true },
  { id: 16, city: 'Seoul', x: 77, y: 36, major: false },
  { id: 15, city: 'Tokyo', x: 80, y: 38, major: true },
  // Australia
  { id: 17, city: 'Sydney', x: 82, y: 70, major: true },
  { id: 18, city: 'Melbourne', x: 81, y: 73, major: false },
  // South America
  { id: 19, city: 'São Paulo', x: 30, y: 66, major: false },
  { id: 20, city: 'Buenos Aires', x: 28, y: 73, major: false },
];

interface Transaction {
  id: string;
  hash: string;
  amount: number;
  nodeId: number;
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
  const [pings, setPings] = useState<Array<{ id: string; x: number; y: number; type: string }>>([]);
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);

  // Fetch price data from CoinGecko
  const fetchPriceData = useCallback(async () => {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true'
      );
      const data = await response.json();
      if (data.bitcoin) {
        setNetworkData(prev => ({
          ...prev,
          price: data.bitcoin.usd,
          change24h: data.bitcoin.usd_24h_change,
          marketCap: data.bitcoin.usd_market_cap,
          volume24h: data.bitcoin.usd_24h_vol,
        }));
      }
    } catch (error) {
      console.error('Error fetching price data:', error);
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

  // Generate simulated transaction
  const generateTransaction = useCallback(() => {
    const nodeId = BITCOIN_NODES[Math.floor(Math.random() * BITCOIN_NODES.length)].id;
    const node = BITCOIN_NODES.find(n => n.id === nodeId)!;

    // Realistic value distribution: mostly small, occasionally large, rarely whale
    const rand = Math.random();
    let amount: number;
    let type: 'normal' | 'large' | 'whale';

    if (rand < 0.85) {
      amount = Math.random() * 0.5 + 0.001; // 0.001 - 0.5 BTC
      type = 'normal';
    } else if (rand < 0.97) {
      amount = Math.random() * 9 + 1; // 1 - 10 BTC
      type = 'large';
    } else {
      amount = Math.random() * 90 + 10; // 10 - 100 BTC
      type = 'whale';
    }

    const tx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      hash: Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
      amount,
      nodeId,
      timestamp: Date.now(),
      type,
    };

    // Add ping at node location
    setPings(prev => [...prev.slice(-20), { id: tx.id, x: node.x, y: node.y, type }]);

    // Remove ping after animation
    setTimeout(() => {
      setPings(prev => prev.filter(p => p.id !== tx.id));
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

  // Transaction simulation (3-7 tx/s)
  useEffect(() => {
    const generateTx = () => {
      generateTransaction();
      const nextDelay = Math.random() * 200 + 150; // 150-350ms between tx
      setTimeout(generateTx, nextDelay);
    };
    const timeout = setTimeout(generateTx, 500);
    return () => clearTimeout(timeout);
  }, [generateTransaction]);

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
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');

        .dashboard-page {
          background: #0a0a0a;
          color: #e8e4dc;
          font-family: 'Space Mono', monospace;
          min-height: 100vh;
          overflow-x: hidden;
        }

        .dashboard-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          padding: 1.5rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 100;
          background: linear-gradient(to bottom, #0a0a0a 0%, transparent 100%);
        }

        .dashboard-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
          color: #f5f3f0;
        }

        .dashboard-logo-text {
          font-size: 11px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
        }

        .dashboard-nav-links {
          display: flex;
          gap: 2.5rem;
        }

        .dashboard-nav-links a {
          color: #f5f3f0;
          text-decoration: none;
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          position: relative;
          padding: 0.25rem 0;
        }

        .dashboard-nav-links a::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 1px;
          background: #b5673a;
          transition: width 0.3s ease;
        }

        .dashboard-nav-links a:hover::after,
        .dashboard-nav-links a.active::after {
          width: 100%;
        }

        .live-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #8a8a8a;
        }

        .live-dot {
          width: 8px;
          height: 8px;
          background: #22c55e;
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }

        .dashboard-container {
          display: grid;
          grid-template-columns: 1fr 320px;
          min-height: 100vh;
          padding-top: 70px;
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
          max-width: 900px;
          aspect-ratio: 16/9;
          background: #0d0d0d;
          border: 1px solid #1a1a1a;
          border-radius: 4px;
          overflow: hidden;
        }

        .world-map {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse at center, rgba(181, 103, 58, 0.03) 0%, transparent 70%),
            linear-gradient(180deg, #0d0d0d 0%, #0a0a0a 100%);
        }

        .map-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(181, 103, 58, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(181, 103, 58, 0.05) 1px, transparent 1px);
          background-size: 50px 50px;
        }

        .world-map-svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
          z-index: 1;
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

        .center-display {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          z-index: 15;
          background: rgba(10, 10, 10, 0.8);
          padding: 1.5rem 2.5rem;
          border: 1px solid rgba(181, 103, 58, 0.3);
        }

        .center-label {
          font-size: 9px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: #b5673a;
          margin-bottom: 0.5rem;
        }

        .center-price {
          font-size: 2.5rem;
          font-weight: 700;
          color: #e8e4dc;
          line-height: 1;
        }

        .center-change {
          font-size: 14px;
          margin-top: 0.5rem;
        }

        .center-change.positive { color: #22c55e; }
        .center-change.negative { color: #ef4444; }

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

        .sidebar {
          background: #0d0d0d;
          border-left: 1px solid #1a1a1a;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .sidebar-section {
          padding: 1.5rem;
          border-bottom: 1px solid #1a1a1a;
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

        .feed-container {
          flex: 1;
          overflow-y: auto;
          padding: 1rem 1.5rem;
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
          padding: 0.75rem 0;
          border-bottom: 1px solid #1a1a1a;
          animation: fadeIn 0.3s ease;
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

        .blocks-section {
          padding: 1.5rem;
          border-top: 1px solid #1a1a1a;
        }

        .block-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
          border-bottom: 1px solid #1a1a1a;
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

        @media (max-width: 1024px) {
          .dashboard-container {
            grid-template-columns: 1fr;
          }

          .sidebar {
            display: none;
          }

          .dashboard-nav-links {
            display: none;
          }
        }
      `}</style>

      <div className="dashboard-page">
        <nav className="dashboard-nav">
          <Link href="/" className="dashboard-logo">
            <Image
              src="/contraband-logo-v3.png"
              alt="Contraband logo"
              width={36}
              height={36}
            />
            <span className="dashboard-logo-text">Contra₿and</span>
          </Link>
          <div className="dashboard-nav-links">
            <Link href="/learn">Stu₿y</Link>
            <Link href="/writings">Writings</Link>
            <Link href="/dashboard" className="active">Dashboard</Link>
            <Link href="/about">About</Link>
          </div>
          <div className="live-indicator">
            <span className="live-dot"></span>
            <span>Live</span>
          </div>
        </nav>

        <div className="dashboard-container">
          <div className="map-section">
            <div className="map-container">
              <div className="world-map">
                <div className="map-grid"></div>
                {/* World map SVG - CC-BY-4.0 fla-shop.com */}
                <img src="/map.svg" alt="" className="world-map-svg" />
              </div>

              <div className="sonar-overlay">
                <div className="radar-sweep"></div>
                <div className="sonar-rings">
                  <div className="sonar-ring"></div>
                  <div className="sonar-ring"></div>
                  <div className="sonar-ring"></div>
                  <div className="sonar-ring"></div>
                </div>
              </div>

              {BITCOIN_NODES.map(node => (
                <div
                  key={node.id}
                  className={`node-dot ${node.major ? 'major' : ''}`}
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  {hoveredNode === node.id && (
                    <div className="node-label">{node.city}</div>
                  )}
                </div>
              ))}

              {pings.map(ping => (
                <div
                  key={ping.id}
                  className={`tx-ping ${ping.type}`}
                  style={{ left: `${ping.x}%`, top: `${ping.y}%` }}
                />
              ))}

              <div className="center-display">
                <div className="center-label">Bitcoin Network</div>
                <div className="center-price">{formatPrice(networkData.price)}</div>
                <div className={`center-change ${networkData.change24h >= 0 ? 'positive' : 'negative'}`}>
                  {networkData.change24h >= 0 ? '+' : ''}{networkData.change24h.toFixed(2)}%
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

            <div className="sidebar-section">
              <div className="sidebar-title">Live Transactions</div>
            </div>

            <div className="feed-container">
              {transactions.map(tx => {
                const node = BITCOIN_NODES.find(n => n.id === tx.nodeId);
                return (
                  <div key={tx.id} className="tx-item">
                    <div className="tx-hash">{tx.hash.slice(0, 16)}...</div>
                    <div className="tx-details">
                      <span className="tx-location">{node?.city}</span>
                      <span className={`tx-amount ${tx.type}`}>
                        {tx.amount < 1 ? tx.amount.toFixed(4) : tx.amount.toFixed(2)} BTC
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="blocks-section">
              <div className="sidebar-title">Recent Blocks</div>
              {recentBlocks.map(block => (
                <div key={block.height} className="block-item">
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
    </>
  );
}
