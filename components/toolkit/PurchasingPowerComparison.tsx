'use client';

import { useState } from 'react';

interface PurchasingPowerComparisonProps {
  isLightMode: boolean;
  currentPrice: number;
}

interface Results {
  historicalPrice: number;
  btcBought: number;
  currentValue: number;
  multiplier: number;
  satsThen: number;
  satsNow: number;
}

function formatNumber(n: number, decimals = 2): string {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatInteger(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

function formatDateDisplay(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

export default function PurchasingPowerComparison({
  isLightMode,
  currentPrice,
}: PurchasingPowerComparisonProps) {
  const [selectedDate, setSelectedDate] = useState('2020-01-01');
  const [amount, setAmount] = useState(100);
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCompare = async () => {
    if (!selectedDate || amount <= 0 || currentPrice <= 0) return;

    setLoading(true);
    setResults(null);

    try {
      const dateUnix = Math.floor(new Date(selectedDate + 'T00:00:00Z').getTime() / 1000);
      const res = await fetch(
        `/api/bitcoin-history?from=${dateUnix}&to=${dateUnix + 7 * 86400}`,
      );
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();

      const prices: { timestamp: number; price: number }[] = data.prices ?? [];
      if (prices.length === 0) throw new Error('No price data');

      const historicalPrice = prices[0].price;
      const btcBought = amount / historicalPrice;
      const currentValue = btcBought * currentPrice;
      const multiplier = currentValue / amount;
      const satsThen = btcBought * 100_000_000;
      const satsNow = (amount / currentPrice) * 100_000_000;

      setResults({
        historicalPrice,
        btcBought,
        currentValue,
        multiplier,
        satsThen,
        satsNow,
      });
    } catch {
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const cardBg = isLightMode ? '#ffffff' : '#141414';
  const textPrimary = isLightMode ? '#111111' : '#e5e5e5';
  const textSecondary = isLightMode ? '#555555' : '#8a8a8a';
  const inputBg = isLightMode ? '#f5f5f5' : '#1a1a1a';
  const inputBorder = isLightMode ? '#d0d0d0' : '#333333';
  const containerBg = isLightMode ? '#f0f0f0' : '#0a0a0a';

  return (
    <>
      <style jsx>{`
        .ppc-container {
          width: 100%;
          max-width: 640px;
          margin: 0 auto;
          background: ${containerBg};
          border-radius: 12px;
          padding: 2rem;
        }

        .ppc-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.5rem;
          color: ${textPrimary};
          margin: 0 0 1.5rem;
          text-align: center;
        }

        .ppc-inputs {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
          align-items: flex-end;
        }

        .ppc-field {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }

        .ppc-label {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: ${textSecondary};
        }

        .ppc-input {
          font-family: 'Space Mono', monospace;
          font-size: 14px;
          padding: 0.5rem 0.75rem;
          border: 1px solid ${inputBorder};
          border-radius: 6px;
          background: ${inputBg};
          color: ${textPrimary};
          outline: none;
          width: 100%;
          box-sizing: border-box;
        }

        .ppc-input:focus {
          border-color: #F7931A;
        }

        .ppc-amount-wrapper {
          position: relative;
        }

        .ppc-dollar-sign {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          font-family: 'Space Mono', monospace;
          font-size: 14px;
          color: ${textSecondary};
          pointer-events: none;
        }

        .ppc-input-dollar {
          padding-left: 1.5rem;
        }

        .ppc-btn {
          font-family: 'Space Mono', monospace;
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.5rem 1.5rem;
          background: #F7931A;
          color: #ffffff;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: opacity 0.15s;
          white-space: nowrap;
        }

        .ppc-btn:hover {
          opacity: 0.88;
        }

        .ppc-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .ppc-results-header {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 1.25rem;
          color: ${textPrimary};
          text-align: center;
          margin: 2rem 0 1rem;
        }

        .ppc-cards {
          display: flex;
          gap: 1rem;
        }

        @media (max-width: 768px) {
          .ppc-cards {
            flex-direction: column;
          }
          .ppc-inputs {
            flex-direction: column;
          }
        }

        .ppc-card {
          flex: 1;
          background: ${cardBg};
          border-radius: 8px;
          padding: 1.25rem;
        }

        .ppc-card-then {
          border-left: 3px solid #8a8a8a;
        }

        .ppc-card-now {
          border-left: 3px solid #F7931A;
        }

        .ppc-card-label {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: ${textSecondary};
          margin: 0 0 1rem;
        }

        .ppc-row-label {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: ${textSecondary};
          margin: 0.75rem 0 0.125rem;
        }

        .ppc-row-label:first-of-type {
          margin-top: 0;
        }

        .ppc-value {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.5rem;
          color: ${textPrimary};
          margin: 0;
          line-height: 1.2;
        }

        .ppc-value-sats {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.5rem;
          color: #F7931A;
          margin: 0;
          line-height: 1.2;
        }

        .ppc-banner {
          margin-top: 1rem;
          background: #F7931A;
          border-radius: 8px;
          padding: 1.25rem;
          text-align: center;
        }

        .ppc-banner-multiplier {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2.5rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
          line-height: 1.1;
        }

        .ppc-banner-desc {
          font-family: 'Space Mono', monospace;
          font-size: 12px;
          color: #ffffff;
          margin: 0.375rem 0 0;
          opacity: 0.92;
        }

        /* Skeleton shimmer */
        .ppc-skeleton {
          position: relative;
          overflow: hidden;
          border-radius: 8px;
          background: ${cardBg};
        }

        .ppc-skeleton::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            ${isLightMode ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)'} 50%,
            transparent 100%
          );
          animation: ppc-shimmer 1.5s infinite;
        }

        @keyframes ppc-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .ppc-skeleton-cards {
          display: flex;
          gap: 1rem;
        }

        @media (max-width: 768px) {
          .ppc-skeleton-cards {
            flex-direction: column;
          }
        }

        .ppc-skeleton-card {
          flex: 1;
          height: 200px;
        }

        .ppc-skeleton-banner {
          margin-top: 1rem;
          height: 80px;
        }
      `}</style>

      <div className="ppc-container">
        <h3 className="ppc-title">What if you&apos;d bought Bitcoin?</h3>

        <div className="ppc-inputs">
          <div className="ppc-field">
            <label className="ppc-label">Date</label>
            <input
              type="date"
              className="ppc-input"
              value={selectedDate}
              min="2013-04-28"
              max={getYesterday()}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <div className="ppc-field">
            <label className="ppc-label">Amount</label>
            <div className="ppc-amount-wrapper">
              <span className="ppc-dollar-sign">$</span>
              <input
                type="number"
                className="ppc-input ppc-input-dollar"
                value={amount}
                min={1}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>
          </div>
          <button
            className="ppc-btn"
            onClick={handleCompare}
            disabled={loading || !selectedDate || amount <= 0}
          >
            Compare
          </button>
        </div>

        {loading && (
          <>
            <div className="ppc-results-header">&nbsp;</div>
            <div className="ppc-skeleton-cards">
              <div className="ppc-skeleton ppc-skeleton-card" />
              <div className="ppc-skeleton ppc-skeleton-card" />
            </div>
            <div className="ppc-skeleton ppc-skeleton-banner" />
          </>
        )}

        {results && !loading && (
          <>
            <p className="ppc-results-header">
              ${formatNumber(amount, 0)} on {formatDateDisplay(selectedDate)}
            </p>

            <div className="ppc-cards">
              <div className="ppc-card ppc-card-then">
                <p className="ppc-card-label">Then</p>
                <p className="ppc-row-label">BTC Price</p>
                <p className="ppc-value">${formatNumber(results.historicalPrice)}</p>
                <p className="ppc-row-label">You got</p>
                <p className="ppc-value">{formatNumber(results.btcBought, 5)} BTC</p>
                <p className="ppc-row-label">Sats</p>
                <p className="ppc-value-sats">{formatInteger(results.satsThen)} sats</p>
              </div>

              <div className="ppc-card ppc-card-now">
                <p className="ppc-card-label">Now</p>
                <p className="ppc-row-label">BTC Price</p>
                <p className="ppc-value">${formatNumber(currentPrice)}</p>
                <p className="ppc-row-label">Worth today</p>
                <p className="ppc-value">${formatNumber(results.currentValue)}</p>
                <p className="ppc-row-label">That ${formatNumber(amount, 0)} buys today</p>
                <p className="ppc-value-sats">{formatInteger(results.satsNow)} sats</p>
              </div>
            </div>

            <div className="ppc-banner">
              <p className="ppc-banner-multiplier">
                {formatNumber(results.multiplier, 2)}x Return
              </p>
              <p className="ppc-banner-desc">
                Your ${formatNumber(amount, 0)} would be ${formatNumber(results.currentValue)} today
              </p>
            </div>
          </>
        )}
      </div>
    </>
  );
}
