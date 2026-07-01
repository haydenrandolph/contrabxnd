'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Shared chrome for the auth modals. Previously SignInModal and SignUpModal
 * each carried an identical ~150-line `<style jsx global>` block; this renders
 * it exactly once (mounted via AuthModals) and both modals reuse the classes.
 *
 * Styling follows the Contrabxnd design system: 2px radius, flat opaque
 * surfaces (no glass/blur), 1px borders, orange reserved for the primary CTA.
 */
export function AuthModalStyles() {
  return (
    <style jsx global>{`
      .auth-modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.85);
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
        border-radius: var(--cb-radius);
        max-width: 400px;
        width: 100%;
      }

      .auth-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem;
        border-bottom: 1px solid #1a1a1a;
      }

      .auth-modal-title {
        font-family: 'Inter', serif;
        font-size: 1.5rem;
        color: #e8e4dc;
      }

      .auth-modal-close {
        width: 32px;
        height: 32px;
        background: transparent;
        border: 1px solid #3a3a3a;
        border-radius: var(--cb-radius);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }

      .auth-modal-close:hover {
        border-color: #F7931A;
      }

      .auth-modal-close svg {
        width: 16px;
        height: 16px;
        stroke: #8a8a8a;
      }

      .auth-modal-close:hover svg {
        stroke: #F7931A;
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
        border-radius: var(--cb-radius);
        color: #e8e4dc;
        font-family: 'JetBrains Mono', monospace;
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
        border-radius: var(--cb-radius);
        padding: 0.75rem;
        margin-bottom: 1rem;
        color: #ef4444;
        font-size: 12px;
      }

      .auth-notice {
        background: rgba(247, 147, 26, 0.08);
        border: 1px solid rgba(247, 147, 26, 0.25);
        border-radius: var(--cb-radius);
        padding: 0.75rem;
        margin-bottom: 1rem;
        color: #F7931A;
        font-size: 12px;
      }

      .auth-submit {
        width: 100%;
        padding: 0.875rem 1.5rem;
        background: #F7931A;
        border: none;
        border-radius: var(--cb-radius);
        color: #fff;
        font-family: 'JetBrains Mono', monospace;
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

      .auth-divider {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin: 1.25rem 0;
        color: #3a3a3a;
        font-size: 10px;
        letter-spacing: 0.15em;
        text-transform: uppercase;
      }

      .auth-divider::before,
      .auth-divider::after {
        content: '';
        flex: 1;
        height: 1px;
        background: #1a1a1a;
      }

      .auth-oauth {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .auth-oauth-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.625rem;
        width: 100%;
        padding: 0.75rem 1rem;
        background: transparent;
        border: 1px solid #2a2a2a;
        border-radius: var(--cb-radius);
        color: #e8e4dc;
        font-family: 'JetBrains Mono', monospace;
        font-size: 12px;
        letter-spacing: 0.05em;
        cursor: pointer;
        transition: border-color 0.2s ease;
      }

      .auth-oauth-btn:hover:not(:disabled) {
        border-color: #5a5a5a;
      }

      .auth-oauth-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .auth-oauth-btn svg {
        width: 16px;
        height: 16px;
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

      .auth-hint {
        font-size: 11px;
        color: #3a3a3a;
        margin-top: 0.25rem;
      }

      .auth-text-link {
        display: inline-block;
        margin-top: 0.625rem;
        background: none;
        border: none;
        padding: 0;
        font-family: 'JetBrains Mono', monospace;
        font-size: 12px;
        color: #5a5a5a;
        cursor: pointer;
        transition: color 0.2s ease;
      }

      .auth-text-link:hover:not(:disabled) {
        color: #F7931A;
      }

      .auth-text-link:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .auth-success {
        text-align: center;
        padding: 2rem 0;
      }

      .auth-success-icon {
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

      .auth-success-icon svg {
        width: 32px;
        height: 32px;
        stroke: #22c55e;
      }

      .auth-success-title {
        font-family: 'Inter', serif;
        font-size: 1.5rem;
        color: #e8e4dc;
        margin-bottom: 0.75rem;
      }

      .auth-success-text {
        color: #8a8a8a;
        font-size: 14px;
        line-height: 1.6;
      }
    `}</style>
  );
}

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
  </svg>
);

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="#e8e4dc">
    <path d="M17.05 12.54c-.03-2.6 2.12-3.85 2.22-3.91-1.21-1.77-3.1-2.01-3.77-2.04-1.6-.16-3.13.94-3.94.94-.81 0-2.07-.92-3.4-.9-1.75.03-3.36 1.02-4.26 2.58-1.81 3.15-.46 7.8 1.3 10.35.86 1.25 1.89 2.65 3.23 2.6 1.3-.05 1.79-.84 3.36-.84 1.57 0 2.01.84 3.39.81 1.4-.02 2.28-1.27 3.13-2.53.99-1.45 1.4-2.85 1.42-2.92-.03-.01-2.72-1.04-2.75-4.14M14.5 4.9c.71-.86 1.19-2.06 1.06-3.25-1.02.04-2.26.68-3 1.54-.66.76-1.24 1.98-1.08 3.14 1.14.09 2.3-.58 3.02-1.43"/>
  </svg>
);

const PROVIDERS = [
  { id: 'google' as const, label: 'Continue with Google', Icon: GoogleIcon },
  { id: 'apple' as const, label: 'Continue with Apple', Icon: AppleIcon },
];

/**
 * Google + Apple sign-in buttons. Redirects through /api/auth/callback, which
 * already handles the PKCE code exchange. (X/Twitter can be added to PROVIDERS
 * once its provider is configured in Supabase.)
 */
export function OAuthButtons({ onError }: { onError: (message: string) => void }) {
  const { signInWithOAuth } = useAuth();
  const [pending, setPending] = useState<string | null>(null);

  const handleClick = async (provider: 'google' | 'apple') => {
    onError('');
    setPending(provider);
    const { error } = await signInWithOAuth(provider);
    if (error) {
      onError(error.message);
      setPending(null);
    }
    // On success the browser navigates away to the provider; no need to reset.
  };

  return (
    <div className="auth-oauth">
      {PROVIDERS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          className="auth-oauth-btn"
          onClick={() => handleClick(id)}
          disabled={pending !== null}
        >
          <Icon />
          {pending === id ? 'Redirecting…' : label}
        </button>
      ))}
    </div>
  );
}
