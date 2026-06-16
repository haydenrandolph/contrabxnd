'use client';

import { useState, useEffect, useRef } from 'react';
import type { NewsItem } from '@/lib/news/types';

interface NewsTickerProps {
  onItemClick: (item: NewsItem) => void;
  isLightMode?: boolean;
}

export default function NewsTicker({ onItemClick, isLightMode }: NewsTickerProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const tickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch('/api/news');
        if (res.ok) {
          const data = await res.json();
          setNews(data.news || []);
        }
      } catch (error) {
        console.error('Failed to fetch news:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();

    // Refresh every 5 minutes
    const interval = setInterval(fetchNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'bullish':
        return '#22c55e';
      case 'bearish':
        return '#ef4444';
      default:
        return '#8a8a8a';
    }
  };

  const getRelativeTime = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  if (isLoading) {
    return (
      <div className="news-ticker-container">
        <style jsx>{`
          .news-ticker-container {
            background: ${isLightMode ? '#d0d0d1' : '#0d0d0d'};
            border-bottom: 1px solid ${isLightMode ? '#c0c0c1' : '#1a1a1a'};
            padding: 0.75rem 0;
            overflow: hidden;
          }
          .ticker-loading {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0;
          }
        `}</style>
        <div className="ticker-loading">
          <span className="skeleton" style={{ width: '120px', height: '12px', display: 'inline-block', marginRight: '2rem' }} />
          <span className="skeleton" style={{ width: '200px', height: '12px', display: 'inline-block', marginRight: '2rem' }} />
          <span className="skeleton" style={{ width: '160px', height: '12px', display: 'inline-block', marginRight: '2rem' }} />
          <span className="skeleton" style={{ width: '180px', height: '12px', display: 'inline-block' }} />
        </div>
      </div>
    );
  }

  if (news.length === 0) {
    return null;
  }

  // Duplicate items for seamless loop
  const tickerItems = [...news, ...news];

  return (
    <>
      <style jsx>{`
        .news-ticker-container {
          background: ${isLightMode ? '#d0d0d1' : '#0d0d0d'};
          border-bottom: 1px solid ${isLightMode ? '#c0c0c1' : '#1a1a1a'};
          padding: 0.75rem 0;
          overflow: hidden;
          position: relative;
        }

        .news-ticker-container::before,
        .news-ticker-container::after {
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          width: 60px;
          z-index: 2;
          pointer-events: none;
        }

        .news-ticker-container::before {
          left: 0;
          background: linear-gradient(to right, ${isLightMode ? '#d0d0d1' : '#0d0d0d'}, transparent);
        }

        .news-ticker-container::after {
          right: 0;
          background: linear-gradient(to left, ${isLightMode ? '#d0d0d1' : '#0d0d0d'}, transparent);
        }

        .news-ticker-track {
          display: flex;
          width: max-content;
          animation: ticker-scroll 120s linear infinite;
        }

        .news-ticker-track.paused {
          animation-play-state: paused;
        }

        @keyframes ticker-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .ticker-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0 2rem;
          cursor: pointer;
          transition: opacity 0.2s ease;
          white-space: nowrap;
        }

        .ticker-item:hover {
          opacity: 0.7;
        }

        .ticker-sentiment {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .ticker-source {
          font-size: 12px;
          opacity: 0.6;
        }

        .ticker-title {
          font-size: 12px;
          color: ${isLightMode ? '#0a0a0a' : '#e8e4dc'};
          font-family: 'Space Mono', monospace;
        }

        .ticker-time {
          font-size: 10px;
          color: #5a5a5a;
          margin-left: 0.25rem;
        }

        .ticker-separator {
          color: ${isLightMode ? '#8a8a8a' : '#3a3a3a'};
          padding: 0 0.5rem;
        }
      `}</style>

      <div
        className="news-ticker-container"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div
          ref={tickerRef}
          className={`news-ticker-track ${isPaused ? 'paused' : ''}`}
        >
          {tickerItems.map((item, index) => (
            <div key={`${item.id}-${index}`} className="ticker-item" onClick={() => onItemClick(item)}>
              {item.sentiment && item.sentiment !== 'neutral' && (
                <span
                  className="ticker-sentiment"
                  style={{ background: getSentimentColor(item.sentiment) }}
                />
              )}
              <span className="ticker-source">{item.source.icon}</span>
              <span className="ticker-title">
                {item.title.length > 80 ? item.title.substring(0, 80) + '...' : item.title}
              </span>
              <span className="ticker-time">{getRelativeTime(item.timestamp)}</span>
              <span className="ticker-separator">•</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
