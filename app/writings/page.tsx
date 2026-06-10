'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import ThemeToggle from '@/components/ThemeToggle';

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
          background: #0a0a0a;
          color: #e8e4dc;
          font-family: 'Space Mono', monospace;
          min-height: 100vh;
        }

        .writings-page.light-mode {
          background: #e8e4dc;
          color: #0a0a0a;
        }

        .writings-page::before {
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

        .page-header {
          padding: 12rem 3rem 6rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .page-header-inner {
          display: flex;
          align-items: baseline;
          gap: 2rem;
          border-bottom: 1px solid #3a3a3a;
          padding-bottom: 2rem;
        }

        .writings-page.light-mode .page-header-inner {
          border-bottom-color: #c8c4bc;
        }

        .page-number {
          font-family: 'Cormorant Garamond', serif;
          font-size: 4rem;
          color: #F7931A;
          line-height: 1;
        }

        .page-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 4rem;
          font-weight: 400;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .page-description {
          max-width: 600px;
          margin-top: 2rem;
          color: #8a8a8a;
          line-height: 1.8;
          font-size: 14px;
        }

        .filter-bar {
          padding: 2rem 3rem;
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          gap: 2rem;
          border-bottom: 1px solid #1a1a1a;
        }

        .writings-page.light-mode .filter-bar {
          border-bottom-color: #d8d4cc;
        }

        .filter-btn {
          background: none;
          border: none;
          color: #8a8a8a;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
          padding: 0.5rem 0;
          position: relative;
          transition: color 0.3s ease;
        }

        .filter-btn:hover,
        .filter-btn.active {
          color: #e8e4dc;
        }

        .writings-page.light-mode .filter-btn:hover,
        .writings-page.light-mode .filter-btn.active {
          color: #0a0a0a;
        }

        .filter-btn.active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 1px;
          background: #F7931A;
        }

        .articles-section {
          padding: 4rem 3rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .featured-article {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          margin-bottom: 4rem;
          border: 1px solid #3a3a3a;
          text-decoration: none;
          color: inherit;
          transition: border-color 0.3s ease;
        }

        .featured-article:hover {
          border-color: #F7931A;
        }

        .writings-page.light-mode .featured-article {
          background: #f5f3f0;
          border-color: #d8d4cc;
        }

        .featured-image {
          background: #1a1a1a;
          min-height: 450px;
          position: relative;
          overflow: hidden;
        }

        .featured-image::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, #F7931A 0%, #0a0a0a 100%);
          opacity: 0.4;
        }

        .featured-content {
          padding: 4rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: #141414;
        }

        .writings-page.light-mode .featured-content {
          background: #f5f3f0;
        }

        .featured-label {
          font-size: 10px;
          letter-spacing: 0.4em;
          text-transform: uppercase;
          color: #F7931A;
          margin-bottom: 1.5rem;
        }

        .featured-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2.5rem;
          font-weight: 400;
          line-height: 1.2;
          margin-bottom: 1.5rem;
        }

        .featured-excerpt {
          color: #8a8a8a;
          font-size: 14px;
          line-height: 1.9;
          margin-bottom: 2rem;
        }

        .featured-meta {
          display: flex;
          gap: 2rem;
          font-size: 11px;
          color: #8a8a8a;
        }

        .articles-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2rem;
        }

        .article-card {
          background: #141414;
          border: 1px solid #1a1a1a;
          padding: 2.5rem;
          text-decoration: none;
          color: inherit;
          position: relative;
          transition: all 0.4s ease;
          display: flex;
          flex-direction: column;
        }

        .writings-page.light-mode .article-card {
          background: #f5f3f0;
          border-color: #d8d4cc;
        }

        .article-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #F7931A 0%, transparent 50%);
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        .article-card:hover {
          border-color: #F7931A;
          transform: translateY(-4px);
        }

        .article-card:hover::before {
          opacity: 0.05;
        }

        .article-number {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2rem;
          color: #3a3a3a;
          margin-bottom: 1.5rem;
          position: relative;
          z-index: 1;
        }

        .writings-page.light-mode .article-number {
          color: #c8c4bc;
        }

        .article-type {
          font-size: 10px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: #F7931A;
          margin-bottom: 1rem;
          position: relative;
          z-index: 1;
        }

        .article-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.8rem;
          font-weight: 400;
          line-height: 1.3;
          margin-bottom: 1rem;
          position: relative;
          z-index: 1;
        }

        .article-excerpt {
          color: #8a8a8a;
          font-size: 13px;
          line-height: 1.8;
          margin-bottom: 2rem;
          position: relative;
          z-index: 1;
          flex-grow: 1;
        }

        .article-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          color: #8a8a8a;
          position: relative;
          z-index: 1;
        }

        .article-arrow {
          width: 24px;
          height: 24px;
          stroke: #F7931A;
          transition: transform 0.3s ease;
        }

        .article-card:hover .article-arrow {
          transform: translateX(4px);
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
          .page-header {
            padding: 10rem 2rem 4rem;
          }

          .page-header-inner {
            flex-direction: column;
            gap: 1rem;
          }

          .page-number,
          .page-title {
            font-size: 2.5rem;
          }

          .filter-bar {
            padding: 1.5rem 2rem;
            overflow-x: auto;
          }

          .articles-section {
            padding: 3rem 2rem;
          }

          .featured-content {
            padding: 2.5rem;
          }

        }
      `}</style>

      <div className={`writings-page ${isLightMode ? 'light-mode' : ''}`}>
        <SiteNav activePath="/writings" />
        <ThemeToggle />

        <header className="page-header">
          <div className="page-header-inner">
            <span className="page-number">01</span>
            <h1 className="page-title">Writings</h1>
          </div>
          <p className="page-description">
            Long-form essays, analysis, and opinions on the ideas that refuse to stay buried.
            Exploring the gray markets of thought where the most valuable insights are found.
          </p>
        </header>

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
