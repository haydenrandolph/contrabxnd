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

type DropdownItem = { href: string; label: string; comingSoon?: false } | { label: string; comingSoon: true; href?: undefined };
type NavLink =
  | { href: string; label: string; comingSoon?: false; dropdown?: undefined }
  | { label: string; comingSoon: true; href?: undefined; dropdown?: undefined }
  | { label: string; href: string; dropdown: DropdownItem[]; comingSoon?: false };

const NAV_LINKS: NavLink[] = [
  { href: '/', label: 'Terminal' },
  {
    href: '/toolkit',
    label: 'Tool₿ox',
    dropdown: [
      { href: '/toolkit/converter', label: 'Sats Converter' },
      { href: '/toolkit/dca', label: 'DCA Calculator' },
      { href: '/toolkit/time-machine', label: 'Time Machine' },
      { href: '/toolkit/mcp', label: 'MCP Server' },
      { label: 'Indexer', comingSoon: true },
      { label: 'Lightning', comingSoon: true },
      { label: 'Wallets', comingSoon: true },
      { label: 'Trading', comingSoon: true },
    ],
  },
  { href: '/learn', label: 'Stu₿y' },
  { href: '/writings', label: 'Writings' },
  { href: '/network', label: 'Merchants' },
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
        .nav-links > a,
        .nav-links > span {
          display: flex;
          align-items: center;
        }
        .nav-links a,
        .nav-links span,
        .nav-links .nav-dropdown-trigger {
          color: #6a6a6a;
          text-decoration: none;
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 16px 0;
          transition: color 0.15s ease;
          cursor: pointer;
          background: none;
          border: none;
          font-family: 'Space Mono', monospace;
          line-height: 1;
        }
        .nav-links a:hover,
        .nav-dropdown-wrap:hover .nav-dropdown-trigger {
          color: #e8e4dc;
        }
        .nav-links a.active,
        .nav-dropdown-wrap.active .nav-dropdown-trigger {
          color: #F7931A;
        }
        .site-nav.light .nav-links a,
        .site-nav.light .nav-links span,
        .site-nav.light .nav-dropdown-trigger {
          color: #6a6a6a;
        }
        .site-nav.light .nav-links a:hover,
        .site-nav.light .nav-dropdown-wrap:hover .nav-dropdown-trigger {
          color: #0a0a0a;
        }
        .site-nav.light .nav-links a.active,
        .site-nav.light .nav-dropdown-wrap.active .nav-dropdown-trigger {
          color: #F7931A;
        }
        .nav-links span.coming-soon {
          opacity: 0.3;
          cursor: not-allowed;
          text-decoration: line-through;
        }

        .nav-dropdown-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .nav-dropdown {
          position: absolute;
          top: 48px;
          left: 50%;
          transform: translateX(-50%);
          min-width: 180px;
          background: #0a0a0a;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 2px;
          padding: 8px 0;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.15s ease, visibility 0.15s ease;
          z-index: 200;
        }
        .site-nav.light .nav-dropdown {
          background: #ffffff;
          border-color: rgba(0, 0, 0, 0.08);
        }
        .nav-dropdown-wrap:hover .nav-dropdown {
          opacity: 1;
          visibility: visible;
        }
        .nav-dropdown a,
        .nav-dropdown span {
          display: block;
          padding: 8px 16px !important;
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #6a6a6a;
          text-decoration: none;
          transition: color 0.15s ease;
          white-space: nowrap;
        }
        .nav-dropdown a:hover {
          color: #e8e4dc;
        }
        .site-nav.light .nav-dropdown a:hover {
          color: #0a0a0a;
        }
        .nav-dropdown span.dd-coming-soon {
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

        .mobile-header {
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          flex-shrink: 0;
        }
        .mobile-overlay.light .mobile-header {
          border-bottom-color: rgba(0, 0, 0, 0.08);
        }

        .mobile-close {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          background: none;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 2px;
          cursor: pointer;
          color: #6a6a6a;
          transition: color 0.15s ease, border-color 0.15s ease;
        }
        .mobile-overlay.light .mobile-close {
          border-color: rgba(0, 0, 0, 0.08);
        }
        .mobile-close:active {
          color: #F7931A;
          border-color: #F7931A;
        }

        .mobile-nav {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 8px 0;
          overflow-y: auto;
        }
        .mobile-nav-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #e8e4dc;
          text-decoration: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          transition: color 0.15s ease, background 0.15s ease;
          min-height: 52px;
        }
        .mobile-overlay.light .mobile-nav-link {
          color: #0a0a0a;
          border-bottom-color: rgba(0, 0, 0, 0.04);
        }
        .mobile-nav-link:active {
          color: #F7931A;
          background: rgba(247, 147, 26, 0.04);
        }
        .mobile-nav-link.active {
          color: #F7931A;
        }
        .mobile-nav-link svg {
          color: #6a6a6a;
        }
        .mobile-nav-link:active svg {
          color: #F7931A;
        }

        .mobile-footer {
          padding: 16px 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          flex-shrink: 0;
        }
        .mobile-overlay.light .mobile-footer {
          border-top-color: rgba(0, 0, 0, 0.08);
        }
        .mobile-footer-badge {
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #6a6a6a;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .mobile-footer-badge span {
          color: #F7931A;
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
            ) : link.dropdown ? (
              <div key={link.href} className={`nav-dropdown-wrap${activePath?.startsWith(link.href) ? ' active' : ''}`}>
                <Link href={link.href} className="nav-dropdown-trigger">
                  {link.label}
                </Link>
                <div className="nav-dropdown">
                  {link.dropdown.map((item) =>
                    item.comingSoon ? (
                      <span key={item.label} className="dd-coming-soon">{item.label}</span>
                    ) : (
                      <Link key={item.href} href={item.href}>{item.label}</Link>
                    )
                  )}
                </div>
              </div>
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

      <div className={`mobile-overlay${light}${menuOpen ? ' open' : ''}`}>
        <div className="mobile-header">
          <Link href="/" className="logo-link" onClick={() => setMenuOpen(false)}>
            <Image src="/contraband-logo-v3.png" alt="Contraband logo" width={24} height={24} />
            <span className="logo-text">Contra₿and</span>
          </Link>
          <button className="mobile-close" onClick={() => setMenuOpen(false)} aria-label="Close menu">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="mobile-nav">
          {NAV_LINKS.filter((link) => !link.comingSoon).map((link) => (
            <Link
              key={link.dropdown ? link.href : link.href!}
              href={link.dropdown ? link.href : link.href!}
              className={`mobile-nav-link${activePath === (link.dropdown ? link.href : link.href) ? ' active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </Link>
          ))}
        </nav>
        <div className="mobile-footer">
          <div className="mobile-footer-badge">
            <span>BIP</span> Bitcoin Intelligence Platform
          </div>
        </div>
      </div>
    </>
  );
}
