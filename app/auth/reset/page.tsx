'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';

const MIN_PASSWORD_LENGTH = 8;

export default function ResetPasswordPage() {
  const { user, isLoading, isConfigured, updatePassword } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Bounce to home shortly after a successful reset.
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => router.push('/'), 2500);
    return () => clearTimeout(t);
  }, [done, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    const { error } = await updatePassword(password);
    if (error) {
      setError(error.message);
      setSubmitting(false);
    } else {
      setDone(true);
    }
  };

  // The recovery link establishes a session via /api/auth/callback before
  // landing here. No session => the link was invalid, expired, or already used.
  const noSession = isConfigured && !isLoading && !user;

  return (
    <>
      <SiteNav />
      <main className="reset-main">
        <div className="reset-card">
          <h1 className="reset-title">Set a New Password</h1>

          {done ? (
            <p className="reset-text reset-ok">
              Password updated. Redirecting you home…
            </p>
          ) : noSession ? (
            <p className="reset-text">
              This reset link is invalid or has expired. Please{' '}
              <Link href="/" className="reset-link">return home</Link> and request
              a new one from the sign-in screen.
            </p>
          ) : isLoading ? (
            <p className="reset-text">Verifying your reset link…</p>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && <div className="reset-error" role="alert">{error}</div>}

              <div className="reset-group">
                <label className="reset-label" htmlFor="reset-password">New Password</label>
                <input
                  id="reset-password"
                  type="password"
                  className="reset-input"
                  placeholder={`Min ${MIN_PASSWORD_LENGTH} characters`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                />
              </div>

              <div className="reset-group">
                <label className="reset-label" htmlFor="reset-confirm">Confirm Password</label>
                <input
                  id="reset-confirm"
                  type="password"
                  className="reset-input"
                  placeholder="Re-enter password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                />
              </div>

              <button type="submit" className="reset-submit" disabled={submitting}>
                {submitting ? 'Updating…' : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </main>
      <SiteFooter />

      <style jsx>{`
        .reset-main {
          min-height: 60vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
        }
        .reset-card {
          width: 100%;
          max-width: 400px;
          background: #0d0d0d;
          border: 1px solid #2a2a2a;
          border-radius: 2px;
          padding: 2rem;
        }
        .reset-title {
          font-family: 'Inter', serif;
          font-size: 1.75rem;
          color: #e8e4dc;
          margin-bottom: 1.5rem;
        }
        .reset-text {
          color: #8a8a8a;
          font-size: 14px;
          line-height: 1.6;
        }
        .reset-ok {
          color: #22c55e;
        }
        .reset-link {
          color: #F7931A;
          text-decoration: none;
        }
        .reset-group {
          margin-bottom: 1.25rem;
        }
        .reset-label {
          display: block;
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #5a5a5a;
          margin-bottom: 0.5rem;
        }
        .reset-input {
          width: 100%;
          padding: 0.75rem 1rem;
          background: #141414;
          border: 1px solid #2a2a2a;
          border-radius: 2px;
          color: #e8e4dc;
          font-family: 'JetBrains Mono', monospace;
          font-size: 14px;
          transition: border-color 0.2s ease;
        }
        .reset-input:focus {
          outline: none;
          border-color: #F7931A;
        }
        .reset-error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 2px;
          padding: 0.75rem;
          margin-bottom: 1rem;
          color: #ef4444;
          font-size: 12px;
        }
        .reset-submit {
          width: 100%;
          padding: 0.875rem 1.5rem;
          background: #F7931A;
          border: none;
          border-radius: 2px;
          color: #fff;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .reset-submit:hover:not(:disabled) {
          background: #e8850f;
        }
        .reset-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </>
  );
}
