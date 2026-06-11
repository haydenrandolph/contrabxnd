'use client';

import { useState, useCallback } from 'react';

interface SatsConverterProps {
  isLightMode: boolean;
  currentPrice: number;
}

const QUICK_REFS = [
  { label: 'A coffee', usd: 5 },
  { label: 'A meal', usd: 25 },
  { label: 'A paycheck', usd: 3_000 },
  { label: 'A used car', usd: 15_000 },
  { label: 'A house', usd: 350_000 },
];

function formatSats(sats: number): string {
  return Math.round(sats).toLocaleString('en-US');
}

function formatUsd(usd: number): string {
  return usd.toFixed(2);
}

export default function SatsConverter({ isLightMode, currentPrice }: SatsConverterProps) {
  const [usdValue, setUsdValue] = useState('');
  const [satsValue, setSatsValue] = useState('');
  const [direction, setDirection] = useState<'usd-to-sats' | 'sats-to-usd'>('usd-to-sats');

  const usdToSats = useCallback(
    (usd: number) => (usd / currentPrice) * 100_000_000,
    [currentPrice]
  );

  const satsToUsd = useCallback(
    (sats: number) => (sats / 100_000_000) * currentPrice,
    [currentPrice]
  );

  const oneSatUsd = currentPrice / 100_000_000;

  const handleUsdChange = (raw: string) => {
    // Allow only digits and a single decimal point
    const cleaned = raw.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    setUsdValue(cleaned);
    if (cleaned === '' || cleaned === '.') {
      setSatsValue('');
      return;
    }
    const num = parseFloat(cleaned);
    if (!isNaN(num)) {
      setSatsValue(formatSats(usdToSats(num)));
    }
  };

  const handleSatsChange = (raw: string) => {
    // Allow only digits (sats are whole numbers, but allow typing freely)
    const cleaned = raw.replace(/[^0-9]/g, '');
    setSatsValue(cleaned === '' ? '' : formatSats(parseInt(cleaned, 10)));
    if (cleaned === '') {
      setUsdValue('');
      return;
    }
    const num = parseInt(cleaned, 10);
    if (!isNaN(num)) {
      setUsdValue(formatUsd(satsToUsd(num)));
    }
  };

  const handleSwap = () => {
    setDirection((d) => (d === 'usd-to-sats' ? 'sats-to-usd' : 'usd-to-sats'));
  };

  const lm = isLightMode;

  return (
    <>
      <style jsx>{`
        .converter-wrapper {
          width: 100%;
        }

        .one-sat-label {
          font-family: 'Space Mono', monospace;
          font-size: 13px;
          color: ${lm ? '#6a6a6a' : '#8a8a8a'};
          text-align: center;
          margin-bottom: 1.5rem;
          letter-spacing: 0.05em;
        }

        .one-sat-label span {
          color: #F7931A;
        }

        .inputs-container {
          display: flex;
          flex-direction: ${direction === 'usd-to-sats' ? 'column' : 'column-reverse'};
          align-items: center;
          gap: 0.5rem;
        }

        .input-group {
          width: 100%;
        }

        .input-label {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: #8a8a8a;
          margin-bottom: 0.4rem;
          display: block;
        }

        .input-container {
          position: relative;
          width: 100%;
        }

        .input-container input {
          width: 100%;
          background: ${lm ? '#f5f3f0' : '#0a0a0a'};
          border: 1px solid ${lm ? '#d0ccc4' : '#3a3a3a'};
          color: ${lm ? '#0a0a0a' : '#e8e4dc'};
          padding: 1rem;
          padding-right: 4.5rem;
          font-size: 18px;
          font-family: 'Space Mono', monospace;
          border-radius: 6px;
          outline: none;
          transition: border-color 0.2s ease;
          box-sizing: border-box;
        }

        .input-container input:focus {
          border-color: #F7931A;
        }

        .input-container input::placeholder {
          color: ${lm ? '#b0aca4' : '#4a4a4a'};
        }

        .currency-tag {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          font-family: 'Space Mono', monospace;
          font-size: 13px;
          color: ${lm ? '#999' : '#666'};
          letter-spacing: 0.1em;
          pointer-events: none;
          user-select: none;
        }

        .swap-button {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 1px solid ${lm ? '#d0ccc4' : '#3a3a3a'};
          background: ${lm ? '#eae7e1' : '#141414'};
          color: #F7931A;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s ease, border-color 0.2s ease;
          flex-shrink: 0;
          margin: 0.25rem 0;
        }

        .swap-button:hover {
          transform: rotate(180deg);
          border-color: #F7931A;
        }

        .swap-button svg {
          width: 18px;
          height: 18px;
        }

        .quick-ref-section {
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid ${lm ? '#e0dcd4' : '#1e1e1e'};
        }

        .quick-ref-title {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: #8a8a8a;
          margin-bottom: 1rem;
        }

        .quick-ref-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem 1.5rem;
        }

        @media (max-width: 480px) {
          .quick-ref-grid {
            grid-template-columns: 1fr;
          }
        }

        .quick-ref-item {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }

        .quick-ref-amount {
          font-family: 'Space Mono', monospace;
          font-size: 12px;
          color: ${lm ? '#6a6a6a' : '#8a8a8a'};
        }

        .quick-ref-sats {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.3rem;
          color: #F7931A;
        }
      `}</style>

      <div className="converter-wrapper">
        <div className="one-sat-label">
          1 sat = <span>${oneSatUsd.toFixed(8)}</span>
        </div>

        <div className="inputs-container">
          <div className="input-group">
            <label className="input-label">
              {direction === 'usd-to-sats' ? 'You have' : 'You get'}
            </label>
            <div className="input-container">
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={usdValue}
                onChange={(e) => handleUsdChange(e.target.value)}
              />
              <span className="currency-tag">USD</span>
            </div>
          </div>

          <button
            className="swap-button"
            onClick={handleSwap}
            aria-label="Swap conversion direction"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <polyline points="19 12 12 19 5 12" />
              <line x1="12" y1="5" x2="12" y2="19" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
          </button>

          <div className="input-group">
            <label className="input-label">
              {direction === 'usd-to-sats' ? 'You get' : 'You have'}
            </label>
            <div className="input-container">
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={satsValue}
                onChange={(e) => handleSatsChange(e.target.value)}
              />
              <span className="currency-tag">SATS</span>
            </div>
          </div>
        </div>

        <div className="quick-ref-section">
          <div className="quick-ref-title">Quick Reference</div>
          <div className="quick-ref-grid">
            {QUICK_REFS.map((item) => (
              <div key={item.usd} className="quick-ref-item">
                <span className="quick-ref-amount">
                  {item.label} (${item.usd.toLocaleString('en-US')})
                </span>
                <span className="quick-ref-sats">
                  {formatSats(usdToSats(item.usd))} sats
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
