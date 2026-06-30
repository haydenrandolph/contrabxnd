'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const calculateStreak = (progress: Array<{ completed_at: string | null; completed: boolean }>) => {
  const completedDates = new Set(
    progress
      .filter(p => p.completed && p.completed_at)
      .map(p => new Date(p.completed_at!).toISOString().split('T')[0])
  );

  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    if (completedDates.has(dateStr)) {
      streak++;
    } else if (i > 0) {
      break; // Allow today to not have activity yet
    }
  }
  return streak;
};

export default function StreakBadge() {
  const { user } = useAuth();
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!user) return;
    fetch('/api/progress')
      .then(r => r.json())
      .then(data => {
        if (data.progress) {
          setStreak(calculateStreak(data.progress));
        }
      })
      .catch(() => {});
  }, [user]);

  if (!user || streak <= 0) return null;

  return (
    <>
      <style jsx>{`
        .streak-badge {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: #F7931A;
          letter-spacing: 0.05em;
        }
        .streak-icon {
          width: 16px;
          height: 16px;
        }
      `}</style>
      <span className="streak-badge">
        <svg viewBox="0 0 24 24" fill="#F7931A" className="streak-icon">
          <path d="M12 23c-3.866 0-7-3.134-7-7 0-3.037 2.506-6.6 4.495-8.87a.75.75 0 0 1 1.186.137C11.742 9.14 12.5 10 13 10c.392 0 .782-.648 1.063-1.134.328-.567.686-1.186 1.252-1.186.498 0 .86.39 1.192.845C18.03 11.009 19 13.547 19 16c0 3.866-3.134 7-7 7z"/>
        </svg>
        {streak}
      </span>
    </>
  );
}
