'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';

interface Article {
  slug: string;
  title: string;
  subtitle: string;
  date: string;
  type: string;
  readTime: string;
}

export default function WritingsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const { isLightMode } = useTheme();

  useEffect(() => {
    fetch('/api/writings')
      .then(r => r.json())
      .then(data => setArticles(data.writings ?? []))
      .catch(() => {});
  }, []);

  const filters = ['All', ...new Set(articles.map(a => a.type))];

  const filtered = activeFilter === 'All'
    ? articles
    : articles.filter(a => a.type === activeFilter);

  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <>
      <style jsx global>{`
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
          font-family: var(--cb-font-display);
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

        .filter-bar {
          padding: 24px 48px;
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
          padding: 48px 48px 96px;
          max-width: 1100px;
          margin: 0 auto;
        }

        .featured-article {
          display: flex;
          flex-direction: column;
          margin-bottom: 48px;
          padding: 48px;
          border: 1px solid var(--cb-border);
          border-radius: 2px;
          background: var(--cb-surface);
          text-decoration: none;
          color: inherit;
          transition: border-color 0.15s ease;
        }

        .featured-article:hover {
          border-color: var(--cb-accent);
        }

        .featured-label {
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--cb-accent);
          margin-bottom: 20px;
        }

        .featured-title {
          font-family: var(--cb-font-display);
          font-size: clamp(1.8rem, 3vw, 2.5rem);
          font-weight: 400;
          line-height: 1.2;
          letter-spacing: -0.02em;
          margin-bottom: 16px;
        }

        .featured-excerpt {
          color: var(--cb-text-muted);
          font-size: 13px;
          line-height: 1.8;
          max-width: 640px;
          margin-bottom: 32px;
        }

        .featured-meta {
          display: flex;
          gap: 32px;
          font-size: 11px;
          color: var(--cb-text-muted);
          letter-spacing: 0.06em;
        }

        .articles-list {
          display: flex;
          flex-direction: column;
          gap: 0;
          border: 1px solid var(--cb-border);
          border-radius: 2px;
        }

        .article-row {
          display: grid;
          grid-template-columns: 60px 1fr auto;
          gap: 24px;
          align-items: center;
          padding: 24px 32px;
          border-bottom: 1px solid var(--cb-border);
          text-decoration: none;
          color: inherit;
          transition: background 0.15s ease;
        }

        .article-row:last-child {
          border-bottom: none;
        }

        .article-row:hover {
          background: var(--cb-surface);
        }

        .article-number {
          font-family: var(--cb-font-display);
          font-size: 1.5rem;
          color: var(--cb-text-muted);
        }

        .article-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }

        .article-type {
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--cb-accent);
        }

        .article-title {
          font-family: var(--cb-font-display);
          font-size: 1.3rem;
          font-weight: 400;
          line-height: 1.3;
        }

        .article-excerpt {
          color: var(--cb-text-muted);
          font-size: 12px;
          line-height: 1.5;
        }

        .article-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
          font-size: 11px;
          color: var(--cb-text-muted);
          white-space: nowrap;
        }

        .article-arrow {
          width: 16px;
          height: 16px;
          stroke: var(--cb-text-muted);
          transition: stroke 0.15s ease;
        }

        .article-row:hover .article-arrow {
          stroke: var(--cb-accent);
        }

        .no-articles {
          padding: 48px;
          text-align: center;
          color: var(--cb-text-muted);
          font-size: 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        @media (max-width: 768px) {
          .page-header { padding: 72px 24px 0; }
          .filter-bar { padding: 20px 24px; gap: 20px; overflow-x: auto; }
          .filter-bar::-webkit-scrollbar { display: none; }
          .articles-section { padding: 32px 24px 64px; }
          .featured-article { padding: 24px; }
          .featured-title { font-size: 1.5rem; }
          .article-row {
            grid-template-columns: 1fr auto;
            gap: 16px;
            padding: 20px 24px;
          }
          .article-number { display: none; }
          .article-meta { flex-direction: row; gap: 12px; }
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
          {featured && (
            <Link href={`/writings/${featured.slug}`} className="featured-article">
              <span className="featured-label">Latest · {featured.type}</span>
              <h2 className="featured-title">{featured.title}</h2>
              <p className="featured-excerpt">{featured.subtitle}</p>
              <div className="featured-meta">
                <span>{new Date(featured.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                <span>{featured.readTime}</span>
              </div>
            </Link>
          )}

          {rest.length > 0 ? (
            <div className="articles-list">
              {rest.map((article, i) => (
                <Link
                  key={article.slug}
                  href={`/writings/${article.slug}`}
                  className="article-row"
                >
                  <span className="article-number">{String(i + 2).padStart(2, '0')}</span>
                  <div className="article-info">
                    <span className="article-type">{article.type}</span>
                    <h3 className="article-title">{article.title}</h3>
                    <p className="article-excerpt">{article.subtitle}</p>
                  </div>
                  <div className="article-meta">
                    <span>{new Date(article.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}</span>
                    <span>{article.readTime}</span>
                    <svg className="article-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          ) : articles.length > 0 && (
            <div className="no-articles">No writings in this category yet.</div>
          )}
        </section>

        <SiteFooter />
      </div>
    </>
  );
}
