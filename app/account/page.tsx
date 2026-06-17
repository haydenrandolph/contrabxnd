'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { ProgressBar } from '@/components/courses';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
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

        .account-page {
          background: var(--cb-bg);
          color: var(--cb-text);
          font-family: 'Space Mono', monospace;
          font-size: 13px;
          min-height: 100vh;
        }

        .account-container {
          padding: 10rem 48px 64px;
          max-width: 900px;
          margin: 0 auto;
        }

        .account-header {
          margin-bottom: 48px;
        }

        .account-label {
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--cb-accent);
          margin-bottom: 16px;
        }

        .account-title {
          font-family: var(--cb-font-display, 'Cormorant Garamond', serif);
          font-size: 2.5rem;
          font-weight: 400;
          letter-spacing: -0.02em;
          margin-bottom: 8px;
        }

        .account-email {
          color: var(--cb-text-muted);
          font-size: 13px;
        }

        .account-section {
          background: var(--cb-surface);
          border: 1px solid var(--cb-border);
          border-radius: 2px;
          padding: 32px;
          margin-bottom: 32px;
        }

        .section-title {
          font-family: var(--cb-font-display, 'Cormorant Garamond', serif);
          font-size: 1.5rem;
          font-weight: 400;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .section-icon {
          width: 24px;
          height: 24px;
          stroke: var(--cb-accent);
        }

        .course-progress-item {
          padding: 24px 0;
          border-bottom: 1px solid var(--cb-border);
        }

        .course-progress-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .course-progress-item:first-child {
          padding-top: 0;
        }

        .course-title {
          font-size: 13px;
          margin-bottom: 0.75rem;
          font-weight: 700;
        }

        .course-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: 16px;
          font-size: 12px;
          color: var(--cb-accent);
          text-decoration: none;
          transition: opacity 0.15s ease;
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
          padding: 64px 32px;
        }

        .not-logged-in h2 {
          font-family: var(--cb-font-display, 'Cormorant Garamond', serif);
          font-size: 2rem;
          margin-bottom: 16px;
        }

        .not-logged-in p {
          color: var(--cb-text-muted);
          margin-bottom: 32px;
        }

        .sign-in-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 16px 32px;
          background: var(--cb-accent);
          border: none;
          border-radius: 2px;
          color: #fff;
          font-family: 'Space Mono', monospace;
          font-size: 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .sign-in-btn:hover {
          background: #e8850f;
        }

        .empty-state {
          text-align: center;
          padding: 32px;
          color: var(--cb-text-muted);
        }

        .empty-state p {
          margin-bottom: 16px;
        }

        .start-learning-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: transparent;
          border: 1px solid var(--cb-accent);
          border-radius: 2px;
          color: var(--cb-accent);
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          text-decoration: none;
          transition: background 0.15s ease, color 0.15s ease;
        }

        .start-learning-btn:hover {
          background: var(--cb-accent);
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
          gap: 16px;
          padding: 16px 0;
          border-bottom: 1px solid var(--cb-border);
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
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 4px 8px;
          border: 1px solid var(--cb-accent);
          border-radius: 2px;
          color: var(--cb-accent);
          flex-shrink: 0;
        }

        .bookmark-link {
          color: var(--cb-text);
          text-decoration: none;
          font-size: 13px;
          transition: color 0.15s ease;
          flex: 1;
        }

        .bookmark-link:hover {
          color: var(--cb-accent);
        }

        .bookmark-date {
          font-size: 11px;
          color: var(--cb-text-muted);
          flex-shrink: 0;
        }

        .highlight-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .highlight-item {
          padding: 20px 0;
          border-bottom: 1px solid var(--cb-border);
        }

        .highlight-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .highlight-item:first-child {
          padding-top: 0;
        }

        .highlight-text {
          font-family: var(--cb-font-display, 'Cormorant Garamond', serif);
          font-size: 1.1rem;
          font-style: italic;
          line-height: 1.6;
          color: var(--cb-text);
          border-left: 3px solid var(--cb-accent);
          padding-left: 16px;
          margin: 0 0 12px;
        }

        .highlight-source {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          color: var(--cb-text-muted);
        }

        .highlight-source-link {
          color: var(--cb-accent);
          text-decoration: none;
          font-size: 11px;
          transition: opacity 0.15s ease;
        }

        .highlight-source-link:hover {
          opacity: 0.8;
        }

        .highlight-source-badge {
          font-size: 9px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 2px 6px;
          border: 1px solid var(--cb-border);
          border-radius: 2px;
          color: var(--cb-text-muted);
        }

        @media (max-width: 768px) {
          .account-container {
            padding: 8rem 32px 64px;
          }

          .account-section {
            padding: 24px;
          }
        }
      `}</style>

      <div className={`account-page ${isLightMode ? 'light-mode' : ''}`}>

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
