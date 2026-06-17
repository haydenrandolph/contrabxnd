'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { NewsItem } from '@/lib/news/types';

interface NewsTickerProps {
  onItemClick: (item: NewsItem) => void;
  isLightMode?: boolean;
}

export default function NewsTicker({ onItemClick, isLightMode }: NewsTickerProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<number>(0);
  const [flashIndex, setFlashIndex] = useState<number | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  const fetchNews = useCallback(async () => {
    try {
      const res = await fetch('/api/news');
      if (res.ok) {
        const data = await res.json();
        const items = data.news || [];
        if (items.length > prevCountRef.current && prevCountRef.current > 0) {
          setFlashIndex(0);
          setTimeout(() => setFlashIndex(null), 2000);
        }
        prevCountRef.current = items.length;
        setNews(items);
        setLastUpdated(Date.now());
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchNews]);

  const getRelativeTime = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'NOW';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}M AGO`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}H AGO`;
    const days = Math.floor(hours / 24);
    return `${days}D AGO`;
  };

  const getSentimentTag = (sentiment?: string) => {
    if (sentiment === 'bullish') return { label: 'BULL', color: '#22c55e' };
    if (sentiment === 'bearish') return { label: 'BEAR', color: '#ef4444' };
    return null;
  };

  const getSourceTag = (source: NewsItem['source']) => {
    if (source.type === 'social') return 'SOCIAL';
    return 'NEWS';
  };

  const bg = isLightMode ? '#ffffff' : '#0a0a0a';
  const bgAlt = isLightMode ? '#f7f7f8' : '#0d0d0d';
  const border = isLightMode ? '#d0d0d1' : '#1a1a1a';
  const textPrimary = isLightMode ? '#0a0a0a' : '#e8e4dc';
  const textMuted = isLightMode ? '#8a8a8a' : '#5a5a5a';
  const textDim = isLightMode ? '#b0b0b1' : '#3a3a3a';

  if (isLoading) {
    return (
      <>
        <style jsx>{`
          .nw-container {
            background: ${bg};
            border-bottom: 1px solid ${border};
            height: 220px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .nw-loading {
            font-family: 'Space Mono', monospace;
            font-size: 10px;
            letter-spacing: 0.15em;
            text-transform: uppercase;
            color: ${textMuted};
          }
          .nw-loading::after {
            content: '';
            animation: dots 1.5s steps(4) infinite;
          }
          @keyframes dots {
            0% { content: ''; }
            25% { content: '.'; }
            50% { content: '..'; }
            75% { content: '...'; }
          }
        `}</style>
        <div className="nw-container">
          <span className="nw-loading">Loading wire</span>
        </div>
      </>
    );
  }

  if (news.length === 0) return null;

  return (
    <>
      <style jsx>{`
        .nw-container {
          background: ${bg};
          border-bottom: 1px solid ${border};
          display: flex;
          flex-direction: column;
          height: 220px;
          overflow: hidden;
        }

        .nw-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 16px;
          border-bottom: 1px solid ${border};
          flex-shrink: 0;
        }

        .nw-header-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .nw-live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #22c55e;
          animation: pulse-dot 2s ease-in-out infinite;
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .nw-label {
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: ${textMuted};
        }

        .nw-count {
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          color: ${textDim};
        }

        .nw-feed {
          flex: 1;
          overflow-y: auto;
          scrollbar-width: none;
        }

        .nw-feed::-webkit-scrollbar {
          display: none;
        }

        .nw-item {
          display: grid;
          grid-template-columns: 56px 1fr;
          gap: 0;
          padding: 0;
          border-bottom: 1px solid ${border};
          cursor: pointer;
          transition: background 0.1s ease;
        }

        .nw-item:hover {
          background: ${bgAlt};
        }

        .nw-item:last-child {
          border-bottom: none;
        }

        .nw-item.flash {
          animation: flash-new 2s ease;
        }

        @keyframes flash-new {
          0% { background: rgba(247, 147, 26, 0.15); }
          100% { background: transparent; }
        }

        .nw-time-col {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          justify-content: center;
          padding: 10px 8px 10px 12px;
          border-right: 1px solid ${border};
        }

        .nw-time {
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.05em;
          color: ${textMuted};
          white-space: nowrap;
        }

        .nw-time.recent {
          color: #F7931A;
        }

        .nw-content {
          display: flex;
          flex-direction: column;
          gap: 3px;
          padding: 10px 12px;
          min-width: 0;
        }

        .nw-tags {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .nw-tag {
          font-family: 'Space Mono', monospace;
          font-size: 8px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 1px 5px;
          border: 1px solid ${textDim};
          color: ${textMuted};
          border-radius: 1px;
          white-space: nowrap;
        }

        .nw-tag.sentiment {
          border: none;
          padding: 1px 5px;
          font-weight: 700;
        }

        .nw-source {
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          color: ${textMuted};
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .nw-title {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          line-height: 1.4;
          color: ${textPrimary};
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .nw-title:hover {
          color: #F7931A;
        }

        @media (max-width: 768px) {
          .nw-container {
            height: 180px;
          }

          .nw-item {
            grid-template-columns: 46px 1fr;
          }

          .nw-time-col {
            padding: 8px 6px 8px 8px;
          }

          .nw-time {
            font-size: 8px;
          }

          .nw-content {
            padding: 8px 10px;
            gap: 2px;
          }

          .nw-title {
            font-size: 10px;
          }

          .nw-tags {
            gap: 4px;
          }

          .nw-tag {
            font-size: 7px;
            padding: 0px 4px;
          }
        }
      `}</style>

      <div className="nw-container">
        <div className="nw-header">
          <div className="nw-header-left">
            <span className="nw-live-dot" />
            <span className="nw-label">Wire</span>
          </div>
          <span className="nw-count">{news.length} items</span>
        </div>

        <div className="nw-feed" ref={feedRef}>
          {news.map((item, i) => {
            const sentiment = getSentimentTag(item.sentiment);
            const isRecent = Date.now() - item.timestamp < 1000 * 60 * 30;

            return (
              <div
                key={item.id}
                className={`nw-item${i === flashIndex ? ' flash' : ''}`}
                onClick={() => onItemClick(item)}
              >
                <div className="nw-time-col">
                  <span className={`nw-time${isRecent ? ' recent' : ''}`}>
                    {getRelativeTime(item.timestamp)}
                  </span>
                </div>
                <div className="nw-content">
                  <div className="nw-tags">
                    <span className="nw-tag">{getSourceTag(item.source)}</span>
                    {sentiment && (
                      <span
                        className="nw-tag sentiment"
                        style={{ color: sentiment.color }}
                      >
                        {sentiment.label}
                      </span>
                    )}
                    <span className="nw-source">{item.source.name}</span>
                  </div>
                  <span className="nw-title">{item.title}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
