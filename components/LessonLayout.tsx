'use client';

import { useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { getLessonNav } from '@/lib/lessons';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import BookmarkButton from '@/components/BookmarkButton';
import HighlightPopover from '@/components/HighlightPopover';

interface LessonLayoutProps {
  slug: string;
  children: ReactNode;
}

interface TocItem {
  id: string;
  text: string;
  index: number;
}

export default function LessonLayout({ slug, children }: LessonLayoutProps) {
  const { isLightMode } = useTheme();
  const { user } = useAuth();
  const [completed, setCompleted] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [activeSection, setActiveSection] = useState('');
  const [tocOpen, setTocOpen] = useState(false);
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const [ttsPaused, setTtsPaused] = useState(false);
  const [ttsRate, setTtsRate] = useState(1);
  const [ttsSupported, setTtsSupported] = useState(false);
  const [ttsCurrentSection, setTtsCurrentSection] = useState('');
  const contentRef = useRef<HTMLElement>(null);
  const ttsChunksRef = useRef<string[]>([]);
  const ttsIndexRef = useRef(0);

  useEffect(() => {
    setTtsSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? scrollTop / docHeight : 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const nav = getLessonNav(slug);

  useEffect(() => {
    if (nav) {
      document.title = `${nav.lesson.title} | Contrabxnd`;
    }
  }, [nav]);

  useEffect(() => {
    if (!contentRef.current) return;
    const headings = contentRef.current.querySelectorAll('h2');
    const items: TocItem[] = [];
    headings.forEach((h2, i) => {
      const id = `section-${i + 1}`;
      h2.id = id;
      h2.setAttribute('data-section-index', String(i + 1));
      items.push({ id, text: h2.textContent || '', index: i + 1 });
    });
    setTocItems(items);
  }, [children]);

  useEffect(() => {
    if (tocItems.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    );
    tocItems.forEach(item => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [tocItems]);

  useEffect(() => {
    if (!user) return;
    fetch('/api/progress')
      .then(r => r.json())
      .then(data => {
        const match = data.progress?.find(
          (p: { course_slug: string; lesson_slug: string; completed: boolean }) =>
            p.course_slug === 'boarding-pass' && p.lesson_slug === slug && p.completed
        );
        if (match) setCompleted(true);
      })
      .catch(() => {});
  }, [user, slug]);

  const markComplete = useCallback(async () => {
    if (completing || completed) return;
    setCompleting(true);
    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseSlug: 'boarding-pass', lessonSlug: slug, completed: true }),
      });
      if (res.ok) setCompleted(true);
    } catch { /* ignore */ }
    setCompleting(false);
  }, [completing, completed, slug]);

  const buildTtsChunks = useCallback(() => {
    if (!contentRef.current) return [];
    const chunks: string[] = [];
    const headings = contentRef.current.querySelectorAll('h2');
    const allElements = Array.from(contentRef.current.children);
    let currentChunk = '';
    let currentHeading = '';

    for (const el of allElements) {
      if (el.tagName === 'H2') {
        if (currentChunk.trim()) {
          chunks.push(currentHeading ? `${currentHeading}. ${currentChunk.trim()}` : currentChunk.trim());
        }
        currentHeading = el.textContent || '';
        currentChunk = '';
      } else {
        const text = el.textContent || '';
        if (text.trim()) currentChunk += text.trim() + ' ';
      }
    }
    if (currentChunk.trim()) {
      chunks.push(currentHeading ? `${currentHeading}. ${currentChunk.trim()}` : currentChunk.trim());
    }
    if (chunks.length === 0 && headings.length === 0) {
      const fullText = contentRef.current.textContent || '';
      if (fullText.trim()) chunks.push(fullText.trim());
    }
    return chunks;
  }, []);

  const speakChunk = useCallback((index: number) => {
    const chunks = ttsChunksRef.current;
    if (index >= chunks.length) {
      setTtsPlaying(false);
      setTtsPaused(false);
      setTtsCurrentSection('');
      return;
    }
    ttsIndexRef.current = index;
    const utterance = new SpeechSynthesisUtterance(chunks[index]);
    utterance.rate = ttsRate;
    utterance.onend = () => speakChunk(index + 1);
    utterance.onerror = (e) => {
      if (e.error !== 'canceled') {
        setTtsPlaying(false);
        setTtsPaused(false);
      }
    };
    const sectionMatch = chunks[index].match(/^(.+?)\./);
    if (sectionMatch && tocItems.find(t => t.text === sectionMatch[1])) {
      setTtsCurrentSection(sectionMatch[1]);
    }
    window.speechSynthesis.speak(utterance);
  }, [ttsRate, tocItems]);

  const ttsPlay = useCallback(() => {
    if (ttsPaused) {
      window.speechSynthesis.resume();
      setTtsPaused(false);
      setTtsPlaying(true);
      return;
    }
    window.speechSynthesis.cancel();
    const chunks = buildTtsChunks();
    ttsChunksRef.current = chunks;
    ttsIndexRef.current = 0;
    setTtsPlaying(true);
    setTtsPaused(false);
    speakChunk(0);
  }, [ttsPaused, buildTtsChunks, speakChunk]);

  const ttsPause = useCallback(() => {
    window.speechSynthesis.pause();
    setTtsPaused(true);
    setTtsPlaying(false);
  }, []);

  const ttsStop = useCallback(() => {
    window.speechSynthesis.cancel();
    setTtsPlaying(false);
    setTtsPaused(false);
    setTtsCurrentSection('');
    ttsIndexRef.current = 0;
  }, []);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (!ttsPlaying && !ttsPaused) return;
    window.speechSynthesis.cancel();
    setTtsPaused(false);
    if (ttsPlaying) {
      const chunks = ttsChunksRef.current;
      if (chunks.length > 0) {
        speakChunk(ttsIndexRef.current);
      }
    }
  }, [ttsRate]);

  if (!nav) return null;
  const { lesson, total, progress, weekLabel, prev, next } = nav;

  const totalMinutes = parseInt(lesson.duration) || 5;
  const remainingMinutes = Math.max(1, Math.ceil(totalMinutes * (1 - scrollProgress)));

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

        .lesson-page {
          background: #0a0a0a;
          color: #e8e4dc;
          font-family: 'Space Mono', monospace;
          font-size: 14px;
          line-height: 1.7;
          overflow-x: hidden;
          min-height: 100vh;
          -webkit-font-smoothing: antialiased;
        }

        .lesson-page.light-mode {
          background: #f7f7f8;
          color: #0a0a0a;
        }

        .lesson-page::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          opacity: 0.03;
          pointer-events: none;
          z-index: 1;
        }

        /* Progress Bar */
        .progress-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: #1a1a1a;
          z-index: 200;
        }

        .lesson-page.light-mode .progress-container {
          background: #d0d0d1;
        }

        .progress-bar {
          height: 100%;
          background: #F7931A;
          transition: width 0.3s ease;
        }

        /* Table of Contents */
        .lesson-toc {
          max-width: 700px;
          margin: 0 auto;
          padding: 0 3rem;
        }

        .toc-toggle {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 16px 20px;
          background: #141414;
          border: 1px solid #1a1a1a;
          border-radius: 2px;
          color: #e8e4dc;
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
          transition: border-color 0.15s ease;
        }

        .toc-toggle:hover {
          border-color: #3a3a3a;
        }

        .lesson-page.light-mode .toc-toggle {
          background: #ffffff;
          border-color: #d0d0d1;
          color: #0a0a0a;
        }

        .toc-toggle-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .toc-count {
          color: #F7931A;
          font-size: 10px;
        }

        .toc-chevron {
          width: 14px;
          height: 14px;
          stroke: #8a8a8a;
          transition: transform 0.2s ease;
        }

        .toc-chevron.open {
          transform: rotate(180deg);
        }

        .toc-list {
          list-style: none;
          margin: 0;
          padding: 0;
          overflow: hidden;
          max-height: 0;
          transition: max-height 0.3s ease, padding 0.3s ease;
          background: #141414;
          border: 1px solid #1a1a1a;
          border-top: none;
          border-radius: 0 0 2px 2px;
        }

        .toc-list.open {
          max-height: 600px;
          padding: 8px 0;
        }

        .lesson-page.light-mode .toc-list {
          background: #ffffff;
          border-color: #d0d0d1;
        }

        .toc-item {
          margin: 0;
        }

        .toc-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 20px;
          text-decoration: none;
          font-family: 'Space Mono', monospace;
          font-size: 12px;
          color: #8a8a8a;
          transition: color 0.15s ease, background 0.15s ease;
          line-height: 1.4;
        }

        .toc-link:hover {
          color: #e8e4dc;
          background: rgba(255, 255, 255, 0.03);
        }

        .lesson-page.light-mode .toc-link:hover {
          color: #0a0a0a;
          background: rgba(0, 0, 0, 0.03);
        }

        .toc-link.active {
          color: #F7931A;
        }

        .toc-number {
          font-size: 10px;
          color: #3a3a3a;
          min-width: 18px;
          font-variant-numeric: tabular-nums;
        }

        .toc-link.active .toc-number {
          color: #F7931A;
        }

        .lesson-page.light-mode .toc-number {
          color: #b0b0b1;
        }

        /* Section Dividers */
        .lesson-content h2 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.75rem;
          font-weight: 400;
          margin: 3rem 0 1.5rem;
          color: #f7f7f8;
          padding-top: 2rem;
          border-top: 1px solid #1a1a1a;
          scroll-margin-top: 100px;
        }

        .lesson-page.light-mode .lesson-content h2 {
          color: #0a0a0a;
          border-top-color: #d0d0d1;
        }

        .lesson-content h2::before {
          content: attr(data-section-index);
          display: block;
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.2em;
          color: #F7931A;
          margin-bottom: 8px;
        }

        /* Voice Reader */
        .voice-reader-bar {
          max-width: 700px;
          margin: 24px auto 0;
          padding: 0 3rem;
        }

        .voice-reader {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: #141414;
          border: 1px solid #1a1a1a;
          border-radius: 2px;
        }

        .lesson-page.light-mode .voice-reader {
          background: #ffffff;
          border-color: #d0d0d1;
        }

        .vr-label {
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #8a8a8a;
          white-space: nowrap;
        }

        .vr-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: transparent;
          border: 1px solid #3a3a3a;
          border-radius: 2px;
          cursor: pointer;
          transition: border-color 0.15s ease, background 0.15s ease;
          flex-shrink: 0;
        }

        .vr-btn:hover {
          border-color: #F7931A;
        }

        .vr-btn svg {
          width: 14px;
          height: 14px;
        }

        .vr-btn.playing {
          border-color: #F7931A;
          background: #F7931A;
        }

        .vr-btn.playing svg {
          stroke: #fff;
        }

        .lesson-page.light-mode .vr-btn {
          border-color: #c0c0c1;
        }

        .vr-status {
          flex: 1;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          color: #8a8a8a;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          min-width: 0;
        }

        .vr-status.active {
          color: #F7931A;
        }

        .vr-speed {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
        }

        .vr-speed-btn {
          padding: 4px 8px;
          background: transparent;
          border: 1px solid #3a3a3a;
          border-radius: 2px;
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: #8a8a8a;
          cursor: pointer;
          transition: border-color 0.15s ease, color 0.15s ease;
        }

        .vr-speed-btn:hover {
          border-color: #F7931A;
          color: #F7931A;
        }

        .vr-speed-btn.active {
          border-color: #F7931A;
          color: #F7931A;
        }

        .lesson-page.light-mode .vr-speed-btn {
          border-color: #c0c0c1;
          color: #8a8a8a;
        }

        .lesson-page.light-mode .vr-speed-btn:hover,
        .lesson-page.light-mode .vr-speed-btn.active {
          border-color: #F7931A;
          color: #F7931A;
        }

        .lesson-header {
          padding: 10rem 3rem 3rem;
          max-width: 800px;
          margin: 0 auto;
        }

        .lesson-breadcrumb {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 2rem;
        }

        .breadcrumb-link {
          color: #8a8a8a;
          text-decoration: none;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          transition: color 0.3s ease;
        }

        .breadcrumb-link:hover {
          color: #F7931A;
        }

        .breadcrumb-sep {
          color: #3a3a3a;
          font-size: 10px;
        }

        .breadcrumb-current {
          color: #e8e4dc;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .lesson-page.light-mode .breadcrumb-current {
          color: #0a0a0a;
        }

        .lesson-meta {
          display: flex;
          align-items: center;
          gap: 2rem;
          margin-bottom: 1.5rem;
        }

        .lesson-number {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1rem;
          color: #F7931A;
        }

        .lesson-week,
        .lesson-duration {
          font-size: 11px;
          color: #3a3a3a;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .lesson-page.light-mode .lesson-week,
        .lesson-page.light-mode .lesson-duration {
          color: #8a8a8a;
        }

        .lesson-remaining {
          font-size: 11px;
          color: #F7931A;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          transition: opacity 0.3s ease;
        }

        .lesson-title-row {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .lesson-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(2rem, 5vw, 3rem);
          font-weight: 400;
          line-height: 1.2;
          margin-bottom: 0;
          flex: 1;
        }

        .lesson-page.light-mode .lesson-title {
          color: #0a0a0a;
        }

        .lesson-subtitle {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.25rem;
          font-style: italic;
          color: #8a8a8a;
        }

        .lesson-content {
          max-width: 700px;
          margin: 0 auto;
          padding: 3rem 3rem 4rem;
        }

        .lesson-content p {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.25rem;
          line-height: 1.9;
          margin-bottom: 1.75rem;
          color: #e8e4dc;
        }

        .lesson-page.light-mode .lesson-content p {
          color: #0a0a0a;
        }

        .lesson-content p:first-of-type::first-letter {
          font-size: 4rem;
          float: left;
          line-height: 1;
          margin-right: 0.75rem;
          margin-top: 0.25rem;
          color: #F7931A;
        }

        .lesson-content h3 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.35rem;
          font-weight: 400;
          margin: 2.5rem 0 1rem;
          color: #f7f7f8;
        }

        .lesson-page.light-mode .lesson-content h3 {
          color: #0a0a0a;
        }

        .lesson-content ul,
        .lesson-content ol {
          margin: 1.5rem 0;
          padding-left: 1.5rem;
        }

        .lesson-content li {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.15rem;
          line-height: 1.8;
          margin-bottom: 0.75rem;
          color: #e8e4dc;
        }

        .lesson-page.light-mode .lesson-content li {
          color: #0a0a0a;
        }

        .lesson-content strong {
          color: #f7f7f8;
          font-weight: 600;
        }

        .lesson-page.light-mode .lesson-content strong {
          color: #0a0a0a;
        }

        .lesson-content a {
          color: #F7931A;
          text-decoration: none;
          border-bottom: 1px solid transparent;
          transition: border-color 0.3s ease;
        }

        .lesson-content a:hover {
          border-bottom-color: #F7931A;
        }

        .key-concept {
          background: #141414;
          border: 1px solid #3a3a3a;
          padding: 2rem;
          margin: 2.5rem 0;
          text-align: center;
        }

        .lesson-page.light-mode .key-concept {
          background: #f7f7f8;
          border-color: #d0d0d1;
        }

        .key-concept-label {
          font-size: 9px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: #F7931A;
          margin-bottom: 1rem;
        }

        .key-concept-text {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.5rem;
          font-style: italic;
          line-height: 1.5;
          color: #e8e4dc;
          margin: 0;
        }

        .lesson-page.light-mode .key-concept-text {
          color: #0a0a0a;
        }

        .highlight-box {
          background: #141414;
          border: 1px solid #1a1a1a;
          border-left: 3px solid #F7931A;
          padding: 1.5rem 2rem;
          margin: 2rem 0;
        }

        .lesson-page.light-mode .highlight-box {
          background: #f7f7f8;
          border-color: #d0d0d1;
          border-left-color: #F7931A;
        }

        .highlight-box h4 {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #F7931A;
          margin-bottom: 0.75rem;
        }

        .highlight-box p {
          font-size: 1.1rem;
          margin-bottom: 0;
        }

        .illustration {
          background: #1a1a1a;
          border: 1px solid #3a3a3a;
          padding: 3rem;
          margin: 2.5rem 0;
          text-align: center;
          min-height: 250px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .lesson-page.light-mode .illustration {
          background: #f7f7f8;
          border-color: #d0d0d1;
        }

        .illustration-label {
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #3a3a3a;
          margin-bottom: 0.5rem;
        }

        .lesson-page.light-mode .illustration-label {
          color: #8a8a8a;
        }

        .illustration-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.25rem;
          color: #8a8a8a;
        }

        .lesson-page.light-mode .illustration-title {
          color: #5a5a5a;
        }

        .lesson-summary {
          background: #141414;
          border: 1px solid #1a1a1a;
          padding: 2rem;
          margin: 3rem 0;
        }

        .lesson-page.light-mode .lesson-summary {
          background: #f7f7f8;
          border-color: #d0d0d1;
        }

        .summary-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.25rem;
          font-weight: 400;
          margin-bottom: 1rem;
          color: #f7f7f8;
        }

        .lesson-page.light-mode .summary-title {
          color: #0a0a0a;
        }

        .summary-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .summary-list li {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          font-size: 1rem;
          margin-bottom: 0.75rem;
        }

        .summary-list li::before {
          content: '◆';
          color: #F7931A;
          font-size: 0.75rem;
          margin-top: 0.35rem;
        }

        .lesson-complete-section {
          max-width: 700px;
          margin: 0 auto;
          padding: 2rem 3rem 0;
          text-align: center;
        }

        .mark-complete-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 2rem;
          background: transparent;
          border: 1px solid #F7931A;
          color: #F7931A;
          font-family: 'Space Mono', monospace;
          font-size: 12px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .mark-complete-btn:hover:not(:disabled) {
          background: #F7931A;
          color: #f7f7f8;
        }

        .mark-complete-btn:disabled {
          cursor: default;
        }

        .mark-complete-btn.completed {
          background: #22c55e;
          border-color: #22c55e;
          color: #f7f7f8;
        }

        .mark-complete-btn svg {
          width: 18px;
          height: 18px;
        }

        .lesson-navigation {
          max-width: 700px;
          margin: 0 auto;
          padding: 3rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid #1a1a1a;
        }

        .lesson-page.light-mode .lesson-navigation {
          border-top-color: #d0d0d1;
        }

        .nav-btn {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          background: transparent;
          border: 1px solid #3a3a3a;
          color: #e8e4dc;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-decoration: none;
          transition: all 0.3s ease;
        }

        .lesson-page.light-mode .nav-btn {
          border-color: #c0c0c1;
          color: #0a0a0a;
        }

        .nav-btn:hover {
          border-color: #F7931A;
          color: #F7931A;
        }

        .nav-btn svg {
          width: 16px;
          height: 16px;
        }

        .nav-btn.primary {
          background: #F7931A;
          border-color: #F7931A;
          color: #f7f7f8;
        }

        .nav-btn.primary:hover {
          background: #ff6600;
          border-color: #ff6600;
        }


        @media (max-width: 768px) {
          .progress-container {
            top: 0;
          }

          .lesson-header {
            padding: calc(5.5rem + var(--safe-top)) 1.5rem 2rem;
          }

          .lesson-breadcrumb {
            display: none;
          }

          .lesson-meta {
            display: flex;
            align-items: center;
            gap: 1rem;
            flex-wrap: wrap;
            margin-bottom: 1rem;
          }

          .lesson-number {
            font-size: 11px;
            font-weight: 700;
          }

          .lesson-week,
          .lesson-duration {
            font-size: 10px;
          }

          .lesson-title {
            font-size: 1.75rem;
            line-height: 1.25;
            margin-bottom: 0.5rem;
          }

          .lesson-subtitle {
            font-size: 1.1rem;
          }

          .lesson-content {
            padding: 0 1.5rem calc(5rem + var(--safe-bottom));
          }

          .lesson-content p {
            font-size: 1.15rem;
            line-height: 1.85;
            margin-bottom: 1.5rem;
          }

          .lesson-content p:first-of-type::first-letter {
            font-size: 3.5rem;
            margin-right: 0.6rem;
            margin-top: 0.2rem;
          }

          .lesson-toc {
            padding: 0 1.5rem;
          }

          .toc-toggle {
            padding: 12px 16px;
          }

          .toc-link {
            padding: 8px 16px;
            font-size: 11px;
          }

          .voice-reader-bar {
            padding: 0 1.5rem;
          }

          .voice-reader {
            gap: 8px;
            padding: 10px 12px;
          }

          .vr-label { display: none; }

          .vr-speed-btn {
            padding: 3px 6px;
            font-size: 9px;
          }

          .lesson-content h2 {
            font-size: 1.4rem;
            margin: 2.5rem 0 1.25rem;
            padding-top: 1.5rem;
          }

          .lesson-content h3 {
            font-size: 1.2rem;
            margin: 2rem 0 1rem;
          }

          .lesson-content ul,
          .lesson-content ol {
            margin: 1.25rem 0;
            padding-left: 1.25rem;
          }

          .lesson-content li {
            font-size: 1.1rem;
            line-height: 1.75;
            margin-bottom: 0.6rem;
          }

          .key-concept {
            padding: 1.25rem 1.5rem;
            margin: 2rem 0;
            border: none;
            border-left: 3px solid #F7931A;
            text-align: left;
          }

          .key-concept-label {
            font-size: 9px;
            letter-spacing: 0.2em;
            margin-bottom: 0.5rem;
          }

          .key-concept-text {
            font-size: 1.15rem;
            line-height: 1.5;
          }

          .highlight-box {
            padding: 1.25rem 1.5rem;
            margin: 2rem 0;
          }

          .highlight-box h4 {
            font-size: 9px;
          }

          .highlight-box p {
            font-size: 1rem;
          }

          .illustration {
            padding: 2rem 1.5rem;
            margin: 2rem 0;
            min-height: 180px;
          }

          .illustration-label {
            font-size: 9px;
            margin-bottom: 0.35rem;
          }

          .illustration-title {
            font-size: 1rem;
          }

          .lesson-summary {
            padding: 1.5rem;
            margin: 2.5rem 0;
          }

          .summary-title {
            font-size: 1.1rem;
            margin-bottom: 1rem;
          }

          .summary-list li {
            font-size: 0.95rem;
            gap: 0.6rem;
            margin-bottom: 0.6rem;
          }

          .summary-list li::before {
            font-size: 0.6rem;
            margin-top: 0.4rem;
          }

          .lesson-navigation {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 1rem 1rem calc(1rem + var(--safe-bottom));
            background: #0a0a0a;
            border-top: 1px solid #1a1a1a;
            display: flex;
            justify-content: space-between;
            align-items: center;
            z-index: 100;
            max-width: none;
            flex-direction: row;
            gap: 0;
          }

          .lesson-page.light-mode .lesson-navigation {
            background: #f7f7f8;
            border-top-color: #d0d0d1;
          }

          .nav-btn {
            padding: 0.75rem 1rem;
            min-width: 90px;
            font-size: 10px;
            width: auto;
          }

          .nav-btn:active {
            border-color: #F7931A;
            color: #F7931A;
          }

          .nav-btn.primary:active {
            background: #d4854c;
            border-color: #d4854c;
          }

          .nav-btn svg {
            width: 16px;
            height: 16px;
          }

        }
      `}</style>

      <div className={`lesson-page ${isLightMode ? 'light-mode' : ''}`}>
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
        </div>

        <SiteNav activePath="/learn" />

        <header className="lesson-header">
          <div className="lesson-breadcrumb">
            <Link href="/learn" className="breadcrumb-link">Stu₿y</Link>
            <span className="breadcrumb-sep">→</span>
            <Link href="/learn/boarding-pass" className="breadcrumb-link">The Boarding Pass</Link>
            <span className="breadcrumb-sep">→</span>
            <span className="breadcrumb-current">Lesson {lesson.order}</span>
          </div>
          <div className="lesson-meta">
            <span className="lesson-number">Lesson {lesson.number} of {total}</span>
            <span className="lesson-week">{weekLabel}</span>
            <span className="lesson-duration">{lesson.duration} read</span>
            {scrollProgress > 0.05 && scrollProgress < 0.95 && (
              <span className="lesson-remaining">{remainingMinutes} min left</span>
            )}
          </div>
          <div className="lesson-title-row">
            <h1 className="lesson-title">{lesson.title}</h1>
            <BookmarkButton contentType="lesson" contentSlug={slug} />
          </div>
          <p className="lesson-subtitle">{lesson.subtitle}</p>
        </header>

        {tocItems.length > 0 && (
          <div className="lesson-toc">
            <button className="toc-toggle" onClick={() => setTocOpen(!tocOpen)}>
              <span className="toc-toggle-left">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 6h16M4 12h16M4 18h16"/>
                </svg>
                Sections
                <span className="toc-count">{tocItems.length}</span>
              </span>
              <svg className={`toc-chevron${tocOpen ? ' open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>
            <ul className={`toc-list${tocOpen ? ' open' : ''}`}>
              {tocItems.map(item => (
                <li key={item.id} className="toc-item">
                  <a
                    href={`#${item.id}`}
                    className={`toc-link${activeSection === item.id ? ' active' : ''}`}
                    onClick={() => setTocOpen(false)}
                  >
                    <span className="toc-number">{String(item.index).padStart(2, '0')}</span>
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {ttsSupported && (
          <div className="voice-reader-bar">
            <div className="voice-reader">
              <span className="vr-label">Listen</span>
              {!ttsPlaying && !ttsPaused ? (
                <button className="vr-btn" onClick={ttsPlay} aria-label="Play">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#8a8a8a" strokeWidth="2">
                    <polygon points="5 3 19 12 5 21 5 3" fill="#8a8a8a" stroke="none"/>
                  </svg>
                </button>
              ) : (
                <>
                  {ttsPlaying ? (
                    <button className="vr-btn playing" onClick={ttsPause} aria-label="Pause">
                      <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                        <rect x="6" y="4" width="4" height="16" fill="#fff" stroke="none"/>
                        <rect x="14" y="4" width="4" height="16" fill="#fff" stroke="none"/>
                      </svg>
                    </button>
                  ) : (
                    <button className="vr-btn" onClick={ttsPlay} aria-label="Resume">
                      <svg viewBox="0 0 24 24" fill="none" stroke="#8a8a8a" strokeWidth="2">
                        <polygon points="5 3 19 12 5 21 5 3" fill="#8a8a8a" stroke="none"/>
                      </svg>
                    </button>
                  )}
                  <button className="vr-btn" onClick={ttsStop} aria-label="Stop">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#8a8a8a" strokeWidth="2">
                      <rect x="6" y="6" width="12" height="12" fill="#8a8a8a" stroke="none"/>
                    </svg>
                  </button>
                </>
              )}
              <span className={`vr-status${ttsPlaying ? ' active' : ''}`}>
                {ttsPlaying ? (ttsCurrentSection || 'Reading...') : ttsPaused ? 'Paused' : `${lesson.duration} · Listen to this lesson`}
              </span>
              <div className="vr-speed">
                {[0.75, 1, 1.25, 1.5, 2].map(rate => (
                  <button
                    key={rate}
                    className={`vr-speed-btn${ttsRate === rate ? ' active' : ''}`}
                    onClick={() => setTtsRate(rate)}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <article className="lesson-content" ref={contentRef}>
          {children}
        </article>

        {user && (
          <div className="lesson-complete-section">
            <button
              className={`mark-complete-btn${completed ? ' completed' : ''}`}
              onClick={markComplete}
              disabled={completed || completing}
            >
              {completed ? (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                  Completed
                </>
              ) : completing ? (
                'Saving...'
              ) : (
                'Mark as Complete'
              )}
            </button>
          </div>
        )}

        <nav className="lesson-navigation">
          <Link href={prev.href} className="nav-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            {prev.label}
          </Link>
          <Link href={next.href} className="nav-btn primary">
            {next.label}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        </nav>

        <HighlightPopover contentType="lesson" contentSlug={slug} />

        <SiteFooter variant="instructor" />
      </div>
    </>
  );
}
