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
      } catch {
        // silent
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
    const interval = setInterval(fetchNews, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getRelativeTime = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'NOW';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  const bg = isLightMode ? '#f7f7f8' : '#0a0a0a';
  const border = isLightMode ? '#d0d0d1' : '#1a1a1a';
  const textPrimary = isLightMode ? '#0a0a0a' : '#e8e4dc';
  const textMuted = isLightMode ? '#8a8a8a' : '#5a5a5a';
  const textDim = isLightMode ? '#c0c0c1' : '#2a2a2a';

  if (isLoading) {
    return (
      <div style={{
        background: bg,
        borderBottom: `1px solid ${border}`,
        padding: '10px 0',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        gap: '2rem',
        paddingLeft: '16px',
      }}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '9px',
          letterSpacing: '0.15em',
          textTransform: 'uppercase' as const,
          color: textMuted,
          flexShrink: 0,
        }}>
          <span style={{
            width: '5px', height: '5px', borderRadius: '50%',
            background: '#3a3a3a',
          }} />
          WIRE
        </span>
      </div>
    );
  }

  if (news.length === 0) return null;

  const tickerItems = [...news, ...news];
  const speed = Math.max(100, news.length * 9);

  return (
    <>
      <style jsx global>{`
        .nw-ticker {
          background: ${bg};
          border-bottom: 1px solid ${border};
          padding: 0;
          overflow: hidden;
          position: relative;
          display: flex;
          align-items: center;
        }

        .nw-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 14px;
          border-right: 1px solid ${border};
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: ${textMuted};
          flex-shrink: 0;
          z-index: 3;
          background: ${bg};
        }

        .nw-live-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #22c55e;
          animation: pulse-dot 2s ease-in-out infinite;
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .nw-scroll-area {
          flex: 1;
          overflow: hidden;
          position: relative;
        }

        .nw-scroll-area::before,
        .nw-scroll-area::after {
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          width: 40px;
          z-index: 2;
          pointer-events: none;
        }

        .nw-scroll-area::before {
          left: 0;
          background: linear-gradient(to right, ${bg}, transparent);
        }

        .nw-scroll-area::after {
          right: 0;
          background: linear-gradient(to left, ${bg}, transparent);
        }

        .nw-track {
          display: flex;
          width: max-content;
        }

        @keyframes nw-ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .nw-item {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          cursor: pointer;
          white-space: nowrap;
          transition: opacity 0.15s ease;
          border-right: 1px solid ${textDim};
        }

        .nw-item:hover {
          opacity: 0.7;
        }

        .nw-item-time {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.05em;
          color: ${textMuted};
          flex-shrink: 0;
        }

        .nw-item-time.recent {
          color: #F7931A;
        }

        .nw-item-source {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: ${textMuted};
          flex-shrink: 0;
        }

        .nw-item-title {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: ${textPrimary};
        }

        .nw-sentiment {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        @media (max-width: 768px) {
          .nw-badge {
            padding: 8px 10px;
            font-size: 8px;
          }
          .nw-item {
            padding: 8px 14px;
            gap: 6px;
          }
          .nw-item-title {
            font-size: 10px;
          }
          .nw-item-time {
            font-size: 8px;
          }
          .nw-item-source {
            font-size: 8px;
          }
        }
      `}</style>

      <div className="nw-ticker">
        <div className="nw-badge">
          <span className="nw-live-dot" />
          WIRE
        </div>

        <div
          className="nw-scroll-area"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div
            ref={tickerRef}
            className="nw-track"
            style={{
              animation: `nw-ticker-scroll ${speed}s linear infinite`,
              animationPlayState: isPaused ? 'paused' : 'running',
            }}
          >
            {tickerItems.map((item, index) => {
              const isRecent = Date.now() - item.timestamp < 1000 * 60 * 30;
              return (
                <div
                  key={`${item.id}-${index}`}
                  className="nw-item"
                  onClick={() => onItemClick(item)}
                >
                  <span className={`nw-item-time${isRecent ? ' recent' : ''}`}>
                    {getRelativeTime(item.timestamp)}
                  </span>
                  {item.sentiment && item.sentiment !== 'neutral' && (
                    <span
                      className="nw-sentiment"
                      style={{ background: item.sentiment === 'bullish' ? '#22c55e' : '#ef4444' }}
                    />
                  )}
                  <span className="nw-item-source">{item.source.name}</span>
                  <span className="nw-item-title">
                    {item.title.length > 90 ? item.title.substring(0, 90) + '...' : item.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
