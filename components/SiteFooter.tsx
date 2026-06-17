'use client';

import Image from 'next/image';
import { useTheme } from '@/contexts/ThemeContext';

interface SiteFooterProps {
  variant?: 'standard' | 'instructor';
  className?: string;
}

const STANDARD_LINKS = [
  { label: 'FML', href: 'https://feelinmoody.io' },
  { label: 'Twitter', href: 'https://x.com/contrabxnd' },
  { label: 'YouTube', href: 'https://youtube.com/@contrabxnd' },
];

const INSTRUCTOR_LINKS = [
  { label: 'Twitter', href: 'https://x.com/hankCmoody' },
  { label: 'YouTube', href: 'https://youtube.com/@hankcmoody' },
  { label: 'Substack', href: 'https://hankcmoody.substack.com' },
];

export default function SiteFooter({ variant = 'standard', className }: SiteFooterProps) {
  const { isLightMode } = useTheme();
  const links = variant === 'instructor' ? INSTRUCTOR_LINKS : STANDARD_LINKS;

  return (
    <>
      <style jsx global>{`
        .site-footer {
          padding: 48px;
          border-top: 1px solid var(--cb-border);
          max-width: 1400px;
          margin: 0 auto;
        }
        .footer-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .footer-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .footer-copy {
          font-size: 10px;
          letter-spacing: 0.08em;
          color: var(--cb-text-muted);
        }
        .footer-links {
          display: flex;
          gap: 24px;
        }
        .footer-links a {
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--cb-text-muted);
          text-decoration: none;
          transition: color 0.15s ease;
        }
        .footer-links a:hover {
          color: #F7931A;
        }

        @media (max-width: 768px) {
          .site-footer {
            padding: 32px 24px;
          }
          .footer-content {
            flex-direction: column;
            gap: 24px;
            text-align: center;
          }
          .footer-left {
            flex-direction: column;
          }
        }
      `}</style>

      <footer className={`site-footer${className ? ` ${className}` : ''}`}>
        <div className="footer-content">
          <div className="footer-left">
            <Image src="/contraband-logo-v3.png" alt="Contrabxnd logo" width={24} height={24} />
            <span className="footer-copy">© 2025–2026 Contrabxnd by FML</span>
          </div>
          <div className="footer-links">
            {links.map((link) => (
              <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer">{link.label} ↗</a>
            ))}
            <a style={{ textDecoration: 'line-through', opacity: 0.3, cursor: 'not-allowed' }} aria-disabled="true" aria-label="RSS — coming soon">RSS</a>
          </div>
        </div>
      </footer>
    </>
  );
}
