'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { OAuthButtons } from './AuthModalShared';

const MIN_PASSWORD_LENGTH = 8;

export default function SignUpModal() {
  const { signUp, setShowAuthModal, showAuthModal } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const closeModal = useCallback(() => setShowAuthModal(null), [setShowAuthModal]);

  // State is fresh on every open: AuthModals only mounts this while open.
  useEffect(() => {
    if (showAuthModal !== 'signup') return;
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

  if (showAuthModal !== 'signup') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      setIsLoading(false);
      return;
    }

    const { error } = await signUp(email, password, displayName);

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      setSuccess(true);
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-modal-overlay" onClick={closeModal}>
        <div
          className="auth-modal"
          ref={contentRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="signup-success-title"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="auth-modal-header">
            <h2 className="auth-modal-title" id="signup-success-title">Check Your Email</h2>
            <button className="auth-modal-close" onClick={closeModal} aria-label="Close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div className="auth-modal-body">
            <div className="auth-success">
              <div className="auth-success-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h3 className="auth-success-title">Almost There!</h3>
              <p className="auth-success-text">
                We&apos;ve sent a confirmation link to <strong>{email}</strong>.
                Click the link to activate your account.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-modal-overlay" onClick={closeModal}>
      <div
        className="auth-modal"
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="signup-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="auth-modal-header">
          <h2 className="auth-modal-title" id="signup-title">Create Account</h2>
          <button className="auth-modal-close" onClick={closeModal} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="auth-modal-body">
          {error && <div className="auth-error" role="alert">{error}</div>}

          <div className="auth-oauth">
            <OAuthButtons onError={(m) => setError(m || null)} />
          </div>
          <div className="auth-divider">or sign up with email</div>

          <form onSubmit={handleSubmit}>
            <div className="auth-form-group">
              <label className="auth-label" htmlFor="signup-name">Display Name (optional)</label>
              <input
                id="signup-name"
                type="text"
                className="auth-input"
                placeholder="Satoshi"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div className="auth-form-group">
              <label className="auth-label" htmlFor="signup-email">Email</label>
              <input
                id="signup-email"
                type="email"
                className="auth-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="auth-form-group">
              <label className="auth-label" htmlFor="signup-password">Password</label>
              <input
                id="signup-password"
                type="password"
                className="auth-input"
                placeholder={`Min ${MIN_PASSWORD_LENGTH} characters`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={MIN_PASSWORD_LENGTH}
              />
              <p className="auth-hint">Minimum {MIN_PASSWORD_LENGTH} characters</p>
            </div>

            <button type="submit" className="auth-submit" disabled={isLoading}>
              {isLoading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <div className="auth-switch">
            Already have an account?{' '}
            <span className="auth-switch-link" onClick={() => setShowAuthModal('signin')}>
              Sign in
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
