'use client';

import { ReactNode } from 'react';
import SidebarShell from '@/components/SidebarShell';
import { DOCS_NAV, docHref, adjacentDocs } from '@/lib/docs';

/**
 * GitBook-style docs shell — thin wrapper over the generalized SidebarShell,
 * fed by lib/docs.ts (nav + prev/next). Wraps content in `.docs-prose` for
 * doc typography.
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
  const sections = DOCS_NAV.map((s) => ({
    title: s.title,
    items: s.items.map((it) => ({ title: it.title, href: docHref(it.slug), active: it.slug === slug })),
  }));
  const { prev, next } = adjacentDocs(slug);

  return (
    <>
      <style jsx global>{`
        .docs-prose { font-size: 15px; line-height: 1.75; color: var(--cb-text-muted); }
        .docs-prose h2 { font-family: var(--cb-font-display); font-weight: 400; font-size: 1.5rem; color: var(--cb-text); margin: 44px 0 14px; letter-spacing: -0.01em; }
        .docs-prose h3 { font-size: 1.05rem; font-weight: 600; color: var(--cb-text); margin: 28px 0 10px; }
        .docs-prose p { margin: 0 0 16px; }
        .docs-prose a { color: var(--cb-accent); text-decoration: none; border-bottom: 1px solid transparent; }
        .docs-prose a:hover { border-bottom-color: var(--cb-accent); }
        .docs-prose ul { margin: 0 0 16px; padding-left: 20px; }
        .docs-prose li { margin-bottom: 6px; }
        .docs-prose code { font-family: var(--cb-font-mono); font-size: 0.85em; background: var(--cb-bg-surface); border: 1px solid var(--cb-border); border-radius: 3px; padding: 1px 5px; color: var(--cb-text); }
        .docs-prose pre { background: var(--cb-bg-surface); border: 1px solid var(--cb-border); border-radius: var(--cb-radius); padding: 16px 18px; overflow-x: auto; margin: 0 0 20px; }
        .docs-prose pre code { background: none; border: none; padding: 0; font-size: 12.5px; line-height: 1.7; color: var(--cb-text); }
      `}</style>
      <SidebarShell label="Docs" sections={sections} title={title} subtitle={subtitle} prev={prev ? { href: docHref(prev.slug), title: prev.title } : null} next={next ? { href: docHref(next.slug), title: next.title } : null}>
        <div className="docs-prose">{children}</div>
      </SidebarShell>
    </>
  );
}
