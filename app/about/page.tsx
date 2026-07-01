'use client';

import { useTheme } from '@/contexts/ThemeContext';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';

export default function AboutPage() {
  const { isLightMode } = useTheme();

  return (
    <>
      <style jsx global>{`
        .about-def {
          font-family: var(--cb-font-mono);
          font-size: 0.82rem;
          line-height: 1.7;
          color: var(--cb-text-muted);
        }
        .about-def strong { color: var(--cb-text); }
        .about-prose {
          max-width: 640px;
          margin-top: 40px;
          font-family: var(--cb-font-display);
          font-weight: 300;
          font-size: 1.5rem;
          line-height: 1.6;
          letter-spacing: -0.01em;
          color: var(--cb-text);
        }
        .about-prose p { margin: 0 0 1.6rem; }
        .about-prose p:last-child { margin-bottom: 0; }
        .about-prose .hl { color: var(--cb-accent); }
        @media (max-width: 768px) {
          .about-prose { font-size: 1.25rem; }
        }
      `}</style>

      <div className={`fml-page ${isLightMode ? 'light-mode' : ''}`}>
        <SiteNav activePath="/about" />

        <section className="fml-hero grid-bg">
          <div className="fml-container">
            <div className="fml-eyebrow"><span className="dot" /> About</div>
            <h1 className="fml-display" style={{ marginTop: 24 }}>Contra₿xnd</h1>
            <p className="fml-lead" style={{ marginTop: 20 }}>Bitcoin intelligence for sovereign individuals.</p>
          </div>
        </section>

        <section className="fml-section">
          <div className="fml-section-inner">
            <div className="fml-callout" style={{ maxWidth: 640 }}>
              <p className="about-def">
                <strong>con·tra·band</strong> /ˈkäntrəˌband/ — goods that have been imported or exported illegally; trade that is prohibited by law.
              </p>
            </div>

            <div className="about-prose">
              <p>
                Throughout history, contraband hasn&apos;t just meant illegal goods. It&apos;s meant{' '}
                <span className="hl">valuable goods that someone in power decided you shouldn&apos;t have access to.</span>{' '}
                Spices. Books. Ideas. Information. Currency.
              </p>
              <p>
                The ₿ isn&apos;t an accident. Bitcoin represents something that was supposed to be
                impossible: value that moves without permission — an expression of what contraband
                has always been.
              </p>
            </div>
          </div>
        </section>

        <SiteFooter />
      </div>
    </>
  );
}
