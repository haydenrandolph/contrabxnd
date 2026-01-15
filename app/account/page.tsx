'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { UserMenu } from '@/components/auth';
import { ProgressBar } from '@/components/courses';

interface LessonProgress {
  id: string;
  course_slug: string;
  lesson_slug: string;
  completed: boolean;
  completed_at: string | null;
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [progress, setProgress] = useState<LessonProgress[]>([]);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const { isLightMode, toggleTheme } = useTheme();
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

  // Calculate progress per course
  const getCourseProgress = (courseSlug: string) => {
    return progress.filter(p => p.course_slug === courseSlug && p.completed).length;
  };

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

        .account-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          padding: 2rem 3rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 100;
          background: linear-gradient(to bottom, #0a0a0a 0%, transparent 100%);
        }

        .account-page.light-mode .account-nav {
          background: linear-gradient(to bottom, #e8e4dc 0%, transparent 100%);
        }

        .account-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
          color: #f5f3f0;
        }

        .account-page.light-mode .account-logo {
          color: #0a0a0a;
        }

        .account-logo-text {
          font-size: 11px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
        }

        .account-nav-links {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 2.5rem;
        }

        .account-nav-links a {
          color: #f5f3f0;
          text-decoration: none;
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          position: relative;
          padding: 0.25rem 0;
        }

        .account-page.light-mode .account-nav-links a {
          color: #0a0a0a;
        }

        .account-nav-links a::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 1px;
          background: #F7931A;
          transition: width 0.3s ease;
        }

        .account-nav-links a:hover::after {
          width: 100%;
        }

        .account-nav-links a.coming-soon {
          text-decoration: line-through;
          opacity: 0.5;
          cursor: not-allowed;
        }

        .account-nav-right {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .mobile-menu-btn {
          display: none;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          width: 44px;
          height: 44px;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0;
          z-index: 1001;
        }

        .mobile-menu-btn span {
          display: block;
          width: 24px;
          height: 2px;
          background: #f5f3f0;
          transition: all 0.3s ease;
          margin: 3px 0;
        }

        .account-page.light-mode .mobile-menu-btn span {
          background: #0a0a0a;
        }

        .mobile-menu-btn.open span:nth-child(1) {
          transform: rotate(45deg) translate(5px, 5px);
        }

        .mobile-menu-btn.open span:nth-child(2) {
          opacity: 0;
        }

        .mobile-menu-btn.open span:nth-child(3) {
          transform: rotate(-45deg) translate(6px, -6px);
        }

        .mobile-menu-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: #0a0a0a;
          z-index: 999;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.3s ease, visibility 0.3s ease;
        }

        .account-page.light-mode .mobile-menu-overlay {
          background: #e8e4dc;
        }

        .mobile-menu-overlay.open {
          opacity: 1;
          visibility: visible;
        }

        .mobile-menu-nav {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
        }

        .mobile-menu-nav a {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2rem;
          color: #e8e4dc;
          text-decoration: none;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .account-page.light-mode .mobile-menu-nav a {
          color: #0a0a0a;
        }

        .account-theme-toggle {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: #1a1a1a;
          border: 1px solid #3a3a3a;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 1001;
          transition: all 0.3s ease;
        }

        .account-theme-toggle:hover {
          background: #F7931A;
          border-color: #F7931A;
          transform: scale(1.1);
        }

        .account-theme-toggle svg {
          width: 24px;
          height: 24px;
          stroke: #e8e4dc;
        }

        .account-page.light-mode .account-theme-toggle {
          background: #f5f3f0;
          border-color: #c8c4bc;
        }

        .account-page.light-mode .account-theme-toggle svg {
          stroke: #0a0a0a;
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

        @media (max-width: 768px) {
          .account-nav {
            padding: 1.5rem 2rem;
          }

          .account-nav-links {
            display: none;
          }

          .mobile-menu-btn {
            display: flex;
          }

          .account-container {
            padding: 8rem 2rem 4rem;
          }

          .account-section {
            padding: 1.5rem;
          }
        }
      `}</style>

      <div className={`account-page ${isLightMode ? 'light-mode' : ''}`}>
        <button
          className="account-theme-toggle"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {isLightMode ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          )}
        </button>

        <nav className="account-nav">
          <Link href="/" className="account-logo">
            <Image
              src="/contraband-logo-v3.png"
              alt="Contraband logo"
              width={40}
              height={40}
            />
            <span className="account-logo-text">Contra₿and</span>
          </Link>
          <div className="account-nav-links">
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/learn">Stu₿y</Link>
            <Link href="/writings">Writings</Link>
            <Link href="/network">Network</Link>
            <a href="#podcasts" className="coming-soon">Podcasts</a>
            <a href="#videos" className="coming-soon">Videos</a>
            <a href="#merch" className="coming-soon">Merch</a>
            <Link href="/about">About</Link>
          </div>
          <div className="account-nav-right">
            <UserMenu />
            <button
              className={`mobile-menu-btn ${menuOpen ? 'open' : ''}`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </nav>

        <div className={`mobile-menu-overlay ${menuOpen ? 'open' : ''}`}>
          <nav className="mobile-menu-nav">
            <Link href="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link>
            <Link href="/learn" onClick={() => setMenuOpen(false)}>Stu₿y</Link>
            <Link href="/writings" onClick={() => setMenuOpen(false)}>Writings</Link>
            <Link href="/network" onClick={() => setMenuOpen(false)}>Network</Link>
            <a href="#podcasts" className="coming-soon">Podcasts</a>
            <a href="#videos" className="coming-soon">Videos</a>
            <a href="#merch" className="coming-soon">Merch</a>
            <Link href="/about" onClick={() => setMenuOpen(false)}>About</Link>
          </nav>
        </div>

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
                <h2 className="section-title">
                  <svg className="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  Course Progress
                </h2>

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
      </div>
    </>
  );
}
