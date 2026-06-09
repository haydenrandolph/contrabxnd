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
  { href: '/dashboard', label: 'Dashboard' },
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
      <style jsx>{`
        .site-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          padding: 2rem 3rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 100;
        }
        .site-nav.blend {
          mix-blend-mode: difference;
        }
        .site-nav:not(.blend) {
          background: linear-gradient(to bottom, #0a0a0a 0%, transparent 100%);
        }
        .site-nav.light:not(.blend) {
          background: linear-gradient(to bottom, #e8e4dc 0%, transparent 100%);
        }

        .logo-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
          color: #f5f3f0;
        }
        .site-nav.light .logo-link,
        .site-nav.light .back-link {
          color: #0a0a0a;
        }
        .site-nav.blend .logo-link {
          color: #f5f3f0;
        }
        .logo-text {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
        }

        .back-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          text-decoration: none;
          color: #f5f3f0;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          transition: color 0.2s ease;
        }
        .back-link:hover {
          color: #F7931A;
        }

        .nav-links {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 2.5rem;
        }
        .nav-links a,
        .nav-links span {
          color: #f5f3f0;
          text-decoration: none;
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          position: relative;
          padding: 0.25rem 0;
        }
        .site-nav.light .nav-links a,
        .site-nav.light .nav-links span {
          color: #0a0a0a;
        }
        .site-nav.blend .nav-links a,
        .site-nav.blend .nav-links span {
          color: #f5f3f0;
        }
        .nav-links a::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 1px;
          background: #F7931A;
          transition: width 0.3s ease;
        }
        .nav-links a:hover::after,
        .nav-links a.active::after {
          width: 100%;
        }
        .nav-links span.coming-soon,
        .nav-links a.coming-soon {
          text-decoration: line-through;
          opacity: 0.5;
          cursor: not-allowed;
        }
        .nav-links span.coming-soon:hover::after,
        .nav-links a.coming-soon:hover::after {
          width: 0;
        }

        .nav-right {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .live-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #8a8a8a;
        }
        .live-dot {
          width: 8px;
          height: 8px;
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
          width: 44px;
          height: 44px;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0;
          z-index: 1001;
        }
        .mobile-menu-btn span {
          display: block;
          width: 24px;
          height: 2px;
          background: #f5f3f0;
          transition: all 0.3s ease;
          margin: 3px 0;
        }
        .site-nav.light .mobile-menu-btn span {
          background: #0a0a0a;
        }
        .mobile-menu-btn.open span:nth-child(1) {
          transform: rotate(45deg) translate(5px, 5px);
        }
        .mobile-menu-btn.open span:nth-child(2) {
          opacity: 0;
        }
        .mobile-menu-btn.open span:nth-child(3) {
          transform: rotate(-45deg) translate(6px, -6px);
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
          transition: opacity 0.3s ease, visibility 0.3s ease;
        }
        .mobile-overlay.light {
          background: #e8e4dc;
        }
        .mobile-overlay.open {
          opacity: 1;
          visibility: visible;
        }
        .mobile-nav {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
        }
        .mobile-nav a {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2rem;
          color: #e8e4dc;
          text-decoration: none;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          transition: color 0.3s ease;
        }
        .mobile-overlay.light .mobile-nav a {
          color: #0a0a0a;
        }
        .mobile-nav a:active {
          color: #F7931A;
        }
        .mobile-nav a.coming-soon {
          text-decoration: line-through;
          opacity: 0.5;
        }

        @media (max-width: 768px) {
          .site-nav {
            padding: 1.5rem 2rem;
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            {backLink.label}
          </Link>
        ) : (
          <Link href="/" className="logo-link">
            <Image src="/contraband-logo-v3.png" alt="Contraband logo" width={40} height={40} />
            <span className="logo-text">Contra₿and</span>
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
