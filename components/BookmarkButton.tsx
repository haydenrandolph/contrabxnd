'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface BookmarkButtonProps {
  contentType: 'article' | 'lesson';
  contentSlug: string;
  className?: string;
}

export default function BookmarkButton({ contentType, contentSlug, className }: BookmarkButtonProps) {
  const { user } = useAuth();
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    fetch('/api/bookmarks')
      .then(r => r.json())
      .then(data => {
        const match = data.bookmarks?.find(
          (b: { content_type: string; content_slug: string }) =>
            b.content_type === contentType && b.content_slug === contentSlug
        );
        if (match) setBookmarked(true);
      })
      .catch(() => {});
  }, [user, contentType, contentSlug]);

  const toggle = useCallback(async () => {
    if (loading) return;
    setLoading(true);

    try {
      const method = bookmarked ? 'DELETE' : 'POST';
      const res = await fetch('/api/bookmarks', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType, contentSlug }),
      });
      if (res.ok) setBookmarked(!bookmarked);
    } catch { /* ignore */ }

    setLoading(false);
  }, [loading, bookmarked, contentType, contentSlug]);

  if (!user) return null;

  return (
    <>
      <style jsx>{`
        .bookmark-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0;
          transition: transform 0.2s ease, opacity 0.2s ease;
          opacity: 0.7;
          flex-shrink: 0;
        }

        .bookmark-btn:hover {
          transform: scale(1.15);
          opacity: 1;
        }

        .bookmark-btn:disabled {
          cursor: default;
          opacity: 0.4;
        }

        .bookmark-btn svg {
          width: 20px;
          height: 20px;
        }
      `}</style>
      <button
        className={`bookmark-btn ${className || ''}`}
        onClick={toggle}
        disabled={loading}
        title={bookmarked ? 'Remove bookmark' : 'Bookmark this'}
        aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark this'}
      >
        <svg viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
            fill={bookmarked ? '#F7931A' : 'none'}
            stroke={bookmarked ? '#F7931A' : '#8a8a8a'}
          />
        </svg>
      </button>
    </>
  );
}
