'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export default function AboutPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isLightMode, toggleTheme } = useTheme();

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

        .about-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          padding: 2rem 3rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 100;
          background: linear-gradient(to bottom, #0a0a0a 0%, transparent 100%);
        }

        .contraband-about-page.light-mode .about-nav {
          background: linear-gradient(to bottom, #e8e4dc 0%, transparent 100%);
        }

        .about-logo-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
          color: #f5f3f0;
        }

        .contraband-about-page.light-mode .about-logo-link {
          color: #0a0a0a;
        }

        .about-logo-text {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
        }

        .about-nav-links {
          display: flex;
          gap: 3rem;
        }

        .about-nav-links a {
          color: #f5f3f0;
          text-decoration: none;
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          position: relative;
          padding: 0.25rem 0;
        }

        .contraband-about-page.light-mode .about-nav-links a {
          color: #0a0a0a;
        }

        .about-nav-links a::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 1px;
          background: #F7931A;
          transition: width 0.3s ease;
        }

        .about-nav-links a:hover::after,
        .about-nav-links a.active::after {
          width: 100%;
        }

        .about-nav-links a.coming-soon {
          text-decoration: line-through;
          opacity: 0.5;
          cursor: not-allowed;
        }

        .about-nav-links a.coming-soon:hover::after {
          width: 0;
        }

        .about-mobile-menu-btn {
          display: none;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          width: 44px;
          height: 44px;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0;
          z-index: 1001;
        }

        .about-mobile-menu-btn span {
          display: block;
          width: 24px;
          height: 2px;
          background: #f5f3f0;
          transition: all 0.3s ease;
          margin: 3px 0;
        }

        .contraband-about-page.light-mode .about-mobile-menu-btn span {
          background: #0a0a0a;
        }

        .about-mobile-menu-btn.open span:nth-child(1) {
          transform: rotate(45deg) translate(5px, 5px);
        }

        .about-mobile-menu-btn.open span:nth-child(2) {
          opacity: 0;
        }

        .about-mobile-menu-btn.open span:nth-child(3) {
          transform: rotate(-45deg) translate(6px, -6px);
        }

        .about-mobile-menu-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: #0a0a0a;
          z-index: 999;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.3s ease, visibility 0.3s ease;
        }

        .contraband-about-page.light-mode .about-mobile-menu-overlay {
          background: #e8e4dc;
        }

        .about-mobile-menu-overlay.open {
          opacity: 1;
          visibility: visible;
        }

        .about-mobile-menu-nav {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
        }

        .about-mobile-menu-nav a {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2rem;
          color: #e8e4dc;
          text-decoration: none;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          transition: color 0.3s ease;
        }

        .contraband-about-page.light-mode .about-mobile-menu-nav a {
          color: #0a0a0a;
        }

        .about-mobile-menu-nav a:active {
          color: #F7931A;
        }

        .about-mobile-menu-nav a.coming-soon {
          text-decoration: line-through;
          opacity: 0.5;
        }

        .about-theme-toggle {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: #1a1a1a;
          border: 1px solid #3a3a3a;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 1001;
          transition: all 0.3s ease;
        }

        .about-theme-toggle:hover {
          background: #F7931A;
          border-color: #F7931A;
          transform: scale(1.1);
        }

        .about-theme-toggle svg {
          width: 24px;
          height: 24px;
          stroke: #e8e4dc;
        }

        .contraband-about-page.light-mode .about-theme-toggle {
          background: #f5f3f0;
          border-color: #c8c4bc;
        }

        .contraband-about-page.light-mode .about-theme-toggle svg {
          stroke: #070713;
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

        .about-footer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 2rem 3rem;
        }

        .about-footer-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .about-footer-left {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .about-footer-copy {
          font-size: 11px;
          color: #3a3a3a;
        }

        .contraband-about-page.light-mode .about-footer-copy {
          color: #8a8a8a;
        }

        .about-footer-links {
          display: flex;
          gap: 2rem;
        }

        .about-footer-links a {
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #8a8a8a;
          text-decoration: none;
          transition: color 0.3s ease;
        }

        .about-footer-links a:hover {
          color: #F7931A;
        }

        @media (max-width: 768px) {
          .about-nav {
            padding: 1.5rem 2rem;
          }

          .about-nav-links {
            display: none;
          }

          .about-mobile-menu-btn {
            display: flex;
          }

          .about-container {
            padding: 6rem 2rem;
            align-items: flex-start;
            padding-top: 10rem;
          }

          .about-text {
            font-size: 1.2rem;
          }

          .about-footer-content {
            flex-direction: column;
            gap: 2rem;
            text-align: center;
          }

          .about-footer-left {
            flex-direction: column;
          }

          .about-footer {
            position: relative;
            padding: 3rem 2rem;
          }
        }
      `}</style>

      <div className={`contraband-about-page ${isLightMode ? 'light-mode' : ''}`}>
        <button
          className="about-theme-toggle"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {isLightMode ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          )}
        </button>

        <nav className="about-nav">
          <Link href="/" className="about-logo-link">
            <Image
              src="/contraband-logo-v3.png"
              alt="Contraband logo"
              width={40}
              height={40}
            />
            <span className="about-logo-text">Contra₿and</span>
          </Link>
          <div className="about-nav-links">
            <Link href="/learn">Stu₿y</Link>
            <Link href="/writings">Writings</Link>
            <a href="#podcasts" className="coming-soon">Podcasts</a>
            <a href="#videos" className="coming-soon">Videos</a>
            <a href="#merch" className="coming-soon">Merch</a>
            <Link href="/about" className="active">About</Link>
          </div>
          <button
            className={`about-mobile-menu-btn ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </nav>

        <div className={`about-mobile-menu-overlay ${menuOpen ? 'open' : ''}`}>
          <nav className="about-mobile-menu-nav">
            <Link href="/learn" onClick={() => setMenuOpen(false)}>Stu₿y</Link>
            <Link href="/writings" onClick={() => setMenuOpen(false)}>Writings</Link>
            <a href="#podcasts" className="coming-soon">Podcasts</a>
            <a href="#videos" className="coming-soon">Videos</a>
            <a href="#merch" className="coming-soon">Merch</a>
            <Link href="/about" onClick={() => setMenuOpen(false)}>About</Link>
          </nav>
        </div>

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

        <footer className="about-footer">
          <div className="about-footer-content">
            <div className="about-footer-left">
              <Image
                src="/contraband-logo-v3.png"
                alt="Contraband logo"
                width={32}
                height={32}
              />
              <span className="about-footer-copy">© 2025 Contraband. All rights reserved.</span>
            </div>
            <div className="about-footer-links">
              <a href="https://x.com/contrabxnd" target="_blank" rel="noopener noreferrer">Twitter</a>
              <a href="https://youtube.com/@contrabxnd" target="_blank" rel="noopener noreferrer">YouTube</a>
              <a href="#">RSS</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
