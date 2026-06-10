'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { ProgressBar } from '@/components/courses';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import ThemeToggle from '@/components/ThemeToggle';
import ShareProgressButton from '@/components/ShareProgressButton';

interface LessonProgress {
  id: string;
  course_slug: string;
  lesson_slug: string;
  completed: boolean;
  completed_at: string | null;
}

interface Bookmark {
  content_type: 'article' | 'lesson';
  content_slug: string;
  created_at: string;
}

interface Highlight {
  id: string;
  content_type: 'article' | 'lesson';
  content_slug: string;
  text: string;
  note: string | null;
  created_at: string;
}

// Course data for progress display
const COURSES = [
  {
    slug: 'boarding-pass',
    title: 'The Boarding Pass',
    totalLessons: 21,
  },
  {
    slug: 'letters-of-marque',
    title: 'Letters of Marque',
    totalLessons: 15,
  },
];

export default function AccountPage() {
  const [progress, setProgress] = useState<LessonProgress[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [isLoadingBookmarks, setIsLoadingBookmarks] = useState(true);
  const [isLoadingHighlights, setIsLoadingHighlights] = useState(true);
  const { isLightMode } = useTheme();
  const { user, profile, isLoading, isConfigured } = useAuth();

  // Fetch user progress
  useEffect(() => {
    const fetchProgress = async () => {
      if (!user) {
        setIsLoadingProgress(false);
        return;
      }

      try {
        const res = await fetch('/api/progress');
        if (res.ok) {
          const data = await res.json();
          setProgress(data.progress || []);
        }
      } catch (error) {
        console.error('Error fetching progress:', error);
      } finally {
        setIsLoadingProgress(false);
      }
    };

    if (!isLoading) {
      fetchProgress();
    }
  }, [user, isLoading]);

  // Fetch user bookmarks
  useEffect(() => {
    const fetchBookmarks = async () => {
      if (!user) {
        setIsLoadingBookmarks(false);
        return;
      }

      try {
        const res = await fetch('/api/bookmarks');
        if (res.ok) {
          const data = await res.json();
          setBookmarks(data.bookmarks || []);
        }
      } catch (error) {
        console.error('Error fetching bookmarks:', error);
      } finally {
        setIsLoadingBookmarks(false);
      }
    };

    if (!isLoading) {
      fetchBookmarks();
    }
  }, [user, isLoading]);

  // Fetch user highlights
  useEffect(() => {
    const fetchHighlights = async () => {
      if (!user) {
        setIsLoadingHighlights(false);
        return;
      }

      try {
        const res = await fetch('/api/highlights');
        if (res.ok) {
          const data = await res.json();
          setHighlights(data.highlights || []);
        }
      } catch (error) {
        console.error('Error fetching highlights:', error);
      } finally {
        setIsLoadingHighlights(false);
      }
    };

    if (!isLoading) {
      fetchHighlights();
    }
  }, [user, isLoading]);

  // Calculate progress per course
  const getCourseProgress = (courseSlug: string) => {
    return progress.filter(p => p.course_slug === courseSlug && p.completed).length;
  };

  // Build link for a bookmark
  const getBookmarkHref = (b: Bookmark) => {
    if (b.content_type === 'lesson') return `/learn/boarding-pass/${b.content_slug}`;
    return `/writings/${b.content_slug}`;
  };

  // Build link for a highlight
  const getHighlightHref = (h: Highlight) => {
    if (h.content_type === 'lesson') return `/learn/boarding-pass/${h.content_slug}`;
    return `/writings/${h.content_slug}`;
  };

  // Format slug into a readable title
  const formatSlug = (slug: string) =>
    slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'User';

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Space+Mono:wght@400;700&display=swap');

        .account-page {
          background: #0a0a0a;
          color: #e8e4dc;
          font-family: 'Space Mono', monospace;
          min-height: 100vh;
        }

        .account-page.light-mode {
          background: #e8e4dc;
          color: #0a0a0a;
        }

        .account-page::before {
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

        .account-container {
          padding: 10rem 3rem 4rem;
          max-width: 900px;
          margin: 0 auto;
        }

        .account-header {
          margin-bottom: 3rem;
        }

        .account-label {
          font-size: 10px;
          letter-spacing: 0.4em;
          text-transform: uppercase;
          color: #F7931A;
          margin-bottom: 1rem;
        }

        .account-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2.5rem;
          font-weight: 400;
          margin-bottom: 0.5rem;
        }

        .account-email {
          color: #8a8a8a;
          font-size: 14px;
        }

        .account-section {
          background: #141414;
          border: 1px solid #1a1a1a;
          padding: 2rem;
          margin-bottom: 2rem;
        }

        .account-page.light-mode .account-section {
          background: #f5f3f0;
          border-color: #d8d4cc;
        }

        .section-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.5rem;
          font-weight: 400;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .section-icon {
          width: 24px;
          height: 24px;
          stroke: #F7931A;
        }

        .course-progress-item {
          padding: 1.5rem 0;
          border-bottom: 1px solid #1a1a1a;
        }

        .account-page.light-mode .course-progress-item {
          border-bottom-color: #d8d4cc;
        }

        .course-progress-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .course-progress-item:first-child {
          padding-top: 0;
        }

        .course-title {
          font-size: 14px;
          margin-bottom: 0.75rem;
          font-weight: 700;
        }

        .course-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 1rem;
          font-size: 12px;
          color: #F7931A;
          text-decoration: none;
          transition: opacity 0.2s ease;
        }

        .course-link:hover {
          opacity: 0.8;
        }

        .course-link svg {
          width: 14px;
          height: 14px;
        }

        .not-logged-in {
          text-align: center;
          padding: 4rem 2rem;
        }

        .not-logged-in h2 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2rem;
          margin-bottom: 1rem;
        }

        .not-logged-in p {
          color: #8a8a8a;
          margin-bottom: 2rem;
        }

        .sign-in-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem 2rem;
          background: #F7931A;
          border: none;
          color: #fff;
          font-family: 'Space Mono', monospace;
          font-size: 12px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .sign-in-btn:hover {
          background: #e8850f;
        }

        .empty-state {
          text-align: center;
          padding: 2rem;
          color: #8a8a8a;
        }

        .empty-state p {
          margin-bottom: 1rem;
        }

        .start-learning-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: transparent;
          border: 1px solid #F7931A;
          color: #F7931A;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .start-learning-btn:hover {
          background: #F7931A;
          color: #fff;
        }

        .bookmark-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .bookmark-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 0;
          border-bottom: 1px solid #1a1a1a;
        }

        .account-page.light-mode .bookmark-item {
          border-bottom-color: #d8d4cc;
        }

        .bookmark-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .bookmark-item:first-child {
          padding-top: 0;
        }

        .bookmark-badge {
          font-size: 9px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          padding: 0.25rem 0.5rem;
          border: 1px solid #F7931A;
          color: #F7931A;
          flex-shrink: 0;
        }

        .bookmark-link {
          color: #e8e4dc;
          text-decoration: none;
          font-size: 14px;
          transition: color 0.2s ease;
          flex: 1;
        }

        .account-page.light-mode .bookmark-link {
          color: #0a0a0a;
        }

        .bookmark-link:hover {
          color: #F7931A;
        }

        .bookmark-date {
          font-size: 11px;
          color: #8a8a8a;
          flex-shrink: 0;
        }

        .highlight-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .highlight-item {
          padding: 1.25rem 0;
          border-bottom: 1px solid #1a1a1a;
        }

        .account-page.light-mode .highlight-item {
          border-bottom-color: #d8d4cc;
        }

        .highlight-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .highlight-item:first-child {
          padding-top: 0;
        }

        .highlight-text {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.1rem;
          font-style: italic;
          line-height: 1.6;
          color: #e8e4dc;
          border-left: 3px solid #F7931A;
          padding-left: 1rem;
          margin: 0 0 0.75rem;
        }

        .account-page.light-mode .highlight-text {
          color: #0a0a0a;
        }

        .highlight-source {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 11px;
          color: #8a8a8a;
        }

        .highlight-source-link {
          color: #F7931A;
          text-decoration: none;
          font-size: 11px;
          transition: opacity 0.2s ease;
        }

        .highlight-source-link:hover {
          opacity: 0.8;
        }

        .highlight-source-badge {
          font-size: 9px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          padding: 0.15rem 0.4rem;
          border: 1px solid #3a3a3a;
          color: #8a8a8a;
        }

        .account-page.light-mode .highlight-source-badge {
          border-color: #c8c4bc;
        }

        @media (max-width: 768px) {
          .account-container {
            padding: 8rem 2rem 4rem;
          }

          .account-section {
            padding: 1.5rem;
          }
        }
      `}</style>

      <div className={`account-page ${isLightMode ? 'light-mode' : ''}`}>
        <ThemeToggle />

        <SiteNav activePath="/account" />

        <main className="account-container">
          {isLoading ? (
            <div className="not-logged-in">
              <p>Loading...</p>
            </div>
          ) : !isConfigured ? (
            <div className="not-logged-in">
              <h2>Authentication Not Configured</h2>
              <p>User accounts are not yet available. Check back soon.</p>
              <Link href="/learn" className="start-learning-btn">
                Browse Courses
              </Link>
            </div>
          ) : !user ? (
            <div className="not-logged-in">
              <h2>Sign In to View Your Account</h2>
              <p>Track your course progress, manage price alerts, and more.</p>
              <Link href="/learn" className="start-learning-btn">
                Browse Courses
              </Link>
            </div>
          ) : (
            <>
              <div className="account-header">
                <p className="account-label">My Account</p>
                <h1 className="account-title">Welcome, {displayName}</h1>
                <p className="account-email">{user.email}</p>
              </div>

              <section id="progress" className="account-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2 className="section-title" style={{ marginBottom: 0 }}>
                    <svg className="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    Course Progress
                  </h2>
                  <ShareProgressButton />
                </div>

                {isLoadingProgress ? (
                  <div className="empty-state">
                    <p>Loading progress...</p>
                  </div>
                ) : COURSES.map(course => {
                  const completed = getCourseProgress(course.slug);
                  return (
                    <div key={course.slug} className="course-progress-item">
                      <p className="course-title">{course.title}</p>
                      <ProgressBar
                        completed={completed}
                        total={course.totalLessons}
                      />
                      <Link href={`/learn/${course.slug}`} className="course-link">
                        {completed === 0 ? 'Start Course' : 'Continue Learning'}
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                      </Link>
                    </div>
                  );
                })}
              </section>

              {!isLoadingBookmarks && bookmarks.length > 0 && (
                <section id="saved" className="account-section">
                  <h2 className="section-title">
                    <svg className="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                    </svg>
                    Saved Items
                  </h2>
                  <ul className="bookmark-list">
                    {bookmarks.map(b => (
                      <li key={`${b.content_type}-${b.content_slug}`} className="bookmark-item">
                        <span className="bookmark-badge">{b.content_type}</span>
                        <Link href={getBookmarkHref(b)} className="bookmark-link">
                          {formatSlug(b.content_slug)}
                        </Link>
                        <span className="bookmark-date">
                          {new Date(b.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {!isLoadingHighlights && highlights.length > 0 && (
                <section id="highlights" className="account-section">
                  <h2 className="section-title">
                    <svg className="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                    Your Highlights
                  </h2>
                  <ul className="highlight-list">
                    {highlights.map(h => (
                      <li key={h.id} className="highlight-item">
                        <p className="highlight-text">{h.text}</p>
                        <div className="highlight-source">
                          <span className="highlight-source-badge">{h.content_type}</span>
                          <Link href={getHighlightHref(h)} className="highlight-source-link">
                            {formatSlug(h.content_slug)}
                          </Link>
                          <span>
                            {new Date(h.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section id="alerts" className="account-section">
                <h2 className="section-title">
                  <svg className="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                  Price Alerts
                </h2>
                <div className="empty-state">
                  <p>No price alerts configured yet.</p>
                  <Link href="/dashboard" className="start-learning-btn">
                    Set Alert on Dashboard
                  </Link>
                </div>
              </section>
            </>
          )}
        </main>
        <SiteFooter />
      </div>
    </>
  );
}
