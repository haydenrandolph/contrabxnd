'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export default function HomePage() {
  const [email, setEmail] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const { isLightMode, toggleTheme } = useTheme();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle subscription
    console.log('Subscribe:', email);
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Space+Mono:wght@400;700&display=swap');

        :root {
          --contraband-black: #0a0a0a;
          --contraband-off-black: #141414;
          --contraband-dark-gray: #1a1a1a;
          --contraband-mid-gray: #3a3a3a;
          --contraband-light-gray: #8a8a8a;
          --contraband-cream: #e8e4dc;
          --contraband-rust: #F7931A;
          --contraband-rust-light: #ff6600;
          --contraband-white: #f5f3f0;
          --contraband-font-display: 'Cormorant Garamond', serif;
          --contraband-font-mono: 'Space Mono', monospace;
        }

        .contraband-page {
          background: var(--contraband-black);
          color: var(--contraband-cream);
          font-family: var(--contraband-font-mono);
          font-size: 14px;
          line-height: 1.7;
          overflow-x: hidden;
          min-height: 100vh;
          transition: background 0.3s ease, color 0.3s ease;
        }

        .contraband-page.light-mode {
          background: var(--contraband-cream);
          color: var(--contraband-black);
        }

        .contraband-page.light-mode .contraband-content-card {
          background: var(--contraband-white);
          border-color: #d0ccc4;
        }

        .contraband-page.light-mode .contraband-featured-content {
          background: var(--contraband-white);
        }

        .contraband-page.light-mode .contraband-featured-image::after {
          background: linear-gradient(45deg, var(--contraband-rust) 0%, var(--contraband-cream) 100%);
        }

        .contraband-page.light-mode .contraband-subscribe-section {
          background: var(--contraband-white);
          border-color: #d0ccc4;
        }

        .contraband-page.light-mode .contraband-subscribe-form input {
          background: var(--contraband-cream);
          border-color: #d0ccc4;
          color: var(--contraband-black);
        }

        .contraband-page.light-mode .contraband-subscribe-form input::placeholder {
          color: var(--contraband-mid-gray);
        }

        .contraband-page.light-mode .contraband-section-header {
          border-color: #d0ccc4;
        }

        .contraband-page.light-mode .contraband-footer {
          border-color: #d0ccc4;
        }

        .contraband-page::before {
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

        .contraband-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          padding: 2rem 3rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 100;
          mix-blend-mode: difference;
        }

        .contraband-page.light-mode .contraband-nav {
          mix-blend-mode: normal;
        }

        .contraband-page.light-mode .contraband-logo,
        .contraband-page.light-mode .contraband-nav-links a {
          color: var(--contraband-black);
        }

        .contraband-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
          color: var(--contraband-white);
        }

        .contraband-logo-text {
          font-family: var(--contraband-font-mono);
          font-size: 11px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
        }

        .contraband-nav-links {
          display: flex;
          gap: 3rem;
        }

        .contraband-nav-links a {
          color: var(--contraband-white);
          text-decoration: none;
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          position: relative;
          padding: 0.25rem 0;
        }

        .contraband-nav-links a::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 1px;
          background: var(--contraband-rust);
          transition: width 0.3s ease;
        }

        .contraband-nav-links a:hover::after {
          width: 100%;
        }

        .contraband-nav-links a.coming-soon {
          text-decoration: line-through;
          opacity: 0.5;
          cursor: not-allowed;
        }

        .contraband-nav-links a.coming-soon:hover::after {
          width: 0;
        }

        /* Mobile Menu Button */
        .mobile-menu-btn {
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

        .mobile-menu-btn span {
          display: block;
          width: 24px;
          height: 2px;
          background: var(--contraband-white);
          transition: all 0.3s ease;
          margin: 3px 0;
        }

        .contraband-page.light-mode .mobile-menu-btn span {
          background: var(--contraband-black);
        }

        .mobile-menu-btn.open span:nth-child(1) {
          transform: rotate(45deg) translate(5px, 5px);
        }

        .mobile-menu-btn.open span:nth-child(2) {
          opacity: 0;
        }

        .mobile-menu-btn.open span:nth-child(3) {
          transform: rotate(-45deg) translate(6px, -6px);
        }

        /* Mobile Menu Overlay */
        .mobile-menu-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: var(--contraband-black);
          z-index: 999;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.3s ease, visibility 0.3s ease;
        }

        .contraband-page.light-mode .mobile-menu-overlay {
          background: var(--contraband-cream);
        }

        .mobile-menu-overlay.open {
          opacity: 1;
          visibility: visible;
        }

        .mobile-menu-nav {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
        }

        .mobile-menu-nav a {
          font-family: var(--contraband-font-display);
          font-size: 2rem;
          color: var(--contraband-cream);
          text-decoration: none;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          transition: color 0.3s ease;
        }

        .contraband-page.light-mode .mobile-menu-nav a {
          color: var(--contraband-black);
        }

        .mobile-menu-nav a:active {
          color: var(--contraband-rust);
        }

        .mobile-menu-nav a.coming-soon {
          text-decoration: line-through;
          opacity: 0.5;
        }

        .mobile-menu-close-area {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: -1;
        }

        .contraband-theme-toggle {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: var(--contraband-rust);
          border: 2px solid var(--contraband-rust);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          transition: all 0.3s ease;
        }

        .contraband-theme-toggle:hover {
          background: var(--contraband-rust-light);
          transform: scale(1.1);
        }

        .contraband-theme-toggle svg {
          width: 24px;
          height: 24px;
          stroke: var(--contraband-white);
        }

        .contraband-page.light-mode .contraband-theme-toggle {
          background: var(--contraband-black);
          border-color: var(--contraband-black);
        }

        .contraband-page.light-mode .contraband-theme-toggle:hover {
          background: var(--contraband-off-black);
        }

        .contraband-hero {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          position: relative;
          padding: 0 3rem;
        }

        .contraband-hero-symbol {
          width: 180px;
          height: 180px;
          margin-bottom: 3rem;
          opacity: 0;
          animation: fadeUp 1s ease 0.3s forwards;
          object-fit: contain;
        }

        .contraband-hero-title {
          font-family: var(--contraband-font-display);
          font-size: clamp(3rem, 10vw, 8rem);
          font-weight: 400;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          text-align: center;
          opacity: 0;
          animation: fadeUp 1s ease 0.5s forwards;
        }

        .contraband-hero-subtitle {
          font-size: 12px;
          letter-spacing: 0.4em;
          text-transform: uppercase;
          color: var(--contraband-rust);
          margin-top: 1.5rem;
          text-align: center;
          opacity: 0;
          animation: fadeUp 1s ease 0.9s forwards;
        }

        .contraband-hero-tagline {
          font-family: var(--contraband-font-display);
          font-size: clamp(1.1rem, 2vw, 1.4rem);
          font-style: italic;
          color: var(--contraband-cream);
          margin-top: 2rem;
          opacity: 0;
          animation: fadeUp 1s ease 0.7s forwards;
        }

        .contraband-scroll-indicator {
          position: absolute;
          bottom: 3rem;
          left: 0;
          right: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          opacity: 0;
          animation: fadeUp 1s ease 1.2s forwards;
        }

        .contraband-scroll-indicator span {
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--contraband-light-gray);
        }

        .contraband-scroll-line {
          width: 1px;
          height: 40px;
          background: linear-gradient(to bottom, var(--contraband-rust), transparent);
          animation: scrollPulse 2s ease infinite;
        }

        @keyframes scrollPulse {
          0%, 100% { transform: scaleY(1); opacity: 1; }
          50% { transform: scaleY(0.6); opacity: 0.5; }
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .contraband-section {
          padding: 8rem 3rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .contraband-section-header {
          display: flex;
          align-items: baseline;
          gap: 2rem;
          margin-bottom: 4rem;
          border-bottom: 1px solid var(--contraband-mid-gray);
          padding-bottom: 1.5rem;
        }

        .contraband-section-number {
          font-family: var(--contraband-font-display);
          font-size: 3rem;
          color: var(--contraband-rust);
          line-height: 1;
        }

        .contraband-section-title {
          font-family: var(--contraband-font-display);
          font-size: 2.5rem;
          font-weight: 400;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .contraband-content-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 2rem;
        }

        .contraband-content-card {
          background: var(--contraband-off-black);
          border: 1px solid var(--contraband-dark-gray);
          padding: 2.5rem;
          position: relative;
          transition: all 0.4s ease;
          cursor: pointer;
        }

        .contraband-content-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, var(--contraband-rust) 0%, transparent 50%);
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        .contraband-content-card:hover {
          border-color: var(--contraband-rust);
          transform: translateY(-4px);
        }

        .contraband-content-card:hover::before {
          opacity: 0.05;
        }

        .contraband-card-type {
          font-size: 10px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: var(--contraband-rust);
          margin-bottom: 1rem;
          position: relative;
          z-index: 1;
        }

        .contraband-card-title {
          font-family: var(--contraband-font-display);
          font-size: 1.6rem;
          font-weight: 400;
          line-height: 1.3;
          margin-bottom: 1rem;
          position: relative;
          z-index: 1;
        }

        .contraband-card-excerpt {
          color: var(--contraband-light-gray);
          font-size: 13px;
          line-height: 1.8;
          margin-bottom: 1.5rem;
          position: relative;
          z-index: 1;
        }

        .contraband-card-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          color: var(--contraband-light-gray);
          position: relative;
          z-index: 1;
        }

        .contraband-card-arrow {
          width: 24px;
          height: 24px;
          stroke: var(--contraband-rust);
          transition: transform 0.3s ease;
        }

        .contraband-content-card:hover .contraband-card-arrow {
          transform: translateX(4px);
        }

        .contraband-featured {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          margin-bottom: 4rem;
          border: 1px solid var(--contraband-mid-gray);
        }

        .contraband-featured-image {
          background: var(--contraband-dark-gray);
          min-height: 400px;
          position: relative;
          overflow: hidden;
        }

        .contraband-featured-image::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, var(--contraband-rust) 0%, var(--contraband-black) 100%);
          opacity: 0.3;
        }

        .contraband-featured-content {
          padding: 4rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: var(--contraband-off-black);
        }

        .contraband-featured-label {
          font-size: 10px;
          letter-spacing: 0.4em;
          text-transform: uppercase;
          color: var(--contraband-rust);
          margin-bottom: 1.5rem;
        }

        .contraband-featured-title {
          font-family: var(--contraband-font-display);
          font-size: 2.2rem;
          font-weight: 400;
          line-height: 1.3;
          margin-bottom: 1.5rem;
        }

        .contraband-featured-excerpt {
          color: var(--contraband-light-gray);
          font-size: 14px;
          line-height: 1.9;
          margin-bottom: 2rem;
        }

        .contraband-btn {
          display: inline-flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 2rem;
          background: transparent;
          border: 1px solid var(--contraband-cream);
          color: var(--contraband-cream);
          font-family: var(--contraband-font-mono);
          font-size: 11px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .contraband-btn:hover {
          background: var(--contraband-cream);
          color: var(--contraband-black);
        }

        .contraband-btn svg {
          width: 16px;
          height: 16px;
          transition: transform 0.3s ease;
        }

        .contraband-btn:hover svg {
          transform: translateX(4px);
        }

        .contraband-subscribe-section {
          background: var(--contraband-off-black);
          border: 1px solid var(--contraband-mid-gray);
          padding: 5rem;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .contraband-subscribe-section::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle at center, var(--contraband-rust) 0%, transparent 70%);
          opacity: 0.03;
        }

        .contraband-subscribe-title {
          font-family: var(--contraband-font-display);
          font-size: 2.5rem;
          font-weight: 400;
          margin-bottom: 1rem;
          position: relative;
        }

        .contraband-subscribe-text {
          color: var(--contraband-light-gray);
          margin-bottom: 2.5rem;
          max-width: 500px;
          margin-left: auto;
          margin-right: auto;
          position: relative;
        }

        .contraband-subscribe-form {
          display: flex;
          justify-content: center;
          gap: 0;
          max-width: 500px;
          margin: 0 auto;
          position: relative;
        }

        .contraband-subscribe-form input {
          flex: 1;
          padding: 1rem 1.5rem;
          background: var(--contraband-black);
          border: 1px solid var(--contraband-mid-gray);
          border-right: none;
          color: var(--contraband-cream);
          font-family: var(--contraband-font-mono);
          font-size: 13px;
        }

        .contraband-subscribe-form input::placeholder {
          color: var(--contraband-light-gray);
        }

        .contraband-subscribe-form input:focus {
          outline: none;
          border-color: var(--contraband-rust);
        }

        .contraband-subscribe-form button {
          padding: 1rem 2rem;
          background: var(--contraband-rust);
          border: 1px solid var(--contraband-rust);
          color: var(--contraband-white);
          font-family: var(--contraband-font-mono);
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .contraband-subscribe-form button:hover {
          background: var(--contraband-rust-light);
          border-color: var(--contraband-rust-light);
        }

        .contraband-footer {
          padding: 4rem 3rem;
          border-top: 1px solid var(--contraband-dark-gray);
          max-width: 1400px;
          margin: 0 auto;
        }

        .contraband-footer-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .contraband-footer-left {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .contraband-footer-copy {
          font-size: 12px;
          color: var(--contraband-light-gray);
        }

        .contraband-footer-links {
          display: flex;
          gap: 2rem;
        }

        .contraband-footer-links a {
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--contraband-light-gray);
          text-decoration: none;
          transition: color 0.3s ease;
        }

        .contraband-footer-links a:hover {
          color: var(--contraband-rust);
        }

        @media (max-width: 900px) {
          .contraband-nav {
            padding: 1.5rem 2rem;
          }

          .contraband-nav-links {
            display: none;
          }

          .mobile-menu-btn {
            display: flex;
          }

          .contraband-section {
            padding: 5rem 2rem;
          }

          .contraband-featured {
            grid-template-columns: 1fr;
          }

          .contraband-featured-image {
            min-height: 250px;
          }

          .contraband-subscribe-section {
            padding: 3rem 2rem;
          }

          .contraband-subscribe-form {
            flex-direction: column;
          }

          .contraband-subscribe-form input {
            border-right: 1px solid var(--contraband-mid-gray);
            border-bottom: none;
          }

          .contraband-footer-content {
            flex-direction: column;
            gap: 2rem;
            text-align: center;
          }

          .contraband-footer-left {
            flex-direction: column;
          }

          .contraband-hero {
            padding: 0 2rem;
          }
        }
      `}</style>

      <div className={`contraband-page ${isLightMode ? 'light-mode' : ''}`}>
        {/* Theme Toggle Button */}
        <button
          className="contraband-theme-toggle"
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

        <nav className="contraband-nav">
          <Link href="/" className="contraband-logo">
            <Image
              src="/contraband-logo-v3.png"
              alt="Contraband logo"
              width={40}
              height={40}
              className="contraband-logo-mark"
            />
            <span className="contraband-logo-text">Contra₿and</span>
          </Link>
          <div className="contraband-nav-links">
            <Link href="/learn">Stu₿y</Link>
            <Link href="/writings">Writings</Link>
            <a href="#podcasts" className="coming-soon">Podcasts</a>
            <a href="#videos" className="coming-soon">Videos</a>
            <a href="#merch" className="coming-soon">Merch</a>
            <Link href="/about">About</Link>
          </div>
          <button
            className={`mobile-menu-btn ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </nav>

        {/* Mobile Menu Overlay */}
        <div className={`mobile-menu-overlay ${menuOpen ? 'open' : ''}`}>
          <nav className="mobile-menu-nav">
            <Link href="/learn" onClick={() => setMenuOpen(false)}>Stu₿y</Link>
            <Link href="/writings" onClick={() => setMenuOpen(false)}>Writings</Link>
            <a href="#podcasts" className="coming-soon">Podcasts</a>
            <a href="#videos" className="coming-soon">Videos</a>
            <a href="#merch" className="coming-soon">Merch</a>
            <Link href="/about" onClick={() => setMenuOpen(false)}>About</Link>
          </nav>
        </div>

        <section className="contraband-hero">
          <Image
            src="/contraband-logo-v3.png"
            alt="Contraband symbol"
            width={180}
            height={180}
            className="contraband-hero-symbol"
          />
          <h1 className="contraband-hero-title">Contra₿and</h1>
          <p className="contraband-hero-tagline">Ideas that refuse to stay buried</p>
          <p className="contraband-hero-subtitle">Stu₿y · Writings · Podcasts · Videos · Merch</p>

          <div className="contraband-scroll-indicator">
            <span>Explore</span>
            <div className="contraband-scroll-line"></div>
          </div>
        </section>

        <section id="writings" className="contraband-section">
          <div className="contraband-section-header">
            <span className="contraband-section-number">01</span>
            <h2 className="contraband-section-title">Writings</h2>
          </div>

          <Link href="/writings/why-trump-1m-btc" className="contraband-featured">
            <div className="contraband-featured-image"></div>
            <div className="contraband-featured-content">
              <span className="contraband-featured-label">Featured Essay</span>
              <h3 className="contraband-featured-title">Letters of Marque for the Digital Age</h3>
              <p className="contraband-featured-excerpt">When states embrace what they once called piracy.</p>
              <span className="contraband-btn">
                Read Now
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </span>
            </div>
          </Link>

          <div className="contraband-content-grid">
            <Link href="/writings/bankmore" className="contraband-content-card">
              <span className="contraband-card-type">Essay</span>
              <h3 className="contraband-card-title">The Pirate's Guide to Banking</h3>
              <p className="contraband-card-excerpt">Why leaving the harbor means carrying more treasure.</p>
              <div className="contraband-card-meta">
                <span>15 min read</span>
                <svg className="contraband-card-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            </Link>
            <Link href="/writings/nation-or-network" className="contraband-content-card">
              <span className="contraband-card-type">Analysis</span>
              <h3 className="contraband-card-title">The Network Eats the Nation</h3>
              <p className="contraband-card-excerpt">Borders are lines on maps. Networks are lines of code.</p>
              <div className="contraband-card-meta">
                <span>10 min read</span>
                <svg className="contraband-card-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            </Link>
            <Link href="/writings/when-did-i-sign" className="contraband-content-card">
              <span className="contraband-card-type">Essay</span>
              <h3 className="contraband-card-title">The Contract You Never Signed</h3>
              <p className="contraband-card-excerpt">You can't breach an agreement you never made.</p>
              <div className="contraband-card-meta">
                <span>7 min read</span>
                <svg className="contraband-card-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            </Link>
          </div>
        </section>

        <section className="contraband-section">
          <div className="contraband-subscribe-section">
            <h2 className="contraband-subscribe-title">Join the Crew</h2>
            <p className="contraband-subscribe-text">Get contraband delivered straight to your inbox. No spam, just ideas worth smuggling.</p>
            <form className="contraband-subscribe-form" onSubmit={handleSubmit}>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit">Subscribe</button>
            </form>
          </div>
        </section>

        <footer className="contraband-footer">
          <div className="contraband-footer-content">
            <div className="contraband-footer-left">
              <Image
                src="/contraband-logo-v3.png"
                alt="Contraband logo"
                width={32}
                height={32}
                className="contraband-footer-logo"
              />
              <span className="contraband-footer-copy">© 2025 Contraband. All rights reserved.</span>
            </div>
            <div className="contraband-footer-links">
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
