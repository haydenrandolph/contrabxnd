'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';

const articles = [
  {
    id: '1',
    number: '01',
    type: 'Featured Essay',
    title: 'Letters of Marque for the Digital Age',
    excerpt: 'When states embrace what they once called piracy.',
    date: 'June 10, 2024',
    readTime: '12 min read',
    slug: 'why-trump-1m-btc',
    featured: true
  },
  {
    id: '2',
    number: '02',
    type: 'Essay',
    title: 'The Pirate\'s Guide to Banking',
    excerpt: 'Why leaving the harbor means carrying more treasure.',
    date: 'June 18, 2023',
    readTime: '15 min read',
    slug: 'bankmore'
  },
  {
    id: '3',
    number: '03',
    type: 'Analysis',
    title: 'The Network Eats the Nation',
    excerpt: 'Borders are lines on maps. Networks are lines of code.',
    date: 'April 30, 2023',
    readTime: '10 min read',
    slug: 'nation-or-network'
  },
  {
    id: '4',
    number: '04',
    type: 'Essay',
    title: 'The Contract You Never Signed',
    excerpt: 'You can\'t breach an agreement you never made.',
    date: 'April 23, 2023',
    readTime: '7 min read',
    slug: 'when-did-i-sign'
  },
  {
    id: '5',
    number: '05',
    type: 'Opinion',
    title: 'The Counterfeit We All Accept',
    excerpt: 'On the collective hallucination we call money.',
    date: 'May 7, 2023',
    readTime: '10 min read',
    slug: 'dont-stare-at-money-too-long'
  },
  {
    id: '6',
    number: '06',
    type: 'Analysis',
    title: 'Maps of Progress',
    excerpt: 'Who draws the line between developed and developing—and why.',
    date: 'April 16, 2023',
    readTime: '6 min read',
    slug: 'hank-are-we-developed'
  },
  {
    id: '7',
    number: '07',
    type: 'Essay',
    title: 'When the Oracle Lies',
    excerpt: 'Confidence without competence is the most dangerous export of our age.',
    date: 'April 9, 2023',
    readTime: '6 min read',
    slug: '2-10-5-chatgpt'
  },
  {
    id: '8',
    number: '08',
    type: 'Essay',
    title: 'Coordinates Unknown',
    excerpt: 'The old maps are wrong. The new ones aren\'t drawn yet.',
    date: 'April 2, 2023',
    readTime: '5 min read',
    slug: 'hank-where-are-we'
  },
  {
    id: '9',
    number: '09',
    type: 'Opinion',
    title: 'Boarding Call',
    excerpt: 'A manifesto for the voyage ahead.',
    date: 'March 31, 2023',
    readTime: '4 min read',
    slug: 'call-it-a-blog-call-it-a-newsletter'
  }
];

