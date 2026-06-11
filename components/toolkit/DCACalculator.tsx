'use client';

import { useState, useMemo } from 'react';
import DCAChart from './DCAChart';

interface DCACalculatorProps {
  isLightMode: boolean;
  currentPrice: number;
}

interface DCAResults {
  totalInvested: number;
  totalBtc: number;
  currentValue: number;
  percentReturn: number;
  dataPoints: Array<{ date: string; invested: number; value: number }>;
}

function formatUSD(v: number): string {
  return v.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatBTC(v: number): string {
  return v.toFixed(8);
}

function oneYearAgo(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d.toISOString().slice(0, 10);
}

export default function DCACalculator({ isLightMode, currentPrice }: DCACalculatorProps) {
  const [amount, setAmount] = useState(100);
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [startDate, setStartDate] = useState(oneYearAgo);
  const [results, setResults] = useState<DCAResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const handleCalculate = async () => {
    setLoading(true);
    setError('');
    setResults(null);

    try {
      const fromUnix = Math.floor(new Date(startDate).getTime() / 1000);
      const toUnix = Math.floor(Date.now() / 1000);

      const res = await fetch(`/api/bitcoin-history?from=${fromUnix}&to=${toUnix}`);
      if (!res.ok) throw new Error('Failed to fetch price data');
      const { prices } = await res.json() as {
        prices: Array<{ timestamp: number; price: number }>;
      };

      if (!prices || !prices.length) {
        throw new Error('No price data returned');
      }

      // Build a date-keyed price map (YYYY-MM-DD -> price)
      const priceMap = new Map<string, number>();
      for (const p of prices) {
        const key = new Date(p.timestamp).toISOString().slice(0, 10);
        priceMap.set(key, p.price);
      }

      // Iterate through purchase dates
      const start = new Date(startDate);
      const end = new Date();
      let cursor = new Date(start);
      let totalInvested = 0;
      let totalBtc = 0;
      const dataPoints: DCAResults['dataPoints'] = [];

      // Helper: find nearest price for a given date
      const findPrice = (dateStr: string): number | null => {
        if (priceMap.has(dateStr)) return priceMap.get(dateStr)!;
        // Search within +/- 3 days
        const base = new Date(dateStr);
        for (let offset = 1; offset <= 3; offset++) {
          const before = new Date(base);
          before.setDate(before.getDate() - offset);
          const bKey = before.toISOString().slice(0, 10);
          if (priceMap.has(bKey)) return priceMap.get(bKey)!;

          const after = new Date(base);
          after.setDate(after.getDate() + offset);
          const aKey = after.toISOString().slice(0, 10);
          if (priceMap.has(aKey)) return priceMap.get(aKey)!;
        }
        return null;
      };

      while (cursor <= end) {
        const dateStr = cursor.toISOString().slice(0, 10);
        const price = findPrice(dateStr);

        if (price !== null) {
          const btcBought = amount / price;
          totalInvested += amount;
          totalBtc += btcBought;

          dataPoints.push({
            date: dateStr,
            invested: totalInvested,
            value: totalBtc * price,
          });
        }

        // Advance cursor
        if (frequency === 'daily') {
          cursor.setDate(cursor.getDate() + 1);
        } else if (frequency === 'weekly') {
          cursor.setDate(cursor.getDate() + 7);
        } else {
          cursor.setMonth(cursor.getMonth() + 1);
        }
      }

      if (!dataPoints.length) {
        throw new Error('Could not match any prices for the selected range');
      }

      // Update last data point value to use current price
      const currentValue = totalBtc * currentPrice;
      dataPoints[dataPoints.length - 1].value = currentValue;

      const percentReturn = ((currentValue - totalInvested) / totalInvested) * 100;

      setResults({
        totalInvested,
        totalBtc,
        currentValue,
        percentReturn,
        dataPoints,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const returnColor = results
    ? results.percentReturn >= 0
      ? '#22c55e'
      : '#ef4444'
    : undefined;

  return (
    <div className="dca-calculator">
      {/* Input row */}
      <div className="dca-inputs">
        {/* Amount */}
        <div className="dca-field">
          <label className="dca-field-label">Amount</label>
          <div className="dca-amount-wrap">
            <span className="dca-dollar-prefix">$</span>
            <input
              type="number"
              min={1}
              step={1}
              value={amount}
              onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
              className="dca-input dca-input-amount"
            />
          </div>
        </div>

        {/* Frequency */}
        <div className="dca-field">
          <label className="dca-field-label">Frequency</label>
          <div className="dca-freq-toggle">
            {(['daily', 'weekly', 'monthly'] as const).map((f) => (
              <button
                key={f}
                className={`dca-freq-btn ${frequency === f ? 'active' : ''}`}
                onClick={() => setFrequency(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Start date */}
        <div className="dca-field">
          <label className="dca-field-label">Start Date</label>
          <input
            type="date"
            min="2013-04-28"
            max={today}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="dca-input"
          />
        </div>
      </div>

      {/* Calculate button */}
      <button
        className="dca-calculate-btn"
        onClick={handleCalculate}
        disabled={loading}
      >
        {loading ? 'Calculating...' : 'Calculate'}
      </button>

      {error && <p className="dca-error">{error}</p>}

      {/* Loading skeleton */}
      {loading && (
        <div className="dca-skeleton-area">
          <div className="dca-skeleton-metrics">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="dca-skeleton-card">
                <div className="dca-skeleton-line short" />
                <div className="dca-skeleton-line long" />
              </div>
            ))}
          </div>
          <div className="dca-skeleton-chart" />
        </div>
      )}

      {/* Results */}
      {results && !loading && (
        <div className="dca-results">
          <div className="dca-metrics">
            <div className="dca-metric-card">
              <span className="dca-metric-label">Total Invested</span>
              <span className="dca-metric-value">{formatUSD(results.totalInvested)}</span>
            </div>
            <div className="dca-metric-card">
              <span className="dca-metric-label">Current Value</span>
              <span
                className="dca-metric-value"
                style={results.currentValue > results.totalInvested ? { color: '#F7931A' } : undefined}
              >
                {formatUSD(results.currentValue)}
              </span>
            </div>
            <div className="dca-metric-card">
              <span className="dca-metric-label">Total BTC</span>
              <span className="dca-metric-value btc">{formatBTC(results.totalBtc)}</span>
            </div>
            <div className="dca-metric-card">
              <span className="dca-metric-label">Return</span>
              <span className="dca-metric-value" style={{ color: returnColor }}>
                {results.percentReturn >= 0 ? '+' : ''}
                {results.percentReturn.toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="dca-chart-wrapper">
            <DCAChart dataPoints={results.dataPoints} isLightMode={isLightMode} />
          </div>
        </div>
      )}

      <style jsx>{`
        .dca-calculator {
          width: 100%;
        }

        .dca-inputs {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 1.25rem;
          margin-bottom: 1.25rem;
        }

        .dca-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .dca-field-label {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: ${isLightMode ? '#5a5a5a' : '#8a8a8a'};
        }

        .dca-amount-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .dca-dollar-prefix {
          position: absolute;
          left: 12px;
          font-family: 'Space Mono', monospace;
          font-size: 14px;
          color: ${isLightMode ? '#5a5a5a' : '#8a8a8a'};
          pointer-events: none;
          z-index: 1;
        }

        .dca-input {
          width: 100%;
          padding: 0.75rem 1rem;
          background: ${isLightMode ? '#f5f3f0' : '#0a0a0a'};
          border: 1px solid ${isLightMode ? '#d0ccc4' : '#3a3a3a'};
          color: ${isLightMode ? '#0a0a0a' : '#e8e4dc'};
          font-family: 'Space Mono', monospace;
          font-size: 14px;
          border-radius: 4px;
          transition: border-color 0.2s ease;
          box-sizing: border-box;
        }

        .dca-input:focus {
          outline: none;
          border-color: #F7931A;
        }

        .dca-input-amount {
          padding-left: 28px;
        }

        /* Remove number input spinners */
        .dca-input-amount::-webkit-outer-spin-button,
        .dca-input-amount::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .dca-input-amount {
          -moz-appearance: textfield;
        }

        .dca-freq-toggle {
          display: inline-flex;
          align-items: center;
          background: ${isLightMode ? '#f5f3f0' : '#141414'};
          border: 1px solid ${isLightMode ? '#c8c4bc' : '#3a3a3a'};
          border-radius: 6px;
          overflow: hidden;
        }

        .dca-freq-btn {
          padding: 0.5rem 1rem;
          background: transparent;
          border: none;
          color: ${isLightMode ? '#5a5a5a' : '#8a8a8a'};
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s ease;
          white-space: nowrap;
        }

        .dca-freq-btn:hover {
          color: ${isLightMode ? '#0a0a0a' : '#e8e4dc'};
        }

        .dca-freq-btn.active {
          background: #F7931A;
          color: ${isLightMode ? '#fff' : '#e8e4dc'};
        }

        .dca-calculate-btn {
          width: 100%;
          padding: 0.9rem;
          background: #F7931A;
          border: 1px solid #F7931A;
          color: #fff;
          font-family: 'Space Mono', monospace;
          font-size: 12px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s ease;
          border-radius: 4px;
          margin-bottom: 1.5rem;
        }

        .dca-calculate-btn:hover:not(:disabled) {
          background: #ff6600;
          border-color: #ff6600;
        }

        .dca-calculate-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .dca-error {
          font-family: 'Space Mono', monospace;
          font-size: 12px;
          color: #ef4444;
          margin-bottom: 1rem;
          text-align: center;
        }

        /* Skeleton loading */
        .dca-skeleton-area {
          animation: skeletonFadeIn 0.3s ease;
        }

        @keyframes skeletonFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .dca-skeleton-metrics {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .dca-skeleton-card {
          background: ${isLightMode ? '#ffffff' : '#141414'};
          border: 1px solid ${isLightMode ? '#d0ccc4' : '#1a1a1a'};
          border-radius: 4px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .dca-skeleton-line {
          border-radius: 3px;
          height: 14px;
          background: linear-gradient(
            90deg,
            ${isLightMode ? '#e0dcd4' : '#1a1a1a'} 25%,
            ${isLightMode ? '#ece9e3' : '#252525'} 50%,
            ${isLightMode ? '#e0dcd4' : '#1a1a1a'} 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s ease-in-out infinite;
        }

        .dca-skeleton-line.short {
          width: 50%;
          height: 10px;
        }

        .dca-skeleton-line.long {
          width: 80%;
          height: 22px;
        }

        .dca-skeleton-chart {
          width: 100%;
          height: 200px;
          border-radius: 4px;
          background: linear-gradient(
            90deg,
            ${isLightMode ? '#e0dcd4' : '#1a1a1a'} 25%,
            ${isLightMode ? '#ece9e3' : '#252525'} 50%,
            ${isLightMode ? '#e0dcd4' : '#1a1a1a'} 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s ease-in-out infinite;
        }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* Results */
        .dca-results {
          animation: resultsFadeIn 0.4s ease;
        }

        @keyframes resultsFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .dca-metrics {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .dca-metric-card {
          background: ${isLightMode ? '#ffffff' : '#141414'};
          border: 1px solid ${isLightMode ? '#d0ccc4' : '#1a1a1a'};
          border-radius: 4px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .dca-metric-label {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #8a8a8a;
        }

        .dca-metric-value {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.8rem;
          font-weight: 400;
          line-height: 1.2;
          color: ${isLightMode ? '#0a0a0a' : '#e8e4dc'};
        }

        .dca-metric-value.btc {
          font-size: 1.4rem;
        }

        .dca-chart-wrapper {
          width: 100%;
          aspect-ratio: 2 / 1;
          border: 1px solid ${isLightMode ? '#d0ccc4' : '#1a1a1a'};
          border-radius: 4px;
          overflow: hidden;
          background: ${isLightMode ? '#ffffff' : '#0a0a0a'};
        }

        @media (max-width: 768px) {
          .dca-inputs {
            grid-template-columns: 1fr;
          }

          .dca-metrics,
          .dca-skeleton-metrics {
            grid-template-columns: repeat(2, 1fr);
          }

          .dca-metric-value {
            font-size: 1.4rem;
          }

          .dca-metric-value.btc {
            font-size: 1.1rem;
          }
        }

        @media (max-width: 480px) {
          .dca-metrics,
          .dca-skeleton-metrics {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
