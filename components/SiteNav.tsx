'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import { UserMenu } from '@/components/auth';
import StreakBadge from '@/components/StreakBadge';

function ThemeToggleBtn({ isLight, onToggle }: { isLight: boolean; onToggle: () => void }) {
  return (
    <button className="nav-theme-btn" onClick={onToggle} aria-label="Toggle theme">
      {isLight ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      )}
    </button>
  );
}

interface SiteNavProps {
  activePath?: string;
  blendMode?: boolean;
  showUserMenu?: boolean;
  backLink?: { href: string; label: string };
  liveIndicator?: { connected: boolean };
}

interface DropdownChild {
  href?: string;
  label: string;
  comingSoon?: boolean;
}

interface DropdownGroup {
  label: string;
  children: DropdownChild[];
}

type NavLink =
  | { href: string; label: string; comingSoon?: false; dropdown?: undefined }
  | { label: string; comingSoon: true; href?: undefined; dropdown?: undefined }
  | { label: string; href: string; dropdown: DropdownGroup[]; comingSoon?: false };

const NAV_LINKS: NavLink[] = [
  { href: '/', label: 'Terminal' },
  {
    href: '/infra',
    label: 'Infra',
    dropdown: [
      {
        label: 'Tool₿ox',
        children: [
          { href: '/infra/converter', label: 'Sats Converter' },
          { href: '/infra/dca', label: 'DCA Calculator' },
          { href: '/infra/time-machine', label: 'Time Machine' },
        ],
      },
      {
        label: 'Agents',
        children: [
          { href: '/infra/agents', label: 'Registry' },
          { href: '/infra/mcp', label: 'MCP Server' },
          { label: 'Marketplace', comingSoon: true },
          { label: 'Indexer', comingSoon: true },
          { label: 'Lightning', comingSoon: true },
        ],
      },
    ],
  },
  { href: '/learn', label: 'Stu₿y' },
  { href: '/writings', label: 'Writings' },
  { href: '/network', label: 'Merchants' },
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
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const { isLightMode, toggleTheme } = useTheme();
  const light = isLightMode ? ' light' : '';

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

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
          font-family: 'JetBrains Mono', monospace;
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
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: var(--cb-accent);
          line-height: 1;
        }
        .logo-text {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          font-weight: 400;
          letter-spacing: 0.2em;
        }

        .back-link {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          color: #e8e4dc;
          font-size: 10px;
          font-weight: 400;
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
          font-weight: 400;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 16px 0;
          transition: color 0.15s ease;
          cursor: pointer;
          background: none;
          border: none;
          font-family: 'JetBrains Mono', monospace;
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
          border-radius: var(--cb-radius);
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
        .dd-group + .dd-group {
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        .site-nav.light .dd-group + .dd-group {
          border-top-color: rgba(0, 0, 0, 0.06);
        }
        .dd-group-trigger {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 8px 16px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #6a6a6a;
          background: none;
          border: none;
          cursor: pointer;
          transition: color 0.15s ease;
          line-height: 1;
        }
        .dd-group-trigger:hover {
          color: #e8e4dc;
        }
        .site-nav.light .dd-group-trigger:hover {
          color: #0a0a0a;
        }
        .dd-group-trigger.open {
          color: var(--cb-accent);
        }
        .dd-group-trigger svg {
          transition: transform 0.15s ease;
        }
        .dd-group-trigger.open svg {
          transform: rotate(90deg);
        }
        .dd-group-children {
          display: none;
        }
        .dd-group-children.open {
          display: block;
        }
        .dd-group-children a,
        .dd-group-children span {
          padding-left: 24px !important;
          font-size: 10px;
        }

        .nav-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .nav-theme-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: var(--cb-radius);
          cursor: pointer;
          color: #6a6a6a;
          transition: color 0.15s ease, border-color 0.15s ease;
        }
        .nav-theme-btn:hover {
          color: #e8e4dc;
          border-color: rgba(255, 255, 255, 0.2);
        }
        .site-nav.light .nav-theme-btn {
          border-color: rgba(0, 0, 0, 0.08);
        }
        .site-nav.light .nav-theme-btn:hover {
          color: #0a0a0a;
          border-color: rgba(0, 0, 0, 0.2);
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
          border-radius: var(--cb-radius);
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
          font-family: 'JetBrains Mono', monospace;
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
          font-family: 'JetBrains Mono', monospace;
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
            <Image src="/contraband-logo-v3.png" alt="Contrabxnd logo" width={28} height={28} />
            <span className="logo-text">CONTRA₿XND</span>
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
                  {link.dropdown.map((group) => (
                    <div key={group.label} className="dd-group">
                      <button
                        className={`dd-group-trigger${expandedGroups[group.label] ? ' open' : ''}`}
                        onClick={() => toggleGroup(group.label)}
                      >
                        {group.label}
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </button>
                      <div className={`dd-group-children${expandedGroups[group.label] ? ' open' : ''}`}>
                        {group.children.map((child) =>
                          child.comingSoon ? (
                            <span key={child.label} className="dd-coming-soon">{child.label}</span>
                          ) : (
                            <Link key={child.href} href={child.href!}>{child.label}</Link>
                          )
                        )}
                      </div>
                    </div>
                  ))}
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
          <ThemeToggleBtn isLight={isLightMode} onToggle={toggleTheme} />
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
            <Image src="/contraband-logo-v3.png" alt="Contrabxnd logo" width={24} height={24} />
            <span className="logo-text">CONTRA₿XND</span>
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="mobile-footer-badge">
              <span>BIP</span> Bitcoin Intelligence Platform
            </div>
            <ThemeToggleBtn isLight={isLightMode} onToggle={toggleTheme} />
          </div>
        </div>
      </div>
    </>
  );
}
