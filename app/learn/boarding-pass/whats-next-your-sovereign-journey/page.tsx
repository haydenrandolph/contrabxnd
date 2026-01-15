'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';

export default function BoardingPassLesson21() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isLightMode, toggleTheme } = useTheme();

  useEffect(() => {
    document.title = "What's Next: Your Sovereign Journey | Contraband";
  }, []);

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
          background: #e8e4dc;
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
          z-index: 1000;
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
          background: #d8d4cc;
        }

        .progress-bar {
          height: 100%;
          background: #F7931A;
          width: 100%; /* 21/21 lessons */
          transition: width 0.3s ease;
        }

        .lesson-nav {
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
          margin-top: 3px;
        }

        .lesson-page.light-mode .lesson-nav {
          background: linear-gradient(to bottom, #e8e4dc 0%, transparent 100%);
        }

        .lesson-logo-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
          color: #f5f3f0;
        }

        .lesson-page.light-mode .lesson-logo-link {
          color: #0a0a0a;
        }

        .lesson-logo-text {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
        }

        .lesson-nav-links {
          display: flex;
          gap: 3rem;
        }

        .mobile-back-btn {
          display: none;
          align-items: center;
          gap: 0.5rem;
          color: #8a8a8a;
          text-decoration: none;
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 0.5rem;
          margin: -0.5rem;
        }

        .mobile-back-btn svg {
          width: 18px;
          height: 18px;
        }

        .mobile-back-btn:active {
          color: #F7931A;
        }

        .lesson-page.light-mode .mobile-back-btn {
          color: #5a5a5a;
        }

        .lesson-page.light-mode .mobile-back-btn:active {
          color: #F7931A;
        }

        .lesson-nav-links a {
          color: #f5f3f0;
          text-decoration: none;
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          position: relative;
          padding: 0.25rem 0;
        }

        .lesson-page.light-mode .lesson-nav-links a {
          color: #0a0a0a;
        }

        .lesson-nav-links a::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 1px;
          background: #F7931A;
          transition: width 0.3s ease;
        }

        .lesson-nav-links a:hover::after,
        .lesson-nav-links a.active::after {
          width: 100%;
        }

        .lesson-nav-links a.coming-soon {
          text-decoration: line-through;
          opacity: 0.5;
          cursor: not-allowed;
        }

        .lesson-nav-links a.coming-soon:hover::after {
          width: 0;
        }

        /* Mobile Menu Button */
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
          background: #e8e4dc;
          transition: all 0.3s ease;
          margin: 3px 0;
        }

        .lesson-page.light-mode .mobile-menu-btn span {
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

        /* Mobile Menu Overlay */
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

        .lesson-page.light-mode .mobile-menu-overlay {
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
          transition: color 0.3s ease;
        }

        .lesson-page.light-mode .mobile-menu-nav a {
          color: #0a0a0a;
        }

        .mobile-menu-nav a:active {
          color: #F7931A;
        }

        .mobile-menu-nav a.coming-soon {
          text-decoration: line-through;
          opacity: 0.5;
        }


        .lesson-theme-toggle {
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

        .lesson-theme-toggle:hover {
          background: #F7931A;
          border-color: #F7931A;
          transform: scale(1.1);
        }

        .lesson-theme-toggle svg {
          width: 24px;
          height: 24px;
          stroke: #e8e4dc;
        }

        .lesson-page.light-mode .lesson-theme-toggle {
          background: #f5f3f0;
          border-color: #c8c4bc;
        }

        .lesson-page.light-mode .lesson-theme-toggle svg {
          stroke: #070713;
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

        .lesson-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(2rem, 5vw, 3rem);
          font-weight: 400;
          line-height: 1.2;
          margin-bottom: 1rem;
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

        .lesson-content h2 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.75rem;
          font-weight: 400;
          margin: 3rem 0 1.5rem;
          color: #f5f3f0;
        }

        .lesson-page.light-mode .lesson-content h2 {
          color: #0a0a0a;
        }

        .lesson-content h3 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.35rem;
          font-weight: 400;
          margin: 2.5rem 0 1rem;
          color: #f5f3f0;
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
          color: #f5f3f0;
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

        .lesson-content hr {
          border: none;
          border-top: 1px solid #3a3a3a;
          margin: 3rem 0;
        }

        .lesson-page.light-mode .lesson-content hr {
          border-top-color: #c8c4bc;
        }

        .lesson-content blockquote {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.1rem;
          font-style: italic;
          color: #8a8a8a;
          margin: 2rem 0;
          padding-left: 2rem;
          border-left: 2px solid #F7931A;
        }

        .key-concept {
          background: #141414;
          border: 1px solid #3a3a3a;
          padding: 2rem;
          margin: 2.5rem 0;
          text-align: center;
        }

        .lesson-page.light-mode .key-concept {
          background: #f5f3f0;
          border-color: #d8d4cc;
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
          background: #f5f3f0;
          border-color: #d8d4cc;
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
          background: #f5f3f0;
          border-color: #d8d4cc;
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
          background: #f5f3f0;
          border-color: #d8d4cc;
        }

        .summary-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.25rem;
          font-weight: 400;
          margin-bottom: 1rem;
          color: #f5f3f0;
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

        .course-complete {
          background: #141414;
          border: 2px solid #F7931A;
          padding: 3rem;
          margin: 4rem 0;
          text-align: center;
        }

        .lesson-page.light-mode .course-complete {
          background: #f5f3f0;
        }

        .course-complete h3 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2rem;
          margin-bottom: 2rem;
          color: #F7931A;
        }

        .course-complete h4 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.5rem;
          margin: 2rem 0 1rem;
          color: #f5f3f0;
        }

        .lesson-page.light-mode .course-complete h4 {
          color: #0a0a0a;
        }

        .course-complete ul {
          list-style: none;
          padding: 0;
          margin: 1rem 0 2rem;
        }

        .course-complete li {
          font-size: 1.15rem;
          margin-bottom: 0.5rem;
        }

        .course-complete ol {
          list-style: decimal;
          padding-left: 2rem;
          margin: 1rem 0 2rem;
          text-align: left;
          display: inline-block;
        }

        .course-complete ol li {
          margin-bottom: 0.75rem;
        }

        .course-complete p {
          font-size: 1.15rem;
          margin: 1.5rem 0;
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
          border-top-color: #d8d4cc;
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
          border-color: #c8c4bc;
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
          color: #f5f3f0;
        }

        .nav-btn.primary:hover {
          background: #ff6600;
          border-color: #ff6600;
        }

        .lesson-footer {
          padding: 4rem 3rem;
          border-top: 1px solid #1a1a1a;
          max-width: 1400px;
          margin: 0 auto;
        }

        .lesson-page.light-mode .lesson-footer {
          border-top-color: #d8d4cc;
        }

        .lesson-footer-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .lesson-footer-left {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .lesson-footer-copy {
          font-size: 12px;
          color: #8a8a8a;
        }

        .lesson-footer-links {
          display: flex;
          gap: 2rem;
        }

        .lesson-footer-links a {
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #8a8a8a;
          text-decoration: none;
          transition: color 0.3s ease;
        }

        .lesson-footer-links a:hover {
          color: #F7931A;
        }

        @media (max-width: 768px) {
          .progress-container {
            top: 0;
          }

          .lesson-nav {
            padding: calc(0.75rem + var(--safe-top)) 1rem 0.75rem;
            background: #0a0a0a;
            border-bottom: 1px solid #1a1a1a;
            margin-top: 3px;
          }

          .lesson-page.light-mode .lesson-nav {
            background: #e8e4dc;
            border-bottom-color: #d8d4cc;
          }

          .lesson-logo-link {
            gap: 0.5rem;
          }

          .lesson-logo-text {
            font-size: 10px;
            letter-spacing: 0.2em;
          }

          .lesson-nav-links {
            display: none;
          }

          .mobile-back-btn {
            display: flex;
          }


          .mobile-menu-btn {
            display: flex;
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

          .lesson-content h2 {
            font-size: 1.4rem;
            margin: 2.5rem 0 1.25rem;
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

          .lesson-content hr {
            margin: 2.5rem 0;
          }

          .lesson-content blockquote {
            font-size: 1rem;
            padding-left: 1.5rem;
            margin: 1.5rem 0;
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

          .course-complete {
            padding: 2rem 1.5rem;
            margin: 3rem 0;
          }

          .course-complete h3 {
            font-size: 1.5rem;
            margin-bottom: 1.5rem;
          }

          .course-complete h4 {
            font-size: 1.25rem;
            margin: 1.5rem 0 0.75rem;
          }

          .course-complete p {
            font-size: 1.05rem;
            margin: 1.25rem 0;
          }

          .course-complete ul {
            margin: 0.75rem 0 1.5rem;
          }

          .course-complete li {
            font-size: 1.05rem;
            margin-bottom: 0.4rem;
          }

          .course-complete ol {
            margin: 0.75rem 0 1.5rem;
          }

          .course-complete ol li {
            font-size: 1.05rem;
            margin-bottom: 0.5rem;
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
            background: #e8e4dc;
            border-top-color: #d8d4cc;
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

          .lesson-footer {
            padding: 2rem 1.25rem calc(6rem + var(--safe-bottom));
          }

          .lesson-footer-content {
            flex-direction: column;
            gap: 1.5rem;
            text-align: center;
          }

          .lesson-footer-left {
            flex-direction: column;
            gap: 1rem;
          }

          .lesson-footer-copy {
            font-size: 11px;
          }

          .lesson-footer-links {
            flex-wrap: wrap;
            justify-content: center;
            gap: 1.5rem;
          }

          .lesson-footer-links a {
            font-size: 10px;
          }

          .lesson-footer-links a:active {
            color: #F7931A;
          }

          .lesson-theme-toggle {
            bottom: calc(5rem + var(--safe-bottom));
            right: 1rem;
            width: 44px;
            height: 44px;
          }

          .lesson-theme-toggle:active {
            background: #F7931A;
            border-color: #F7931A;
          }
        }
      `}</style>

      <div className={`lesson-page ${isLightMode ? 'light-mode' : ''}`}>
        <div className="progress-container">
          <div className="progress-bar"></div>
        </div>

        <button
          className="lesson-theme-toggle"
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

        <nav className="lesson-nav">
          <Link href="/learn/boarding-pass" className="mobile-back-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Course
          </Link>
          <Link href="/" className="lesson-logo-link">
            <Image
              src="/contraband-logo-v3.png"
              alt="Contraband logo"
              width={40}
              height={40}
            />
            <span className="lesson-logo-text">Contra₿and</span>
          </Link>
          <div className="lesson-nav-links">
            <Link href="/learn" className="active">Stu₿y</Link>
            <Link href="/writings">Writings</Link>
            <a href="#podcasts" className="coming-soon">Podcasts</a>
            <a href="#videos" className="coming-soon">Videos</a>
            <a href="#merch" className="coming-soon">Merch</a>
            <Link href="/about">About</Link>
            <Link href="/">Hank C. Moody</Link>
          </div>
          <button
            className={`mobile-menu-btn ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </nav>

        {/* Mobile Menu Overlay */}
        <div className={`mobile-menu-overlay ${menuOpen ? 'open' : ''}`}>
          <nav className="mobile-menu-nav">
            <Link href="/learn" onClick={() => setMenuOpen(false)}>Stu₿y</Link>
            <Link href="/writings" onClick={() => setMenuOpen(false)}>Writings</Link>
            <a href="#podcasts" className="coming-soon">Podcasts</a>
            <a href="#videos" className="coming-soon">Videos</a>
            <a href="#merch" className="coming-soon">Merch</a>
            <Link href="/about" onClick={() => setMenuOpen(false)}>About</Link>
            <Link href="/" onClick={() => setMenuOpen(false)}>Hank C. Moody</Link>
          </nav>
        </div>

        <header className="lesson-header">
          <div className="lesson-breadcrumb">
            <Link href="/learn" className="breadcrumb-link">Stu₿y</Link>
            <span className="breadcrumb-sep">→</span>
            <Link href="/learn/boarding-pass" className="breadcrumb-link">The Boarding Pass</Link>
            <span className="breadcrumb-sep">→</span>
            <span className="breadcrumb-current">Lesson 21</span>
          </div>
          <div className="lesson-meta">
            <span className="lesson-number">Lesson 21 of 21</span>
            <span className="lesson-week">Week 3</span>
            <span className="lesson-duration">10 min read</span>
          </div>
          <h1 className="lesson-title">What's Next: Your Sovereign Journey</h1>
          <p className="lesson-subtitle">Where to go from here.</p>
        </header>

        <article className="lesson-content">
          <p>Twenty lessons. Three weeks. You've come a long way.</p>

          <p>You understand what Bitcoin is, why it exists, and how it works. You've bought some. You've set up a wallet. You know the risks and how to avoid them.</p>

          <p>Now what?</p>

          <h3>You're Just Getting Started</h3>

          <p>Here's a secret: most of the Bitcoin journey happens after you buy.</p>

          <p>The first purchase is like stepping through a door. On the other side is a world of ideas about money, freedom, technology, and society that most people never encounter. The deeper you go, the more you understand why people become so passionate about this.</p>

          <p>The journey changes you. Your relationship with money. Your understanding of economics. Your view of government and institutions. Your sense of what's possible.</p>

          <p>This isn't cult programming—it's education. When you understand how money actually works, you can't unsee it.</p>

          <h3>The Next Course: Letters of Marque</h3>

          <p>If you're holding bitcoin and want to take security seriously, the next step is <strong>Letters of Marque: Self-Custody and Sovereign Security</strong>.</p>

          <p>That course covers:</p>
          <ul>
            <li>Hardware wallet deep dive</li>
            <li>Seed phrase security (metal backups, geographic distribution)</li>
            <li>Multisig setups for larger holdings</li>
            <li>Inheritance planning</li>
            <li>Operational security (privacy, phishing, physical security)</li>
          </ul>

          <p>It's designed for people who have completed The Boarding Pass and want to level up their security.</p>

          <h3>Resources for Continued Learning</h3>

          <p><strong>Books:</strong></p>
          <ul>
            <li><em>The Bitcoin Standard</em> by Saifedean Ammous (monetary theory)</li>
            <li><em>Inventing Bitcoin</em> by Yan Pritzker (technical introduction)</li>
            <li><em>The Sovereign Individual</em> by Davidson & Rees-Mogg (prescient, pre-Bitcoin)</li>
            <li><em>The Fiat Standard</em> by Saifedean Ammous (critique of current system)</li>
          </ul>

          <p><strong>Podcasts:</strong></p>
          <ul>
            <li>What Bitcoin Did (interviews, accessible)</li>
            <li>Bitcoin Audible (reads Bitcoin articles)</li>
            <li>Stephan Livera Podcast (more technical)</li>
          </ul>

          <p><strong>Websites:</strong></p>
          <ul>
            <li>bitcoin.org (basics)</li>
            <li>mempool.space (network stats, fees)</li>
            <li>clark moody dashboard (real-time data)</li>
          </ul>

          <p><strong>Twitter/X:</strong></p>
          <ul>
            <li>Follow bitcoiners (you'll find them)</li>
            <li>Be skeptical of financial advice</li>
            <li>Signal &gt; noise takes time to filter</li>
          </ul>

          <h3>Principles for the Long Journey</h3>

          <p><strong>Keep stacking</strong><br />DCA works. The people with the most bitcoin aren't geniuses—they just kept buying.</p>

          <p><strong>Secure your keys</strong><br />Self-custody isn't optional for serious holders. Do the work.</p>

          <p><strong>Stay humble</strong><br />The price will do things you don't expect. Markets humble everyone eventually.</p>

          <p><strong>Ignore the noise</strong><br />Media coverage is mostly uninformed. Twitter is mostly noise. Focus on fundamentals.</p>

          <p><strong>Think long-term</strong><br />Four-year cycles. Halving events. Adoption curves. These are the relevant timeframes, not daily price movements.</p>

          <p><strong>Don't risk what you can't lose</strong><br />Leverage kills. Yolo-ing your rent money is foolish. Bitcoin's volatility requires a strong stomach and a long horizon.</p>

          <p><strong>Help others</strong><br />The best way to learn is to teach. Help newcomers. Answer questions. Be patient with skeptics.</p>

          <h3>The Big Picture</h3>

          <p>Bitcoin is the largest peaceful protest in human history. Not protest through marches or signs, but protest through exit—opting out of a monetary system that debases savings and enriches insiders.</p>

          <p>You're not just holding an asset. You're participating in a monetary revolution. Whether Bitcoin succeeds completely, partially, or not at all, you're part of an attempt to build something better.</p>

          <p>That attempt matters regardless of outcome. The ideas matter. The technology matters. The possibility of money beyond state control—that matters.</p>

          <h3>Welcome Aboard</h3>

          <p>You have your boarding pass now. You understand the ship, the route, and the destination.</p>

          <p>The journey will have storms. Prices will crash. Media will declare Bitcoin dead (again). People will call you crazy (still).</p>

          <p>But if you've understood these lessons, you know something they don't: this technology works. The network has never failed. The math is sound. The incentives align.</p>

          <p>The only question is how much of your future you want to stake on that understanding.</p>

          <p>Welcome to Bitcoin. Welcome to sovereignty. Welcome to the adventure.</p>

          <hr />

          <blockquote>
            "The Times 03/Jan/2009 Chancellor on brink of second bailout for banks"<br />
            — Satoshi Nakamoto, Genesis Block
          </blockquote>

          <hr />

          <div className="course-complete">
            <h3>Course Complete</h3>

            <p>You've finished <strong>The Boarding Pass: Your First 21 Days with Bitcoin</strong>.</p>

            <h4>What you've learned:</h4>
            <ul>
              <li>What Bitcoin is and why it matters</li>
              <li>How the network achieves decentralization</li>
              <li>Why 21 million is the number that changes everything</li>
              <li>How to buy, store, and secure bitcoin</li>
              <li>How to think about volatility, scams, and long-term holding</li>
            </ul>

            <h4>Next steps:</h4>
            <ol>
              <li>Continue your DCA plan</li>
              <li>Move to self-custody (hardware wallet)</li>
              <li>Enroll in <strong>Letters of Marque</strong> for advanced security</li>
              <li>Keep learning—the rabbit hole goes deep</li>
            </ol>

            <p>See you on the next voyage.</p>

            <p><em>— Contraband</em></p>
          </div>
        </article>

        <nav className="lesson-navigation">
          <Link href="/learn/boarding-pass/the-road-to-self-custody" className="nav-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Lesson 20
          </Link>
          <Link href="/learn/boarding-pass" className="nav-btn primary">
            Course Overview
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        </nav>

        <footer className="lesson-footer">
          <div className="lesson-footer-content">
            <div className="lesson-footer-left">
              <Image
                src="/contraband-logo-v3.png"
                alt="Contraband logo"
                width={32}
                height={32}
              />
              <span className="lesson-footer-copy">© 2025 Contraband. All rights reserved.</span>
            </div>
            <div className="lesson-footer-links">
              <a href="https://x.com/hankCmoody" target="_blank" rel="noopener noreferrer">Twitter</a>
              <a href="https://youtube.com/@hankcmoody" target="_blank" rel="noopener noreferrer">YouTube</a>
              <a href="https://hankcmoody.substack.com" target="_blank" rel="noopener noreferrer">Substack</a>
              <a href="#">RSS</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
