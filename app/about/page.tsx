'use client';

import Image from 'next/image';
import { useTheme } from '@/contexts/ThemeContext';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import ThemeToggle from '@/components/ThemeToggle';

export default function AboutPage() {
  const { isLightMode } = useTheme();

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Space+Mono:wght@400;700&display=swap');

        .contraband-about-page {
          background: var(--cb-bg);
          color: var(--cb-text);
          font-family: 'Space Mono', monospace;
          font-size: 13px;
          line-height: 1.7;
          overflow-x: hidden;
          min-height: 100vh;
        }

        .about-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8rem 48px;
        }

        .about-content {
          max-width: 700px;
        }

        .about-content-logo {
          width: 100px;
          height: 100px;
          margin-bottom: 48px;
          opacity: 0;
          animation: fadeUp 1s ease 0.2s forwards;
        }

        .section-label {
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--cb-accent);
          margin-bottom: 32px;
          opacity: 0;
          animation: fadeUp 1s ease 0.3s forwards;
        }

        .about-text {
          font-family: var(--cb-font-display, 'Cormorant Garamond', serif);
          font-size: 1.4rem;
          line-height: 1.9;
          color: var(--cb-text);
        }

        .about-text p {
          margin-bottom: 1.75rem;
          opacity: 0;
          animation: fadeUp 1s ease forwards;
        }

        .about-text p:nth-child(1) { animation-delay: 0.4s; }
        .about-text p:nth-child(2) { animation-delay: 0.5s; }
        .about-text p:nth-child(3) { animation-delay: 0.6s; }
        .about-text p:nth-child(4) { animation-delay: 0.7s; }

        .about-text p:last-child {
          margin-bottom: 0;
        }

        .highlight-text {
          color: var(--cb-accent);
        }

        .definition {
          font-family: 'Space Mono', monospace;
          font-size: 1rem;
          color: var(--cb-text-muted);
          margin-bottom: 1.75rem;
        }

        .definition strong {
          color: var(--cb-text);
        }

        .definition em {
          color: var(--cb-text-muted);
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        :global(.about-custom-footer) {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          border-top: none;
        }

        @media (max-width: 768px) {
          .about-container {
            padding: 6rem 32px;
            align-items: flex-start;
            padding-top: 10rem;
          }

          .about-text {
            font-size: 1.2rem;
          }

          :global(.about-custom-footer) {
            position: relative;
            padding: 48px 32px;
          }
        }
      `}</style>

      <div className={`contraband-about-page ${isLightMode ? 'light-mode' : ''}`}>
        <ThemeToggle />

        <SiteNav activePath="/about" />

        <main className="about-container">
          <div className="about-content">
            <Image
              className="about-content-logo"
              src="/contraband-logo-v3.png"
              alt="Contraband"
              width={100}
              height={100}
            />
            <div className="section-label">The Name</div>
            <div className="about-text">
              <p className="definition"><strong>con·tra·band</strong> <em>/ˈkäntrəˌband/</em> — goods that have been imported or exported illegally; trade that is prohibited by law.</p>
              <p>Throughout history, contraband hasn't just meant illegal goods. It's meant <span className="highlight-text">valuable goods that someone in power decided you shouldn't have access to.</span> Spices. Books. Ideas. Information. Currency.</p>
              <p>The ₿ isn't an accident. Bitcoin represents something that was supposed to be impossible: value that moves without permission. An expression of what contraband has always been.</p>
            </div>
          </div>
        </main>

        <SiteFooter className="about-custom-footer" />
      </div>
    </>
  );
}
