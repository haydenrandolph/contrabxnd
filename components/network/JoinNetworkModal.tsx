'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { BUSINESS_CATEGORIES } from '@/lib/network/types';

interface JoinNetworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function JoinNetworkModal({
  isOpen,
  onClose,
  onSuccess,
}: JoinNetworkModalProps) {
  const { user, setShowAuthModal } = useAuth();
  const [businessName, setBusinessName] = useState('');
  const [website, setWebsite] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const stableClose = useCallback(() => handleClose(), []);  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { stableClose(); return; }
      if (e.key === 'Tab' && contentRef.current) {
        const focusable = contentRef.current.querySelectorAll<HTMLElement>(
          'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    contentRef.current?.querySelector<HTMLElement>('button, input')?.focus();
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, stableClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) {
      setShowAuthModal('signin');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/network/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          website,
          category,
          description,
          contactEmail,
          paymentMethod,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit application');
      }

      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setBusinessName('');
    setWebsite('');
    setCategory('');
    setDescription('');
    setContactEmail('');
    setPaymentMethod('');
    setError('');
    setSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <>
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 3000;
          padding: 2rem;
          animation: modalFadeIn 0.2s ease;
        }

        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-content {
          background: #0d0d0d;
          border: 1px solid #2a2a2a;
          border-radius: 8px;
          max-width: 500px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          animation: modalSlideIn 0.2s ease;
        }

        @keyframes modalSlideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .modal-header {
          padding: 1.5rem;
          border-bottom: 1px solid #1a1a1a;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.5rem;
          color: #e8e4dc;
        }

        .modal-close {
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

        .modal-close:hover {
          background: #F7931A;
          border-color: #F7931A;
        }

        .modal-close svg {
          width: 16px;
          height: 16px;
          stroke: #8a8a8a;
        }

        .modal-close:hover svg {
          stroke: #fff;
        }

        .modal-body {
          padding: 1.5rem;
        }

        .form-group {
          margin-bottom: 1.25rem;
        }

        .form-label {
          display: block;
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #5a5a5a;
          margin-bottom: 0.5rem;
        }

        .form-input,
        .form-select,
        .form-textarea {
          width: 100%;
          padding: 0.75rem 1rem;
          background: #141414;
          border: 1px solid #2a2a2a;
          border-radius: 4px;
          color: #e8e4dc;
          font-family: 'Space Mono', monospace;
          font-size: 14px;
          transition: border-color 0.2s ease;
        }

        .form-input:focus,
        .form-select:focus,
        .form-textarea:focus {
          outline: none;
          border-color: #F7931A;
        }

        .form-input::placeholder,
        .form-textarea::placeholder {
          color: #3a3a3a;
        }

        .form-select {
          cursor: pointer;
        }

        .form-textarea {
          min-height: 80px;
          resize: vertical;
        }

        .form-hint {
          font-size: 11px;
          color: #3a3a3a;
          margin-top: 0.25rem;
        }

        .form-error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 4px;
          padding: 0.75rem;
          margin-bottom: 1rem;
          color: #ef4444;
          font-size: 12px;
        }

        .form-submit {
          width: 100%;
          padding: 0.875rem 1.5rem;
          background: #F7931A;
          border: none;
          border-radius: 4px;
          color: #fff;
          font-family: 'Space Mono', monospace;
          font-size: 12px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .form-submit:hover:not(:disabled) {
          background: #e8850f;
        }

        .form-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .success-state {
          text-align: center;
          padding: 2rem 0;
        }

        .success-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 1.5rem;
          background: rgba(34, 197, 94, 0.1);
          border: 2px solid #22c55e;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .success-icon svg {
          width: 32px;
          height: 32px;
          stroke: #22c55e;
        }

        .success-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.5rem;
          color: #e8e4dc;
          margin-bottom: 0.75rem;
        }

        .success-text {
          color: #8a8a8a;
          font-size: 14px;
          line-height: 1.6;
        }

        .signin-prompt {
          text-align: center;
          padding: 2rem;
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

        .payment-options {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
        }

        .payment-option {
          padding: 0.75rem;
          background: #141414;
          border: 1px solid #2a2a2a;
          border-radius: 4px;
          color: #8a8a8a;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
        }

        .payment-option:hover {
          border-color: #3a3a3a;
        }

        .payment-option.active {
          border-color: #F7931A;
          color: #F7931A;
          background: rgba(247, 147, 26, 0.1);
        }

        /* Light-mode overrides (theme class lives on <html>) */
        :global(.light-mode) .modal-content {
          background: #ffffff;
          border-color: #c0c0c1;
        }
        :global(.light-mode) .modal-header {
          border-bottom-color: #e5e5e6;
        }
        :global(.light-mode) .modal-title {
          color: #0a0a0a;
        }
        :global(.light-mode) .modal-close {
          border-color: #c0c0c1;
        }
        :global(.light-mode) .modal-close svg {
          stroke: #5a5a5a;
        }
        :global(.light-mode) .form-label {
          color: #6a6a6a;
        }
        :global(.light-mode) .form-input,
        :global(.light-mode) .form-select,
        :global(.light-mode) .form-textarea {
          background: #f7f7f8;
          border-color: #d0d0d1;
          color: #0a0a0a;
        }
        :global(.light-mode) .form-input::placeholder,
        :global(.light-mode) .form-textarea::placeholder {
          color: #a0a0a0;
        }
        :global(.light-mode) .form-hint {
          color: #8a8a8a;
        }
        :global(.light-mode) .success-title {
          color: #0a0a0a;
        }
        :global(.light-mode) .success-text {
          color: #6a6a6a;
        }
        :global(.light-mode) .signin-prompt {
          color: #6a6a6a;
        }
        :global(.light-mode) .payment-option {
          background: #f7f7f8;
          border-color: #d0d0d1;
          color: #6a6a6a;
        }
        :global(.light-mode) .payment-option.active {
          border-color: #F7931A;
          color: #b5673a;
          background: rgba(247, 147, 26, 0.1);
        }
      `}</style>

      <div className="modal-overlay" onClick={handleClose}>
        <div className="modal-content" ref={contentRef} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">Join the Network</h2>
            <button className="modal-close" onClick={handleClose}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div className="modal-body">
            {success ? (
              <div className="success-state">
                <div className="success-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <h3 className="success-title">Application Received!</h3>
                <p className="success-text">
                  Thank you for applying to join the Contrabxnd Network.
                  We&apos;ll review your application and get back to you soon.
                </p>
              </div>
            ) : !user ? (
              <div className="signin-prompt">
                <p>Please <button onClick={() => setShowAuthModal('signin')}>sign in</button> to submit an application.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {error && <div className="form-error">{error}</div>}

                <div className="form-group">
                  <label className="form-label">Business Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Your business name"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Website URL *</label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://example.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select
                    className="form-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                  >
                    <option value="">Select a category</option>
                    {BUSINESS_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Brief description of your business (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={200}
                  />
                  <p className="form-hint">{description.length}/200 characters</p>
                </div>

                <div className="form-group">
                  <label className="form-label">Contact Email *</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="contact@yourbusiness.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">How do you accept Bitcoin? *</label>
                  <div className="payment-options">
                    {[
                      { value: 'lightning', label: 'Lightning' },
                      { value: 'onchain', label: 'On-chain' },
                      { value: 'both', label: 'Both' },
                      { value: 'processor', label: 'Processor' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`payment-option ${paymentMethod === option.value ? 'active' : ''}`}
                        onClick={() => setPaymentMethod(option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="form-submit"
                  disabled={isLoading || !paymentMethod}
                >
                  {isLoading ? 'Submitting...' : 'Submit Application'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
