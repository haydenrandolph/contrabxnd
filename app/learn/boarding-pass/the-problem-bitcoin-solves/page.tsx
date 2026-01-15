'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';

export default function BoardingPassLesson02() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isLightMode, toggleTheme } = useTheme();

  useEffect(() => {
    document.title = 'The Problem Bitcoin Solves | Contraband';
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
          width: 9.52%; /* 2/21 lessons */
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

          .lesson-header {
            padding: calc(5.5rem + var(--safe-top)) 1.5rem 2rem;
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
            <span className="breadcrumb-current">Lesson 2</span>
          </div>
          <div className="lesson-meta">
            <span className="lesson-number">Lesson 02 of 21</span>
            <span className="lesson-week">Week 1</span>
            <span className="lesson-duration">15 min read</span>
          </div>
          <h1 className="lesson-title">The Problem Bitcoin Solves</h1>
          <p className="lesson-subtitle">Digital scarcity and the double-spend problem.</p>
        </header>

        <article className="lesson-content">
          <p>Before 2009, creating digital money that couldn't be copied was considered impossible. That might sound strange—after all, we send money digitally all the time. But what we call "digital money" is actually just messages about money, not the money itself. The difference matters more than you might think.</p>

          <p>To understand why Bitcoin is significant, you need to understand the problem it solved—a problem that computer scientists had been wrestling with for decades.</p>

          <h3>The Copy Problem</h3>

          <p>Digital things can be copied. That's kind of their superpower. Your MP3s, your photos, your documents—you can make infinite perfect copies with zero effort. That's great for sharing cat videos. It's terrible for money.</p>

          <p>Money only works if it's scarce. If you could copy a dollar as easily as you copy a file, dollars would be worthless within hours. Everyone would have infinite dollars, which means dollars would buy nothing.</p>

          <p>Physical cash solves this with, well, physicality. You can't email someone a $20 bill. If you hand it to them, you no longer have it. The scarcity is enforced by the laws of physics.</p>

          <p>But digital information doesn't work that way. Send someone a photo and you still have the photo. Send someone a file and you still have the file. How do you send someone money and not still have the money?</p>

          <div className="key-concept">
            <p className="key-concept-label">The Core Problem</p>
            <p className="key-concept-text">How do you create something digital that can't be copied?</p>
          </div>

          <h3>The Traditional Solution: Trusted Third Parties</h3>

          <p>Before Bitcoin, there was only one answer: use a trusted intermediary.</p>

          <p>When you Venmo someone $50, you're not sending digital money. You're sending a message to Venmo that says "please decrease my balance by $50 and increase their balance by $50." Venmo maintains the ledger—the record of who has what—and makes sure you can't spend the same $50 twice.</p>

          <p>This works. Mostly. But it has significant drawbacks:</p>

          <ul>
            <li><strong>You need permission.</strong> Venmo has to let you use their service. They can say no. They have said no to entire categories of legal transactions.</li>
            <li><strong>They can freeze your funds.</strong> If Venmo decides you violated their terms, your money is stuck. No appeal to physics is possible.</li>
            <li><strong>They see everything.</strong> Every transaction, every recipient, every pattern. This data is valuable, and it doesn't belong to you.</li>
            <li><strong>They can fail.</strong> Companies go bankrupt. Servers go down. Governments impose sanctions. When the intermediary fails, your money might fail with it.</li>
            <li><strong>They charge for the privilege.</strong> Credit cards: 2-3%. International wire transfers: $30-50 plus exchange rate markups. Remittances: up to 10%. These fees add up to hundreds of billions annually.</li>
          </ul>

          <p>For most transactions, most of the time, these drawbacks are tolerable. We've built an entire financial system around trusting intermediaries, and it sort of works.</p>

          <p>But "sort of works" isn't the same as "actually works." And for a lot of people in a lot of situations, the intermediaries don't work at all.</p>

          <div className="illustration">
            <span className="illustration-label">Illustration</span>
            <span className="illustration-title">The Intermediary Problem: Every Transaction Requires Trust</span>
          </div>

          <h3>The Double-Spend Problem</h3>

          <p>Computer scientists had a name for this challenge: the double-spend problem. If you have a digital token, what prevents you from sending it to two different people at the same time?</p>

          <p>Think about it: you have $100 in some digital wallet. You send $100 to Alice. A millisecond later, before the network has "caught up," you send the same $100 to Bob. Which transaction is valid? Who actually got paid?</p>

          <p>With a central authority, this is easy. The authority processes transactions in order and rejects the second one. But without a central authority? How do distributed computers around the world agree on which transaction came first?</p>

          <p>This was the unsolved problem. Cryptographers had been working on digital cash since the 1980s. DigiCash, e-gold, bit gold, b-money—they all either required trusted third parties or couldn't solve the double-spend problem. Many believed it couldn't be done.</p>

          <h3>Satoshi's Solution</h3>

          <p>In 2008, someone using the name Satoshi Nakamoto posted a paper to a cryptography mailing list. The title was simple: "Bitcoin: A Peer-to-Peer Electronic Cash System."</p>

          <p>The solution was elegant: instead of one authority maintaining the ledger, have thousands of computers maintain identical copies of the same ledger. Instead of trusting an institution, trust mathematics—specifically, the math that makes the ledger prohibitively expensive to fake.</p>

          <p>Here's the key insight: if changing the ledger requires enormous computational work, and if everyone can verify that the work was done, then no one can cheat without spending more than they'd gain. The incentives align toward honesty.</p>

          <div className="key-concept">
            <p className="key-concept-label">The Elegant Part</p>
            <p className="key-concept-text">Bitcoin doesn't prevent double-spending through authority. It prevents it through economic incentives. Cheating costs more than it's worth, so no one cheats.</p>
          </div>

          <h3>Why This Matters</h3>

          <p>The double-spend solution enabled something genuinely new: digital scarcity without trusted intermediaries.</p>

          <p>Before Bitcoin, the only digital things that were scarce were artificially scarce—made rare by companies or governments that could, at any time, make them un-rare. The scarcity of your in-game gold or airline miles or Venmo balance depends entirely on the policies of whoever controls the database.</p>

          <p>Bitcoin's scarcity is enforced by mathematics. No CEO can decide to inflate it. No government can print more. The rules are the rules, and they're enforced by every computer running the software.</p>

          <p>This is the first time in history that a digital asset has been genuinely scarce—not because someone says so, but because mathematics makes it so.</p>

          <div className="key-concept">
            <p className="key-concept-label">The Breakthrough</p>
            <p className="key-concept-text">Bitcoin created digital scarcity without requiring trust in any authority.</p>
          </div>

          <h3>Beyond Money</h3>

          <p>The implications extend beyond payments. What Bitcoin proved was that you can have digital consensus without central authority. You can have thousands of computers agree on the state of a shared ledger, update that ledger reliably, and do so in a way that no one can manipulate.</p>

          <p>This is a new primitive—a new basic building block for digital systems. It's not just money that requires consensus about who owns what. Property records, identity systems, contracts, voting—all of these are fundamentally about maintaining accurate shared records.</p>

          <p>Bitcoin solved the consensus problem for money first. But the solution is bigger than money.</p>

          <h3>The 2008 Context</h3>

          <p>It's not a coincidence that the Bitcoin whitepaper appeared in October 2008, at the height of the financial crisis. Banks were failing. Governments were bailing them out with money created from nothing. The trusted intermediaries that the entire financial system depended on were revealed to be fragile, captured, and often corrupt.</p>

          <p>Satoshi embedded a message in the first Bitcoin block: "The Times 03/Jan/2009 Chancellor on brink of second bailout for banks."</p>

          <p>The timing wasn't random. Bitcoin wasn't just a technical solution to the double-spend problem. It was a response to a system that had failed—a system where trusted third parties turned out to be neither trustworthy nor, in a crisis, particularly third-party.</p>

          <p>The problem Bitcoin solves isn't just technical. It's institutional. And that's why, fifteen years later, people are still arguing about it.</p>

          <div className="lesson-summary">
            <h3 className="summary-title">Lesson Summary</h3>
            <ul className="summary-list">
              <li>Digital information can be copied infinitely, which makes digital money hard</li>
              <li>The "double-spend problem" asks: how do you prevent spending the same digital money twice?</li>
              <li>Traditional solution: trusted intermediaries who maintain the ledger (banks, PayPal, Venmo)</li>
              <li>This works but requires permission, surveillance, and trust that often fails</li>
              <li>Bitcoin's solution: distributed consensus through mathematical proof of work</li>
              <li>The breakthrough: genuine digital scarcity without trusting any central authority</li>
            </ul>
          </div>
        </article>

        <nav className="lesson-navigation">
          <Link href="/learn/boarding-pass/what-is-bitcoin-actually" className="nav-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Lesson 1
          </Link>
          <Link href="/learn/boarding-pass/21-million-the-number-that-changes-everything" className="nav-btn primary">
            Lesson 3
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
