'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { COURSE, WEEKS, lessonSidebarSections } from '@/lib/lessons';
import SidebarShell from '@/components/SidebarShell';
import SiteFooter from '@/components/SiteFooter';
import ShareProgressButton from '@/components/ShareProgressButton';

export default function BoardingPassCoursePage() {
  const { isLightMode } = useTheme();
  const { user } = useAuth();
  const [completedSlugs, setCompletedSlugs] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    fetch('/api/progress')
      .then(r => r.json())
      .then(data => {
        const slugs = new Set<string>(
          (data.progress ?? [])
            .filter((p: { course_slug: string; completed: boolean }) => p.course_slug === 'boarding-pass' && p.completed)
            .map((p: { lesson_slug: string }) => p.lesson_slug)
        );
        setCompletedSlugs(slugs);
      })
      .catch(() => {});
  }, [user]);

  const outcomes = COURSE.outcomes;
  const weeks = WEEKS;
  const totalLessons = weeks.reduce((acc, w) => acc + w.lessons.length, 0);
  const completedCount = completedSlugs.size;

  return (
    <>
      <style jsx global>{`

        :root {
          --safe-top: env(safe-area-inset-top);
          --safe-bottom: env(safe-area-inset-bottom);
        }

        * {
          -webkit-tap-highlight-color: transparent;
        }

        .course-page {
          background: var(--cb-bg);
          color: var(--cb-text);
          font-family: var(--cb-font-mono);
          font-size: 13px;
          line-height: 1.7;
          overflow-x: hidden;
          min-height: 100vh;
          -webkit-font-smoothing: antialiased;
        }

        .course-header {
          padding: 12rem 3rem 4rem;
          max-width: 900px;
          margin: 0 auto;
        }

        .course-back {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          color: var(--cb-text-muted);
          text-decoration: none;
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          margin-bottom: 3rem;
          transition: color 0.3s ease;
        }

        .course-back:hover {
          color: var(--cb-accent);
        }

        .course-back svg {
          width: 16px;
          height: 16px;
          transition: transform 0.3s ease;
        }

        .course-back:hover svg {
          transform: translateX(-4px);
        }

        .course-label {
          font-size: 10px;
          letter-spacing: 0.4em;
          text-transform: uppercase;
          color: var(--cb-accent);
          margin-bottom: 1.5rem;
        }

        .course-title {
          font-family: var(--cb-font-display);
          font-size: clamp(1.8rem, 4vw, 2.75rem);
          font-weight: 500;
          letter-spacing: -0.02em;
          line-height: 1.15;
          margin-bottom: 1rem;
        }

        .course-tagline {
          font-family: var(--cb-font-display);
          font-size: 1.1rem;
          font-style: italic;
          color: var(--cb-accent);
          margin-bottom: 2rem;
        }

        .course-description {
          font-family: var(--cb-font-display);
          font-size: 1.0625rem;
          color: var(--cb-text-muted);
          line-height: 1.7;
          margin-bottom: 3rem;
        }

        .course-meta-bar {
          display: flex;
          gap: 3rem;
          padding: 1.5rem 0;
          border-top: 1px solid var(--cb-border);
          border-bottom: 1px solid var(--cb-border);
        }

        .meta-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .meta-label {
          font-size: 9px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--cb-text-muted);
        }

        .meta-value {
          font-size: 14px;
          color: var(--cb-text);
        }

        .outcomes-section {
          padding: 4rem 3rem;
          max-width: 900px;
          margin: 0 auto;
        }

        .section-title {
          font-family: var(--cb-font-display);
          font-size: 1.75rem;
          font-weight: 400;
          margin-bottom: 2rem;
        }

        .outcomes-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }

        .outcome-item {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
        }

        .outcome-icon {
          color: var(--cb-accent);
          font-size: 1.25rem;
          line-height: 1;
          margin-top: 0.2rem;
        }

        .outcome-text {
          font-size: 14px;
          color: var(--cb-text);
          line-height: 1.6;
        }

        .curriculum-section {
          padding: 4rem 3rem 6rem;
          max-width: 900px;
          margin: 0 auto;
        }

        .curriculum-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 2rem;
        }

        .curriculum-count {
          font-size: 12px;
          color: var(--cb-text-muted);
        }

        .week-block {
          margin-bottom: 3rem;
        }

        .week-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--cb-border);
        }

        .week-number {
          font-family: var(--cb-font-display);
          font-size: 1.5rem;
          color: var(--cb-accent);
        }

        .week-title {
          font-family: var(--cb-font-display);
          font-size: 1.25rem;
          font-weight: 400;
        }

        .lessons-list {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .lesson-item {
          display: grid;
          grid-template-columns: 50px 1fr auto;
          gap: 1.5rem;
          align-items: center;
          padding: 1.25rem 0;
          border-bottom: 1px solid var(--cb-border);
          text-decoration: none;
          color: inherit;
          transition: all 0.3s ease;
        }

        .lesson-item:hover {
          background: var(--cb-surface);
        }

        .lesson-item:last-child {
          border-bottom: none;
        }

        .lesson-number {
          font-family: var(--cb-font-display);
          font-size: 1.5rem;
          color: var(--cb-text-muted);
        }

        .lesson-content h4 {
          font-family: var(--cb-font-display);
          font-size: 1.1rem;
          font-weight: 400;
          margin-bottom: 0.25rem;
        }

        .lesson-content p {
          font-size: 12px;
          color: var(--cb-text-muted);
        }

        .lesson-duration {
          font-size: 11px;
          color: var(--cb-text-muted);
        }

        .lesson-check {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #22c55e;
          flex-shrink: 0;
        }

        .lesson-check svg {
          width: 16px;
          height: 16px;
          stroke: #fff;
        }

        .lesson-item.lesson-completed {
          border-left: 2px solid #22c55e;
        }

        .progress-summary {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 0;
          margin-top: 1rem;
          font-size: 12px;
          color: var(--cb-text-muted);
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .progress-bar-outer {
          flex: 1;
          height: 4px;
          background: var(--cb-surface);
          border-radius: var(--cb-radius);
          overflow: hidden;
        }

        .progress-bar-inner {
          height: 100%;
          background: #22c55e;
          border-radius: var(--cb-radius);
          transition: width 0.5s ease;
        }

        .start-section {
          padding: 4rem 3rem;
          background: var(--cb-surface);
          border-top: 1px solid var(--cb-border);
        }

        .start-inner {
          max-width: 600px;
          margin: 0 auto;
          text-align: center;
        }

        .start-title {
          font-family: var(--cb-font-display);
          font-size: 2rem;
          font-weight: 400;
          margin-bottom: 1rem;
        }

        .start-text {
          color: var(--cb-text-muted);
          margin-bottom: 2rem;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1.25rem 2.5rem;
          background: var(--cb-accent);
          border: 1px solid var(--cb-accent);
          border-radius: var(--cb-radius);
          color: #fff;
          font-family: var(--cb-font-mono);
          font-size: 12px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          text-decoration: none;
          transition: all 0.3s ease;
        }

        .btn-primary:hover {
          background: #ff6600;
          border-color: #ff6600;
        }

        .btn-primary svg {
          width: 18px;
          height: 18px;
          transition: transform 0.3s ease;
        }

        .btn-primary:hover svg {
          transform: translateX(4px);
        }

        @media (max-width: 768px) {
          .course-header {
            padding: calc(5rem + var(--safe-top)) 1.25rem 2rem;
          }

          .course-back {
            margin-bottom: 1.5rem;
            font-size: 10px;
            padding: 0.5rem;
            margin-left: -0.5rem;
          }

          .course-back:active {
            color: var(--cb-accent);
          }

          .course-back svg {
            width: 18px;
            height: 18px;
          }

          .course-label {
            font-size: 9px;
            letter-spacing: 0.25em;
            margin-bottom: 0.75rem;
          }

          .course-title {
            font-size: 2rem;
            line-height: 1.15;
            margin-bottom: 0.5rem;
          }

          .course-tagline {
            font-size: 1.1rem;
            margin-bottom: 1.25rem;
          }

          .course-description {
            font-size: 13px;
            line-height: 1.7;
            margin-bottom: 1.5rem;
          }

          .course-meta-bar {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1px;
            background: var(--cb-border);
            border: 1px solid var(--cb-border);
            padding: 0;
            margin: 0 0 1.5rem 0;
          }

          .meta-item {
            background: var(--cb-surface);
            padding: 1rem;
            text-align: center;
          }

          .meta-value {
            font-family: var(--cb-font-display);
            font-size: 1.25rem;
            display: block;
            margin-bottom: 0.25rem;
          }

          .meta-label {
            font-size: 9px;
          }

          .outcomes-section {
            padding: 2rem 1.25rem;
            background: var(--cb-surface);
            border-top: 1px solid var(--cb-border);
            border-bottom: 1px solid var(--cb-border);
          }

          .section-title {
            font-size: 1.25rem;
            margin-bottom: 1.25rem;
          }

          .outcomes-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .outcome-item {
            gap: 0.75rem;
          }

          .outcome-icon {
            font-size: 10px;
            margin-top: 0.35rem;
          }

          .outcome-text {
            font-size: 13px;
            line-height: 1.6;
          }

          .curriculum-section {
            padding: 2rem 0;
          }

          .curriculum-header {
            padding: 0 1.25rem 1.25rem;
          }

          .curriculum-count {
            font-size: 11px;
          }

          .week-block {
            margin-bottom: 0.5rem;
          }

          .week-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem 1.25rem;
            background: var(--cb-surface);
            border-top: 1px solid var(--cb-border);
            border-bottom: 1px solid var(--cb-border);
            margin-bottom: 0;
            cursor: pointer;
          }

          .week-header:active {
            background: var(--cb-border);
          }

          .week-number {
            font-size: 1.1rem;
          }

          .week-title {
            font-size: 1rem;
          }

          .lessons-list {
            background: var(--cb-bg);
          }

          .lesson-item {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1rem 1.25rem;
            grid-template-columns: none;
          }

          .lesson-item:hover {
            background: transparent;
          }

          .lesson-item:active {
            background: var(--cb-surface);
          }

          .lesson-number {
            width: 32px;
            height: 32px;
            border: 1px solid var(--cb-text-muted);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-family: var(--cb-font-mono);
            flex-shrink: 0;
          }

          .lesson-content {
            flex: 1;
            min-width: 0;
          }

          .lesson-content h4 {
            font-size: 1rem;
            margin-bottom: 0.15rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .lesson-content p {
            display: none;
          }

          .lesson-duration {
            font-size: 11px;
            display: block;
          }

          .start-section {
            padding: 0 1.25rem 2rem;
            background: transparent;
            border-top: none;
          }

          .start-inner {
            text-align: left;
          }

          .start-title {
            display: none;
          }

          .start-text {
            display: none;
          }

          .btn-primary {
            display: flex;
            width: 100%;
            justify-content: center;
            padding: 1rem 1.5rem;
            font-size: 12px;
          }

          .btn-primary:active {
            background: var(--cb-accent);
            border-color: var(--cb-accent);
          }

          .btn-primary svg {
            width: 18px;
            height: 18px;
          }

        }
      `}</style>

      <SidebarShell bare label="Study" activePath="/learn" sections={lessonSidebarSections('')}>
        <div className={`course-page ${isLightMode ? 'light-mode' : ''}`}>

        <header className="course-header">
          <Link href="/learn" className="course-back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            All Courses
          </Link>
          <p className="course-label">Course 01 · Beginner</p>
          <h1 className="course-title">The Boarding Pass</h1>
          <p className="course-tagline">Your first 21 days with Bitcoin</p>
          <p className="course-description">Everything you need to understand Bitcoin and make your first moves. No jargon, no hype, no scams. Just clear explanations from first principles—21 lessons for the 21 million.</p>

          <div className="course-meta-bar">
            <div className="meta-item">
              <span className="meta-label">Lessons</span>
              <span className="meta-value">21</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Duration</span>
              <span className="meta-value">~3 weeks</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Level</span>
              <span className="meta-value">Beginner</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Price</span>
              <span className="meta-value">Free</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Downloads</span>
              <span className="meta-value">3 resources</span>
            </div>
          </div>
          {user && completedCount > 0 && (
            <div className="progress-summary">
              <span>{completedCount}/{totalLessons}</span>
              <div className="progress-bar-outer">
                <div className="progress-bar-inner" style={{ width: `${(completedCount / totalLessons) * 100}%` }} />
              </div>
              <ShareProgressButton />
            </div>
          )}
        </header>

        <section className="outcomes-section">
          <h2 className="section-title">What you'll learn</h2>
          <div className="outcomes-grid">
            {outcomes.map((outcome, index) => (
              <div key={index} className="outcome-item">
                <span className="outcome-icon">◆</span>
                <p className="outcome-text">{outcome}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="curriculum-section">
          <div className="curriculum-header">
            <h2 className="section-title">Curriculum</h2>
            <span className="curriculum-count">21 lessons · ~15 min each</span>
          </div>

          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="week-block">
              <div className="week-header">
                <span className="week-number">{week.label}</span>
                <span className="week-title">{week.title}</span>
              </div>
              <div className="lessons-list">
                {week.lessons.map((lesson, lessonIndex) => (
                  <Link key={lessonIndex} href={`/learn/boarding-pass/${lesson.slug}`} className={`lesson-item${completedSlugs.has(lesson.slug) ? ' lesson-completed' : ''}`}>
                    <span className="lesson-number">{lesson.number}</span>
                    <div className="lesson-content">
                      <h4>{lesson.title}</h4>
                      <p>{lesson.description}</p>
                    </div>
                    {completedSlugs.has(lesson.slug) ? (
                      <span className="lesson-check">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M20 6L9 17l-5-5"/>
                        </svg>
                      </span>
                    ) : (
                      <span className="lesson-duration">{lesson.duration}</span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>

        <section className="start-section">
          <div className="start-inner">
            <h2 className="start-title">Ready to start?</h2>
            <p className="start-text">21 lessons. 21 million. Begin your journey into Bitcoin.</p>
            <Link href="/learn/boarding-pass/what-is-bitcoin-actually" className="btn-primary">
              Start Lesson 1
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>
        </section>

        <SiteFooter variant="instructor" />
        </div>
      </SidebarShell>
    </>
  );
}
