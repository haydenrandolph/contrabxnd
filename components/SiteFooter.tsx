'use client';

import Image from 'next/image';
import { useTheme } from '@/contexts/ThemeContext';

interface SiteFooterProps {
  variant?: 'standard' | 'instructor';
  className?: string;
}

const STANDARD_LINKS = [
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
      <style jsx>{`
        .site-footer {
          padding: 4rem 3rem;
          border-top: 1px solid #1a1a1a;
          max-width: 1400px;
          margin: 0 auto;
        }
        .site-footer.light {
          border-top-color: #d0ccc4;
        }
        .footer-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .footer-left {
          display: flex;
          align-items: center;
          gap: 2rem;
        }
        .footer-copy {
          font-size: 12px;
          color: #8a8a8a;
        }
        .footer-links {
          display: flex;
          gap: 2rem;
        }
        .footer-links a {
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #8a8a8a;
          text-decoration: none;
          transition: color 0.3s ease;
        }
        .footer-links a:hover {
          color: #F7931A;
        }

        @media (max-width: 768px) {
          .footer-content {
            flex-direction: column;
            gap: 2rem;
            text-align: center;
          }
          .footer-left {
            flex-direction: column;
          }
        }
      `}</style>

      <footer className={`site-footer${isLightMode ? ' light' : ''}${className ? ` ${className}` : ''}`}>
        <div className="footer-content">
          <div className="footer-left">
            <Image src="/contraband-logo-v3.png" alt="Contraband logo" width={32} height={32} />
            <span className="footer-copy">© 2025–2026 Contraband. All rights reserved.</span>
          </div>
          <div className="footer-links">
            {links.map((link) => (
              <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer">{link.label}</a>
            ))}
            <a style={{ textDecoration: 'line-through', opacity: 0.5, cursor: 'not-allowed' }} aria-disabled="true" aria-label="RSS — coming soon">RSS</a>
          </div>
        </div>
      </footer>
    </>
  );
}
