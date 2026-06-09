'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function SignInModal() {
  const { signIn, setShowAuthModal, showAuthModal } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const closeModal = useCallback(() => setShowAuthModal(null), [setShowAuthModal]);

  useEffect(() => {
    if (showAuthModal !== 'signin') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { closeModal(); return; }
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
    contentRef.current?.querySelector<HTMLElement>('input')?.focus();
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showAuthModal, closeModal]);

  if (showAuthModal !== 'signin') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  return (
    <>
      <style jsx global>{`
        .auth-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(8px);
          z-index: 3000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          animation: authModalFadeIn 0.2s ease;
        }

        @keyframes authModalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .auth-modal {
          background: #0d0d0d;
          border: 1px solid #2a2a2a;
          border-radius: 8px;
          max-width: 400px;
          width: 100%;
          animation: authModalSlideIn 0.2s ease;
        }

        @keyframes authModalSlideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .auth-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #1a1a1a;
        }

        .auth-modal-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.5rem;
          color: #e8e4dc;
        }

        .auth-modal-close {
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

        .auth-modal-close:hover {
          background: #F7931A;
          border-color: #F7931A;
        }

        .auth-modal-close svg {
          width: 16px;
          height: 16px;
          stroke: #8a8a8a;
        }

        .auth-modal-close:hover svg {
          stroke: #fff;
        }

        .auth-modal-body {
          padding: 1.5rem;
        }

        .auth-form-group {
          margin-bottom: 1.25rem;
        }

        .auth-label {
          display: block;
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #5a5a5a;
          margin-bottom: 0.5rem;
        }

        .auth-input {
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

        .auth-input:focus {
          outline: none;
          border-color: #F7931A;
        }

        .auth-input::placeholder {
          color: #3a3a3a;
        }

        .auth-error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 4px;
          padding: 0.75rem;
          margin-bottom: 1rem;
          color: #ef4444;
          font-size: 12px;
        }

        .auth-submit {
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

        .auth-submit:hover:not(:disabled) {
          background: #e8850f;
        }

        .auth-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .auth-switch {
          text-align: center;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #1a1a1a;
          font-size: 13px;
          color: #5a5a5a;
        }

        .auth-switch-link {
          color: #F7931A;
          cursor: pointer;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .auth-switch-link:hover {
          color: #e8850f;
        }
      `}</style>

      <div className="auth-modal-overlay" onClick={closeModal}>
        <div className="auth-modal" ref={contentRef} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
          <div className="auth-modal-header">
            <h2 className="auth-modal-title">Sign In</h2>
            <button className="auth-modal-close" onClick={() => setShowAuthModal(null)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div className="auth-modal-body">
            <form onSubmit={handleSubmit}>
              {error && <div className="auth-error">{error}</div>}

              <div className="auth-form-group">
                <label className="auth-label">Email</label>
                <input
                  type="email"
                  className="auth-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="auth-form-group">
                <label className="auth-label">Password</label>
                <input
                  type="password"
                  className="auth-input"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="auth-submit" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="auth-switch">
              Don&apos;t have an account?{' '}
              <span className="auth-switch-link" onClick={() => setShowAuthModal('signup')}>
                Sign up
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
