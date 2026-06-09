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
          background: #0a0a0a;
          color: #e8e4dc;
          font-family: 'Space Mono', monospace;
          font-size: 14px;
          line-height: 1.7;
          overflow-x: hidden;
          min-height: 100vh;
        }

        .contraband-about-page.light-mode {
          background: #e8e4dc;
          color: #0a0a0a;
        }

        .contraband-about-page::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          opacity: 0.03;
          pointer-events: none;
          z-index: 1000;
        }

        .about-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8rem 3rem;
        }

        .about-content {
          max-width: 700px;
        }

        .about-content-logo {
          width: 100px;
          height: 100px;
          margin-bottom: 3rem;
          opacity: 0;
          animation: fadeUp 1s ease 0.2s forwards;
        }

        .section-label {
          font-size: 10px;
          letter-spacing: 0.4em;
          text-transform: uppercase;
          color: #F7931A;
          margin-bottom: 2rem;
          opacity: 0;
          animation: fadeUp 1s ease 0.3s forwards;
        }

        .about-text {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.4rem;
          line-height: 1.9;
          color: #e8e4dc;
        }

        .contraband-about-page.light-mode .about-text {
          color: #0a0a0a;
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
          color: #d4854c;
        }

        .definition {
          font-family: 'Space Mono', monospace;
          font-size: 1rem;
          color: #8a8a8a;
          margin-bottom: 1.75rem;
        }

        .contraband-about-page.light-mode .definition {
          color: #5a5a5a;
        }

        .definition strong {
          color: #e8e4dc;
        }

        .contraband-about-page.light-mode .definition strong {
          color: #0a0a0a;
        }

        .definition em {
          color: #3a3a3a;
        }

        .contraband-about-page.light-mode .definition em {
          color: #8a8a8a;
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
            padding: 6rem 2rem;
            align-items: flex-start;
            padding-top: 10rem;
          }

          .about-text {
            font-size: 1.2rem;
          }

          :global(.about-custom-footer) {
            position: relative;
            padding: 3rem 2rem;
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
