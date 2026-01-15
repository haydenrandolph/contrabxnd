'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';

export default function BoardingPassLesson03() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isLightMode, toggleTheme } = useTheme();

  useEffect(() => {
    document.title = '21 Million: The Number That Changes Everything | Contraband';
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
          width: 14.28%; /* 3/21 lessons */
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

        .stat-highlight {
          background: #141414;
          border: 1px solid #3a3a3a;
          padding: 1.5rem;
          margin: 2rem 0;
          text-align: center;
        }

        .lesson-page.light-mode .stat-highlight {
          background: #f5f3f0;
          border-color: #d8d4cc;
        }

        .stat-number {
          font-family: 'Space Mono', monospace;
          font-size: 2rem;
          font-weight: 700;
          color: #F7931A;
          display: block;
          margin-bottom: 0.5rem;
        }

        .stat-label {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1rem;
          color: #8a8a8a;
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
            <span className="breadcrumb-current">Lesson 3</span>
          </div>
          <div className="lesson-meta">
            <span className="lesson-number">Lesson 03 of 21</span>
            <span className="lesson-week">Week 1</span>
            <span className="lesson-duration">14 min read</span>
          </div>
          <h1 className="lesson-title">21 Million: The Number That Changes Everything</h1>
          <p className="lesson-subtitle">Why Bitcoin's fixed supply is its superpower.</p>
        </header>

        <article className="lesson-content">
          <p>There will only ever be 21 million bitcoin. Not 21 million and one. Not "probably around 21 million." Exactly 21 million, and not a single satoshi more. This isn't a policy decision that could change. It isn't a promise from a CEO or a government. It's math. And it changes everything.</p>

          <div className="stat-highlight">
            <span className="stat-number">21,000,000</span>
            <span className="stat-label">Total Bitcoin That Will Ever Exist</span>
          </div>

          <p>To understand why this matters, you need to understand what it means for something to be truly scarce—and why most things you think are scarce really aren't.</p>

          <h3>The Illusion of Scarcity</h3>

          <p>We're told many things are scarce. Gold. Real estate. Fine art. Limited edition sneakers. But are they really?</p>

          <p><strong>Gold</strong> has a fixed supply... on Earth. But more is mined every year (about 2% of existing supply). And if we ever figure out asteroid mining, there's more gold floating in space than has ever been extracted from our planet.</p>

          <p><strong>Real estate</strong> is "limited"—they're not making more land, as the saying goes. Except we build up, reclaim from the sea, and develop previously uninhabitable areas constantly.</p>

          <p><strong>Limited editions</strong> are only limited until the company decides to release another edition. Just ask anyone who bought a "rare" digital collectible before the creators minted 10,000 more.</p>

          <p>Most scarcity is artificial. It exists because someone with authority says so, and it persists only as long as that authority keeps its word. The moment incentives change, the scarcity evaporates.</p>

          <div className="key-concept">
            <p className="key-concept-label">Key Insight</p>
            <p className="key-concept-text">Artificial scarcity can always be reversed. Bitcoin's scarcity cannot.</p>
          </div>

          <h3>How Bitcoin's Supply Works</h3>

          <p>Bitcoin's supply follows a fixed, predictable schedule that was set at the very beginning and cannot be changed:</p>

          <ul>
            <li>New bitcoin are created as rewards for "miners" who process transactions</li>
            <li>Initially, the reward was 50 bitcoin per block (roughly every 10 minutes)</li>
            <li>Every 210,000 blocks (about 4 years), the reward cuts in half</li>
            <li>This continues until the reward becomes zero, around the year 2140</li>
            <li>At that point, exactly 21 million bitcoin will exist</li>
          </ul>

          <p>This schedule is called the "halving" and it's written into the code that every Bitcoin node runs. Change it, and you're not running Bitcoin anymore—you're running something else that no one else will recognize.</p>

          <div className="illustration">
            <span className="illustration-label">Illustration</span>
            <span className="illustration-title">Bitcoin Supply Curve: Issuance Over Time</span>
          </div>

          <h3>The Halvings</h3>

          <p>The halving events are milestones in Bitcoin's history. As of 2024, about 19.5 million bitcoin have already been created—over 93% of all the bitcoin that will ever exist. The remaining 1.5 million will trickle out over the next 116 years.</p>

          <h3>Why Can't They Just Change It?</h3>

          <p>This is the question everyone asks. If Bitcoin is just software, can't someone just... update it?</p>

          <p>Technically, yes. Anyone can modify the Bitcoin code to allow more than 21 million coins. But here's the thing: that modified code wouldn't be Bitcoin. It would be a fork—a separate network that the rest of the world would ignore.</p>

          <p>For a change to become "real" Bitcoin, it would need to be accepted by:</p>

          <ul>
            <li>The majority of nodes (computers running Bitcoin software)</li>
            <li>The majority of miners (who process transactions)</li>
            <li>The majority of businesses (who accept Bitcoin)</li>
            <li>The majority of users (who hold and spend Bitcoin)</li>
          </ul>

          <p>Every single one of these groups has a massive incentive to reject any change that would devalue their existing bitcoin. It's like asking everyone who owns dollars to vote on whether to devalue their savings. The answer will always be no.</p>

          <div className="key-concept">
            <p className="key-concept-label">The Nuclear Option</p>
            <p className="key-concept-text">If someone tried to change the 21 million cap, the network would simply split. History shows which chain would retain value: the one that keeps its promises.</p>
          </div>

          <h3>Sound Money vs. Unsound Money</h3>

          <p>Economists talk about "sound money"—money that holds its value over time because its supply can't be arbitrarily increased. For most of human history, gold served this function. It's hard to mine, impossible to create from nothing, and its supply increases slowly and predictably.</p>

          <p>But even gold isn't perfectly sound. Governments debased gold coins by mixing in cheaper metals. Paper currencies "backed" by gold were eventually unpegged when governments wanted to print more. And gold's supply still increases by about 2% per year.</p>

          <p>Bitcoin is harder money than gold. Its supply increase is slower, more predictable, and absolutely capped. There's a term for this: Bitcoin is "ultra-sound money."</p>

          <div className="key-concept">
            <p className="key-concept-label">Compare</p>
            <p className="key-concept-text">Gold: ~2% annual supply increase, forever. Bitcoin: Decreasing supply increase, then zero.</p>
          </div>

          <h3>What About Dollars?</h3>

          <p>The US dollar has no supply cap. None. Zero. The Federal Reserve can create as many dollars as it wants, whenever it wants, for whatever reason it decides is important enough.</p>

          <p>And they do. In 2020 alone, roughly 40% of all dollars in existence were created. Not over decades—in a single year. If you held dollars, each one became worth less because there were suddenly a lot more of them chasing the same amount of goods.</p>

          <p>This is called inflation, and it's not a bug—it's a feature of the current system. Central banks target about 2% inflation per year. That might sound small, but it compounds:</p>

          <ul>
            <li>At 2% inflation, your money loses half its value in 35 years</li>
            <li>At 3% inflation (common in many countries), it loses half in 23 years</li>
            <li>At 7% inflation (the US rate in 2022), it loses half in 10 years</li>
          </ul>

          <p>This is the hidden tax that no one votes for. Your savings erode while the numbers in your account stay the same.</p>

          <h3>Thinking in Satoshis</h3>

          <p>A common objection: "21 million isn't enough for a global currency. How can everyone use it?"</p>

          <p>The answer: divisibility. Each bitcoin can be divided into 100 million units called "satoshis" (or "sats"). That means there are actually:</p>

          <div className="stat-highlight">
            <span className="stat-number">2.1 Quadrillion</span>
            <span className="stat-label">Total Satoshis That Will Ever Exist</span>
          </div>

          <p>That's 2,100,000,000,000,000 sats. Plenty for every human on Earth to own millions. The "21 million" limit isn't about how many units exist—it's about ensuring those units can't be multiplied.</p>

          <h3>The Game Theory</h3>

          <p>Here's the beautiful part: the 21 million cap creates a powerful feedback loop.</p>

          <p>Because supply is fixed, any increase in demand must be reflected in price. As price rises, more people become interested. As more people become interested, demand increases. As demand increases, price rises.</p>

          <p>This loop is what critics call a "bubble" and what proponents call "monetization"—the process of a new form of money being discovered and adopted. Either way, the fixed supply is what makes it possible. Without the cap, increased demand would just mean more coins being printed, which would satisfy demand without increasing price, which would remove the incentive to hold.</p>

          <p>The 21 million cap turns Bitcoin into a one-way door. Once you understand it, you can't unsee it.</p>

          <div className="lesson-summary">
            <h3 className="summary-title">Lesson Summary</h3>
            <ul className="summary-list">
              <li>Exactly 21 million bitcoin will ever exist—this is enforced by code, not promises</li>
              <li>New bitcoin are created through mining, with rewards halving every ~4 years</li>
              <li>Over 93% of all bitcoin have already been created</li>
              <li>Changing the cap would require consensus from nodes, miners, businesses, and users—all of whom have incentives to refuse</li>
              <li>Bitcoin is "ultra-sound money"—harder than gold, with a supply that eventually stops growing entirely</li>
              <li>Each bitcoin divides into 100 million satoshis, providing more than enough units for global use</li>
            </ul>
          </div>
        </article>

        <nav className="lesson-navigation">
          <Link href="/learn/boarding-pass/the-problem-bitcoin-solves" className="nav-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Lesson 2
          </Link>
          <Link href="/learn/boarding-pass/how-the-network-works" className="nav-btn primary">
            Lesson 4
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
