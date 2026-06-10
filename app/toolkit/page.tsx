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
          background: var(--contraband-black);
          color: var(--contraband-cream);
          font-family: 'Space Mono', monospace;
          font-size: 14px;
          line-height: 1.7;
          min-height: 100vh;
          overflow-x: hidden;
        }

        .toolkit-page.light-mode {
          background: #f5f3f0;
          color: #0a0a0a;
        }

        .toolkit-header {
          max-width: 1200px;
          margin: 0 auto;
          padding: 8rem 3rem 0;
        }

        .toolkit-header-top {
          display: flex;
          align-items: baseline;
          gap: 2rem;
          margin-bottom: 1rem;
          border-bottom: 1px solid #3a3a3a;
          padding-bottom: 1.5rem;
        }

        .toolkit-page.light-mode .toolkit-header-top {
          border-bottom-color: #d0ccc4;
        }

        .toolkit-section-number {
          font-family: 'Cormorant Garamond', serif;
          font-size: 3rem;
          color: #F7931A;
          line-height: 1;
        }

        .toolkit-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2.5rem;
          font-weight: 400;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .toolkit-subtitle {
          font-size: 12px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: #8a8a8a;
          margin-top: 0.5rem;
        }

        .toolkit-price-bar {
          max-width: 1200px;
          margin: 2rem auto 0;
          padding: 0 3rem;
          display: flex;
          align-items: center;
          gap: 2rem;
          font-size: 12px;
          letter-spacing: 0.1em;
        }

        .toolkit-price-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .toolkit-price-label {
          color: #8a8a8a;
          text-transform: uppercase;
          font-size: 10px;
          letter-spacing: 0.15em;
        }

        .toolkit-price-value {
          color: #F7931A;
          font-weight: 700;
        }

        .toolkit-price-sep {
          color: #3a3a3a;
        }

        .toolkit-page.light-mode .toolkit-price-sep {
          color: #d0ccc4;
        }

        .toolkit-tabs {
          max-width: 1200px;
          margin: 2.5rem auto 0;
          padding: 0 3rem;
        }

        .toolkit-tab-bar {
          display: inline-flex;
          align-items: center;
          gap: 0;
          background: #141414;
          border: 1px solid #3a3a3a;
          border-radius: 6px;
          overflow: hidden;
        }

        .toolkit-page.light-mode .toolkit-tab-bar {
          background: #ffffff;
          border-color: #c8c4bc;
        }

        .toolkit-tab {
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #8a8a8a;
          padding: 0.65rem 1.5rem;
          background: transparent;
          border: none;
          cursor: pointer;
          font-family: 'Space Mono', monospace;
          transition: all 0.3s ease;
          white-space: nowrap;
        }

        .toolkit-tab:hover {
          color: #e8e4dc;
        }

        .toolkit-page.light-mode .toolkit-tab:hover {
          color: #0a0a0a;
        }

        .toolkit-tab.active {
          color: #fff;
          background: #F7931A;
        }

        .toolkit-content {
          max-width: 1200px;
          margin: 3rem auto;
          padding: 0 3rem 6rem;
        }

        @media (max-width: 768px) {
          .toolkit-header {
            padding: 6rem 2rem 0;
          }

          .toolkit-header-top {
            flex-direction: column;
            gap: 0.5rem;
          }

          .toolkit-title {
            font-size: 1.8rem;
          }

          .toolkit-price-bar {
            padding: 0 2rem;
            flex-wrap: wrap;
            gap: 1rem;
          }

          .toolkit-tabs {
            padding: 0 2rem;
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
            padding: 0 2rem 4rem;
          }
        }
      `}</style>

      <div className={`toolkit-page ${isLightMode ? 'light-mode' : ''}`}>
        <ThemeToggle />
        <SiteNav activePath="/toolkit" />

        <div className="toolkit-header">
          <div className="toolkit-header-top">
            <span className="toolkit-section-number">₿</span>
            <h1 className="toolkit-title">Toolkit</h1>
          </div>
          <p className="toolkit-subtitle">Calculate · Convert · Compare</p>
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
