'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { NewsItem } from '@/lib/news/types';

interface NewsModalProps {
  item: NewsItem | null;
  onClose: () => void;
  isLightMode?: boolean;
}

export default function NewsModal({ item, onClose, isLightMode }: NewsModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const stableClose = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    if (!item) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { stableClose(); return; }
      if (e.key === 'Tab' && contentRef.current) {
        const focusable = contentRef.current.querySelectorAll<HTMLElement>(
          'button, [href], [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    contentRef.current?.querySelector<HTMLElement>('button')?.focus();
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [item, stableClose]);

  if (!item) return null;

  const getSentimentLabel = (sentiment?: string) => {
    switch (sentiment) {
      case 'bullish':
        return { text: 'BULLISH', color: '#22c55e' };
      case 'bearish':
        return { text: 'BEARISH', color: '#ef4444' };
      default:
        return { text: 'NEUTRAL', color: '#8a8a8a' };
    }
  };

  const getRelativeTime = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  };

  const sentiment = getSentimentLabel(item.sentiment);

  return (
    <>
      <style jsx>{`
        .news-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .news-modal {
          background: ${isLightMode ? '#f7f7f8' : '#0d0d0d'};
          border: 1px solid ${isLightMode ? '#d0d0d1' : '#2a2a2a'};
          max-width: 600px;
          width: 100%;
          max-height: 80vh;
          overflow-y: auto;
          position: relative;
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .news-modal-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: none;
          border: none;
          color: ${isLightMode ? '#5a5a5a' : '#5a5a5a'};
          cursor: pointer;
          padding: 0.5rem;
          transition: color 0.2s ease;
          z-index: 1;
        }

        .news-modal-close:hover {
          color: ${isLightMode ? '#0a0a0a' : '#e8e4dc'};
        }

        .news-modal-close svg {
          width: 24px;
          height: 24px;
        }

        .news-modal-header {
          padding: 2rem 2rem 1rem;
          border-bottom: 1px solid ${isLightMode ? '#d0d0d1' : '#1a1a1a'};
        }

        .news-modal-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .news-modal-sentiment {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 10px;
          letter-spacing: 0.15em;
          font-weight: 700;
        }

        .sentiment-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .news-modal-time {
          font-size: 12px;
          color: #8a8a8a;
        }

        .news-modal-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.75rem;
          font-weight: 400;
          line-height: 1.3;
          color: ${isLightMode ? '#0a0a0a' : '#e8e4dc'};
          margin: 0;
        }

        .news-modal-body {
          padding: 1.5rem 2rem;
        }

        .news-modal-summary {
          font-size: 14px;
          line-height: 1.8;
          color: ${isLightMode ? '#3a3a3a' : '#a8a8a8'};
          margin-bottom: 1.5rem;
        }

        .news-modal-source {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: ${isLightMode ? '#e8e4dc' : '#141414'};
          border: 1px solid ${isLightMode ? '#d0d0d1' : '#1a1a1a'};
          margin-bottom: 1.5rem;
        }

        .source-icon {
          font-size: 1.5rem;
        }

        .source-info {
          flex: 1;
        }

        .source-name {
          font-size: 13px;
          color: ${isLightMode ? '#0a0a0a' : '#e8e4dc'};
          font-weight: 600;
        }

        .source-type {
          font-size: 10px;
          color: #8a8a8a;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .news-modal-engagement {
          display: flex;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .engagement-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 12px;
          color: #8a8a8a;
        }

        .engagement-item svg {
          width: 14px;
          height: 14px;
        }

        @media (max-width: 600px) {
          .news-modal {
            max-height: 90vh;
          }

          .news-modal-header {
            padding: 1.5rem 1.5rem 1rem;
          }

          .news-modal-title {
            font-size: 1.4rem;
          }

          .news-modal-body,
          .news-modal-footer {
            padding: 1rem 1.5rem;
          }
        }
      `}</style>

      <div className="news-modal-overlay" onClick={onClose}>
        <div className="news-modal" ref={contentRef} role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
          <button className="news-modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <div className="news-modal-header">
            <div className="news-modal-meta">
              {item.sentiment && item.sentiment !== 'neutral' && (
                <div className="news-modal-sentiment" style={{ color: sentiment.color }}>
                  <span className="sentiment-dot" style={{ background: sentiment.color }} />
                  {sentiment.text}
                </div>
              )}
              <span className="news-modal-time">{getRelativeTime(item.timestamp)}</span>
            </div>
            <h2 className="news-modal-title">{item.title}</h2>
          </div>

          <div className="news-modal-body">
            {item.summary ? (
              <p className="news-modal-summary">{item.summary}</p>
            ) : (
              <p className="news-modal-summary" style={{ fontStyle: 'italic', opacity: 0.7 }}>
                {item.source.type === 'social'
                  ? 'View the full post for more details.'
                  : 'No additional details available for this headline.'}
              </p>
            )}

            <div className="news-modal-source">
              <span className="source-icon">{item.source.icon || '📰'}</span>
              <div className="source-info">
                <div className="source-name">{item.source.name}</div>
                <div className="source-type">{item.source.type}</div>
              </div>
            </div>

            {item.engagement && (item.engagement.likes || item.engagement.comments) && (
              <div className="news-modal-engagement">
                {item.engagement.likes !== undefined && item.engagement.likes > 0 && (
                  <span className="engagement-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                    </svg>
                    {item.engagement.likes}
                  </span>
                )}
                {item.engagement.comments !== undefined && item.engagement.comments > 0 && (
                  <span className="engagement-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    {item.engagement.comments}
                  </span>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
