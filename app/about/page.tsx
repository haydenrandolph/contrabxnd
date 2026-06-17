'use client';

import { useTheme } from '@/contexts/ThemeContext';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';

export default function AboutPage() {
  const { isLightMode } = useTheme();

  return (
    <>
      <style jsx global>{`

        .contraband-about-page {
          background: var(--cb-bg);
          color: var(--cb-text);
          font-family: 'Space Mono', monospace;
          font-size: 13px;
          line-height: 1.7;
          overflow-x: hidden;
          min-height: 100vh;
        }

        .page-header {
          max-width: 1100px;
          margin: 0 auto;
          padding: 80px 48px 0;
        }

        .page-label {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--cb-accent);
          margin-bottom: 16px;
        }

        .page-title {
          font-family: var(--cb-font-display, 'Cormorant Garamond', serif);
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 400;
          letter-spacing: -0.02em;
          line-height: 1.15;
          color: var(--cb-text);
          margin-bottom: 12px;
        }

        .page-subtitle {
          font-family: 'Space Mono', monospace;
          font-size: 13px;
          color: var(--cb-text-muted);
          max-width: 600px;
          line-height: 1.6;
        }

        .page-divider {
          width: 100%;
          height: 1px;
          background: var(--cb-border);
          margin-top: 32px;
        }

        .page-content {
          max-width: 1100px;
          margin: 0 auto;
          padding: 48px 48px 96px;
        }

        .about-prose {
          max-width: 700px;
        }

        .about-definition {
          font-family: 'Space Mono', monospace;
          font-size: 1rem;
          color: var(--cb-text-muted);
          margin-bottom: 32px;
          line-height: 1.8;
        }

        .about-definition strong {
          color: var(--cb-text);
        }

        .about-definition em {
          color: var(--cb-text-muted);
        }

        .about-text {
          font-family: var(--cb-font-display, 'Cormorant Garamond', serif);
          font-size: 1.4rem;
          line-height: 1.9;
          color: var(--cb-text);
        }

        .about-text p {
          margin-bottom: 1.75rem;
        }

        .about-text p:last-child {
          margin-bottom: 0;
        }

        .highlight-text {
          color: var(--cb-accent);
        }

        @media (max-width: 768px) {
          .page-header { padding: 72px 24px 0; }
          .page-content { padding: 32px 24px 64px; }
          .about-text { font-size: 1.2rem; }
        }
      `}</style>

      <div className={`contraband-about-page ${isLightMode ? 'light-mode' : ''}`}>

        <SiteNav activePath="/about" />

        <div className="page-header">
          <div className="page-label">ABOUT</div>
          <h1 className="page-title">Contra₿xnd</h1>
          <p className="page-subtitle">Contrabxnd knowledge for sovereign individuals.</p>
          <div className="page-divider" />
        </div>
        <div className="page-content">
          <div className="about-prose">
            <p className="about-definition"><strong>con·tra·band</strong> <em>/ˈkäntrəˌband/</em> — goods that have been imported or exported illegally; trade that is prohibited by law.</p>
            <div className="about-text">
              <p>Throughout history, contraband hasn't just meant illegal goods. It's meant <span className="highlight-text">valuable goods that someone in power decided you shouldn't have access to.</span> Spices. Books. Ideas. Information. Currency.</p>
              <p>The ₿ isn't an accident. Bitcoin represents something that was supposed to be impossible: value that moves without permission. An expression of what contraband has always been.</p>
            </div>
          </div>
        </div>

        <SiteFooter />
      </div>
    </>
  );
}
