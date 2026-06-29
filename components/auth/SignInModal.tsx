'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { OAuthButtons } from './AuthModalShared';

type Mode = 'signin' | 'forgot';

export default function SignInModal() {
  const { signIn, resetPassword, resendConfirmation, setShowAuthModal, showAuthModal } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const closeModal = useCallback(() => setShowAuthModal(null), [setShowAuthModal]);

  // State is fresh on every open: AuthModals only mounts this while open.
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
    setNotice(null);
    setNeedsConfirm(false);
    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      // Supabase returns "Email not confirmed" before the user verifies. Turn
      // that into a clear message + a way to get the email resent, rather than
      // the raw string.
      if (/not confirmed/i.test(error.message)) {
        setError('Your email isn’t confirmed yet. Check your inbox for the confirmation link.');
        setNeedsConfirm(true);
      } else {
        setError(error.message);
      }
      setIsLoading(false);
    }
    // On success, onAuthStateChange closes the modal.
  };

  const handleResend = async () => {
    setIsLoading(true);
    setError(null);
    const { error } = await resendConfirmation(email);
    setNotice(error ? null : 'Confirmation email sent. Check your inbox.');
    if (error) setError(error.message);
    setNeedsConfirm(false);
    setIsLoading(false);
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setIsLoading(true);
    const { error } = await resetPassword(email);
    if (error) {
      setError(error.message);
    } else {
      setNotice('If an account exists for that email, a password reset link is on its way.');
    }
    setIsLoading(false);
  };

  return (
    <div className="auth-modal-overlay" onClick={closeModal}>
      <div
        className="auth-modal"
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="signin-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="auth-modal-header">
          <h2 className="auth-modal-title" id="signin-title">
            {mode === 'forgot' ? 'Reset Password' : 'Sign In'}
          </h2>
          <button className="auth-modal-close" onClick={closeModal} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="auth-modal-body">
          {error && <div className="auth-error" role="alert">{error}</div>}
          {notice && <div className="auth-notice" role="status">{notice}</div>}

          {needsConfirm && (
            <button type="button" className="auth-text-link" onClick={handleResend} disabled={isLoading}>
              Resend confirmation email
            </button>
          )}

          {mode === 'forgot' ? (
            <form onSubmit={handleForgot}>
              <div className="auth-form-group">
                <label className="auth-label" htmlFor="forgot-email">Email</label>
                <input
                  id="forgot-email"
                  type="email"
                  className="auth-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="auth-submit" disabled={isLoading}>
                {isLoading ? 'Sending…' : 'Send Reset Link'}
              </button>
              <button
                type="button"
                className="auth-text-link"
                onClick={() => { setMode('signin'); setError(null); setNotice(null); }}
              >
                Back to sign in
              </button>
            </form>
          ) : (
            <>
              <form onSubmit={handleSubmit}>
                <div className="auth-form-group">
                  <label className="auth-label" htmlFor="signin-email">Email</label>
                  <input
                    id="signin-email"
                    type="email"
                    className="auth-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="auth-form-group">
                  <label className="auth-label" htmlFor="signin-password">Password</label>
                  <input
                    id="signin-password"
                    type="password"
                    className="auth-input"
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="auth-text-link"
                    onClick={() => { setMode('forgot'); setError(null); setNotice(null); }}
                  >
                    Forgot password?
                  </button>
                </div>

                <button type="submit" className="auth-submit" disabled={isLoading}>
                  {isLoading ? 'Signing in…' : 'Sign In'}
                </button>
              </form>

              <div className="auth-divider">or</div>
              <OAuthButtons onError={(m) => setError(m || null)} />

              <div className="auth-switch">
                Don&apos;t have an account?{' '}
                <span className="auth-switch-link" onClick={() => setShowAuthModal('signup')}>
                  Sign up
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