export default function WritingsPage() {
  const [activeFilter, setActiveFilter] = useState('All');
  const filters = ['All', 'Essays', 'Analysis', 'Opinion', 'Guides'];
  const { isLightMode } = useTheme();

  const featuredArticle = articles.find(a => a.featured);
  const regularArticles = articles.filter(a => !a.featured);

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Space+Mono:wght@400;700&display=swap');

        .writings-page {
          background: var(--cb-bg);
          color: var(--cb-text);
          font-family: 'Space Mono', monospace;
          font-size: 13px;
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

        .filter-bar {
          padding: 32px 48px;
          max-width: 1100px;
          margin: 0 auto;
          display: flex;
          gap: 32px;
          border-bottom: 1px solid var(--cb-border);
        }

        .filter-btn {
          background: none;
          border: none;
          color: var(--cb-text-muted);
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          padding: 8px 0;
          position: relative;
          transition: color 0.15s ease;
        }

        .filter-btn:hover,
        .filter-btn.active {
          color: var(--cb-text);
        }

        .filter-btn.active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 1px;
          background: var(--cb-accent);
        }

        .articles-section {
          padding: 64px 48px;
          max-width: 1100px;
          margin: 0 auto;
        }

        .featured-article {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          margin-bottom: 64px;
          border: 1px solid var(--cb-border);
          border-radius: 2px;
          text-decoration: none;
          color: inherit;
          transition: border-color 0.15s ease;
        }

        .featured-article:hover {
          border-color: var(--cb-accent);
        }

        .featured-image {
          background: var(--cb-surface);
          min-height: 450px;
          position: relative;
          overflow: hidden;
        }

        .featured-content {
          padding: 64px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: var(--cb-surface);
        }

        .featured-label {
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--cb-accent);
          margin-bottom: 24px;
        }

        .featured-title {
          font-family: var(--cb-font-display, 'Cormorant Garamond', serif);
          font-size: 2.5rem;
          font-weight: 400;
          line-height: 1.2;
          letter-spacing: -0.02em;
          margin-bottom: 24px;
        }

        .featured-excerpt {
          color: var(--cb-text-muted);
          font-size: 13px;
          line-height: 1.9;
          margin-bottom: 32px;
        }

        .featured-meta {
          display: flex;
          gap: 32px;
          font-size: 11px;
          color: var(--cb-text-muted);
        }

        .articles-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 32px;
        }

        .article-card {
          background: var(--cb-surface);
          border: 1px solid var(--cb-border);
          border-radius: 2px;
          padding: 40px;
          text-decoration: none;
          color: inherit;
          position: relative;
          transition: border-color 0.15s ease;
          display: flex;
          flex-direction: column;
        }

        .article-card:hover {
          border-color: var(--cb-accent);
        }

        .article-number {
          font-family: var(--cb-font-display, 'Cormorant Garamond', serif);
          font-size: 2rem;
          color: var(--cb-border);
          margin-bottom: 24px;
          position: relative;
          z-index: 1;
        }

        .article-type {
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--cb-accent);
          margin-bottom: 16px;
          position: relative;
          z-index: 1;
        }

        .article-title {
          font-family: var(--cb-font-display, 'Cormorant Garamond', serif);
          font-size: 1.8rem;
          font-weight: 400;
          line-height: 1.3;
          margin-bottom: 16px;
          position: relative;
          z-index: 1;
        }

        .article-excerpt {
          color: var(--cb-text-muted);
          font-size: 13px;
          line-height: 1.8;
          margin-bottom: 32px;
          position: relative;
          z-index: 1;
          flex-grow: 1;
        }

        .article-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          color: var(--cb-text-muted);
          position: relative;
          z-index: 1;
        }

        .article-arrow {
          width: 24px;
          height: 24px;
          stroke: var(--cb-accent);
        }

        @media (max-width: 1000px) {
          .featured-article {
            grid-template-columns: 1fr;
          }

          .featured-image {
            min-height: 300px;
          }

          .articles-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .page-header { padding: 72px 24px 0; }
          .page-content { padding: 32px 24px 64px; }

          .filter-bar {
            padding: 24px 32px;
            overflow-x: auto;
          }

          .articles-section {
            padding: 48px 32px;
          }

          .featured-content {
            padding: 40px;
          }

        }
      `}</style>

      <div className={`writings-page ${isLightMode ? 'light-mode' : ''}`}>
        <SiteNav activePath="/writings" />

        <div className="page-header">
          <div className="page-label">WRITINGS</div>
          <h1 className="page-title">Writings</h1>
          <p className="page-subtitle">Essays, analysis, and opinion.</p>
          <div className="page-divider" />
        </div>

        <div className="filter-bar">
          {filters.map((filter) => (
            <button
              key={filter}
              className={`filter-btn ${activeFilter === filter ? 'active' : ''}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>

        <section className="articles-section">
          {featuredArticle && (
            <Link href={`/writings/${featuredArticle.slug}`} className="featured-article">
              <div className="featured-image"></div>
              <div className="featured-content">
                <span className="featured-label">{featuredArticle.type}</span>
                <h2 className="featured-title">{featuredArticle.title}</h2>
                <p className="featured-excerpt">{featuredArticle.excerpt}</p>
                <div className="featured-meta">
                  <span>{featuredArticle.date}</span>
                  <span>{featuredArticle.readTime}</span>
                </div>
              </div>
            </Link>
          )}

          <div className="articles-grid">
            {regularArticles.map((article) => (
              <Link
                key={article.id}
                href={`/writings/${article.slug}`}
                className="article-card"
              >
                <span className="article-number">{article.number}</span>
                <span className="article-type">{article.type}</span>
                <h3 className="article-title">{article.title}</h3>
                <p className="article-excerpt">{article.excerpt}</p>
                <div className="article-meta">
                  <span>{article.date} · {article.readTime}</span>
                  <svg className="article-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <SiteFooter />
      </div>
    </>
  );
}
