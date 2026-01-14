'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface PriceAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPrice: number;
  onAlertCreated?: () => void;
}

export default function PriceAlertModal({
  isOpen,
  onClose,
  currentPrice,
  onAlertCreated,
}: PriceAlertModalProps) {
  const { user, setShowAuthModal } = useAuth();
  const [targetPrice, setTargetPrice] = useState('');
  const [direction, setDirection] = useState<'above' | 'below'>('above');
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyPush, setNotifyPush] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) {
      setShowAuthModal('signin');
      return;
    }

    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) {
      setError('Please enter a valid price');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetPrice: price,
          direction,
          notifyEmail,
          notifyPush,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create alert');
      }

      setSuccess(true);
      onAlertCreated?.();
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setTargetPrice('');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const formattedCurrentPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(currentPrice);

  return (
    <>
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .modal-content {
          background: #0d0d0d;
          border: 1px solid #2a2a2a;
          max-width: 400px;
          width: 100%;
          position: relative;
          animation: modalFadeIn 0.2s ease;
        }

        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modal-header {
          padding: 1.5rem;
          border-bottom: 1px solid #1a1a1a;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-title {
          font-family: 'Space Mono', monospace;
          font-size: 12px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #F7931A;
        }

        .modal-close {
          background: none;
          border: none;
          color: #5a5a5a;
          cursor: pointer;
          padding: 0.25rem;
          transition: color 0.2s ease;
        }

        .modal-close:hover {
          color: #e8e4dc;
        }

        .modal-close svg {
          width: 20px;
          height: 20px;
        }

        .modal-body {
          padding: 1.5rem;
        }

        .current-price {
          text-align: center;
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: #141414;
          border-radius: 4px;
        }

        .current-price-label {
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #8a8a8a;
          margin-bottom: 0.5rem;
        }

        .current-price-value {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2rem;
          color: #e8e4dc;
        }

        .form-group {
          margin-bottom: 1.25rem;
        }

        .form-label {
          display: block;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #8a8a8a;
          margin-bottom: 0.5rem;
        }

        .form-input {
          width: 100%;
          padding: 0.75rem 1rem;
          background: #141414;
          border: 1px solid #2a2a2a;
          color: #e8e4dc;
          font-family: 'Space Mono', monospace;
          font-size: 16px;
          transition: border-color 0.2s ease;
        }

        .form-input:focus {
          outline: none;
          border-color: #F7931A;
        }

        .form-input::placeholder {
          color: #5a5a5a;
        }

        .direction-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .direction-btn {
          flex: 1;
          padding: 0.75rem;
          background: #141414;
          border: 1px solid #2a2a2a;
          color: #8a8a8a;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .direction-btn:hover {
          border-color: #3a3a3a;
        }

        .direction-btn.active {
          border-color: #F7931A;
          color: #F7931A;
          background: rgba(247, 147, 26, 0.1);
        }

        .notification-options {
          display: flex;
          gap: 1rem;
        }

        .notification-option {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        .notification-checkbox {
          width: 18px;
          height: 18px;
          accent-color: #F7931A;
        }

        .notification-label {
          font-size: 12px;
          color: #e8e4dc;
        }

        .form-error {
          color: #ef4444;
          font-size: 12px;
          margin-bottom: 1rem;
        }

        .form-success {
          text-align: center;
          padding: 2rem;
        }

        .form-success svg {
          width: 48px;
          height: 48px;
          stroke: #22c55e;
          margin-bottom: 1rem;
        }

        .form-success p {
          color: #e8e4dc;
          font-size: 14px;
        }

        .submit-btn {
          width: 100%;
          padding: 1rem;
          background: #F7931A;
          border: none;
          color: #fff;
          font-family: 'Space Mono', monospace;
          font-size: 12px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .submit-btn:hover:not(:disabled) {
          background: #e8850f;
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .signin-prompt {
          text-align: center;
          padding: 1rem;
          color: #8a8a8a;
          font-size: 13px;
        }

        .signin-prompt button {
          background: none;
          border: none;
          color: #F7931A;
          cursor: pointer;
          text-decoration: underline;
        }
      `}</style>

      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <span className="modal-title">Set Price Alert</span>
            <button className="modal-close" onClick={onClose}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div className="modal-body">
            {success ? (
              <div className="form-success">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <p>Alert created successfully!</p>
              </div>
            ) : !user ? (
              <div className="signin-prompt">
                <p>Please <button onClick={() => setShowAuthModal('signin')}>sign in</button> to create price alerts.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="current-price">
                  <p className="current-price-label">Current BTC Price</p>
                  <p className="current-price-value">{formattedCurrentPrice}</p>
                </div>

                {error && <p className="form-error">{error}</p>}

                <div className="form-group">
                  <label className="form-label">Alert me when price goes</label>
                  <div className="direction-buttons">
                    <button
                      type="button"
                      className={`direction-btn ${direction === 'above' ? 'active' : ''}`}
                      onClick={() => setDirection('above')}
                    >
                      Above
                    </button>
                    <button
                      type="button"
                      className={`direction-btn ${direction === 'below' ? 'active' : ''}`}
                      onClick={() => setDirection('below')}
                    >
                      Below
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Target Price (USD)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 100000"
                    value={targetPrice}
                    onChange={e => setTargetPrice(e.target.value)}
                    min="1"
                    step="any"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Notify me via</label>
                  <div className="notification-options">
                    <label className="notification-option">
                      <input
                        type="checkbox"
                        className="notification-checkbox"
                        checked={notifyEmail}
                        onChange={e => setNotifyEmail(e.target.checked)}
                      />
                      <span className="notification-label">Email</span>
                    </label>
                    <label className="notification-option">
                      <input
                        type="checkbox"
                        className="notification-checkbox"
                        checked={notifyPush}
                        onChange={e => setNotifyPush(e.target.checked)}
                      />
                      <span className="notification-label">Push</span>
                    </label>
                  </div>
                </div>

                <button type="submit" className="submit-btn" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Alert'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
