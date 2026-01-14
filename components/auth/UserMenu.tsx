'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function UserMenu() {
  const { user, profile, signOut, setShowAuthModal, isLoading, isConfigured } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Hide if still loading or auth not configured
  if (isLoading || !isConfigured) {
    return null;
  }

  // Not logged in - show sign in/up buttons
  if (!user) {
    return (
      <>
        <style jsx>{`
          .auth-buttons {
            display: flex;
            gap: 1rem;
            align-items: center;
          }

          .auth-btn {
            font-family: 'Space Mono', monospace;
            font-size: 11px;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            text-decoration: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .auth-btn-ghost {
            background: transparent;
            border: none;
            color: #8a8a8a;
          }

          .auth-btn-ghost:hover {
            color: #F7931A;
          }

          .auth-btn-primary {
            background: #F7931A;
            border: none;
            color: #fff;
          }

          .auth-btn-primary:hover {
            background: #e8850f;
          }

          @media (max-width: 768px) {
            .auth-buttons {
              display: none;
            }
          }
        `}</style>
        <div className="auth-buttons">
          <button className="auth-btn auth-btn-ghost" onClick={() => setShowAuthModal('signin')}>
            Sign In
          </button>
          <button className="auth-btn auth-btn-primary" onClick={() => setShowAuthModal('signup')}>
            Sign Up
          </button>
        </div>
      </>
    );
  }

  // Logged in - show user menu
  const displayName = profile?.display_name || user.email?.split('@')[0] || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <>
      <style jsx>{`
        .user-menu-container {
          position: relative;
        }

        .user-menu-trigger {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: transparent;
          border: 1px solid #2a2a2a;
          border-radius: 4px;
          padding: 0.375rem 0.75rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .user-menu-trigger:hover {
          border-color: #F7931A;
        }

        .user-avatar {
          width: 28px;
          height: 28px;
          background: linear-gradient(135deg, #F7931A 0%, #b5673a 100%);
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
          color: #fff;
          letter-spacing: 0.05em;
        }

        .user-name {
          font-size: 12px;
          color: #e8e4dc;
          max-width: 100px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .user-menu-chevron {
          width: 16px;
          height: 16px;
          stroke: #5a5a5a;
          transition: transform 0.2s ease;
        }

        .user-menu-trigger[data-open="true"] .user-menu-chevron {
          transform: rotate(180deg);
        }

        .user-menu-dropdown {
          position: absolute;
          top: calc(100% + 0.5rem);
          right: 0;
          background: #0d0d0d;
          border: 1px solid #2a2a2a;
          border-radius: 4px;
          min-width: 200px;
          z-index: 100;
          animation: dropdownFadeIn 0.15s ease;
        }

        @keyframes dropdownFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .user-menu-item {
          display: block;
          width: 100%;
          padding: 0.75rem 1rem;
          font-family: 'Space Mono', monospace;
          font-size: 12px;
          color: #8a8a8a;
          text-decoration: none;
          text-align: left;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .user-menu-item:hover {
          background: #141414;
          color: #e8e4dc;
        }

        .user-menu-item:first-child {
          border-radius: 4px 4px 0 0;
        }

        .user-menu-item:last-child {
          border-radius: 0 0 4px 4px;
        }

        .user-menu-divider {
          height: 1px;
          background: #1a1a1a;
          margin: 0.25rem 0;
        }

        .user-menu-item.danger:hover {
          color: #ef4444;
        }

        @media (max-width: 768px) {
          .user-name {
            display: none;
          }
        }
      `}</style>

      <div className="user-menu-container" ref={menuRef}>
        <button
          className="user-menu-trigger"
          onClick={() => setIsOpen(!isOpen)}
          data-open={isOpen}
        >
          <div className="user-avatar">{initials}</div>
          <span className="user-name">{displayName}</span>
          <svg className="user-menu-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        {isOpen && (
          <div className="user-menu-dropdown">
            <Link href="/account" className="user-menu-item" onClick={() => setIsOpen(false)}>
              My Account
            </Link>
            <Link href="/account#progress" className="user-menu-item" onClick={() => setIsOpen(false)}>
              Course Progress
            </Link>
            <Link href="/account#alerts" className="user-menu-item" onClick={() => setIsOpen(false)}>
              Price Alerts
            </Link>
            <div className="user-menu-divider" />
            <button
              className="user-menu-item danger"
              onClick={() => {
                signOut();
                setIsOpen(false);
              }}
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </>
  );
}
