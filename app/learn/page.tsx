'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import ThemeToggle from '@/components/ThemeToggle';

export default function LearnPage() {
  const { isLightMode } = useTheme();
  const { user } = useAuth();
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    fetch('/api/progress')
      .then(r => r.json())
      .then(data => {
        const count = (data.progress ?? []).filter(
          (p: { course_slug: string; completed: boolean }) => p.course_slug === 'boarding-pass' && p.completed
        ).length;
        setCompletedCount(count);
      })
      .catch(() => {});
  }, [user]);

  const courses = [
    {
      number: '01',
      badge: 'Start Here',
      title: 'The Boarding Pass',
      tagline: 'Your first 21 days with Bitcoin',
      description: 'Everything you need to understand Bitcoin and make your first moves—without the jargon, the hype, or the scams. 21 lessons for the 21 million.',
      meta: [
        { label: 'Lessons', value: '21' },
        { label: 'Duration', value: '~3 weeks' },
        { label: 'Level', value: 'Beginner' },
        { label: 'Price', value: 'Free' }
      ],
      link: '/learn/boarding-pass'
    },
    {
      number: '02',
      title: 'Letters of Marque',
      tagline: 'Self-custody and sovereign security',
      description: 'Your keys, your coins, your rules. A comprehensive guide to taking full custody of your Bitcoin—and keeping it safe from every threat.',
      meta: [
        { label: 'Modules', value: '5' },
        { label: 'Duration', value: '~2 weeks' },
        { label: 'Level', value: 'Intermediate' },
        { label: 'Price', value: 'Free' }
      ],
      link: '/learn/letters-of-marque'
    }
  ];

  const pathSteps = [
    {
      number: '01',
      title: 'Understand',
      description: 'Learn what Bitcoin actually is—not the headlines, not the hype. The technology, the economics, the philosophy.'
    },
    {
      number: '02',
      title: 'Acquire',
      description: 'Buy your first sats safely. Know the difference between exchanges, understand fees, avoid the traps.'
    },
    {
      number: '03',
      title: 'Secure',
      description: 'Move your Bitcoin to self-custody. Your keys, your coins. No exchange, no counterparty, no permission needed.'
    },
    {
      number: '04',
      title: 'Fortify',
      description: 'Level up your security. Hardware wallets, seed phrase protection, inheritance planning, operational security.'
    }
  ];

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Space+Mono:wght@400;700&display=swap');

        :root {
          --safe-top: env(safe-area-inset-top);
          --safe-bottom: env(safe-area-inset-bottom);
        }

        * {
          -webkit-tap-highlight-color: transparent;
        }

        .learn-page {
          background: var(--cb-bg);
          color: var(--cb-text);
          font-family: 'Space Mono', monospace;
          font-size: 13px;
          line-height: 1.7;
          overflow-x: hidden;
          min-height: 100vh;
          -webkit-font-smoothing: antialiased;
        }

        .page-header {
          max-width: 1100px;
          margin: 0 auto;
          padding: 80px 48px 0;
        }

        .page-label {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--cb-accent);
          margin-bottom: 16px;
        }

        .page-title {
          font-family: var(--cb-font-display, 'Cormorant Garamond', serif);
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 400;
          letter-spacing: -0.02em;
          line-height: 1.15;
          color: var(--cb-text);
          margin-bottom: 12px;
        }

        .page-subtitle {
          font-family: 'Space Mono', monospace;
          font-size: 13px;
          color: var(--cb-text-muted);
          max-width: 600px;
          line-height: 1.6;
        }

        .page-divider {
          width: 100%;
          height: 1px;
          background: var(--cb-border);
          margin-top: 32px;
        }

        .page-content {
          max-width: 1100px;
          margin: 0 auto;
          padding: 48px 48px 96px;
        }

        .courses-section {
          padding: 48px 48px 96px;
          max-width: 1100px;
          margin: 0 auto;
        }

        .courses-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2rem;
        }

        .course-card {
          background: var(--cb-surface);
          border: 1px solid var(--cb-border);
          border-radius: 2px;
          padding: 48px;
          position: relative;
          transition: border-color 0.15s ease;
          display: flex;
          flex-direction: column;
        }

        .course-card:hover {
          border-color: var(--cb-accent);
        }

        .course-badge {
          position: absolute;
          top: 2rem;
          right: 2rem;
          padding: 0.4rem 0.75rem;
          background: var(--cb-accent);
          border-radius: 2px;
          font-size: 9px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #fff;
        }

        .course-number {
          font-family: var(--cb-font-display, 'Cormorant Garamond', serif);
          font-size: 3rem;
          color: var(--cb-border);
          line-height: 1;
          margin-bottom: 24px;
        }

        .course-title {
          font-family: var(--cb-font-display, 'Cormorant Garamond', serif);
          font-size: 2rem;
          font-weight: 400;
          margin-bottom: 8px;
        }

        .course-tagline {
          font-family: var(--cb-font-display, 'Cormorant Garamond', serif);
          font-size: 1.1rem;
          font-style: italic;
          color: var(--cb-accent);
          margin-bottom: 24px;
        }

        .course-description {
          color: var(--cb-text-muted);
          font-size: 13px;
          line-height: 1.8;
          margin-bottom: 32px;
          flex-grow: 1;
        }

        .course-meta {
          display: flex;
          gap: 2rem;
          padding-top: 24px;
          border-top: 1px solid var(--cb-border);
          margin-bottom: 32px;
        }

        .meta-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .meta-label {
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--cb-text-muted);
        }

        .meta-value {
          font-size: 13px;
          color: var(--cb-text);
        }

        .course-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 16px 32px;
          background: transparent;
          border: 1px solid var(--cb-text);
          border-radius: 2px;
          color: var(--cb-text);
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          text-decoration: none;
          transition: background 0.15s ease, color 0.15s ease;
        }

        .course-btn:hover {
          background: var(--cb-text);
          color: var(--cb-bg);
        }

        .course-btn svg {
          width: 16px;
          height: 16px;
        }

        .path-section {
          padding: 64px 48px;
          background: var(--cb-surface);
          border-top: 1px solid var(--cb-border);
          border-bottom: 1px solid var(--cb-border);
        }

        .path-inner {
          max-width: 900px;
          margin: 0 auto;
        }

        .path-header {
          text-align: center;
          margin-bottom: 64px;
        }

        .path-label {
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--cb-accent);
          margin-bottom: 16px;
        }

        .path-title {
          font-family: var(--cb-font-display, 'Cormorant Garamond', serif);
          font-size: 2rem;
          font-weight: 400;
          letter-spacing: -0.02em;
        }

        .path-steps {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .path-step {
          display: grid;
          grid-template-columns: 80px 1fr;
          gap: 32px;
          padding: 32px 0;
          border-bottom: 1px solid var(--cb-border);
        }

        .path-step:last-child {
          border-bottom: none;
        }

        .step-number {
          font-family: var(--cb-font-display, 'Cormorant Garamond', serif);
          font-size: 2.5rem;
          color: var(--cb-accent);
          line-height: 1;
        }

        .step-content h3 {
          font-family: var(--cb-font-display, 'Cormorant Garamond', serif);
          font-size: 1.4rem;
          font-weight: 400;
          margin-bottom: 8px;
        }

        .step-content p {
          color: var(--cb-text-muted);
          font-size: 13px;
          line-height: 1.7;
        }

        .philosophy-section {
          padding: 64px 48px;
          max-width: 800px;
          margin: 0 auto;
          text-align: center;
        }

        .philosophy-quote {
          font-family: var(--cb-font-display, 'Cormorant Garamond', serif);
          font-size: 1.75rem;
          font-style: italic;
          line-height: 1.6;
          margin-bottom: 24px;
          color: var(--cb-text);
        }

        .philosophy-source {
          font-size: 12px;
          color: var(--cb-accent);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .course-progress {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-top: 16px;
          font-size: 11px;
          color: var(--cb-text-muted);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .course-progress-bar {
          flex: 1;
          height: 4px;
          background: var(--cb-border);
          border-radius: 2px;
          overflow: hidden;
        }

        .course-progress-fill {
          height: 100%;
          background: #22c55e;
          border-radius: 2px;
          transition: width 0.15s ease;
        }

        @media (max-width: 768px) {
          .courses-grid {
            grid-template-columns: 1fr;
          }

          .path-step {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .page-header { padding: 72px 24px 0; }
          .page-content { padding: 32px 24px 64px; }

          .courses-section {
            padding: 32px 24px 64px;
          }

          .courses-grid {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 24px;
          }

          .course-card {
            padding: 24px;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
          }

          .course-meta {
            flex-wrap: wrap;
            gap: 16px;
          }

          .meta-item {
            min-width: 70px;
          }

          .course-btn {
            width: 100%;
            justify-content: center;
          }

          .path-section {
            padding: 64px 24px;
          }

          .philosophy-section {
            padding: 64px 24px;
          }

          .philosophy-quote {
            font-size: 1.4rem;
          }

        }
      `}</style>

      <div className={`learn-page ${isLightMode ? 'light-mode' : ''}`}>
        <ThemeToggle />
        <SiteNav activePath="/learn" />

        <div className="page-header">
          <div className="page-label">STU₿Y</div>
          <h1 className="page-title">Bitcoin Education</h1>
          <p className="page-subtitle">From first principles to full sovereignty.</p>
          <div className="page-divider" />
        </div>

        <section className="courses-section">
          <div className="courses-grid">
            {courses.map((course) => (
              <div key={course.number} className="course-card">
                {course.badge && <span className="course-badge">{course.badge}</span>}
                <span className="course-number">{course.number}</span>
                <h2 className="course-title">{course.title}</h2>
                <p className="course-tagline">{course.tagline}</p>
                <p className="course-description">{course.description}</p>
                <div className="course-meta">
                  {course.meta.map((item, index) => (
                    <div key={index} className="meta-item">
                      <span className="meta-label">{item.label}</span>
                      <span className="meta-value">{item.value}</span>
                    </div>
                  ))}
                </div>
                {user && completedCount > 0 && course.link === '/learn/boarding-pass' && (
                  <div className="course-progress">
                    <span>{completedCount}/21</span>
                    <div className="course-progress-bar">
                      <div className="course-progress-fill" style={{ width: `${(completedCount / 21) * 100}%` }} />
                    </div>
                  </div>
                )}
                <a href={course.link} className="course-btn">
                  Start Course
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </a>
              </div>
            ))}
          </div>
        </section>

        <section className="path-section">
          <div className="path-inner">
            <div className="path-header">
              <p className="path-label">The Journey</p>
              <h2 className="path-title">From curious to sovereign</h2>
            </div>
            <div className="path-steps">
              {pathSteps.map((step) => (
                <div key={step.number} className="path-step">
                  <span className="step-number">{step.number}</span>
                  <div className="step-content">
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="philosophy-section">
          <p className="philosophy-quote">"The best time to learn about Bitcoin was 2009. The second best time is now."</p>
          <p className="philosophy-source">— Contraband</p>
        </section>

        <SiteFooter />
      </div>
    </>
  );
}
