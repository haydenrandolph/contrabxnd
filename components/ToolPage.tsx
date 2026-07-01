'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';

/**
 * Shared FML-styled shell for the infra tool pages: breadcrumb + light-weight
 * title header, then the tool framed inside a bordered surface card so it reads
 * as a product page rather than a bare form.
 */
export default function ToolPage({
  breadcrumb,
  title,
  subtitle,
  children,
  framed = true,
}: {
  breadcrumb: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  framed?: boolean;
}) {
  const { isLightMode } = useTheme();
  return (
    <>
      <style jsx global>{`
        .tp-header { padding-top: 120px; }
        .tp-crumb { font-family: var(--cb-font-mono); font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--cb-text-dim); }
        .tp-crumb a { color: var(--cb-accent); text-decoration: none; transition: color 0.15s ease; }
        .tp-crumb a:hover { color: var(--cb-text); }
        .tp-title { font-family: var(--cb-font-display); font-weight: 300; letter-spacing: -0.02em; font-size: clamp(2rem, 4vw, 2.75rem); line-height: 1.1; color: var(--cb-text); margin: 18px 0 12px; }
        .tp-sub { font-size: 0.95rem; font-weight: 300; color: var(--cb-text-muted); max-width: 560px; line-height: 1.6; }
        .tp-divider { height: 1px; background: var(--cb-border); margin-top: 36px; }
        .tp-body { padding: 40px 0 96px; }
        .tp-frame { border: 1px solid var(--cb-border); border-radius: var(--cb-radius); background: var(--cb-surface); padding: 28px; }
        @media (max-width: 768px) {
          .tp-header { padding-top: 96px; }
          .tp-frame { padding: 20px; }
          .tp-body { padding: 28px 0 64px; }
        }
      `}</style>

      <div className={`fml-page ${isLightMode ? 'light-mode' : ''}`}>
        <SiteNav activePath="/infra" />

        <div className="fml-narrow tp-header">
          <div className="tp-crumb"><Link href="/infra">INFRA</Link> / {breadcrumb}</div>
          <h1 className="tp-title">{title}</h1>
          <p className="tp-sub">{subtitle}</p>
          <div className="tp-divider" />
        </div>

        <div className="fml-narrow tp-body">
          {framed ? <div className="tp-frame">{children}</div> : children}
        </div>

        <SiteFooter />
      </div>
    </>
  );
}
