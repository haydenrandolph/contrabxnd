'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface ProgressEntry {
  course_slug: string;
  lesson_slug: string;
  completed: boolean;
}

export default function ShareProgressButton() {
  const { user } = useAuth();
  const [sharing, setSharing] = useState(false);
  const [toast, setToast] = useState('');
  const [completedCount, setCompletedCount] = useState(0);
  const totalLessons = 21;

  useEffect(() => {
    if (!user) return;
    fetch('/api/progress')
      .then(r => r.json())
      .then(data => {
        const count = (data.progress ?? []).filter(
          (p: ProgressEntry) => p.course_slug === 'boarding-pass' && p.completed
        ).length;
        setCompletedCount(count);
      })
      .catch(() => {});
  }, [user]);

  if (!user || completedCount === 0) return null;

  const share = async () => {
    setSharing(true);
    try {
      // Try native Web Share API first (mobile-friendly)
      if (navigator.share) {
        await navigator.share({
          title: 'My Contrabxnd Progress',
          text: `I've completed ${completedCount}/${totalLessons} lessons on the Boarding Pass course at Contrabxnd!`,
          url: 'https://contrabxnd.io/learn/boarding-pass',
        });
      } else {
        // Fallback: copy progress message to clipboard
        const message = `I've completed ${completedCount}/${totalLessons} lessons on the Boarding Pass course at Contrabxnd!\nhttps://contrabxnd.io/learn/boarding-pass`;
        await navigator.clipboard.writeText(message);
        setToast('Copied to clipboard!');
        setTimeout(() => setToast(''), 2500);
      }
    } catch {
      // User cancelled share dialog or error occurred
    }
    setSharing(false);
  };

  const percentage = Math.round((completedCount / totalLessons) * 100);

  return (
    <>
      <style jsx>{`
        .share-progress-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: transparent;
          border: 1px solid #3a3a3a;
          color: #8a8a8a;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s ease;
          white-space: nowrap;
        }

        .share-progress-btn:hover {
          border-color: #F7931A;
          color: #F7931A;
        }

        .share-progress-btn:active {
          background: rgba(247, 147, 26, 0.1);
        }

        .share-progress-btn.sharing {
          opacity: 0.6;
          pointer-events: none;
        }

        .share-progress-btn svg {
          width: 14px;
          height: 14px;
          flex-shrink: 0;
        }

        .share-toast {
          position: fixed;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          background: #F7931A;
          color: #fff;
          font-family: 'Space Mono', monospace;
          font-size: 12px;
          letter-spacing: 0.05em;
          padding: 0.75rem 1.5rem;
          z-index: 9999;
          animation: toast-in 0.3s ease;
        }

        @keyframes toast-in {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        :global(.light-mode) .share-progress-btn,
        :global(.account-page.light-mode) .share-progress-btn {
          border-color: #c8c4bc;
          color: #5a5a5a;
        }

        :global(.light-mode) .share-progress-btn:hover,
        :global(.account-page.light-mode) .share-progress-btn:hover {
          border-color: #F7931A;
          color: #F7931A;
        }
      `}</style>

      <button
        className={`share-progress-btn${sharing ? ' sharing' : ''}`}
        onClick={share}
        title={`Share your progress: ${percentage}% complete`}
        disabled={sharing}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
        {sharing ? 'Sharing...' : 'Share Progress'}
      </button>

      {toast && <div className="share-toast">{toast}</div>}
    </>
  );
}
