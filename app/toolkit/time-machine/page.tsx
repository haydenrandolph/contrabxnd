'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import PurchasingPowerComparison from '@/components/toolkit/PurchasingPowerComparison';

export default function TimeMachinePage() {
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

  return (
    <>
      <style jsx global>{`
        .tool-page {
          background: var(--cb-bg);
          color: var(--cb-text);
          font-family: var(--cb-font-mono);
          font-size: 13px;
          line-height: 1.7;
          min-height: 100vh;
          overflow-x: hidden;
        }

        .page-header {
          max-width: 720px;
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

        .page-label a {
          color: var(--cb-text-muted);
          text-decoration: none;
          transition: color 0.15s ease;
        }

        .page-label a:hover {
          color: var(--cb-text);
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

        .tool-content {
          max-width: 720px;
          margin: 0 auto;
          padding: 48px 48px 96px;
        }

        @media (max-width: 768px) {
          .page-header { padding: 72px 24px 0; }
          .tool-content { padding: 32px 24px 64px; }
        }
      `}</style>

      <div className={`tool-page ${isLightMode ? 'light-mode' : ''}`}>
        <SiteNav activePath="/toolkit" />

        <div className="page-header">
          <div className="page-label">
            <a href="/toolkit">TOOL₿OX</a> / TIME MACHINE
          </div>
          <h1 className="page-title">Time Machine</h1>
          <p className="page-subtitle">See what your money would be worth if you had bought Bitcoin.</p>
          <div className="page-divider" />
        </div>

        <div className="tool-content">
          <PurchasingPowerComparison isLightMode={isLightMode} currentPrice={currentPrice} />
        </div>

        <SiteFooter />
      </div>
    </>
  );
}
