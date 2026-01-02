'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ReactNode } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface ArticleLayoutProps {
  article: {
    type: string;
    title: string;
    subtitle?: string;
    date: string;
    readTime: string;
    substackUrl?: string;
  };
  slug: string;
  children: ReactNode;
  relatedArticles: Array<{
    slug: string;
    type: string;
    title: string;
    readTime: string;
  }>;
}

export default function ArticleLayout({
  article,
  slug,
  children,
  relatedArticles
}: ArticleLayoutProps) {
  const { isLightMode, toggleTheme } = useTheme();

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Space+Mono:wght@400;700&display=swap');

        .article-page {
          background: #0a0a0a;
          color: #e8e4dc;
          font-family: 'Space Mono', monospace;
          min-height: 100vh;
        }

        .article-page.light-mode {
          background: #e8e4dc;
          color: #070713;
        }

        .article-page::before {
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

        .article-nav {
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

        .article-page.light-mode .article-nav {
          background: linear-gradient(to bottom, #e8e4dc 0%, transparent 100%);
        }

        .article-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
          color: #f5f3f0;
        }

        .article-page.light-mode .article-logo {
          color: #070713;
        }

        .article-logo-text {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
        }

        .article-nav-links {
          display: flex;
          gap: 3rem;
        }

        .article-nav-links a {
          color: #f5f3f0;
          text-decoration: none;
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          position: relative;
          padding: 0.25rem 0;
        }

        .article-page.light-mode .article-nav-links a {
          color: #070713;
        }

        .article-nav-links a::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 1px;
          background: #F7931A;
          transition: width 0.3s ease;
        }

        .article-nav-links a:hover::after,
        .article-nav-links a.active::after {
          width: 100%;
        }

        .article-nav-links a.coming-soon {
          text-decoration: line-through;
          opacity: 0.5;
          cursor: not-allowed;
        }

        .article-nav-links a.coming-soon:hover::after {
          width: 0;
        }

        .article-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 12rem 3rem 6rem;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          color: #8a8a8a;
          text-decoration: none;
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          margin-bottom: 3rem;
          transition: color 0.3s ease;
        }

        .back-link:hover {
          color: #F7931A;
        }

        .back-arrow {
          width: 20px;
          height: 20px;
          stroke: currentColor;
        }

        .article-header {
          margin-bottom: 3rem;
          padding-bottom: 3rem;
          border-bottom: 1px solid #3a3a3a;
        }

        .article-page.light-mode .article-header {
          border-bottom-color: #c8c4bc;
        }

        .article-type {
          font-size: 10px;
          letter-spacing: 0.4em;
          text-transform: uppercase;
          color: #F7931A;
          margin-bottom: 1.5rem;
        }

        .article-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 3rem;
          font-weight: 400;
          line-height: 1.1;
          margin-bottom: 1.5rem;
          color: #e8e4dc;
        }

        .article-page.light-mode .article-title {
          color: #070713;
        }

        .article-subtitle {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.5rem;
          font-weight: 400;
          line-height: 1.4;
          color: #8a8a8a;
          font-style: italic;
          margin-bottom: 2rem;
        }

        .article-meta {
          display: flex;
          gap: 2rem;
          font-size: 11px;
          color: #8a8a8a;
          letter-spacing: 0.1em;
        }

        .article-hero {
          width: 100%;
          height: 400px;
          background: #1a1a1a;
          margin-bottom: 4rem;
          position: relative;
          overflow: hidden;
        }

        .article-hero::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, #F7931A 0%, #0a0a0a 100%);
          opacity: 0.3;
        }

        .article-content {
          position: relative;
          z-index: 1;
        }

        .article-content p:first-of-type::first-letter {
          font-family: 'Cormorant Garamond', serif;
          font-size: 4rem;
          float: left;
          line-height: 1;
          margin-right: 0.75rem;
          margin-top: 0.25rem;
          color: #F7931A;
        }

        .article-footer {
          margin-top: 4rem;
          padding-top: 3rem;
          border-top: 1px solid #3a3a3a;
        }

        .article-page.light-mode .article-footer {
          border-top-color: #c8c4bc;
        }

        .share-section {
          margin-bottom: 4rem;
        }

        .share-title {
          font-size: 11px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #8a8a8a;
          margin-bottom: 1rem;
        }

        .share-buttons {
          display: flex;
          gap: 1rem;
        }

        .share-button {
          padding: 0.75rem 1.5rem;
          background: #1a1a1a;
          border: 1px solid #3a3a3a;
          color: #e8e4dc;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          display: inline-block;
        }

        .article-page.light-mode .share-button {
          background: #f5f3f0;
          border-color: #c8c4bc;
          color: #070713;
        }

        .share-button:hover {
          background: #F7931A;
          border-color: #F7931A;
          color: #f5f3f0;
        }

        .related-articles {
          padding: 6rem 3rem;
          max-width: 1400px;
          margin: 0 auto;
          border-top: 1px solid #1a1a1a;
        }

        .article-page.light-mode .related-articles {
          border-top-color: #d8d4cc;
        }

        .related-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2rem;
          font-weight: 400;
          margin-bottom: 3rem;
          color: #e8e4dc;
        }

        .article-page.light-mode .related-title {
          color: #070713;
        }

        .related-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
        }

        .related-card {
          background: #141414;
          border: 1px solid #1a1a1a;
          padding: 2rem;
          text-decoration: none;
          color: inherit;
          transition: all 0.4s ease;
        }

        .article-page.light-mode .related-card {
          background: #f5f3f0;
          border-color: #d8d4cc;
        }

        .related-card:hover {
          border-color: #F7931A;
          transform: translateY(-4px);
        }

        .related-card-type {
          font-size: 10px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: #F7931A;
          margin-bottom: 1rem;
        }

        .related-card-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.5rem;
          font-weight: 400;
          line-height: 1.3;
          margin-bottom: 1rem;
        }

        .related-card-meta {
          font-size: 11px;
          color: #8a8a8a;
        }

        .page-footer {
          padding: 4rem 3rem;
          border-top: 1px solid #1a1a1a;
          max-width: 1400px;
          margin: 0 auto;
        }

        .article-page.light-mode .page-footer {
          border-top-color: #d8d4cc;
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

        .theme-toggle {
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

        .theme-toggle:hover {
          background: #F7931A;
          border-color: #F7931A;
          transform: scale(1.1);
        }

        .theme-toggle svg {
          width: 24px;
          height: 24px;
          stroke: #e8e4dc;
        }

        .article-page.light-mode .theme-toggle {
          background: #f5f3f0;
          border-color: #c8c4bc;
        }

        .article-page.light-mode .theme-toggle svg {
          stroke: #070713;
        }

        @media (max-width: 1000px) {
          .related-grid {
            grid-template-columns: 1fr;
          }

          .article-title {
            font-size: 2rem;
          }
        }

        @media (max-width: 768px) {
          .article-nav {
            padding: 1.5rem 2rem;
          }

          .article-nav-links {
            display: none;
          }

          .article-container {
            padding: 10rem 2rem 4rem;
          }

          .article-hero {
            height: 250px;
          }

          .related-articles {
            padding: 4rem 2rem;
          }

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

      <div className={`article-page ${isLightMode ? 'light-mode' : ''}`}>
        <nav className="article-nav">
          <Link href="/" className="article-logo">
            <Image
              src="/contraband-logo-v3.png"
              alt="Contraband logo"
              width={40}
              height={40}
            />
            <span className="article-logo-text">Contra₿and</span>
          </Link>
          <div className="article-nav-links">
            <Link href="/learn">Stu₿y</Link>
            <Link href="/writings" className="active">Writings</Link>
            <a href="#podcasts" className="coming-soon">Podcasts</a>
            <a href="#videos" className="coming-soon">Videos</a>
            <a href="#merch" className="coming-soon">Merch</a>
            <Link href="/about">About</Link>
          </div>
        </nav>

        <button
          onClick={toggleTheme}
          className="theme-toggle"
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

        <div className="article-container">
          <Link href="/writings" className="back-link">
            <svg className="back-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Writings
          </Link>

          <header className="article-header">
            <div className="article-type">{article.type}</div>
            <h1 className="article-title">{article.title}</h1>
            {article.subtitle && (
              <p className="article-subtitle">{article.subtitle}</p>
            )}
            <div className="article-meta">
              <span>Published {new Date(article.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}</span>
              <span>{article.readTime}</span>
              <span>{article.type}</span>
            </div>
          </header>

          <div className="article-hero"></div>

          <div className="article-content">
            {children}
          </div>

          <footer className="article-footer">
            <div className="share-section">
              <h3 className="share-title">Share This Article</h3>
              <div className="share-buttons">
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(`https://contrabxnd.io/writings/${slug}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="share-button"
                >
                  Twitter
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://contrabxnd.io/writings/${slug}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="share-button"
                >
                  LinkedIn
                </a>
                <button
                  className="share-button"
                  onClick={() => navigator.clipboard.writeText(`https://contrabxnd.io/writings/${slug}`)}
                >
                  Copy Link
                </button>
              </div>
            </div>

            {article.substackUrl && (
              <div className="share-section">
                <h3 className="share-title">Also Available On</h3>
                <a
                  href={article.substackUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="share-button"
                >
                  Read on Substack →
                </a>
              </div>
            )}
          </footer>
        </div>

        {relatedArticles.length > 0 && (
          <section className="related-articles">
            <h2 className="related-title">Related Writings</h2>
            <div className="related-grid">
              {relatedArticles.map((related) => (
                <Link
                  key={related.slug}
                  href={`/writings/${related.slug}`}
                  className="related-card"
                >
                  <div className="related-card-type">{related.type}</div>
                  <h3 className="related-card-title">{related.title}</h3>
                  <div className="related-card-meta">{related.readTime}</div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <footer className="page-footer">
          <div className="footer-content">
            <div className="footer-left">
              <Image
                src="/contraband-logo-v3.png"
                alt="Contraband logo"
                width={32}
                height={32}
              />
              <span className="footer-copy">© 2025 Contraband. All rights reserved.</span>
            </div>
            <div className="footer-links">
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
