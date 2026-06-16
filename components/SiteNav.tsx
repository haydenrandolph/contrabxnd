'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import { UserMenu } from '@/components/auth';
import StreakBadge from '@/components/StreakBadge';

interface SiteNavProps {
  activePath?: string;
  blendMode?: boolean;
  showUserMenu?: boolean;
  backLink?: { href: string; label: string };
  liveIndicator?: { connected: boolean };
}

type NavLink = { href: string; label: string; comingSoon?: false } | { label: string; comingSoon: true; href?: undefined };

const NAV_LINKS: NavLink[] = [
  { href: '/toolkit', label: 'Toolkit' },
  { href: '/learn', label: 'Stu₿y' },
  { href: '/writings', label: 'Writings' },
  { href: '/network', label: 'Network' },
  { label: 'Podcasts', comingSoon: true },
  { label: 'Videos', comingSoon: true },
  { label: 'Merch', comingSoon: true },
  { href: '/about', label: 'About' },
];

export default function SiteNav({
  activePath,
  blendMode = false,
  showUserMenu = true,
  backLink,
  liveIndicator,
}: SiteNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isLightMode } = useTheme();
  const light = isLightMode ? ' light' : '';

  return (
    <>
      <style jsx global>{`
        .site-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 48px;
          padding: 0 48px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 100;
          background: #0a0a0a;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          line-height: 1;
        }
        .site-nav.light {
          background: #f7f7f8;
          border-bottom-color: rgba(0, 0, 0, 0.08);
        }
        .site-nav.blend {
          background: rgba(10, 10, 10, 0.95);
        }
        .site-nav.blend.light {
          background: rgba(247, 247, 248, 0.95);
        }

        .logo-link {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: #e8e4dc;
        }
        .site-nav.light .logo-link,
        .site-nav.light .back-link {
          color: #0a0a0a;
        }
        .logo-sep {
          color: var(--cb-text-muted);
          font-size: 12px;
          opacity: 0.4;
        }
        .logo-badge {
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: var(--cb-accent);
          line-height: 1;
        }
        .logo-text {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
        }

        .back-link {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          color: #e8e4dc;
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          transition: color 0.15s ease;
        }
        .back-link:hover {
          color: #F7931A;
        }

        .nav-links {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 32px;
        }
        .nav-links a,
        .nav-links span {
          color: #6a6a6a;
          text-decoration: none;
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 16px 0;
          transition: color 0.15s ease;
        }
        .nav-links a:hover {
          color: #e8e4dc;
        }
        .nav-links a.active {
          color: #F7931A;
        }
        .site-nav.light .nav-links a,
        .site-nav.light .nav-links span {
          color: #6a6a6a;
        }
        .site-nav.light .nav-links a:hover {
          color: #0a0a0a;
        }
        .site-nav.light .nav-links a.active {
          color: #F7931A;
        }
        .nav-links span.coming-soon {
          opacity: 0.3;
          cursor: not-allowed;
          text-decoration: line-through;
        }

        .nav-right {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .live-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #6a6a6a;
        }
        .live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          animation: livePulse 2s ease infinite;
        }
        @keyframes livePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .mobile-menu-btn {
          display: none;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          width: 40px;
          height: 40px;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0;
          z-index: 1001;
        }
        .mobile-menu-btn span {
          display: block;
          width: 20px;
          height: 1px;
          background: #e8e4dc;
          transition: all 0.2s ease;
          margin: 3px 0;
        }
        .site-nav.light .mobile-menu-btn span {
          background: #0a0a0a;
        }
        .mobile-menu-btn.open span:nth-child(1) {
          transform: rotate(45deg) translate(4px, 4px);
        }
        .mobile-menu-btn.open span:nth-child(2) {
          opacity: 0;
        }
        .mobile-menu-btn.open span:nth-child(3) {
          transform: rotate(-45deg) translate(5px, -5px);
        }

        .mobile-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: #0a0a0a;
          z-index: 999;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.2s ease, visibility 0.2s ease;
        }
        .mobile-overlay.light {
          background: #f7f7f8;
        }
        .mobile-overlay.open {
          opacity: 1;
          visibility: visible;
        }
        .mobile-nav {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 32px;
        }
        .mobile-nav a {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2rem;
          color: #e8e4dc;
          text-decoration: none;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          transition: color 0.15s ease;
        }
        .mobile-overlay.light .mobile-nav a {
          color: #0a0a0a;
        }
        .mobile-nav a:active {
          color: #F7931A;
        }
        .mobile-nav a.coming-soon {
          text-decoration: line-through;
          opacity: 0.3;
        }

        @media (max-width: 768px) {
          .site-nav {
            padding: 0 24px;
          }
          .nav-links {
            display: none;
          }
          .mobile-menu-btn {
            display: flex;
          }
        }
      `}</style>

      <nav className={`site-nav${light}${blendMode ? ' blend' : ''}`}>
        {backLink ? (
          <Link href={backLink.href} className="back-link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            {backLink.label}
          </Link>
        ) : (
          <Link href="/" className="logo-link">
            <Image src="/contraband-logo-v3.png" alt="Contraband logo" width={28} height={28} />
            <span className="logo-text">Contra₿and</span>
            <span className="logo-sep">|</span>
            <span className="logo-badge">BIP</span>
          </Link>
        )}

        <div className="nav-links">
          {NAV_LINKS.map((link) =>
            link.comingSoon ? (
              <span key={link.label} className="coming-soon" aria-disabled="true" aria-label={`${link.label} — coming soon`}>
                {link.label}
              </span>
            ) : (
              <Link key={link.href} href={link.href} className={activePath === link.href ? 'active' : ''}>
                {link.label}
              </Link>
            )
          )}
        </div>

        <div className="nav-right">
          {liveIndicator && (
            <div className="live-indicator">
              <span className="live-dot" style={{ background: liveIndicator.connected ? '#22c55e' : '#f59e0b' }} />
              <span>{liveIndicator.connected ? 'Live' : 'Connecting...'}</span>
            </div>
          )}
          <StreakBadge />
          {showUserMenu && <UserMenu />}
          <button
            className={`mobile-menu-btn${menuOpen ? ' open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>

      <div className={`mobile-overlay${light}${menuOpen ? ' open' : ''}`} onClick={() => setMenuOpen(false)}>
        <nav className="mobile-nav" onClick={(e) => e.stopPropagation()}>
          {NAV_LINKS.map((link) =>
            link.comingSoon ? (
              <a key={link.label} className="coming-soon" aria-disabled="true" aria-label={`${link.label} — coming soon`}>
                {link.label}
              </a>
            ) : (
              <Link key={link.href} href={link.href!} onClick={() => setMenuOpen(false)}>
                {link.label}
              </Link>
            )
          )}
        </nav>
      </div>
    </>
  );
}
