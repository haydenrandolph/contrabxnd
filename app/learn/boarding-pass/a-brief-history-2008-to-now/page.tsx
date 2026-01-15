'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';

export default function BoardingPassLesson06() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isLightMode, toggleTheme } = useTheme();

  useEffect(() => {
    document.title = 'A Brief History: 2008 to Now | Contraband';
  }, []);

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Space+Mono:wght@400;700&display=swap');

        :root {
          --safe-top: env(safe-area-inset-top);
          --safe-bottom: env(safe-area-inset-bottom);
        }

        * {
          -webkit-tap-highlight-color: transparent;
        }

        .lesson-page {
          background: #0a0a0a;
          color: #e8e4dc;
          font-family: 'Space Mono', monospace;
          font-size: 14px;
          line-height: 1.7;
          overflow-x: hidden;
          min-height: 100vh;
          -webkit-font-smoothing: antialiased;
        }

        .lesson-page.light-mode {
          background: #e8e4dc;
          color: #0a0a0a;
        }

        .lesson-page::before {
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

        .progress-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: #1a1a1a;
          z-index: 200;
        }

        .lesson-page.light-mode .progress-container {
          background: #d8d4cc;
        }

        .progress-bar {
          height: 100%;
          background: #F7931A;
          width: 28.57%;
          transition: width 0.3s ease;
        }

        .lesson-nav {
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
          margin-top: 3px;
        }

        .lesson-page.light-mode .lesson-nav {
          background: linear-gradient(to bottom, #e8e4dc 0%, transparent 100%);
        }

        .lesson-logo-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
          color: #f5f3f0;
        }

        .lesson-page.light-mode .lesson-logo-link {
          color: #0a0a0a;
        }

        .lesson-logo-text {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
        }

        .lesson-nav-links {
          display: flex;
          gap: 3rem;
        }

        .mobile-back-btn {
          display: none;
          align-items: center;
          gap: 0.5rem;
          color: #8a8a8a;
          text-decoration: none;
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 0.5rem;
          margin: -0.5rem;
        }

        .mobile-back-btn svg {
          width: 18px;
          height: 18px;
        }

        .mobile-back-btn:active {
          color: #F7931A;
        }

        .lesson-page.light-mode .mobile-back-btn {
          color: #5a5a5a;
        }

        .lesson-page.light-mode .mobile-back-btn:active {
          color: #F7931A;
        }

        .lesson-nav-links a {
          color: #f5f3f0;
          text-decoration: none;
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          position: relative;
          padding: 0.25rem 0;
        }

        .lesson-page.light-mode .lesson-nav-links a {
          color: #0a0a0a;
        }

        .lesson-nav-links a::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 1px;
          background: #F7931A;
          transition: width 0.3s ease;
        }

        .lesson-nav-links a:hover::after,
        .lesson-nav-links a.active::after {
          width: 100%;
        }

        .lesson-nav-links a.coming-soon {
          text-decoration: line-through;
          opacity: 0.5;
          cursor: not-allowed;
        }

        .lesson-nav-links a.coming-soon:hover::after {
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
          background: #e8e4dc;
          transition: all 0.3s ease;
          margin: 3px 0;
        }

        .lesson-page.light-mode .mobile-menu-btn span {
          background: #0a0a0a;
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

        .lesson-page.light-mode .mobile-menu-overlay {
          background: #e8e4dc;
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
          font-family: 'Cormorant Garamond', serif;
          font-size: 2rem;
          color: #e8e4dc;
          text-decoration: none;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          transition: color 0.3s ease;
        }

        .lesson-page.light-mode .mobile-menu-nav a {
          color: #0a0a0a;
        }

        .mobile-menu-nav a:active {
          color: #F7931A;
        }

        .mobile-menu-nav a.coming-soon {
          text-decoration: line-through;
          opacity: 0.5;
        }


        .lesson-theme-toggle {
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

        .lesson-theme-toggle:hover {
          background: #F7931A;
          border-color: #F7931A;
          transform: scale(1.1);
        }

        .lesson-theme-toggle svg {
          width: 24px;
          height: 24px;
          stroke: #e8e4dc;
        }

        .lesson-page.light-mode .lesson-theme-toggle {
          background: #f5f3f0;
          border-color: #c8c4bc;
        }

        .lesson-page.light-mode .lesson-theme-toggle svg {
          stroke: #070713;
        }

        .lesson-header {
          padding: 10rem 3rem 3rem;
          max-width: 800px;
          margin: 0 auto;
        }

        .lesson-breadcrumb {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 2rem;
        }

        .breadcrumb-link {
          color: #8a8a8a;
          text-decoration: none;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          transition: color 0.3s ease;
        }

        .breadcrumb-link:hover {
          color: #F7931A;
        }

        .breadcrumb-sep {
          color: #3a3a3a;
          font-size: 10px;
        }

        .breadcrumb-current {
          color: #e8e4dc;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .lesson-page.light-mode .breadcrumb-current {
          color: #0a0a0a;
        }

        .lesson-meta {
          display: flex;
          align-items: center;
          gap: 2rem;
          margin-bottom: 1.5rem;
        }

        .lesson-number {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1rem;
          color: #F7931A;
        }

        .lesson-week,
        .lesson-duration {
          font-size: 11px;
          color: #3a3a3a;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .lesson-page.light-mode .lesson-week,
        .lesson-page.light-mode .lesson-duration {
          color: #8a8a8a;
        }

        .lesson-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(2rem, 5vw, 3rem);
          font-weight: 400;
          line-height: 1.2;
          margin-bottom: 1rem;
        }

        .lesson-page.light-mode .lesson-title {
          color: #0a0a0a;
        }

        .lesson-subtitle {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.25rem;
          font-style: italic;
          color: #8a8a8a;
        }

        .lesson-content {
          max-width: 700px;
          margin: 0 auto;
          padding: 3rem 3rem 4rem;
        }

        .lesson-content p {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.25rem;
          line-height: 1.9;
          margin-bottom: 1.75rem;
          color: #e8e4dc;
        }

        .lesson-page.light-mode .lesson-content p {
          color: #0a0a0a;
        }

        .lesson-content p:first-of-type::first-letter {
          font-size: 4rem;
          float: left;
          line-height: 1;
          margin-right: 0.75rem;
          margin-top: 0.25rem;
          color: #F7931A;
        }

        .lesson-content h2 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.75rem;
          font-weight: 400;
          margin: 3rem 0 1.5rem;
          color: #f5f3f0;
        }

        .lesson-page.light-mode .lesson-content h2 {
          color: #0a0a0a;
        }

        .lesson-content h3 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.35rem;
          font-weight: 400;
          margin: 2.5rem 0 1rem;
          color: #f5f3f0;
        }

        .lesson-page.light-mode .lesson-content h3 {
          color: #0a0a0a;
        }

        .lesson-content ul,
        .lesson-content ol {
          margin: 1.5rem 0;
          padding-left: 1.5rem;
        }

        .lesson-content li {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.15rem;
          line-height: 1.8;
          margin-bottom: 0.75rem;
          color: #e8e4dc;
        }

        .lesson-page.light-mode .lesson-content li {
          color: #0a0a0a;
        }

        .lesson-content strong {
          color: #f5f3f0;
          font-weight: 600;
        }

        .lesson-page.light-mode .lesson-content strong {
          color: #0a0a0a;
        }

        .lesson-content a {
          color: #F7931A;
          text-decoration: none;
          border-bottom: 1px solid transparent;
          transition: border-color 0.3s ease;
        }

        .lesson-content a:hover {
          border-bottom-color: #F7931A;
        }

        .lesson-content em {
          font-style: italic;
        }

        .key-concept {
          background: #141414;
          border: 1px solid #3a3a3a;
          padding: 2rem;
          margin: 2.5rem 0;
          text-align: center;
        }

        .lesson-page.light-mode .key-concept {
          background: #f5f3f0;
          border-color: #d8d4cc;
        }

        .key-concept-label {
          font-size: 9px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: #F7931A;
          margin-bottom: 1rem;
        }

        .key-concept-text {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.5rem;
          font-style: italic;
          line-height: 1.5;
          color: #e8e4dc;
          margin: 0;
        }

        .lesson-page.light-mode .key-concept-text {
          color: #0a0a0a;
        }

        .highlight-box {
          background: #141414;
          border: 1px solid #1a1a1a;
          border-left: 3px solid #F7931A;
          padding: 1.5rem 2rem;
          margin: 2rem 0;
        }

        .lesson-page.light-mode .highlight-box {
          background: #f5f3f0;
          border-color: #d8d4cc;
          border-left-color: #F7931A;
        }

        .highlight-box h4 {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #F7931A;
          margin-bottom: 0.75rem;
        }

        .highlight-box p {
          font-size: 1.1rem;
          margin-bottom: 0;
        }

        .illustration {
          background: #1a1a1a;
          border: 1px solid #3a3a3a;
          padding: 3rem;
          margin: 2.5rem 0;
          text-align: center;
          min-height: 250px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .lesson-page.light-mode .illustration {
          background: #f5f3f0;
          border-color: #d8d4cc;
        }

        .illustration-label {
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #3a3a3a;
          margin-bottom: 0.5rem;
        }

        .lesson-page.light-mode .illustration-label {
          color: #8a8a8a;
        }

        .illustration-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.25rem;
          color: #8a8a8a;
        }

        .lesson-page.light-mode .illustration-title {
          color: #5a5a5a;
        }

        .lesson-summary {
          background: #141414;
          border: 1px solid #1a1a1a;
          padding: 2rem;
          margin: 3rem 0;
        }

        .lesson-page.light-mode .lesson-summary {
          background: #f5f3f0;
          border-color: #d8d4cc;
        }

        .summary-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.25rem;
          font-weight: 400;
          margin-bottom: 1rem;
          color: #f5f3f0;
        }

        .lesson-page.light-mode .summary-title {
          color: #0a0a0a;
        }

        .summary-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .summary-list li {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          font-size: 1rem;
          margin-bottom: 0.75rem;
        }

        .summary-list li::before {
          content: '◆';
          color: #F7931A;
          font-size: 0.75rem;
          margin-top: 0.35rem;
        }

        .lesson-navigation {
          max-width: 700px;
          margin: 0 auto;
          padding: 3rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid #1a1a1a;
        }

        .lesson-page.light-mode .lesson-navigation {
          border-top-color: #d8d4cc;
        }

        .nav-btn {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          background: transparent;
          border: 1px solid #3a3a3a;
          color: #e8e4dc;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-decoration: none;
          transition: all 0.3s ease;
        }

        .lesson-page.light-mode .nav-btn {
          border-color: #c8c4bc;
          color: #0a0a0a;
        }

        .nav-btn:hover {
          border-color: #F7931A;
          color: #F7931A;
        }

        .nav-btn svg {
          width: 16px;
          height: 16px;
        }

        .nav-btn.primary {
          background: #F7931A;
          border-color: #F7931A;
          color: #f5f3f0;
        }

        .nav-btn.primary:hover {
          background: #ff6600;
          border-color: #ff6600;
        }

        .lesson-footer {
          padding: 4rem 3rem;
          border-top: 1px solid #1a1a1a;
          max-width: 1400px;
          margin: 0 auto;
        }

        .lesson-page.light-mode .lesson-footer {
          border-top-color: #d8d4cc;
        }

        .lesson-footer-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .lesson-footer-left {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .lesson-footer-copy {
          font-size: 12px;
          color: #8a8a8a;
        }

        .lesson-footer-links {
          display: flex;
          gap: 2rem;
        }

        .lesson-footer-links a {
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #8a8a8a;
          text-decoration: none;
          transition: color 0.3s ease;
        }

        .lesson-footer-links a:hover {
          color: #F7931A;
        }

        @media (max-width: 768px) {
          .lesson-nav {
            padding: 1.5rem 2rem;
          }

          .lesson-nav-links {
            display: none;
          }

          .lesson-header {
            padding: 8rem 2rem 2rem;
          }

          .lesson-content {
            padding: 2rem 2rem 3rem;
          }

          .lesson-content p {
            font-size: 1.1rem;
          }

          .lesson-navigation {
            padding: 2rem;
            flex-direction: column;
            gap: 1rem;
          }

          .nav-btn {
            width: 100%;
            justify-content: center;
          }

          .lesson-footer-content {
            flex-direction: column;
            gap: 2rem;
            text-align: center;
          }

          .lesson-footer-left {
            flex-direction: column;
          }
        }
      `}</style>

      <div className={`lesson-page ${isLightMode ? 'light-mode' : ''}`}>
        <div className="progress-container">
          <div className="progress-bar"></div>
        </div>

        <button
          className="lesson-theme-toggle"
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

        <nav className="lesson-nav">
          <Link href="/learn/boarding-pass" className="mobile-back-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Course
          </Link>
          <Link href="/" className="lesson-logo-link">
            <Image
              src="/contraband-logo-v3.png"
              alt="Contraband logo"
              width={40}
              height={40}
            />
            <span className="lesson-logo-text">Contra₿and</span>
          </Link>
          <div className="lesson-nav-links">
            <Link href="/learn" className="active">Stu₿y</Link>
            <Link href="/writings">Writings</Link>
            <a href="#podcasts" className="coming-soon">Podcasts</a>
            <a href="#videos" className="coming-soon">Videos</a>
            <a href="#merch" className="coming-soon">Merch</a>
            <Link href="/about">About</Link>
            <Link href="/">Hank C. Moody</Link>
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
            <Link href="/" onClick={() => setMenuOpen(false)}>Hank C. Moody</Link>
          </nav>
        </div>

        <header className="lesson-header">
          <div className="lesson-breadcrumb">
            <Link href="/learn" className="breadcrumb-link">Stu₿y</Link>
            <span className="breadcrumb-sep">→</span>
            <Link href="/learn/boarding-pass" className="breadcrumb-link">The Boarding Pass</Link>
            <span className="breadcrumb-sep">→</span>
            <span className="breadcrumb-current">Lesson 6</span>
          </div>
          <div className="lesson-meta">
            <span className="lesson-number">Lesson 06 of 21</span>
            <span className="lesson-week">Week 1</span>
            <span className="lesson-duration">16 min read</span>
          </div>
          <h1 className="lesson-title">A Brief History: 2008 to Now</h1>
          <p className="lesson-subtitle">From cypherpunks to institutional adoption.</p>
        </header>

        <article className="lesson-content">
          <p>Every technology has an origin story. Bitcoin's is better than most—mysterious founder, decades of failed predecessors, perfect timing, and a community of idealists who kept it alive when no one else cared.</p>

          <p>Understanding the history helps you understand what Bitcoin is for.</p>

          <h3>The Prehistory: Cypherpunks</h3>

          <p>Bitcoin didn't emerge from nothing. It was the culmination of decades of work by cryptographers and privacy advocates known as "cypherpunks."</p>

          <p>In the 1990s, this loose community saw what was coming: digital surveillance, corporate control of information, governments with unprecedented power to monitor citizens. They believed cryptography—the mathematics of secure communication—could preserve freedom in the digital age.</p>

          <p>They tried to build digital cash. DigiCash (1989), e-gold (1996), bit gold (1998), b-money (1998), RPOW (2004). Each one failed, usually because they required trusted third parties or couldn't solve the double-spend problem.</p>

          <p>The ideas were right. The technology wasn't ready.</p>

          <h3>The Whitepaper: October 31, 2008</h3>

          <p>On Halloween 2008, someone calling themselves Satoshi Nakamoto posted a message to a cryptography mailing list:</p>

          <p><em>"I've been working on a new electronic cash system that's fully peer-to-peer, with no trusted third party."</em></p>

          <p>The linked paper—"Bitcoin: A Peer-to-Peer Electronic Cash System"—was just nine pages. It described a solution to the double-spend problem using proof of work and a distributed ledger. The ideas weren't all new, but the combination was.</p>

          <p>The timing was perfect. Lehman Brothers had collapsed six weeks earlier. The global financial system was in freefall. Trust in institutions was at a generational low.</p>

          <h3>The Genesis Block: January 3, 2009</h3>

          <p>Satoshi mined the first Bitcoin block on January 3, 2009. Embedded in it was a message:</p>

          <p><em>"The Times 03/Jan/2009 Chancellor on brink of second bailout for banks"</em></p>

          <p>This headline from a British newspaper served two purposes: proving the block wasn't mined before that date, and making a statement about why Bitcoin existed.</p>

          <p>For the first year, Bitcoin was essentially worthless—a curiosity among cryptographers. Satoshi kept mining, communicating on forums, and improving the code.</p>

          <h3>The First Transaction: 2010</h3>

          <p>The first known commercial Bitcoin transaction happened on May 22, 2010. A programmer named Laszlo Hanyecz paid 10,000 BTC for two pizzas, worth about $41 at the time.</p>

          <p>Those bitcoin would later be worth over $600 million. May 22 is now celebrated as "Bitcoin Pizza Day."</p>

          <p>Later that year, the first Bitcoin exchanges launched. Mt. Gox, named after a Magic: The Gathering card exchange (yes, really), would become the dominant exchange before its spectacular collapse in 2014.</p>

          <h3>Satoshi Disappears: 2011</h3>

          <p>In April 2011, Satoshi sent a final email: "I've moved on to other things." They were never heard from again.</p>

          <p>This disappearance was crucial. With the creator gone, there was no one to appeal to, no authority figure, no cult of personality. Bitcoin had to stand on its own.</p>

          <p>Satoshi's coins—estimated at around 1 million BTC—have never moved. Whoever Satoshi was, they left behind a monetary network worth hundreds of billions while keeping nothing for themselves.</p>

          <h3>The Early Years: 2011-2013</h3>

          <p>Bitcoin attracted a motley crew: libertarians, technologists, drug dealers (Silk Road launched in 2011), speculators, and the genuinely curious.</p>

          <p>Prices were volatile. $1 became $30 became $2 became $100. Each boom brought new attention; each crash was declared the end. "Bitcoin is dead" became a recurring headline.</p>

          <p>The community grew. Core developers maintained the code. Businesses built infrastructure. Enthusiasts spread the word.</p>

          <h3>Mt. Gox and the First Big Crash: 2014</h3>

          <p>In February 2014, Mt. Gox—handling about 70% of all Bitcoin trades—suspended withdrawals and then declared bankruptcy. 850,000 BTC had been stolen over several years, worth about $450 million at the time.</p>

          <p>The price crashed. Mainstream coverage was brutal. Many declared Bitcoin finished.</p>

          <p>But the network kept running. Every block was still being mined. Every transaction was still being verified. The protocol was fine—it was a company that failed, not the technology.</p>

          <p>This distinction would prove important again and again.</p>

          <h3>The Maturation: 2015-2020</h3>

          <p>The post-Mt. Gox years saw professionalization:</p>

          <ul>
            <li>Regulated exchanges replaced sketchy early platforms</li>
            <li>Custody solutions emerged for institutional investors</li>
            <li>The Lightning Network began development for faster payments</li>
            <li>Major companies started taking Bitcoin seriously</li>
          </ul>

          <p>Each halving (2012, 2016, 2020) reduced new supply and seemed to catalyze price increases. Theories emerged about four-year cycles driven by halving events.</p>

          <h3>The Institutional Era: 2020-Present</h3>

          <p>COVID-19 changed everything. Governments worldwide printed unprecedented amounts of money. Inflation, dormant for decades, returned with a vengeance.</p>

          <p>Suddenly, Bitcoin's pitch—money that can't be printed—resonated with a much wider audience.</p>

          <p>The dominoes fell quickly:</p>
          <ul>
            <li>MicroStrategy became the first public company to put Bitcoin on its balance sheet (2020)</li>
            <li>Tesla bought $1.5 billion in Bitcoin (2021)</li>
            <li>El Salvador made Bitcoin legal tender (2021)</li>
            <li>Major banks started offering Bitcoin services</li>
            <li>Fidelity, BlackRock, and other giants filed for Bitcoin ETFs</li>
            <li>Bitcoin ETFs were approved in the US (2024)</li>
          </ul>

          <p>Bitcoin went from "internet funny money" to a recognized asset class in under fifteen years—faster than any previous monetary transition in history.</p>

          <h3>What Comes Next?</h3>

          <p>No one knows. Predictions about Bitcoin have been consistently wrong in both directions.</p>

          <p>What we can say:</p>
          <ul>
            <li>The network has never been stronger technically</li>
            <li>Institutional adoption is accelerating</li>
            <li>Nation-state adoption is beginning</li>
            <li>The regulatory picture is slowly clarifying</li>
            <li>Each halving will continue reducing new supply</li>
          </ul>

          <p>Bitcoin's history suggests that reports of its death are always premature and that most people underestimate how far it can go.</p>

          <div className="lesson-summary">
            <h3 className="summary-title">Lesson Summary</h3>
            <ul className="summary-list">
              <li>Bitcoin built on decades of cypherpunk research into digital cash</li>
              <li>Launched in January 2009 with a message referencing bank bailouts</li>
              <li>Satoshi disappeared in 2011, leaving no authority figure</li>
              <li>Early years were volatile but the network never failed</li>
              <li>Mt. Gox collapse (2014) proved the protocol could survive company failures</li>
              <li>2020s brought institutional adoption and nation-state interest</li>
              <li>History shows: never bet against Bitcoin long-term</li>
            </ul>
          </div>
        </article>

        <nav className="lesson-navigation">
          <Link href="/learn/boarding-pass/bitcoin-vs-the-altcoins" className="nav-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Lesson 5
          </Link>
          <Link href="/learn/boarding-pass/the-philosophy-why-this-exists" className="nav-btn primary">
            Lesson 7
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        </nav>

        <footer className="lesson-footer">
          <div className="lesson-footer-content">
            <div className="lesson-footer-left">
              <Image
                src="/contraband-logo-v3.png"
                alt="Contraband logo"
                width={32}
                height={32}
              />
              <span className="lesson-footer-copy">© 2025 Contraband. All rights reserved.</span>
            </div>
            <div className="lesson-footer-links">
              <a href="https://x.com/hankCmoody" target="_blank" rel="noopener noreferrer">Twitter</a>
              <a href="https://youtube.com/@hankcmoody" target="_blank" rel="noopener noreferrer">YouTube</a>
              <a href="https://hankcmoody.substack.com" target="_blank" rel="noopener noreferrer">Substack</a>
              <a href="#">RSS</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
