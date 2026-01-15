'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';

export default function BoardingPassLesson18() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isLightMode, toggleTheme } = useTheme();

  useEffect(() => {
    document.title = 'Shitcoins: Why Bitcoin Only | Contraband';
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
          width: 85.71%;
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
          .progress-container {
            top: 0;
          }

          .lesson-nav {
            padding: calc(0.75rem + var(--safe-top)) 1rem 0.75rem;
            background: #0a0a0a;
            border-bottom: 1px solid #1a1a1a;
            margin-top: 3px;
          }

          .lesson-page.light-mode .lesson-nav {
            background: #e8e4dc;
            border-bottom-color: #d8d4cc;
          }

          .lesson-logo-link {
            gap: 0.5rem;
          }

          .lesson-logo-text {
            font-size: 10px;
            letter-spacing: 0.2em;
          }

          .lesson-nav-links {
            display: none;
          }

          .mobile-back-btn {
            display: flex;
          }


          .mobile-menu-btn {
            display: flex;
          }

          .lesson-header {
            padding: calc(5.5rem + var(--safe-top)) 1.5rem 2rem;
          }

          .lesson-breadcrumb {
            display: none;
          }

          .lesson-meta {
            display: flex;
            align-items: center;
            gap: 1rem;
            flex-wrap: wrap;
            margin-bottom: 1rem;
          }

          .lesson-number {
            font-size: 11px;
            font-weight: 700;
          }

          .lesson-week,
          .lesson-duration {
            font-size: 10px;
          }

          .lesson-title {
            font-size: 1.75rem;
            line-height: 1.25;
            margin-bottom: 0.5rem;
          }

          .lesson-subtitle {
            font-size: 1.1rem;
          }

          .lesson-content {
            padding: 0 1.5rem calc(5rem + var(--safe-bottom));
          }

          .lesson-content p {
            font-size: 1.15rem;
            line-height: 1.85;
            margin-bottom: 1.5rem;
          }

          .lesson-content p:first-of-type::first-letter {
            font-size: 3.5rem;
            margin-right: 0.6rem;
            margin-top: 0.2rem;
          }

          .lesson-content h2 {
            font-size: 1.4rem;
            margin: 2.5rem 0 1.25rem;
          }

          .lesson-content h3 {
            font-size: 1.2rem;
            margin: 2rem 0 1rem;
          }

          .lesson-content ul,
          .lesson-content ol {
            margin: 1.25rem 0;
            padding-left: 1.25rem;
          }

          .lesson-content li {
            font-size: 1.1rem;
            line-height: 1.75;
            margin-bottom: 0.6rem;
          }

          .key-concept {
            padding: 1.25rem 1.5rem;
            margin: 2rem 0;
            border: none;
            border-left: 3px solid #F7931A;
            text-align: left;
          }

          .key-concept-label {
            font-size: 9px;
            letter-spacing: 0.2em;
            margin-bottom: 0.5rem;
          }

          .key-concept-text {
            font-size: 1.15rem;
            line-height: 1.5;
          }

          .lesson-summary {
            padding: 1.5rem;
            margin: 2.5rem 0;
          }

          .summary-title {
            font-size: 1.1rem;
            margin-bottom: 1rem;
          }

          .summary-list li {
            font-size: 0.95rem;
            gap: 0.6rem;
            margin-bottom: 0.6rem;
          }

          .summary-list li::before {
            font-size: 0.6rem;
            margin-top: 0.4rem;
          }

          .lesson-navigation {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 1rem 1rem calc(1rem + var(--safe-bottom));
            background: #0a0a0a;
            border-top: 1px solid #1a1a1a;
            display: flex;
            justify-content: space-between;
            align-items: center;
            z-index: 100;
            max-width: none;
            flex-direction: row;
            gap: 0;
          }

          .lesson-page.light-mode .lesson-navigation {
            background: #e8e4dc;
            border-top-color: #d8d4cc;
          }

          .nav-btn {
            padding: 0.75rem 1rem;
            min-width: 90px;
            font-size: 10px;
            width: auto;
          }

          .nav-btn:active {
            border-color: #F7931A;
            color: #F7931A;
          }

          .nav-btn.primary:active {
            background: #d4854c;
            border-color: #d4854c;
          }

          .nav-btn svg {
            width: 16px;
            height: 16px;
          }

          .lesson-footer {
            padding: 2rem 1.25rem calc(6rem + var(--safe-bottom));
          }

          .lesson-footer-content {
            flex-direction: column;
            gap: 1.5rem;
            text-align: center;
          }

          .lesson-footer-left {
            flex-direction: column;
            gap: 1rem;
          }

          .lesson-footer-copy {
            font-size: 11px;
          }

          .lesson-footer-links {
            flex-wrap: wrap;
            justify-content: center;
            gap: 1.5rem;
          }

          .lesson-footer-links a {
            font-size: 10px;
          }

          .lesson-footer-links a:active {
            color: #F7931A;
          }

          .lesson-theme-toggle {
            bottom: calc(5rem + var(--safe-bottom));
            right: 1rem;
            width: 44px;
            height: 44px;
          }

          .lesson-theme-toggle:active {
            background: #F7931A;
            border-color: #F7931A;
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
            <span className="breadcrumb-current">Lesson 18</span>
          </div>
          <div className="lesson-meta">
            <span className="lesson-number">Lesson 18 of 21</span>
            <span className="lesson-week">Week 3</span>
            <span className="lesson-duration">15 min read</span>
          </div>
          <h1 className="lesson-title">Shitcoins: Why Bitcoin Only</h1>
          <p className="lesson-subtitle">The case for focus over diversification.</p>
        </header>

        <article className="lesson-content">
          <p>There are thousands of cryptocurrencies. Shouldn't you diversify? Hold a portfolio of different tokens?</p>

          <p>Many people in bitcoin believe the answer is no. They focus exclusively on Bitcoin and consider everything else a distraction at best, a scam at worst.</p>

          <p>This lesson explains the logic behind that position.</p>

          <h3>The Monetary Focus</h3>

          <p>Bitcoin is trying to be one thing: better money. Everything about its design serves that purpose. Fixed supply. Decentralization. Security. Immutability.</p>

          <p>Most other cryptocurrencies are trying to be something else:</p>
          <ul>
            <li>Ethereum: programmable applications platform</li>
            <li>Solana: fast transactions</li>
            <li>Cardano: academic research project</li>
            <li>Dogecoin: meme</li>
            <li>Thousands of others: various promises</li>
          </ul>

          <p>These might be interesting experiments. But they're not competing to be money in the way Bitcoin is. They have different goals, different tradeoffs, and different risks.</p>

          <h3>The Lindy Effect</h3>

          <p>The Lindy Effect says that the longer something has survived, the longer it's likely to continue surviving. Bitcoin has:</p>
          <ul>
            <li>15+ years of operation</li>
            <li>Survived every attack, crash, and competitor</li>
            <li>Grown in security and adoption continuously</li>
            <li>Never been successfully hacked</li>
          </ul>

          <p>Most altcoins are young and unproven. Many that existed in 2017 are dead today. The survival rate is abysmal.</p>

          <p>Betting on altcoins is betting against the Lindy Effect. Sometimes that bet wins. Usually, it doesn't.</p>

          <h3>The Decentralization Problem</h3>

          <p>Remember what makes Bitcoin valuable: no one controls it. This property is extremely hard to achieve and easy to lose.</p>

          <p>Most altcoins have:</p>
          <ul>
            <li>Known founders who hold large percentages</li>
            <li>Foundations that control development</li>
            <li>The ability to change rules (and have done so)</li>
            <li>Pre-mines or venture capital allocations</li>
          </ul>

          <p>These aren't decentralized systems. They're startups with tokens. The founders can change the rules, inflate the supply, or abandon the project whenever incentives shift.</p>

          <p>Bitcoin's founding conditions—anonymous creator, fair launch, no pre-mine—cannot be replicated. Every altcoin is starting with a compromised foundation.</p>

          <h3>The Security Gap</h3>

          <p>Bitcoin's security comes from its hash rate—the computational power protecting the network. Bitcoin's hash rate is orders of magnitude higher than any competitor.</p>

          <p>This matters because proof-of-work security is measurable. We can calculate how much it would cost to attack Bitcoin (~billions of dollars). We can calculate the same for altcoins (~much less).</p>

          <p>Proof-of-stake systems (Ethereum, Solana, etc.) have different security models that are newer and less battle-tested. They might work. But "might work" isn't what you want for storing wealth.</p>

          <h3>The "Diversification" Fallacy</h3>

          <p>Traditional finance teaches diversification: don't put all your eggs in one basket. But this logic doesn't directly apply to cryptocurrency.</p>

          <p>Diversification works when:</p>
          <ul>
            <li>Assets are uncorrelated</li>
            <li>All assets have positive expected value</li>
            <li>You can't identify the best asset</li>
          </ul>

          <p>In crypto:</p>
          <ul>
            <li>Altcoins are highly correlated with Bitcoin (when BTC drops, alts drop more)</li>
            <li>Most altcoins have negative expected value (they go to zero)</li>
            <li>Bitcoin's properties are identifiably unique</li>
          </ul>

          <p>Holding altcoins alongside Bitcoin isn't diversification—it's dilution. You're adding more risk, not less.</p>

          <h3>The Opportunity Cost</h3>

          <p>Every dollar in altcoins is a dollar not in Bitcoin.</p>

          <p>If Bitcoin succeeds as global money, the upside is enormous. If you believe in that thesis, altcoins are a distraction from the main opportunity.</p>

          <p>If Bitcoin fails, altcoins probably fail too (they're built on the same technological foundation and rely on the same adoption curve). There's no hedge here.</p>

          <h3>The Mental Bandwidth Cost</h3>

          <p>Following one asset is manageable. Following a portfolio of tokens is a full-time job:</p>
          <ul>
            <li>Different roadmaps and updates</li>
            <li>Different communities and politics</li>
            <li>Different risks and vulnerabilities</li>
            <li>Different tax implications</li>
          </ul>

          <p>Most people who try to manage altcoin portfolios underperform simple Bitcoin holdings. The complexity adds friction without adding returns.</p>

          <h3>When Altcoins "Work"</h3>

          <p>Yes, some altcoins have outperformed Bitcoin over certain periods. Early Ethereum buyers did very well. So did early Solana buyers.</p>

          <p>But consider:</p>
          <ul>
            <li>Survivorship bias: we remember winners, not the thousands that went to zero</li>
            <li>Timing required: you had to buy early AND sell before the crash</li>
            <li>Risk taken: these were high-risk bets that happened to pay off</li>
          </ul>

          <p>For every altcoin success story, there are hundreds of failures. The expected value of the overall strategy is negative.</p>

          <h3>The Bitcoin Maximalist Position</h3>

          <p>"Bitcoin Maximalism" is the view that Bitcoin will capture most or all of the value in cryptocurrency, and therefore holding anything else is irrational.</p>

          <p>The logic:</p>
          <ol>
            <li>Money has network effects (the more people use it, the better it works)</li>
            <li>Network effects tend toward monopoly</li>
            <li>Bitcoin has the strongest network effects</li>
            <li>Therefore, Bitcoin will likely absorb the value of competitors</li>
          </ol>

          <p>You don't have to be a maximalist. But you should understand why many thoughtful people in the space are.</p>

          <h3>A Reasonable Middle Ground</h3>

          <p>If you want exposure to altcoins despite the risks:</p>
          <ul>
            <li>Keep it small (5-10% of your crypto portfolio)</li>
            <li>Assume it could go to zero</li>
            <li>Don't let it distract from accumulating Bitcoin</li>
            <li>Understand you're speculating, not investing</li>
          </ul>

          <p>Most importantly: don't let altcoin casinos prevent you from accumulating Bitcoin consistently.</p>

          <div className="key-concept">
            <p className="key-concept-label">Key Concept</p>
            <p className="key-concept-text">Bitcoin is the only cryptocurrency that has achieved genuine decentralization and monetary properties. Everything else is an experiment with a much higher chance of failure.</p>
          </div>

          <div className="lesson-summary">
            <h3 className="summary-title">Lesson Summary</h3>
            <ul className="summary-list">
              <li>Bitcoin is focused on being money; most altcoins have different goals</li>
              <li>The Lindy Effect favors Bitcoin's 15+ year track record</li>
              <li>Altcoins typically have centralized control despite "decentralization" marketing</li>
              <li>Bitcoin's security (hash rate) vastly exceeds all competitors</li>
              <li>Altcoin "diversification" adds risk without reducing correlation</li>
              <li>Every dollar in altcoins is a dollar not in Bitcoin</li>
              <li>Some altcoins outperform short-term, but survivorship bias is severe</li>
              <li>If you speculate on altcoins, keep it small and assume total loss is possible</li>
            </ul>
          </div>
        </article>

        <nav className="lesson-navigation">
          <Link href="/learn/boarding-pass/common-scams-and-how-to-avoid-them" className="nav-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Lesson 17
          </Link>
          <Link href="/learn/boarding-pass/bitcoin-and-taxes" className="nav-btn primary">
            Lesson 19
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
