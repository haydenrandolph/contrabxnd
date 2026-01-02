'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export default function LearnPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isLightMode, toggleTheme } = useTheme();

  const courses = [
    {
      number: '01',
      badge: 'Start Here',
      title: 'The Boarding Pass',
      tagline: 'Your first 21 days with Bitcoin',
      description: 'Everything you need to understand Bitcoin and make your first moves—without the jargon, the hype, or the scams. 21 lessons for the 21 million.',
      meta: [
        { label: 'Lessons', value: '21' },
        { label: 'Duration', value: '~3 weeks' },
        { label: 'Level', value: 'Beginner' },
        { label: 'Price', value: 'Free' }
      ],
      link: '/learn/boarding-pass'
    },
    {
      number: '02',
      title: 'Letters of Marque',
      tagline: 'Self-custody and sovereign security',
      description: 'Your keys, your coins, your rules. A comprehensive guide to taking full custody of your Bitcoin—and keeping it safe from every threat.',
      meta: [
        { label: 'Modules', value: '5' },
        { label: 'Duration', value: '~2 weeks' },
        { label: 'Level', value: 'Intermediate' },
        { label: 'Price', value: 'Free' }
      ],
      link: '/learn/letters-of-marque'
    }
  ];

  const pathSteps = [
    {
      number: '01',
      title: 'Understand',
      description: 'Learn what Bitcoin actually is—not the headlines, not the hype. The technology, the economics, the philosophy.'
    },
    {
      number: '02',
      title: 'Acquire',
      description: 'Buy your first sats safely. Know the difference between exchanges, understand fees, avoid the traps.'
    },
    {
      number: '03',
      title: 'Secure',
      description: 'Move your Bitcoin to self-custody. Your keys, your coins. No exchange, no counterparty, no permission needed.'
    },
    {
      number: '04',
      title: 'Fortify',
      description: 'Level up your security. Hardware wallets, seed phrase protection, inheritance planning, operational security.'
    }
  ];

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

        .learn-page {
          background: #0a0a0a;
          color: #e8e4dc;
          font-family: 'Space Mono', monospace;
          font-size: 14px;
          line-height: 1.7;
          overflow-x: hidden;
          min-height: 100vh;
          -webkit-font-smoothing: antialiased;
        }

        .learn-page.light-mode {
          background: #e8e4dc;
          color: #0a0a0a;
        }

        .learn-page::before {
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

        .learn-nav {
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

        .learn-page.light-mode .learn-nav {
          background: linear-gradient(to bottom, #e8e4dc 0%, transparent 100%);
        }

        .learn-logo-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
          color: #f5f3f0;
        }

        .learn-page.light-mode .learn-logo-link {
          color: #0a0a0a;
        }

        .learn-logo-text {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
        }

        .learn-nav-links {
          display: flex;
          gap: 3rem;
        }

        .learn-nav-links a {
          color: #f5f3f0;
          text-decoration: none;
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          position: relative;
          padding: 0.25rem 0;
        }

        .learn-page.light-mode .learn-nav-links a {
          color: #0a0a0a;
        }

        .learn-nav-links a::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 1px;
          background: #F7931A;
          transition: width 0.3s ease;
        }

        .learn-nav-links a:hover::after,
        .learn-nav-links a.active::after {
          width: 100%;
        }

        .learn-nav-links a.coming-soon {
          text-decoration: line-through;
          opacity: 0.5;
          cursor: not-allowed;
        }

        .learn-nav-links a.coming-soon:hover::after {
          width: 0;
        }

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
          background: #f5f3f0;
          transition: all 0.3s ease;
          margin: 3px 0;
        }

        .learn-page.light-mode .mobile-menu-btn span {
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

        .learn-page.light-mode .mobile-menu-overlay {
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

        .learn-page.light-mode .mobile-menu-nav a {
          color: #0a0a0a;
        }

        .mobile-menu-nav a:active {
          color: #F7931A;
        }

        .mobile-menu-nav a.coming-soon {
          text-decoration: line-through;
          opacity: 0.5;
        }

        .learn-theme-toggle {
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

        .learn-theme-toggle:hover {
          background: #F7931A;
          border-color: #F7931A;
          transform: scale(1.1);
        }

        .learn-theme-toggle svg {
          width: 24px;
          height: 24px;
          stroke: #e8e4dc;
        }

        .learn-page.light-mode .learn-theme-toggle {
          background: #f5f3f0;
          border-color: #c8c4bc;
        }

        .learn-page.light-mode .learn-theme-toggle svg {
          stroke: #070713;
        }

        .learn-hero {
          padding: 12rem 3rem 6rem;
          max-width: 1000px;
          margin: 0 auto;
          text-align: center;
        }

        .hero-label {
          font-size: 10px;
          letter-spacing: 0.4em;
          text-transform: uppercase;
          color: #F7931A;
          margin-bottom: 2rem;
          opacity: 0;
          animation: fadeUp 1s ease 0.2s forwards;
        }

        .hero-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(2.5rem, 6vw, 4rem);
          font-weight: 400;
          line-height: 1.2;
          margin-bottom: 1.5rem;
          opacity: 0;
          animation: fadeUp 1s ease 0.3s forwards;
        }

        .hero-subtitle {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.4rem;
          color: #8a8a8a;
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.7;
          opacity: 0;
          animation: fadeUp 1s ease 0.4s forwards;
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

        .courses-section {
          padding: 4rem 3rem 8rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .courses-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2rem;
        }

        .course-card {
          background: #141414;
          border: 1px solid #1a1a1a;
          padding: 3rem;
          position: relative;
          transition: all 0.4s ease;
          display: flex;
          flex-direction: column;
        }

        .learn-page.light-mode .course-card {
          background: #f5f3f0;
          border-color: #d8d4cc;
        }

        .course-card:hover {
          border-color: #F7931A;
          transform: translateY(-4px);
        }

        .course-badge {
          position: absolute;
          top: 2rem;
          right: 2rem;
          padding: 0.4rem 0.75rem;
          background: #F7931A;
          font-size: 9px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #f5f3f0;
        }

        .course-number {
          font-family: 'Cormorant Garamond', serif;
          font-size: 3rem;
          color: #3a3a3a;
          line-height: 1;
          margin-bottom: 1.5rem;
        }

        .learn-page.light-mode .course-number {
          color: #c8c4bc;
        }

        .course-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2rem;
          font-weight: 400;
          margin-bottom: 0.5rem;
        }

        .course-tagline {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.1rem;
          font-style: italic;
          color: #d4854c;
          margin-bottom: 1.5rem;
        }

        .course-description {
          color: #8a8a8a;
          font-size: 13px;
          line-height: 1.8;
          margin-bottom: 2rem;
          flex-grow: 1;
        }

        .course-meta {
          display: flex;
          gap: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid #1a1a1a;
          margin-bottom: 2rem;
        }

        .learn-page.light-mode .course-meta {
          border-top-color: #d8d4cc;
        }

        .meta-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .meta-label {
          font-size: 9px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #3a3a3a;
        }

        .learn-page.light-mode .meta-label {
          color: #8a8a8a;
        }

        .meta-value {
          font-size: 13px;
          color: #e8e4dc;
        }

        .learn-page.light-mode .meta-value {
          color: #0a0a0a;
        }

        .course-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 1rem 2rem;
          background: transparent;
          border: 1px solid #e8e4dc;
          color: #e8e4dc;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          text-decoration: none;
          transition: all 0.3s ease;
        }

        .learn-page.light-mode .course-btn {
          border-color: #0a0a0a;
          color: #0a0a0a;
        }

        .course-btn:hover {
          background: #e8e4dc;
          color: #0a0a0a;
        }

        .learn-page.light-mode .course-btn:hover {
          background: #0a0a0a;
          color: #e8e4dc;
        }

        .course-btn svg {
          width: 16px;
          height: 16px;
          transition: transform 0.3s ease;
        }

        .course-btn:hover svg {
          transform: translateX(4px);
        }

        .path-section {
          padding: 6rem 3rem;
          background: #141414;
          border-top: 1px solid #1a1a1a;
          border-bottom: 1px solid #1a1a1a;
        }

        .learn-page.light-mode .path-section {
          background: #f5f3f0;
          border-top-color: #d8d4cc;
          border-bottom-color: #d8d4cc;
        }

        .path-inner {
          max-width: 900px;
          margin: 0 auto;
        }

        .path-header {
          text-align: center;
          margin-bottom: 4rem;
        }

        .path-label {
          font-size: 10px;
          letter-spacing: 0.4em;
          text-transform: uppercase;
          color: #F7931A;
          margin-bottom: 1rem;
        }

        .path-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2rem;
          font-weight: 400;
        }

        .path-steps {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .path-step {
          display: grid;
          grid-template-columns: 80px 1fr;
          gap: 2rem;
          padding: 2rem 0;
          border-bottom: 1px solid #1a1a1a;
        }

        .learn-page.light-mode .path-step {
          border-bottom-color: #d8d4cc;
        }

        .path-step:last-child {
          border-bottom: none;
        }

        .step-number {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2.5rem;
          color: #F7931A;
          line-height: 1;
        }

        .step-content h3 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.4rem;
          font-weight: 400;
          margin-bottom: 0.5rem;
        }

        .step-content p {
          color: #8a8a8a;
          font-size: 13px;
          line-height: 1.7;
        }

        .philosophy-section {
          padding: 6rem 3rem;
          max-width: 800px;
          margin: 0 auto;
          text-align: center;
        }

        .philosophy-quote {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.75rem;
          font-style: italic;
          line-height: 1.6;
          margin-bottom: 1.5rem;
          color: #e8e4dc;
        }

        .learn-page.light-mode .philosophy-quote {
          color: #0a0a0a;
        }

        .philosophy-source {
          font-size: 12px;
          color: #F7931A;
          letter-spacing: 0.2em;
          text-transform: uppercase;
        }

        .learn-footer {
          padding: 4rem 3rem;
          border-top: 1px solid #1a1a1a;
          max-width: 1400px;
          margin: 0 auto;
        }

        .learn-page.light-mode .learn-footer {
          border-top-color: #d8d4cc;
        }

        .learn-footer-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .learn-footer-left {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .learn-footer-copy {
          font-size: 12px;
          color: #8a8a8a;
        }

        .learn-footer-links {
          display: flex;
          gap: 2rem;
        }

        .learn-footer-links a {
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #8a8a8a;
          text-decoration: none;
          transition: color 0.3s ease;
        }

        .learn-footer-links a:hover {
          color: #F7931A;
        }

        @media (max-width: 900px) {
          .courses-grid {
            grid-template-columns: 1fr;
          }

          .path-step {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
        }

        @media (max-width: 768px) {
          .learn-nav {
            padding: 1.5rem 2rem;
          }

          .learn-nav-links {
            display: none;
          }

          .mobile-menu-btn {
            display: flex;
          }

          .learn-hero {
            padding: 10rem 2rem 4rem;
          }

          .courses-section {
            padding: 2rem 2rem 4rem;
          }

          .course-card {
            padding: 2rem;
          }

          .path-section {
            padding: 4rem 2rem;
          }

          .philosophy-section {
            padding: 4rem 2rem;
          }

          .learn-footer-content {
            flex-direction: column;
            gap: 2rem;
            text-align: center;
          }

          .learn-footer-left {
            flex-direction: column;
          }
        }
      `}</style>

      <div className={`learn-page ${isLightMode ? 'light-mode' : ''}`}>
        <button
          className="learn-theme-toggle"
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

        <nav className="learn-nav">
          <Link href="/" className="learn-logo-link">
            <Image
              src="/contraband-logo-v3.png"
              alt="Contraband logo"
              width={40}
              height={40}
            />
            <span className="learn-logo-text">Contra₿and</span>
          </Link>
          <div className="learn-nav-links">
            <Link href="/learn" className="active">Stu₿y</Link>
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

        <section className="learn-hero">
          <p className="hero-label">Bitcoin Education</p>
          <h1 className="hero-title">The education they satisfactorily hope you never get</h1>
          <p className="hero-subtitle">Free courses on Bitcoin—from first principles to full sovereignty. No hype, no shilling, no shortcuts.</p>
        </section>

        <section className="courses-section">
          <div className="courses-grid">
            {courses.map((course) => (
              <div key={course.number} className="course-card">
                {course.badge && <span className="course-badge">{course.badge}</span>}
                <span className="course-number">{course.number}</span>
                <h2 className="course-title">{course.title}</h2>
                <p className="course-tagline">{course.tagline}</p>
                <p className="course-description">{course.description}</p>
                <div className="course-meta">
                  {course.meta.map((item, index) => (
                    <div key={index} className="meta-item">
                      <span className="meta-label">{item.label}</span>
                      <span className="meta-value">{item.value}</span>
                    </div>
                  ))}
                </div>
                <a href={course.link} className="course-btn">
                  Start Course
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </a>
              </div>
            ))}
          </div>
        </section>

        <section className="path-section">
          <div className="path-inner">
            <div className="path-header">
              <p className="path-label">The Journey</p>
              <h2 className="path-title">From curious to sovereign</h2>
            </div>
            <div className="path-steps">
              {pathSteps.map((step) => (
                <div key={step.number} className="path-step">
                  <span className="step-number">{step.number}</span>
                  <div className="step-content">
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="philosophy-section">
          <p className="philosophy-quote">"The best time to learn about Bitcoin was 2009. The second best time is now."</p>
          <p className="philosophy-source">— Contraband</p>
        </section>

        <footer className="learn-footer">
          <div className="learn-footer-content">
            <div className="learn-footer-left">
              <Image
                src="/contraband-logo-v3.png"
                alt="Contraband logo"
                width={32}
                height={32}
              />
              <span className="learn-footer-copy">© 2025 Contraband. All rights reserved.</span>
            </div>
            <div className="learn-footer-links">
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
