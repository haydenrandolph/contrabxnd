'use client';

import { useTheme } from '@/contexts/ThemeContext';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import ThemeToggle from '@/components/ThemeToggle';

export default function LearnPage() {
  const { isLightMode } = useTheme();

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
          background: #0a0a0a;
          color: #e8e4dc;
          font-family: 'Space Mono', monospace;
          font-size: 14px;
          line-height: 1.7;
          overflow-x: hidden;
          min-height: 100vh;
          -webkit-font-smoothing: antialiased;
        }

        .learn-page.light-mode {
          background: #e8e4dc;
          color: #0a0a0a;
        }

        .learn-page::before {
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

        .learn-hero {
          padding: 12rem 3rem 6rem;
          max-width: 1000px;
          margin: 0 auto;
          text-align: center;
        }

        .hero-label {
          font-size: 10px;
          letter-spacing: 0.4em;
          text-transform: uppercase;
          color: #F7931A;
          margin-bottom: 2rem;
          opacity: 0;
          animation: fadeUp 1s ease 0.2s forwards;
        }

        .hero-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(2.5rem, 6vw, 4rem);
          font-weight: 400;
          line-height: 1.2;
          margin-bottom: 1.5rem;
          opacity: 0;
          animation: fadeUp 1s ease 0.3s forwards;
        }

        .hero-subtitle {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.4rem;
          color: #8a8a8a;
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.7;
          opacity: 0;
          animation: fadeUp 1s ease 0.4s forwards;
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .courses-section {
          padding: 4rem 3rem 8rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .courses-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2rem;
        }

        .course-card {
          background: #141414;
          border: 1px solid #1a1a1a;
          padding: 3rem;
          position: relative;
          transition: all 0.4s ease;
          display: flex;
          flex-direction: column;
        }

        .learn-page.light-mode .course-card {
          background: #f5f3f0;
          border-color: #d8d4cc;
        }

        .course-card:hover {
          border-color: #F7931A;
          transform: translateY(-4px);
        }

        .course-badge {
          position: absolute;
          top: 2rem;
          right: 2rem;
          padding: 0.4rem 0.75rem;
          background: #F7931A;
          font-size: 9px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #f5f3f0;
        }

        .course-number {
          font-family: 'Cormorant Garamond', serif;
          font-size: 3rem;
          color: #3a3a3a;
          line-height: 1;
          margin-bottom: 1.5rem;
        }

        .learn-page.light-mode .course-number {
          color: #c8c4bc;
        }

        .course-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2rem;
          font-weight: 400;
          margin-bottom: 0.5rem;
        }

        .course-tagline {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.1rem;
          font-style: italic;
          color: #d4854c;
          margin-bottom: 1.5rem;
        }

        .course-description {
          color: #8a8a8a;
          font-size: 13px;
          line-height: 1.8;
          margin-bottom: 2rem;
          flex-grow: 1;
        }

        .course-meta {
          display: flex;
          gap: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid #1a1a1a;
          margin-bottom: 2rem;
        }

        .learn-page.light-mode .course-meta {
          border-top-color: #d8d4cc;
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
          color: #3a3a3a;
        }

        .learn-page.light-mode .meta-label {
          color: #8a8a8a;
        }

        .meta-value {
          font-size: 13px;
          color: #e8e4dc;
        }

        .learn-page.light-mode .meta-value {
          color: #0a0a0a;
        }

        .course-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 1rem 2rem;
          background: transparent;
          border: 1px solid #e8e4dc;
          color: #e8e4dc;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          text-decoration: none;
          transition: all 0.3s ease;
        }

        .learn-page.light-mode .course-btn {
          border-color: #0a0a0a;
          color: #0a0a0a;
        }

        .course-btn:hover {
          background: #e8e4dc;
          color: #0a0a0a;
        }

        .learn-page.light-mode .course-btn:hover {
          background: #0a0a0a;
          color: #e8e4dc;
        }

        .course-btn svg {
          width: 16px;
          height: 16px;
          transition: transform 0.3s ease;
        }

        .course-btn:hover svg {
          transform: translateX(4px);
        }

        .path-section {
          padding: 6rem 3rem;
          background: #141414;
          border-top: 1px solid #1a1a1a;
          border-bottom: 1px solid #1a1a1a;
        }

        .learn-page.light-mode .path-section {
          background: #f5f3f0;
          border-top-color: #d8d4cc;
          border-bottom-color: #d8d4cc;
        }

        .path-inner {
          max-width: 900px;
          margin: 0 auto;
        }

        .path-header {
          text-align: center;
          margin-bottom: 4rem;
        }

        .path-label {
          font-size: 10px;
          letter-spacing: 0.4em;
          text-transform: uppercase;
          color: #F7931A;
          margin-bottom: 1rem;
        }

        .path-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2rem;
          font-weight: 400;
        }

        .path-steps {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .path-step {
          display: grid;
          grid-template-columns: 80px 1fr;
          gap: 2rem;
          padding: 2rem 0;
          border-bottom: 1px solid #1a1a1a;
        }

        .learn-page.light-mode .path-step {
          border-bottom-color: #d8d4cc;
        }

        .path-step:last-child {
          border-bottom: none;
        }

        .step-number {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2.5rem;
          color: #F7931A;
          line-height: 1;
        }

        .step-content h3 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.4rem;
          font-weight: 400;
          margin-bottom: 0.5rem;
        }

        .step-content p {
          color: #8a8a8a;
          font-size: 13px;
          line-height: 1.7;
        }

        .philosophy-section {
          padding: 6rem 3rem;
          max-width: 800px;
          margin: 0 auto;
          text-align: center;
        }

        .philosophy-quote {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.75rem;
          font-style: italic;
          line-height: 1.6;
          margin-bottom: 1.5rem;
          color: #e8e4dc;
        }

        .learn-page.light-mode .philosophy-quote {
          color: #0a0a0a;
        }

        .philosophy-source {
          font-size: 12px;
          color: #F7931A;
          letter-spacing: 0.2em;
          text-transform: uppercase;
        }

        @media (max-width: 768px) {
          .courses-grid {
            grid-template-columns: 1fr;
          }

          .path-step {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .learn-hero {
            padding: 10rem 1.5rem 4rem;
          }

          .courses-section {
            padding: 2rem 1rem 4rem;
          }

          .courses-grid {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1.5rem;
          }

          .course-card {
            padding: 1.5rem;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
          }

          .course-meta {
            flex-wrap: wrap;
            gap: 1rem;
          }

          .meta-item {
            min-width: 70px;
          }

          .course-btn {
            width: 100%;
            justify-content: center;
          }

          .path-section {
            padding: 4rem 1.5rem;
          }

          .philosophy-section {
            padding: 4rem 1.5rem;
          }

          .philosophy-quote {
            font-size: 1.4rem;
          }

        }
      `}</style>

      <div className={`learn-page ${isLightMode ? 'light-mode' : ''}`}>
        <ThemeToggle />
        <SiteNav activePath="/learn" />

        <section className="learn-hero">
          <p className="hero-label">Bitcoin Education</p>
          <h1 className="hero-title">The education they satisfactorily hope you never get</h1>
          <p className="hero-subtitle">Free courses on Bitcoin—from first principles to full sovereignty. No hype, no shilling, no shortcuts.</p>
        </section>

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
