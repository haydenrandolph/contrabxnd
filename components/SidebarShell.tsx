'use client';

import Link from 'next/link';
import { ReactNode, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import SiteNav from '@/components/SiteNav';

export interface ShellNavItem { title: string; href: string; active?: boolean }
export interface ShellNavSection { title: string; items: ShellNavItem[] }

/**
 * Generalized GitBook-style shell: fixed top nav + persistent left sidebar
 * (grouped nav tree) + content column + optional prev/next footer. Used by both
 * the /docs section and the /infra product console. Sidebar is offset below the
 * 48px fixed SiteNav and collapses to a drawer on mobile.
 */
export default function SidebarShell({
  label,
  sections,
  title,
  subtitle,
  prev,
  next,
  bare = false,
  activePath,
  children,
}: {
  label: string;
  sections: ShellNavSection[];
  title?: string;
  subtitle?: string;
  prev?: { href: string; title: string } | null;
  next?: { href: string; title: string } | null;
  /** Skip the default title header — the page renders its own header inside. */
  bare?: boolean;
  /** SiteNav active path; defaults from label. */
  activePath?: string;
  children: ReactNode;
}) {
  const { isLightMode } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <>
      <style jsx global>{`
        .sb-shell { background: var(--cb-bg); color: var(--cb-text); min-height: 100vh; font-family: var(--cb-font-sans); }
        .sb-layout { display: flex; max-width: 1320px; margin: 0 auto; }

        .sb-sidebar {
          flex: 0 0 264px; width: 264px; border-right: 1px solid var(--cb-border);
          padding: 32px 24px 80px; position: sticky; top: 48px; align-self: flex-start;
          height: calc(100vh - 48px); overflow-y: auto;
        }
        .sb-group { margin-bottom: 26px; }
        .sb-group-title { font-family: var(--cb-font-mono); font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--cb-text-dim); margin-bottom: 10px; padding-left: 12px; }
        .sb-link { display: block; font-size: 13px; color: var(--cb-text-muted); text-decoration: none; padding: 6px 12px; border-left: 2px solid transparent; margin-left: -2px; transition: color 0.12s ease, border-color 0.12s ease; }
        .sb-link:hover { color: var(--cb-text); }
        .sb-link.active { color: var(--cb-accent); border-left-color: var(--cb-accent); }

        .sb-main { flex: 1 1 auto; min-width: 0; padding: 56px 56px 96px; max-width: 860px; }
        .sb-main.bare { padding: 0; max-width: none; }
        .sb-eyebrow { font-family: var(--cb-font-mono); font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--cb-text-dim); margin-bottom: 14px; }
        .sb-title { font-family: var(--cb-font-display); font-weight: 300; letter-spacing: -0.02em; font-size: clamp(2rem, 4vw, 2.75rem); line-height: 1.1; color: var(--cb-text); margin: 0; }
        .sb-subtitle { font-size: 1rem; font-weight: 300; color: var(--cb-text-muted); margin-top: 12px; max-width: 620px; line-height: 1.6; }
        .sb-divider { height: 1px; background: var(--cb-border); margin: 32px 0 40px; }

        .sb-footnav { display: flex; justify-content: space-between; gap: 16px; margin-top: 64px; padding-top: 28px; border-top: 1px solid var(--cb-border); }
        .sb-footbtn { flex: 1; border: 1px solid var(--cb-border); border-radius: var(--cb-radius); padding: 14px 18px; text-decoration: none; transition: border-color 0.15s ease; }
        .sb-footbtn:hover { border-color: var(--cb-border-hover); }
        .sb-footdir { font-family: var(--cb-font-mono); font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--cb-text-dim); }
        .sb-foott { display: block; margin-top: 4px; color: var(--cb-text); font-size: 14px; }
        .sb-footbtn.nxt { text-align: right; }

        .sb-menu-btn { display: none; }

        @media (max-width: 900px) {
          .sb-sidebar {
            position: fixed; top: 0; left: 0; z-index: 210; width: 280px; height: 100vh;
            background: var(--cb-bg); transform: translateX(-100%); transition: transform 0.2s ease;
            padding-top: 68px;
          }
          .sb-sidebar.open { transform: translateX(0); }
          .sb-main { padding: 32px 22px 72px; }
          .sb-menu-btn {
            display: inline-flex; align-items: center; gap: 8px; margin: 60px 0 -8px 22px;
            background: var(--cb-surface); border: 1px solid var(--cb-border); border-radius: var(--cb-radius);
            font-family: var(--cb-font-mono); font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em;
            color: var(--cb-text); padding: 8px 14px; cursor: pointer;
          }
          .sb-scrim { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 205; }
        }
      `}</style>

      <div className={`sb-shell ${isLightMode ? 'light-mode' : ''}`}>
        <SiteNav activePath={activePath ?? (label === 'Docs' ? '/docs' : '/infra')} />

        <button className="sb-menu-btn" onClick={() => setOpen(true)}>☰ {label}</button>
        {open && <div className="sb-scrim" onClick={() => setOpen(false)} />}

        <div className="sb-layout">
          <aside className={`sb-sidebar ${open ? 'open' : ''}`}>
            {sections.map((section) => (
              <div key={section.title} className="sb-group">
                <div className="sb-group-title">{section.title}</div>
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`sb-link ${item.active ? 'active' : ''}`}
                    onClick={() => setOpen(false)}
                  >
                    {item.title}
                  </Link>
                ))}
              </div>
            ))}
          </aside>

          <main className={`sb-main ${bare ? 'bare' : ''}`}>
            {!bare && (
              <>
                <div className="sb-eyebrow">{label}</div>
                <h1 className="sb-title">{title}</h1>
                {subtitle && <p className="sb-subtitle">{subtitle}</p>}
                <div className="sb-divider" />
              </>
            )}

            {children}

            {(prev || next) && (
              <div className="sb-footnav">
                {prev ? (
                  <Link href={prev.href} className="sb-footbtn">
                    <span className="sb-footdir">← Previous</span>
                    <span className="sb-foott">{prev.title}</span>
                  </Link>
                ) : <span style={{ flex: 1 }} />}
                {next ? (
                  <Link href={next.href} className="sb-footbtn nxt">
                    <span className="sb-footdir">Next →</span>
                    <span className="sb-foott">{next.title}</span>
                  </Link>
                ) : <span style={{ flex: 1 }} />}
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
