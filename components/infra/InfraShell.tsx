'use client';

import { ReactNode } from 'react';
import SidebarShell from '@/components/SidebarShell';
import { INFRA_NAV, infraHref } from '@/lib/infra-nav';

/**
 * Product-console shell for /infra pages — thin wrapper over SidebarShell fed
 * by lib/infra-nav.ts. Every infra product page (explorer, lightning, mcp,
 * agents, tools) renders inside this so the whole surface shares one sidebar.
 *
 * `framed` wraps children in a bordered surface card (good for compact tools).
 */
export default function InfraShell({
  slug,
  title,
  subtitle,
  framed = false,
  children,
}: {
  slug: string;
  title: string;
  subtitle?: string;
  framed?: boolean;
  children: ReactNode;
}) {
  const sections = INFRA_NAV.map((s) => ({
    title: s.title,
    items: s.items.map((it) => ({ title: it.title, href: infraHref(it.slug), active: it.slug === slug })),
  }));

  return (
    <>
      <style jsx global>{`
        .infra-frame { border: 1px solid var(--cb-border); border-radius: var(--cb-radius); background: var(--cb-surface); padding: 28px; }
        @media (max-width: 768px) { .infra-frame { padding: 18px; } }
      `}</style>
      <SidebarShell label="Infra" sections={sections} title={title} subtitle={subtitle}>
        {framed ? <div className="infra-frame">{children}</div> : children}
      </SidebarShell>
    </>
  );
}
