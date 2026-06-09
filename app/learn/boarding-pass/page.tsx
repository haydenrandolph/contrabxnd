'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { COURSE, WEEKS } from '@/lib/lessons';

export default function BoardingPassCoursePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isLightMode, toggleTheme } = useTheme();

  const outcomes = COURSE.outcomes;
  const weeks = WEEKS;

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

        .course-page {
          background: #0a0a0a;
          color: #e8e4dc;
          font-family: 'Space Mono', monospace;
          font-size: 14px;
          line-height: 1.7;
          overflow-x: hidden;
          min-height: 100vh;
          -webkit-font-smoothing: antialiased;
        }

        .course-page.light-mode {
          background: #e8e4dc;
          color: #0a0a0a;
        }

        .course-page::before {
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

        .course-nav {
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

        .course-page.light-mode .course-nav {
          background: linear-gradient(to bottom, #e8e4dc 0%, transparent 100%);
        }

        .course-logo-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
          color: #f5f3f0;
        }

        .course-page.light-mode .course-logo-link {
          color: #0a0a0a;
        }

        .course-logo-text {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
        }

        .course-nav-links {
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

        .course-page.light-mode .mobile-back-btn {
          color: #5a5a5a;
        }

        .course-page.light-mode .mobile-back-btn:active {
          color: #F7931A;
        }

        .course-nav-links a {
          color: #f5f3f0;
          text-decoration: none;
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          position: relative;
          padding: 0.25rem 0;
        }

        .course-page.light-mode .course-nav-links a {
          color: #0a0a0a;
        }

        .course-nav-links a::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 1px;
          background: #F7931A;
          transition: width 0.3s ease;
        }

        .course-nav-links a:hover::after,
        .course-nav-links a.active::after {
          width: 100%;
        }

        .course-nav-links a.coming-soon {
          text-decoration: line-through;
          opacity: 0.5;
          cursor: not-allowed;
        }

        .course-nav-links a.coming-soon:hover::after {
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

        .course-page.light-mode .mobile-menu-btn span {
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

        .course-page.light-mode .mobile-menu-overlay {
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

        .course-page.light-mode .mobile-menu-nav a {
          color: #0a0a0a;
        }

        .mobile-menu-nav a:active {
          color: #F7931A;
        }

        .mobile-menu-nav a.coming-soon {
          text-decoration: line-through;
          opacity: 0.5;
        }

        .course-theme-toggle {
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

        .course-theme-toggle:hover {
          background: #F7931A;
          border-color: #F7931A;
          transform: scale(1.1);
        }

        .course-theme-toggle svg {
          width: 24px;
          height: 24px;
          stroke: #e8e4dc;
        }

        .course-page.light-mode .course-theme-toggle {
          background: #f5f3f0;
          border-color: #c8c4bc;
        }

        .course-page.light-mode .course-theme-toggle svg {
          stroke: #070713;
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
          color: #8a8a8a;
          text-decoration: none;
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          margin-bottom: 3rem;
          transition: color 0.3s ease;
        }

        .course-back:hover {
          color: #F7931A;
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
          color: #F7931A;
          margin-bottom: 1.5rem;
        }

        .course-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(2.5rem, 6vw, 4rem);
          font-weight: 400;
          line-height: 1.15;
          margin-bottom: 1rem;
        }

        .course-page.light-mode .course-title {
          color: #0a0a0a;
        }

        .course-tagline {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.5rem;
          font-style: italic;
          color: #d4854c;
          margin-bottom: 2rem;
        }

        .course-description {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.2rem;
          color: #8a8a8a;
          line-height: 1.8;
          margin-bottom: 3rem;
        }

        .course-meta-bar {
          display: flex;
          gap: 3rem;
          padding: 1.5rem 0;
          border-top: 1px solid #1a1a1a;
          border-bottom: 1px solid #1a1a1a;
        }

        .course-page.light-mode .course-meta-bar {
          border-top-color: #d8d4cc;
          border-bottom-color: #d8d4cc;
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

        .course-page.light-mode .meta-label {
          color: #8a8a8a;
        }

        .meta-value {
          font-size: 14px;
          color: #e8e4dc;
        }

        .course-page.light-mode .meta-value {
          color: #0a0a0a;
        }

        .outcomes-section {
          padding: 4rem 3rem;
          max-width: 900px;
          margin: 0 auto;
        }

        .section-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.75rem;
          font-weight: 400;
          margin-bottom: 2rem;
        }

        .course-page.light-mode .section-title {
          color: #0a0a0a;
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
          color: #F7931A;
          font-size: 1.25rem;
          line-height: 1;
          margin-top: 0.2rem;
        }

        .outcome-text {
          font-size: 14px;
          color: #e8e4dc;
          line-height: 1.6;
        }

        .course-page.light-mode .outcome-text {
          color: #0a0a0a;
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
          color: #8a8a8a;
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
          border-bottom: 1px solid #1a1a1a;
        }

        .course-page.light-mode .week-header {
          border-bottom-color: #d8d4cc;
        }

        .week-number {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.5rem;
          color: #F7931A;
        }

        .week-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.25rem;
          font-weight: 400;
        }

        .course-page.light-mode .week-title {
          color: #0a0a0a;
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
          border-bottom: 1px solid #1a1a1a;
          text-decoration: none;
          color: inherit;
          transition: all 0.3s ease;
        }

        .course-page.light-mode .lesson-item {
          border-bottom-color: #d8d4cc;
        }

        .lesson-item:hover {
          padding-left: 1rem;
          background: #141414;
          margin: 0 -1rem;
          padding-right: 1rem;
        }

        .course-page.light-mode .lesson-item:hover {
          background: #f5f3f0;
        }

        .lesson-item:last-child {
          border-bottom: none;
        }

        .lesson-number {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.5rem;
          color: #3a3a3a;
        }

        .course-page.light-mode .lesson-number {
          color: #c8c4bc;
        }

        .lesson-content h4 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.1rem;
          font-weight: 400;
          margin-bottom: 0.25rem;
        }

        .course-page.light-mode .lesson-content h4 {
          color: #0a0a0a;
        }

        .lesson-content p {
          font-size: 12px;
          color: #8a8a8a;
        }

        .course-page.light-mode .lesson-content p {
          color: #5a5a5a;
        }

        .lesson-duration {
          font-size: 11px;
          color: #3a3a3a;
        }

        .course-page.light-mode .lesson-duration {
          color: #8a8a8a;
        }

        .start-section {
          padding: 4rem 3rem;
          background: #141414;
          border-top: 1px solid #1a1a1a;
        }

        .course-page.light-mode .start-section {
          background: #f5f3f0;
          border-top-color: #d8d4cc;
        }

        .start-inner {
          max-width: 600px;
          margin: 0 auto;
          text-align: center;
        }

        .start-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2rem;
          font-weight: 400;
          margin-bottom: 1rem;
        }

        .course-page.light-mode .start-title {
          color: #0a0a0a;
        }

        .start-text {
          color: #8a8a8a;
          margin-bottom: 2rem;
        }

        .course-page.light-mode .start-text {
          color: #5a5a5a;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1.25rem 2.5rem;
          background: #F7931A;
          border: 1px solid #F7931A;
          color: #f5f3f0;
          font-family: 'Space Mono', monospace;
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

        .course-footer {
          padding: 4rem 3rem;
          border-top: 1px solid #1a1a1a;
          max-width: 1400px;
          margin: 0 auto;
        }

        .course-page.light-mode .course-footer {
          border-top-color: #d8d4cc;
        }

        .course-footer-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .course-footer-left {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .course-footer-copy {
          font-size: 12px;
          color: #8a8a8a;
        }

        .course-footer-links {
          display: flex;
          gap: 2rem;
        }

        .course-footer-links a {
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #8a8a8a;
          text-decoration: none;
          transition: color 0.3s ease;
        }

        .course-footer-links a:hover {
          color: #F7931A;
        }

        @media (max-width: 768px) {
          .course-nav {
            padding: calc(0.75rem + var(--safe-top)) 1rem 0.75rem;
            background: #0a0a0a;
            border-bottom: 1px solid #1a1a1a;
          }

          .course-page.light-mode .course-nav {
            background: #e8e4dc;
            border-bottom-color: #d8d4cc;
          }

          .course-logo-link {
            gap: 0.5rem;
          }

          .course-logo-text {
            font-size: 10px;
            letter-spacing: 0.2em;
          }

          .course-nav-links {
            display: none;
          }

          .mobile-back-btn {
            display: flex;
          }

          .mobile-menu-btn {
            display: flex;
          }

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
            color: #F7931A;
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
            background: #1a1a1a;
            border: 1px solid #1a1a1a;
            padding: 0;
            margin: 0 0 1.5rem 0;
          }

          .course-page.light-mode .course-meta-bar {
            background: #d8d4cc;
            border-color: #d8d4cc;
          }

          .meta-item {
            background: #141414;
            padding: 1rem;
            text-align: center;
          }

          .course-page.light-mode .meta-item {
            background: #f5f3f0;
          }

          .meta-value {
            font-family: 'Cormorant Garamond', serif;
            font-size: 1.25rem;
            display: block;
            margin-bottom: 0.25rem;
          }

          .meta-label {
            font-size: 9px;
          }

          .outcomes-section {
            padding: 2rem 1.25rem;
            background: #141414;
            border-top: 1px solid #1a1a1a;
            border-bottom: 1px solid #1a1a1a;
          }

          .course-page.light-mode .outcomes-section {
            background: #f5f3f0;
            border-top-color: #d8d4cc;
            border-bottom-color: #d8d4cc;
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
            background: #141414;
            border-top: 1px solid #1a1a1a;
            border-bottom: 1px solid #1a1a1a;
            margin-bottom: 0;
            cursor: pointer;
          }

          .course-page.light-mode .week-header {
            background: #f5f3f0;
            border-top-color: #d8d4cc;
            border-bottom-color: #d8d4cc;
          }

          .week-header:active {
            background: #1a1a1a;
          }

          .course-page.light-mode .week-header:active {
            background: #e8e4dc;
          }

          .week-number {
            font-size: 1.1rem;
          }

          .week-title {
            font-size: 1rem;
          }

          .lessons-list {
            background: #0a0a0a;
          }

          .course-page.light-mode .lessons-list {
            background: #e8e4dc;
          }

          .lesson-item {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1rem 1.25rem;
            grid-template-columns: none;
          }

          .lesson-item:hover {
            padding-left: 1rem;
            padding-right: 1.25rem;
            margin: 0;
            background: transparent;
          }

          .lesson-item:active {
            background: #141414;
          }

          .course-page.light-mode .lesson-item:active {
            background: #f5f3f0;
          }

          .lesson-number {
            width: 32px;
            height: 32px;
            border: 1px solid #3a3a3a;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-family: 'Space Mono', monospace;
            flex-shrink: 0;
          }

          .course-page.light-mode .lesson-number {
            border-color: #c8c4bc;
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
            background: #d4854c;
            border-color: #d4854c;
          }

          .btn-primary svg {
            width: 18px;
            height: 18px;
          }

          .course-footer {
            padding: 2rem 1.25rem calc(2rem + var(--safe-bottom));
          }

          .course-footer-content {
            flex-direction: column;
            gap: 1.5rem;
            text-align: center;
          }

          .course-footer-left {
            flex-direction: column;
            gap: 1rem;
          }

          .course-footer-copy {
            font-size: 11px;
          }

          .course-footer-links {
            flex-wrap: wrap;
            justify-content: center;
            gap: 1.5rem;
          }

          .course-footer-links a {
            font-size: 10px;
          }

          .course-footer-links a:active {
            color: #F7931A;
          }

          .course-theme-toggle {
            bottom: calc(1.5rem + var(--safe-bottom));
            right: 1rem;
            width: 44px;
            height: 44px;
          }

          .course-theme-toggle:active {
            background: #F7931A;
            border-color: #F7931A;
          }
        }
      `}</style>

      <div className={`course-page ${isLightMode ? 'light-mode' : ''}`}>
        <button
          className="course-theme-toggle"
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

        <nav className="course-nav">
          <Link href="/learn" className="mobile-back-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Courses
          </Link>
          <Link href="/" className="course-logo-link">
            <Image
              src="/contraband-logo-v3.png"
              alt="Contraband logo"
              width={40}
              height={40}
            />
            <span className="course-logo-text">Contra₿and</span>
          </Link>
          <div className="course-nav-links">
            <Link href="/learn" className="active">Stu₿y</Link>
            <Link href="/writings">Writings</Link>
            <a className="coming-soon" aria-disabled="true" aria-label="Podcasts — coming soon">Podcasts</a>
            <a className="coming-soon" aria-disabled="true" aria-label="Videos — coming soon">Videos</a>
            <a className="coming-soon" aria-disabled="true" aria-label="Merch — coming soon">Merch</a>
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
            <a className="coming-soon" aria-disabled="true" aria-label="Podcasts — coming soon">Podcasts</a>
            <a className="coming-soon" aria-disabled="true" aria-label="Videos — coming soon">Videos</a>
            <a className="coming-soon" aria-disabled="true" aria-label="Merch — coming soon">Merch</a>
            <Link href="/about" onClick={() => setMenuOpen(false)}>About</Link>
            <Link href="/" onClick={() => setMenuOpen(false)}>Hank C. Moody</Link>
          </nav>
        </div>

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
                  <Link key={lessonIndex} href={`/learn/boarding-pass/${lesson.slug}`} className="lesson-item">
                    <span className="lesson-number">{lesson.number}</span>
                    <div className="lesson-content">
                      <h4>{lesson.title}</h4>
                      <p>{lesson.description}</p>
                    </div>
                    <span className="lesson-duration">{lesson.duration}</span>
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

        <footer className="course-footer">
          <div className="course-footer-content">
            <div className="course-footer-left">
              <Image
                src="/contraband-logo-v3.png"
                alt="Contraband logo"
                width={32}
                height={32}
              />
              <span className="course-footer-copy">© 2025 Contraband. All rights reserved.</span>
            </div>
            <div className="course-footer-links">
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
