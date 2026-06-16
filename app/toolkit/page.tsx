'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import ThemeToggle from '@/components/ThemeToggle';
import SatsConverter from '@/components/toolkit/SatsConverter';
import DCACalculator from '@/components/toolkit/DCACalculator';
import PurchasingPowerComparison from '@/components/toolkit/PurchasingPowerComparison';

type ToolTab = 'sats' | 'dca' | 'power';

export default function ToolkitPage() {
  const [activeTab, setActiveTab] = useState<ToolTab>('sats');
  const [currentPrice, setCurrentPrice] = useState(0);
  const { isLightMode } = useTheme();

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch('/api/price');
        if (res.ok) {
          const data = await res.json();
          setCurrentPrice(data.price ?? 0);
        }
      } catch { /* ignore */ }
    };
    fetchPrice();
    const interval = setInterval(fetchPrice, 30_000);
    return () => clearInterval(interval);
  }, []);

  const formatUSD = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  const satPrice = currentPrice > 0 ? (currentPrice / 100_000_000) : 0;

  return (
    <>
      <style jsx global>{`
        .toolkit-page {
          background: var(--cb-bg);
          color: var(--cb-text);
          font-family: var(--cb-font-mono);
          font-size: 13px;
          line-height: 1.7;
          min-height: 100vh;
          overflow-x: hidden;
        }

        .page-header {
          max-width: 1100px;
          margin: 0 auto;
          padding: 80px 48px 0;
        }

        .page-label {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--cb-accent);
          margin-bottom: 16px;
        }

        .page-title {
          font-family: var(--cb-font-display, 'Cormorant Garamond', serif);
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 400;
          letter-spacing: -0.02em;
          line-height: 1.15;
          color: var(--cb-text);
          margin-bottom: 12px;
        }

        .page-subtitle {
          font-family: 'Space Mono', monospace;
          font-size: 13px;
          color: var(--cb-text-muted);
          max-width: 600px;
          line-height: 1.6;
        }

        .page-divider {
          width: 100%;
          height: 1px;
          background: var(--cb-border);
          margin-top: 32px;
        }

        .page-content {
          max-width: 1100px;
          margin: 0 auto;
          padding: 48px 48px 96px;
        }

        .toolkit-price-bar {
          max-width: 1100px;
          margin: 2rem auto 0;
          padding: 0 48px;
          display: flex;
          align-items: center;
          gap: 2rem;
          font-size: 13px;
          letter-spacing: 0.08em;
        }

        .toolkit-price-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .toolkit-price-label {
          color: var(--cb-text-muted);
          text-transform: uppercase;
          font-size: 10px;
          letter-spacing: 0.08em;
        }

        .toolkit-price-value {
          color: var(--cb-accent);
          font-weight: 700;
        }

        .toolkit-price-sep {
          color: var(--cb-border);
        }

        .toolkit-tabs {
          max-width: 1100px;
          margin: 2.5rem auto 0;
          padding: 0 48px;
        }

        .toolkit-tab-bar {
          display: inline-flex;
          align-items: center;
          gap: 0;
          background: var(--cb-surface);
          border: 1px solid var(--cb-border);
          border-radius: 2px;
          overflow: hidden;
        }

        .toolkit-tab {
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--cb-text-muted);
          padding: 0.65rem 1.5rem;
          background: transparent;
          border: none;
          cursor: pointer;
          font-family: var(--cb-font-mono);
          transition: color 0.15s ease;
          white-space: nowrap;
        }

        .toolkit-tab:hover {
          color: var(--cb-text);
        }

        .toolkit-tab.active {
          color: #fff;
          background: var(--cb-accent);
        }

        .toolkit-content {
          max-width: 1100px;
          margin: 3rem auto;
          padding: 0 48px 6rem;
        }

        @media (max-width: 768px) {
          .page-header { padding: 72px 24px 0; }
          .page-content { padding: 32px 24px 64px; }

          .toolkit-price-bar {
            padding: 0 24px;
            flex-wrap: wrap;
            gap: 1rem;
          }

          .toolkit-tabs {
            padding: 0 24px;
          }

          .toolkit-tab-bar {
            display: flex;
            width: 100%;
          }

          .toolkit-tab {
            flex: 1;
            text-align: center;
            padding: 0.65rem 0.75rem;
            font-size: 10px;
          }

          .toolkit-content {
            padding: 0 24px 4rem;
          }
        }
      `}</style>

      <div className={`toolkit-page ${isLightMode ? 'light-mode' : ''}`}>
        <ThemeToggle />
        <SiteNav activePath="/toolkit" />

        <div className="page-header">
          <div className="page-label">TOOLKIT</div>
          <h1 className="page-title">Toolkit</h1>
          <p className="page-subtitle">Calculate · Convert · Compare</p>
          <div className="page-divider" />
        </div>

        <div className="toolkit-price-bar">
          <div className="toolkit-price-item">
            <span className="toolkit-price-label">BTC</span>
            <span className="toolkit-price-value">
              {currentPrice > 0 ? formatUSD(currentPrice) : <span className="skeleton" style={{ width: 80, height: 14, display: 'inline-block' }} />}
            </span>
          </div>
          <span className="toolkit-price-sep">|</span>
          <div className="toolkit-price-item">
            <span className="toolkit-price-label">1 sat</span>
            <span className="toolkit-price-value">
              {satPrice > 0 ? `$${satPrice.toFixed(6)}` : <span className="skeleton" style={{ width: 60, height: 14, display: 'inline-block' }} />}
            </span>
          </div>
        </div>

        <div className="toolkit-tabs">
          <div className="toolkit-tab-bar">
            <button className={`toolkit-tab ${activeTab === 'sats' ? 'active' : ''}`} onClick={() => setActiveTab('sats')}>
              Sats Converter
            </button>
            <button className={`toolkit-tab ${activeTab === 'dca' ? 'active' : ''}`} onClick={() => setActiveTab('dca')}>
              DCA Calculator
            </button>
            <button className={`toolkit-tab ${activeTab === 'power' ? 'active' : ''}`} onClick={() => setActiveTab('power')}>
              Time Machine
            </button>
          </div>
        </div>

        <div className="toolkit-content">
          {activeTab === 'sats' && <SatsConverter isLightMode={isLightMode} currentPrice={currentPrice} />}
          {activeTab === 'dca' && <DCACalculator isLightMode={isLightMode} currentPrice={currentPrice} />}
          {activeTab === 'power' && <PurchasingPowerComparison isLightMode={isLightMode} currentPrice={currentPrice} />}
        </div>

        <SiteFooter />
      </div>
    </>
  );
}
