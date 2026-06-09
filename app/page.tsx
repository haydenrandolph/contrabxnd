'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import ThemeToggle from '@/components/ThemeToggle';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
} from '@vnedyalk0v/react19-simple-maps';
import worldAtlas from 'world-atlas/countries-110m.json';

// Bitcoin hub cities for the hero map
const HERO_NODES = [
  { id: 1, coordinates: [-74.01, 40.71] as [number, number], major: true },
  { id: 2, coordinates: [-122.42, 37.77] as [number, number], major: true },
  { id: 3, coordinates: [-0.13, 51.51] as [number, number], major: true },
  { id: 4, coordinates: [139.69, 35.68] as [number, number], major: true },
  { id: 5, coordinates: [103.82, 1.35] as [number, number], major: true },
  { id: 6, coordinates: [151.21, -33.87] as [number, number], major: false },
  { id: 7, coordinates: [8.68, 50.11] as [number, number], major: false },
  { id: 8, coordinates: [-46.63, -23.55] as [number, number], major: false },
  { id: 9, coordinates: [55.27, 25.20] as [number, number], major: false },
  { id: 10, coordinates: [114.17, 22.32] as [number, number], major: false },
];

interface HeroArc {
  id: string;
  from: [number, number];
  to: [number, number];
  type: 'normal' | 'large' | 'whale';
}

