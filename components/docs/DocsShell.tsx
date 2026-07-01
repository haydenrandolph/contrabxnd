'use client';

import Link from 'next/link';
import { ReactNode, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import SiteNav from '@/components/SiteNav';
import { DOCS_NAV, docHref, adjacentDocs } from '@/lib/docs';

/**
 * GitBook-style docs shell: persistent left sidebar (grouped nav tree) +
 * content column + prev/next footer. FML-styled. Sidebar collapses to a
 * drawer on mobile.
 */
export default function DocsShell({
  slug,
  title,
  subtitle,
  children,
}: {
  slug: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const { isLightMode } = useTheme();
  const [open, setOpen] = useState(false);
  const { prev, next } = adjacentDocs(slug);

  return (
    <>
      <style jsx global>{`
        .docs-shell { background: var(--cb-bg); color: var(--cb-text); min-height: 100vh; font-family: var(--cb-font-sans); }
        .docs-layout { display: flex; max-width: 1280px; margin: 0 auto; }

        .docs-sidebar {
          flex: 0 0 260px; width: 260px; border-right: 1px solid var(--cb-border);
          padding: 40px 24px 80px; position: sticky; top: 0; align-self: flex-start;
          height: 100vh; overflow-y: auto;
        }
        .docs-side-group { margin-bottom: 28px; }
        .docs-side-title { font-family: var(--cb-font-mono); font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--cb-text-dim); margin-bottom: 12px; }
        .docs-side-link { display: block; font-size: 13px; color: var(--cb-text-muted); text-decoration: none; padding: 6px 12px; border-left: 2px solid transparent; margin-left: -2px; transition: color 0.12s ease, border-color 0.12s ease; }
        .docs-side-link:hover { color: var(--cb-text); }
        .docs-side-link.active { color: var(--cb-accent); border-left-color: var(--cb-accent); }

        .docs-main { flex: 1 1 auto; min-width: 0; padding: 56px 56px 96px; max-width: 820px; }
        .docs-crumb { font-family: var(--cb-font-mono); font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--cb-text-dim); margin-bottom: 14px; }
        .docs-crumb a { color: var(--cb-accent); text-decoration: none; }
        .docs-title { font-family: var(--cb-font-display); font-weight: 300; letter-spacing: -0.02em; font-size: clamp(2rem, 4vw, 2.75rem); line-height: 1.1; color: var(--cb-text); margin: 0; }
        .docs-subtitle { font-size: 1rem; font-weight: 300; color: var(--cb-text-muted); margin-top: 12px; max-width: 620px; line-height: 1.6; }
        .docs-divider { height: 1px; background: var(--cb-border); margin: 32px 0 40px; }

        /* Prose defaults for doc content */
        .docs-content { font-size: 15px; line-height: 1.75; color: var(--cb-text-muted); }
        .docs-content h2 { font-family: var(--cb-font-display); font-weight: 400; font-size: 1.5rem; color: var(--cb-text); margin: 44px 0 14px; letter-spacing: -0.01em; }
        .docs-content h3 { font-size: 1.05rem; font-weight: 600; color: var(--cb-text); margin: 28px 0 10px; }
        .docs-content p { margin: 0 0 16px; }
        .docs-content a { color: var(--cb-accent); text-decoration: none; border-bottom: 1px solid transparent; }
        .docs-content a:hover { border-bottom-color: var(--cb-accent); }
        .docs-content ul { margin: 0 0 16px; padding-left: 20px; }
        .docs-content li { margin-bottom: 6px; }
        .docs-content code { font-family: var(--cb-font-mono); font-size: 0.85em; background: var(--cb-bg-surface); border: 1px solid var(--cb-border); border-radius: 3px; padding: 1px 5px; color: var(--cb-text); }
        .docs-content pre { background: var(--cb-bg-surface); border: 1px solid var(--cb-border); border-radius: var(--cb-radius); padding: 16px 18px; overflow-x: auto; margin: 0 0 20px; }
        .docs-content pre code { background: none; border: none; padding: 0; font-size: 12.5px; line-height: 1.7; color: var(--cb-text); }

        .docs-nav-foot { display: flex; justify-content: space-between; gap: 16px; margin-top: 64px; padding-top: 28px; border-top: 1px solid var(--cb-border); }
        .docs-nav-btn { flex: 1; border: 1px solid var(--cb-border); border-radius: var(--cb-radius); padding: 14px 18px; text-decoration: none; transition: border-color 0.15s ease; }
        .docs-nav-btn:hover { border-color: var(--cb-border-hover); }
        .docs-nav-dir { font-family: var(--cb-font-mono); font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--cb-text-dim); }
        .docs-nav-t { display: block; margin-top: 4px; color: var(--cb-text); font-size: 14px; }
        .docs-nav-btn.nxt { text-align: right; }

        .docs-menu-btn { display: none; }

        @media (max-width: 900px) {
          .docs-sidebar {
            position: fixed; top: 0; left: 0; z-index: 60; width: 280px; height: 100vh;
            background: var(--cb-bg); transform: translateX(-100%); transition: transform 0.2s ease;
            padding-top: 72px;
          }
          .docs-sidebar.open { transform: translateX(0); }
          .docs-main { padding: 40px 24px 72px; }
          .docs-menu-btn {
            display: inline-flex; align-items: center; gap: 8px; position: sticky; top: 12px;
            margin: 12px 0 0 24px; z-index: 50; background: var(--cb-surface);
            border: 1px solid var(--cb-border); border-radius: var(--cb-radius);
            font-family: var(--cb-font-mono); font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em;
            color: var(--cb-text); padding: 8px 14px; cursor: pointer;
          }
          .docs-scrim { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 55; }
        }
      `}</style>

      <div className={`docs-shell ${isLightMode ? 'light-mode' : ''}`}>
        <SiteNav activePath="/docs" />

        <button className="docs-menu-btn" onClick={() => setOpen(true)}>☰ Docs</button>
        {open && <div className="docs-scrim" onClick={() => setOpen(false)} />}

        <div className="docs-layout">
          <aside className={`docs-sidebar ${open ? 'open' : ''}`}>
            {DOCS_NAV.map((section) => (
              <div key={section.title} className="docs-side-group">
                <div className="docs-side-title">{section.title}</div>
                {section.items.map((item) => (
                  <Link
                    key={item.slug}
                    href={docHref(item.slug)}
                    className={`docs-side-link ${item.slug === slug ? 'active' : ''}`}
                    onClick={() => setOpen(false)}
                  >
                    {item.title}
                  </Link>
                ))}
              </div>
            ))}
          </aside>

          <main className="docs-main">
            <div className="docs-crumb"><Link href="/docs">DOCS</Link></div>
            <h1 className="docs-title">{title}</h1>
            {subtitle && <p className="docs-subtitle">{subtitle}</p>}
            <div className="docs-divider" />

            <div className="docs-content">{children}</div>

            <div className="docs-nav-foot">
              {prev ? (
                <Link href={docHref(prev.slug)} className="docs-nav-btn">
                  <span className="docs-nav-dir">← Previous</span>
                  <span className="docs-nav-t">{prev.title}</span>
                </Link>
              ) : <span style={{ flex: 1 }} />}
              {next ? (
                <Link href={docHref(next.slug)} className="docs-nav-btn nxt">
                  <span className="docs-nav-dir">Next →</span>
                  <span className="docs-nav-t">{next.title}</span>
                </Link>
              ) : <span style={{ flex: 1 }} />}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