export default function HomePage() {
  const [email, setEmail] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [subscribeMessage, setSubscribeMessage] = useState('');
  const [heroArcs, setHeroArcs] = useState<HeroArc[]>([]);
  const [heroView, setHeroView] = useState<'map' | 'chart'>('map');
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const { isLightMode } = useTheme();

  // Generate random transaction arcs for the hero map
  const createHeroArc = useCallback(() => {
    const fromIndex = Math.floor(Math.random() * HERO_NODES.length);
    let toIndex = Math.floor(Math.random() * HERO_NODES.length);
    while (toIndex === fromIndex) {
      toIndex = Math.floor(Math.random() * HERO_NODES.length);
    }

    const types: Array<'normal' | 'large' | 'whale'> = ['normal', 'normal', 'normal', 'large', 'whale'];
    const type = types[Math.floor(Math.random() * types.length)];

    const arc: HeroArc = {
      id: `arc-${Date.now()}-${Math.random()}`,
      from: HERO_NODES[fromIndex].coordinates,
      to: HERO_NODES[toIndex].coordinates,
      type,
    };

    setHeroArcs(prev => [...prev.slice(-8), arc]);

    // Remove arc after animation
    setTimeout(() => {
      setHeroArcs(prev => prev.filter(a => a.id !== arc.id));
    }, 2500);
  }, []);

  // Animate arcs on the hero map
  useEffect(() => {
    // Create initial arcs
    createHeroArc();
    setTimeout(createHeroArc, 400);
    setTimeout(createHeroArc, 800);

    // Continue creating arcs
    const interval = setInterval(() => {
      createHeroArc();
    }, 1200);

    return () => clearInterval(interval);
  }, [createHeroArc]);

  useEffect(() => {
    if (heroView !== 'chart' || !chartContainerRef.current) return;
    const container = chartContainerRef.current;
    container.innerHTML = '';
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: 'BITSTAMP:BTCUSD',
      interval: 'D',
      timezone: 'Etc/UTC',
      theme: isLightMode ? 'light' : 'dark',
      style: '1',
      locale: 'en',
      backgroundColor: isLightMode ? '#f5f3f0' : '#0a0a0a',
      gridColor: isLightMode ? '#e0dcd4' : '#1a1a1a',
      hide_top_toolbar: true,
      hide_legend: true,
      allow_symbol_change: false,
      save_image: false,
      calendar: false,
      support_host: 'https://www.tradingview.com',
    });
    container.appendChild(script);
  }, [heroView, isLightMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (subscribeStatus === 'loading') return;

    setSubscribeStatus('loading');
    setSubscribeMessage('');

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setSubscribeStatus('error');
        setSubscribeMessage(data.error || 'Something went wrong. Please try again.');
        return;
      }

      setSubscribeStatus('success');
      setSubscribeMessage("You're on the list. Welcome aboard.");
      setEmail('');
    } catch {
      setSubscribeStatus('error');
      setSubscribeMessage('Network error. Please try again.');
    }
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Space+Mono:wght@400;700&display=swap');

        :root {
          --contraband-black: #0a0a0a;
          --contraband-off-black: #141414;
          --contraband-dark-gray: #1a1a1a;
          --contraband-mid-gray: #3a3a3a;
          --contraband-light-gray: #8a8a8a;
          --contraband-cream: #e8e4dc;
          --contraband-rust: #F7931A;
          --contraband-rust-light: #ff6600;
          --contraband-white: #f5f3f0;
          --contraband-font-display: 'Cormorant Garamond', serif;
          --contraband-font-mono: 'Space Mono', monospace;
        }

        .contraband-page {
          background: var(--contraband-black);
          color: var(--contraband-cream);
          font-family: var(--contraband-font-mono);
          font-size: 14px;
          line-height: 1.7;
          overflow-x: hidden;
          min-height: 100vh;
          transition: background 0.3s ease, color 0.3s ease;
        }

        .contraband-page.light-mode {
          background: var(--contraband-cream);
          color: var(--contraband-black);
        }

        .contraband-page.light-mode .contraband-content-card {
          background: var(--contraband-white);
          border-color: #d0ccc4;
        }

        .contraband-page.light-mode .contraband-featured-content {
          background: var(--contraband-white);
        }

        .contraband-page.light-mode .contraband-featured-image::after {
          background: linear-gradient(45deg, var(--contraband-rust) 0%, var(--contraband-cream) 100%);
        }

        .contraband-page.light-mode .contraband-subscribe-section {
          background: var(--contraband-white);
          border-color: #d0ccc4;
        }

        .contraband-page.light-mode .contraband-subscribe-form input {
          background: var(--contraband-cream);
          border-color: #d0ccc4;
          color: var(--contraband-black);
        }

        .contraband-page.light-mode .contraband-subscribe-form input::placeholder {
          color: var(--contraband-mid-gray);
        }

        .contraband-page.light-mode .contraband-section-header {
          border-color: #d0ccc4;
        }

        .contraband-page::before {
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

        .contraband-hero {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          position: relative;
          padding: 7rem 3rem 3rem;
        }

        .contraband-hero-symbol {
          width: 180px;
          height: 180px;
          margin-bottom: 3rem;
          opacity: 0;
          animation: fadeUp 1s ease 0.3s forwards;
          object-fit: contain;
        }

        .hero-map-container {
          position: relative;
          width: 100%;
          max-width: 900px;
          aspect-ratio: 16/8;
          margin-bottom: 2rem;
          cursor: pointer;
          opacity: 0;
          animation: fadeUp 1s ease 0.2s forwards;
          border-radius: 8px;
          overflow: hidden;
          background: radial-gradient(ellipse at center, rgba(181, 103, 58, 0.05) 0%, transparent 70%);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .hero-map-container:hover {
          transform: scale(1.02);
          box-shadow: 0 0 40px rgba(247, 147, 26, 0.15);
        }

        .contraband-page.light-mode .hero-map-container {
          background: radial-gradient(ellipse at center, rgba(181, 103, 58, 0.08) 0%, transparent 70%);
          box-shadow: 0 2px 20px rgba(0, 0, 0, 0.06);
        }

        .hero-map-container svg {
          position: absolute;
          inset: 0;
          z-index: 1;
        }

        .hero-map-node {
          filter: drop-shadow(0 0 4px rgba(247, 147, 26, 0.5));
          animation: heroNodePulse 3s ease-in-out infinite;
        }

        .hero-map-node.major {
          filter: drop-shadow(0 0 8px rgba(247, 147, 26, 0.7));
        }

        @keyframes heroNodePulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        .hero-sonar-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          z-index: 2;
          opacity: 0.6;
        }

        .hero-sonar-rings {
          position: absolute;
          width: 80%;
          height: 80%;
          border-radius: 50%;
        }

        .hero-sonar-ring {
          position: absolute;
          inset: 0;
          border: 1px solid rgba(181, 103, 58, 0.15);
          border-radius: 50%;
          animation: heroSonarPulse 4s ease-out infinite;
        }

        .contraband-page.light-mode .hero-sonar-ring {
          border-color: rgba(181, 103, 58, 0.25);
        }

        .contraband-page.light-mode .hero-radar-sweep {
          background: conic-gradient(
            from 0deg,
            transparent 0deg,
            rgba(181, 103, 58, 0.18) 30deg,
            transparent 60deg
          );
        }

        .hero-sonar-ring:nth-child(2) { animation-delay: 1s; }
        .hero-sonar-ring:nth-child(3) { animation-delay: 2s; }
        .hero-sonar-ring:nth-child(4) { animation-delay: 3s; }

        @keyframes heroSonarPulse {
          0% { transform: scale(0.3); opacity: 0.5; }
          100% { transform: scale(1); opacity: 0; }
        }

        .hero-radar-sweep {
          position: absolute;
          width: 80%;
          height: 80%;
          background: conic-gradient(
            from 0deg,
            transparent 0deg,
            rgba(181, 103, 58, 0.12) 30deg,
            transparent 60deg
          );
          border-radius: 50%;
          animation: heroRadarSweep 6s linear infinite;
        }

        @keyframes heroRadarSweep {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .hero-map-cta {
          position: absolute;
          bottom: 1rem;
          right: 1rem;
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--contraband-rust);
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: 10;
        }

        .hero-map-container:hover .hero-map-cta {
          opacity: 1;
        }

        /* Transaction arc styles */
        .hero-tx-arc {
          fill: none;
          stroke-linecap: round;
          animation: heroArcPulse 2.5s ease-out forwards;
        }

        .hero-tx-arc.normal {
          stroke: #22c55e;
          stroke-width: 1.5;
          filter: drop-shadow(0 0 4px rgba(34, 197, 94, 0.6));
        }

        .hero-tx-arc.large {
          stroke: #f59e0b;
          stroke-width: 2;
          filter: drop-shadow(0 0 6px rgba(245, 158, 11, 0.6));
        }

        .hero-tx-arc.whale {
          stroke: #a855f7;
          stroke-width: 2.5;
          filter: drop-shadow(0 0 10px rgba(168, 85, 247, 0.8));
        }

        @keyframes heroArcPulse {
          0% {
            stroke-dashoffset: 1000;
            opacity: 0.8;
          }
          60% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
          100% {
            stroke-dashoffset: 0;
            opacity: 0;
          }
        }

        .hero-arc-endpoint {
          animation: heroEndpointPulse 2.5s ease-out forwards;
        }

        .hero-arc-endpoint.normal { fill: #22c55e; }
        .hero-arc-endpoint.large { fill: #f59e0b; }
        .hero-arc-endpoint.whale { fill: #a855f7; }

        @keyframes heroEndpointPulse {
          0% { r: 0; opacity: 0; }
          20% { r: 5; opacity: 1; }
          60% { r: 5; opacity: 1; }
          100% { r: 7; opacity: 0; }
        }

        .contraband-hero-title {
          font-family: var(--contraband-font-display);
          font-size: clamp(3rem, 10vw, 8rem);
          font-weight: 400;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          text-align: center;
          opacity: 0;
          animation: fadeUp 1s ease 0.5s forwards;
        }

        .contraband-hero-subtitle {
          font-size: 12px;
          letter-spacing: 0.4em;
          text-transform: uppercase;
          color: var(--contraband-rust);
          margin-top: 1.5rem;
          text-align: center;
          opacity: 0;
          animation: fadeUp 1s ease 0.9s forwards;
        }

        .contraband-hero-tagline {
          font-family: var(--contraband-font-display);
          font-size: clamp(1.1rem, 2vw, 1.4rem);
          font-style: italic;
          color: var(--contraband-cream);
          margin-top: 2rem;
          opacity: 0;
          animation: fadeUp 1s ease 0.7s forwards;
        }

        .contraband-scroll-indicator {
          position: absolute;
          bottom: 3rem;
          left: 0;
          right: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          opacity: 0;
          animation: fadeUp 1s ease 1.2s forwards;
        }

        .contraband-scroll-indicator span {
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--contraband-light-gray);
        }

        .contraband-scroll-line {
          width: 1px;
          height: 40px;
          background: linear-gradient(to bottom, var(--contraband-rust), transparent);
          animation: scrollPulse 2s ease infinite;
        }

        @keyframes scrollPulse {
          0%, 100% { transform: scaleY(1); opacity: 1; }
          50% { transform: scaleY(0.6); opacity: 0.5; }
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .contraband-section {
          padding: 8rem 3rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .contraband-section-header {
          display: flex;
          align-items: baseline;
          gap: 2rem;
          margin-bottom: 4rem;
          border-bottom: 1px solid var(--contraband-mid-gray);
          padding-bottom: 1.5rem;
        }

        .contraband-section-number {
          font-family: var(--contraband-font-display);
          font-size: 3rem;
          color: var(--contraband-rust);
          line-height: 1;
        }

        .contraband-section-title {
          font-family: var(--contraband-font-display);
          font-size: 2.5rem;
          font-weight: 400;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .contraband-content-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 2rem;
        }

        .contraband-content-card {
          background: var(--contraband-off-black);
          border: 1px solid var(--contraband-dark-gray);
          padding: 2.5rem;
          position: relative;
          transition: all 0.4s ease;
          cursor: pointer;
        }

        .contraband-content-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, var(--contraband-rust) 0%, transparent 50%);
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        .contraband-content-card:hover {
          border-color: var(--contraband-rust);
          transform: translateY(-4px);
        }

        .contraband-content-card:hover::before {
          opacity: 0.05;
        }

        .contraband-card-type {
          font-size: 10px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: var(--contraband-rust);
          margin-bottom: 1rem;
          position: relative;
          z-index: 1;
        }

        .contraband-card-title {
          font-family: var(--contraband-font-display);
          font-size: 1.6rem;
          font-weight: 400;
          line-height: 1.3;
          margin-bottom: 1rem;
          position: relative;
          z-index: 1;
        }

        .contraband-card-excerpt {
          color: var(--contraband-light-gray);
          font-size: 13px;
          line-height: 1.8;
          margin-bottom: 1.5rem;
          position: relative;
          z-index: 1;
        }

        .contraband-card-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          color: var(--contraband-light-gray);
          position: relative;
          z-index: 1;
        }

        .contraband-card-arrow {
          width: 24px;
          height: 24px;
          stroke: var(--contraband-rust);
          transition: transform 0.3s ease;
        }

        .contraband-content-card:hover .contraband-card-arrow {
          transform: translateX(4px);
        }

        .contraband-featured {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          margin-bottom: 4rem;
          border: 1px solid var(--contraband-mid-gray);
        }

        .contraband-featured-image {
          background: var(--contraband-dark-gray);
          min-height: 400px;
          position: relative;
          overflow: hidden;
        }

        .contraband-featured-image::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, var(--contraband-rust) 0%, var(--contraband-black) 100%);
          opacity: 0.3;
        }

        .contraband-featured-content {
          padding: 4rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: var(--contraband-off-black);
        }

        .contraband-featured-label {
          font-size: 10px;
          letter-spacing: 0.4em;
          text-transform: uppercase;
          color: var(--contraband-rust);
          margin-bottom: 1.5rem;
        }

        .contraband-featured-title {
          font-family: var(--contraband-font-display);
          font-size: 2.2rem;
          font-weight: 400;
          line-height: 1.3;
          margin-bottom: 1.5rem;
        }

        .contraband-featured-excerpt {
          color: var(--contraband-light-gray);
          font-size: 14px;
          line-height: 1.9;
          margin-bottom: 2rem;
        }

        .contraband-btn {
          display: inline-flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 2rem;
          background: transparent;
          border: 1px solid var(--contraband-cream);
          color: var(--contraband-cream);
          font-family: var(--contraband-font-mono);
          font-size: 11px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .contraband-btn:hover {
          background: var(--contraband-cream);
          color: var(--contraband-black);
        }

        .contraband-btn svg {
          width: 16px;
          height: 16px;
          transition: transform 0.3s ease;
        }

        .contraband-btn:hover svg {
          transform: translateX(4px);
        }

        .contraband-subscribe-section {
          background: var(--contraband-off-black);
          border: 1px solid var(--contraband-mid-gray);
          padding: 5rem;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .contraband-subscribe-section::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle at center, var(--contraband-rust) 0%, transparent 70%);
          opacity: 0.03;
        }

        .contraband-subscribe-title {
          font-family: var(--contraband-font-display);
          font-size: 2.5rem;
          font-weight: 400;
          margin-bottom: 1rem;
          position: relative;
        }

        .contraband-subscribe-text {
          color: var(--contraband-light-gray);
          margin-bottom: 2.5rem;
          max-width: 500px;
          margin-left: auto;
          margin-right: auto;
          position: relative;
        }

        .contraband-subscribe-form {
          display: flex;
          justify-content: center;
          gap: 0;
          max-width: 500px;
          margin: 0 auto;
          position: relative;
        }

        .contraband-subscribe-form input {
          flex: 1;
          padding: 1rem 1.5rem;
          background: var(--contraband-black);
          border: 1px solid var(--contraband-mid-gray);
          border-right: none;
          color: var(--contraband-cream);
          font-family: var(--contraband-font-mono);
          font-size: 13px;
        }

        .contraband-subscribe-form input::placeholder {
          color: var(--contraband-light-gray);
        }

        .contraband-subscribe-form input:focus {
          outline: none;
          border-color: var(--contraband-rust);
        }

        .contraband-subscribe-form button {
          padding: 1rem 2rem;
          background: var(--contraband-rust);
          border: 1px solid var(--contraband-rust);
          color: var(--contraband-white);
          font-family: var(--contraband-font-mono);
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .contraband-subscribe-form button:hover {
          background: var(--contraband-rust-light);
          border-color: var(--contraband-rust-light);
        }

        .hero-view-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
          opacity: 0;
          animation: fadeUp 1s ease 0.1s forwards;
          position: relative;
          z-index: 10;
        }

        .hero-view-label {
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--contraband-light-gray);
          transition: color 0.3s ease;
          cursor: pointer;
        }

        .hero-view-label.active {
          color: var(--contraband-rust);
        }

        .hero-view-switch {
          position: relative;
          width: 36px;
          height: 18px;
          padding: 0;
          appearance: none;
          -webkit-appearance: none;
          background: var(--contraband-dark-gray);
          border: 1px solid var(--contraband-mid-gray);
          border-radius: 9px;
          cursor: pointer;
          transition: background 0.3s ease, border-color 0.3s ease;
          outline: none;
        }

        .hero-view-switch::after {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          width: 12px;
          height: 12px;
          background: var(--contraband-rust);
          border-radius: 50%;
          transition: transform 0.3s ease;
        }

        .hero-view-switch.chart::after {
          transform: translateX(18px);
        }

        .contraband-page.light-mode .hero-view-switch {
          background: #d8d4cc;
          border-color: #c8c4bc;
        }

        .hero-chart-container {
          position: relative;
          width: 100%;
          max-width: 900px;
          aspect-ratio: 16/8;
          margin-bottom: 2rem;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid var(--contraband-dark-gray);
          opacity: 0;
          animation: fadeUp 0.6s ease forwards;
        }

        .contraband-page.light-mode .hero-chart-container {
          border-color: #d0ccc4;
        }

        .hero-chart-container .tradingview-widget-container {
          width: 100%;
          height: 100%;
        }

        @media (max-width: 768px) {
          .contraband-section {
            padding: 5rem 2rem;
          }

          .contraband-featured {
            grid-template-columns: 1fr;
          }

          .contraband-featured-image {
            min-height: 250px;
          }

          .contraband-subscribe-section {
            padding: 3rem 2rem;
          }

          .contraband-subscribe-form {
            flex-direction: column;
          }

          .contraband-subscribe-form input {
            border-right: 1px solid var(--contraband-mid-gray);
            border-bottom: none;
          }

          .contraband-hero {
            padding: 5rem 2rem 2rem;
          }

          .hero-map-container {
            max-width: 100%;
            aspect-ratio: 16/10;
            margin-bottom: 1.5rem;
          }

          .hero-map-cta {
            font-size: 9px;
            bottom: 0.5rem;
            right: 0.5rem;
          }

          .hero-chart-container {
            max-width: 100%;
            aspect-ratio: 16/10;
            margin-bottom: 1.5rem;
          }
        }
      `}</style>

      <div className={`contraband-page ${isLightMode ? 'light-mode' : ''}`}>
        <ThemeToggle />
        <SiteNav blendMode />

        <section className="contraband-hero">
          <div className="hero-view-toggle">
            <span
              className={`hero-view-label ${heroView === 'map' ? 'active' : ''}`}
              onClick={() => setHeroView('map')}
            >
              Network
            </span>
            <button
              className={`hero-view-switch ${heroView === 'chart' ? 'chart' : ''}`}
              onClick={() => setHeroView(prev => prev === 'map' ? 'chart' : 'map')}
              aria-label="Toggle between network map and price chart"
            />
            <span
              className={`hero-view-label ${heroView === 'chart' ? 'active' : ''}`}
              onClick={() => setHeroView('chart')}
            >
              Price
            </span>
          </div>

          {heroView === 'chart' ? (
            <div className="hero-chart-container">
              <div className="tradingview-widget-container" ref={chartContainerRef} />
            </div>
          ) : (
          <Link href="/dashboard" className="hero-map-container">
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{
                scale: 100,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                center: [10, 20] as any,
              }}
              style={{
                width: '100%',
                height: '100%',
              }}
            >
              <Geographies geography={worldAtlas}>
                {({ geographies }) =>
                  geographies.map((geo, index) => (
                    <Geography
                      key={`geo-${index}`}
                      geography={geo}
                      fill={isLightMode ? '#d8d4cc' : '#1a1a1a'}
                      stroke={isLightMode ? '#b5946e' : '#b5673a'}
                      strokeWidth={0.3}
                      style={{
                        default: { outline: 'none' },
                        hover: { outline: 'none' },
                        pressed: { outline: 'none' },
                      }}
                    />
                  ))
                }
              </Geographies>
              {HERO_NODES.map((node) => (
                <Marker
                  key={node.id}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  coordinates={node.coordinates as any}
                >
                  <circle
                    r={node.major ? 4 : 2.5}
                    fill="#F7931A"
                    className={`hero-map-node ${node.major ? 'major' : ''}`}
                  />
                </Marker>
              ))}
              {/* Transaction arcs */}
              {heroArcs.map((arc) => (
                <Line
                  key={arc.id}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  from={arc.from as any}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  to={arc.to as any}
                  stroke={arc.type === 'whale' ? '#a855f7' : arc.type === 'large' ? '#f59e0b' : '#22c55e'}
                  strokeWidth={arc.type === 'whale' ? 2 : arc.type === 'large' ? 1.5 : 1}
                  strokeLinecap="round"
                  className={`hero-tx-arc ${arc.type}`}
                  style={{
                    strokeDasharray: 1000,
                  }}
                />
              ))}
              {/* Arc endpoints */}
              {heroArcs.map((arc) => (
                <Marker
                  key={`${arc.id}-end`}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  coordinates={arc.to as any}
                >
                  <circle
                    className={`hero-arc-endpoint ${arc.type}`}
                    r={3}
                  />
                </Marker>
              ))}
            </ComposableMap>
            <div className="hero-sonar-overlay">
              <div className="hero-radar-sweep"></div>
              <div className="hero-sonar-rings">
                <div className="hero-sonar-ring"></div>
                <div className="hero-sonar-ring"></div>
                <div className="hero-sonar-ring"></div>
                <div className="hero-sonar-ring"></div>
              </div>
            </div>
            <span className="hero-map-cta">View Live Dashboard →</span>
          </Link>
          )}
          <h1 className="contraband-hero-title">Contra₿and</h1>
          <p className="contraband-hero-tagline">Ideas that refuse to stay buried</p>
          <p className="contraband-hero-subtitle">Stu₿y · Writings · Podcasts · Videos · Merch</p>

          <div className="contraband-scroll-indicator">
            <span>Explore</span>
            <div className="contraband-scroll-line"></div>
          </div>
        </section>

        <section id="writings" className="contraband-section">
          <div className="contraband-section-header">
            <span className="contraband-section-number">01</span>
            <h2 className="contraband-section-title">Writings</h2>
          </div>

          <Link href="/writings/why-trump-1m-btc" className="contraband-featured">
            <div className="contraband-featured-image"></div>
            <div className="contraband-featured-content">
              <span className="contraband-featured-label">Featured Essay</span>
              <h3 className="contraband-featured-title">Letters of Marque for the Digital Age</h3>
              <p className="contraband-featured-excerpt">When states embrace what they once called piracy.</p>
              <span className="contraband-btn">
                Read Now
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </span>
            </div>
          </Link>

          <div className="contraband-content-grid">
            <Link href="/writings/bankmore" className="contraband-content-card">
              <span className="contraband-card-type">Essay</span>
              <h3 className="contraband-card-title">The Pirate's Guide to Banking</h3>
              <p className="contraband-card-excerpt">Why leaving the harbor means carrying more treasure.</p>
              <div className="contraband-card-meta">
                <span>15 min read</span>
                <svg className="contraband-card-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            </Link>
            <Link href="/writings/nation-or-network" className="contraband-content-card">
              <span className="contraband-card-type">Analysis</span>
              <h3 className="contraband-card-title">The Network Eats the Nation</h3>
              <p className="contraband-card-excerpt">Borders are lines on maps. Networks are lines of code.</p>
              <div className="contraband-card-meta">
                <span>10 min read</span>
                <svg className="contraband-card-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            </Link>
            <Link href="/writings/when-did-i-sign" className="contraband-content-card">
              <span className="contraband-card-type">Essay</span>
              <h3 className="contraband-card-title">The Contract You Never Signed</h3>
              <p className="contraband-card-excerpt">You can't breach an agreement you never made.</p>
              <div className="contraband-card-meta">
                <span>7 min read</span>
                <svg className="contraband-card-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            </Link>
          </div>
        </section>

        <section className="contraband-section">
          <div className="contraband-subscribe-section">
            <h2 className="contraband-subscribe-title">Join the Crew</h2>
            <p className="contraband-subscribe-text">Get contraband delivered straight to your inbox. No spam, just ideas worth smuggling.</p>
            <form className="contraband-subscribe-form" onSubmit={handleSubmit}>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={subscribeStatus === 'loading' || subscribeStatus === 'success'}
                required
              />
              <button type="submit" disabled={subscribeStatus === 'loading' || subscribeStatus === 'success'}>
                {subscribeStatus === 'loading' ? 'Joining...' : subscribeStatus === 'success' ? 'Joined' : 'Subscribe'}
              </button>
            </form>
            {subscribeMessage && (
              <p
                className="contraband-subscribe-message"
                role="status"
                style={{ color: subscribeStatus === 'error' ? '#ef4444' : '#22c55e' }}
              >
                {subscribeMessage}
              </p>
            )}
          </div>
        </section>

        <SiteFooter />
      </div>
    </>
  );
}
