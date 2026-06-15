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

  const [chartLoaded, setChartLoaded] = useState(false);

  useEffect(() => {
    if (heroView !== 'chart') return;
    if (!chartContainerRef.current) return;
    const container = chartContainerRef.current;
    container.innerHTML = '';
    setChartLoaded(false);

    const wrapper = document.createElement('div');
    wrapper.className = 'tradingview-widget-container__widget';
    wrapper.style.width = '100%';
    wrapper.style.height = '100%';
    container.appendChild(wrapper);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: [['Bitcoin', 'BITSTAMP:BTCUSD|12M']],
      chartOnly: true,
      width: '100%',
      height: '100%',
      locale: 'en',
      colorTheme: isLightMode ? 'light' : 'dark',
      autosize: true,
      showVolume: false,
      showMA: false,
      hideDateRanges: true,
      hideMarketStatus: true,
      hideSymbolLogo: true,
      scalePosition: 'right',
      scaleMode: 'Normal',
      fontFamily: 'Space Mono, monospace',
      fontSize: '10',
      noTimeScale: false,
      valuesTracking: '1',
      changeMode: 'price-and-percent',
      chartType: 'candlesticks',
      upColor: '#F7931A',
      downColor: isLightMode ? '#c8c4bc' : '#3a3a3a',
      borderUpColor: '#F7931A',
      borderDownColor: isLightMode ? '#a09a90' : '#5a5a5a',
      wickUpColor: '#F7931A',
      wickDownColor: isLightMode ? '#a09a90' : '#5a5a5a',
      backgroundColor: isLightMode ? '#f5f3f0' : '#0a0a0a',
      gridLineColor: isLightMode ? '#e0dcd4' : '#1a1a1a',
    });
    script.onload = () => setChartLoaded(true);
    container.appendChild(script);

    return () => {
      container.innerHTML = '';
    };
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
          background: var(--cb-bg);
          color: var(--cb-text);
          font-family: var(--cb-font-mono);
          font-size: 13px;
          line-height: 1.6;
          overflow-x: hidden;
          min-height: 100vh;
        }

        .contraband-page.light-mode {
          background: var(--cb-bg);
          color: var(--cb-text);
        }

        .contraband-page.light-mode .contraband-content-card {
          background: var(--cb-surface);
          border-color: var(--cb-border);
        }

        .contraband-page.light-mode .contraband-featured-content {
          background: var(--cb-surface);
        }

        .contraband-page.light-mode .contraband-subscribe-section {
          background: var(--cb-surface);
          border-color: var(--cb-border);
        }

        .contraband-page.light-mode .contraband-subscribe-title {
          color: var(--cb-text);
        }

        .contraband-page.light-mode .contraband-subscribe-text {
          color: var(--cb-text-muted);
        }

        .contraband-page.light-mode .contraband-subscribe-form input {
          background: var(--cb-bg);
          border-color: var(--cb-border);
          color: var(--cb-text);
        }

        .contraband-page.light-mode .contraband-subscribe-form input::placeholder {
          color: var(--cb-text-muted);
        }

        .contraband-page.light-mode .contraband-section-header {
          border-color: var(--cb-border);
        }

        .contraband-page.light-mode .contraband-featured {
          border-color: var(--cb-border);
        }

        .contraband-page.light-mode .contraband-featured-content {
          background: var(--cb-surface);
        }

        .contraband-page.light-mode .contraband-featured-image {
          background: rgba(0, 0, 0, 0.04);
        }

        .contraband-page.light-mode .contraband-featured-excerpt {
          color: var(--cb-text-muted);
        }

        .contraband-page.light-mode .contraband-btn {
          border-color: var(--cb-text);
          color: var(--cb-text);
        }

        .contraband-page.light-mode .contraband-btn:hover {
          background: var(--cb-text);
          color: var(--cb-bg);
        }

        .contraband-page.light-mode .contraband-card-excerpt {
          color: var(--cb-text-muted);
        }

        .contraband-page.light-mode .contraband-card-meta {
          color: var(--cb-text-muted);
        }

        .contraband-hero {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          position: relative;
          padding: 64px 48px 48px;
        }

        .hero-map-container {
          position: relative;
          width: 100%;
          max-width: 900px;
          aspect-ratio: 16/8;
          margin-bottom: 32px;
          cursor: pointer;
          opacity: 0;
          animation: fadeIn 0.6s ease 0.2s forwards;
          border-radius: 2px;
          overflow: hidden;
          border: 1px solid var(--cb-border);
        }

        .hero-map-container:hover {
          border-color: rgba(247, 147, 26, 0.3);
        }

        .hero-map-container svg {
          position: absolute;
          inset: 0;
          z-index: 1;
        }

        .hero-map-node {
          animation: heroNodePulse 3s ease-in-out infinite;
        }

        @keyframes heroNodePulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        .hero-sonar-overlay { display: none; }

        .hero-map-cta {
          position: absolute;
          bottom: 16px;
          right: 16px;
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--cb-text-muted);
          opacity: 0;
          transition: opacity 0.15s ease;
          z-index: 10;
        }

        .hero-map-container:hover .hero-map-cta {
          opacity: 1;
          color: #F7931A;
        }

        .hero-tx-arc {
          fill: none;
          stroke-linecap: round;
          animation: heroArcPulse 2.5s ease-out forwards;
        }

        .hero-tx-arc.normal { stroke: #F7931A; stroke-width: 1; opacity: 0.4; }
        .hero-tx-arc.large { stroke: #F7931A; stroke-width: 1.5; opacity: 0.6; }
        .hero-tx-arc.whale { stroke: #F7931A; stroke-width: 2; opacity: 0.8; }

        @keyframes heroArcPulse {
          0% { stroke-dashoffset: 1000; opacity: 0.6; }
          60% { stroke-dashoffset: 0; opacity: 0.8; }
          100% { stroke-dashoffset: 0; opacity: 0; }
        }

        .hero-arc-endpoint { fill: #F7931A; animation: heroEndpointPulse 2.5s ease-out forwards; }

        @keyframes heroEndpointPulse {
          0% { r: 0; opacity: 0; }
          20% { r: 3; opacity: 0.8; }
          60% { r: 3; opacity: 0.8; }
          100% { r: 4; opacity: 0; }
        }

        .contraband-hero-title {
          font-family: var(--cb-font-display);
          font-size: clamp(3.5rem, 10vw, 7rem);
          font-weight: 400;
          letter-spacing: -0.02em;
          text-transform: uppercase;
          text-align: center;
          opacity: 0;
          animation: fadeIn 0.6s ease 0.4s forwards;
        }

        .contraband-hero-subtitle {
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--cb-text-muted);
          margin-top: 16px;
          text-align: center;
          opacity: 0;
          animation: fadeIn 0.6s ease 0.7s forwards;
        }

        .contraband-hero-tagline {
          font-family: var(--cb-font-display);
          font-size: clamp(1.1rem, 2vw, 1.4rem);
          font-style: italic;
          color: var(--cb-text-muted);
          margin-top: 24px;
          opacity: 0;
          animation: fadeIn 0.6s ease 0.6s forwards;
        }

        .contraband-scroll-indicator {
          position: absolute;
          bottom: 48px;
          left: 0;
          right: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          opacity: 0;
          animation: fadeIn 0.6s ease 1s forwards;
        }

        .contraband-scroll-indicator span {
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--cb-text-muted);
        }

        .contraband-scroll-line {
          width: 1px;
          height: 32px;
          background: var(--cb-border);
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .contraband-section {
          padding: 96px 48px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .contraband-section-header {
          display: flex;
          align-items: baseline;
          gap: 24px;
          margin-bottom: 48px;
          border-bottom: 1px solid var(--cb-border);
          padding-bottom: 16px;
        }

        .contraband-section-number {
          font-family: var(--cb-font-display);
          font-size: 2.5rem;
          color: #F7931A;
          line-height: 1;
        }

        .contraband-section-title {
          font-family: var(--cb-font-display);
          font-size: 2.5rem;
          font-weight: 400;
          letter-spacing: -0.02em;
          text-transform: uppercase;
        }

        .contraband-content-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 1px;
          background: var(--cb-border);
        }

        .contraband-content-card {
          background: var(--cb-surface);
          padding: 32px;
          position: relative;
          cursor: pointer;
          text-decoration: none;
          color: inherit;
          transition: background 0.15s ease;
        }

        .contraband-content-card:hover {
          background: rgba(247, 147, 26, 0.03);
        }

        .contraband-card-type {
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--cb-text-muted);
          margin-bottom: 16px;
        }

        .contraband-card-title {
          font-family: var(--cb-font-display);
          font-size: 1.5rem;
          font-weight: 400;
          line-height: 1.3;
          letter-spacing: -0.01em;
          margin-bottom: 12px;
        }

        .contraband-card-excerpt {
          color: var(--cb-text-muted);
          font-size: 13px;
          line-height: 1.6;
          margin-bottom: 24px;
        }

        .contraband-card-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 10px;
          color: var(--cb-text-muted);
        }

        .contraband-card-arrow {
          font-size: 16px;
          color: var(--cb-text-muted);
          transition: color 0.15s ease;
        }

        .contraband-content-card:hover .contraband-card-arrow {
          color: #F7931A;
        }

        .contraband-featured {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          margin-bottom: 48px;
          border: 1px solid var(--cb-border);
          border-radius: 2px;
        }

        .contraband-featured-image {
          background: var(--cb-surface);
          min-height: 400px;
          position: relative;
          overflow: hidden;
        }

        .contraband-featured-content {
          padding: 48px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: var(--cb-surface);
          border-left: 1px solid var(--cb-border);
        }

        .contraband-featured-label {
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--cb-text-muted);
          margin-bottom: 24px;
        }

        .contraband-featured-title {
          font-family: var(--cb-font-display);
          font-size: 2rem;
          font-weight: 400;
          line-height: 1.3;
          letter-spacing: -0.01em;
          margin-bottom: 16px;
        }

        .contraband-featured-excerpt {
          color: var(--cb-text-muted);
          font-size: 13px;
          line-height: 1.6;
          margin-bottom: 32px;
        }

        .contraband-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: transparent;
          border: 1px solid var(--cb-border);
          color: var(--cb-text);
          font-family: var(--cb-font-mono);
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          text-decoration: none;
          cursor: pointer;
          border-radius: 2px;
          transition: border-color 0.15s ease, color 0.15s ease;
        }

        .contraband-btn:hover {
          border-color: #F7931A;
          color: #F7931A;
        }

        .contraband-btn svg {
          width: 14px;
          height: 14px;
        }

        .contraband-subscribe-section {
          background: var(--cb-surface);
          border: 1px solid var(--cb-border);
          border-radius: 2px;
          padding: 64px;
          text-align: center;
        }

        .contraband-subscribe-title {
          font-family: var(--cb-font-display);
          font-size: 2.5rem;
          font-weight: 400;
          letter-spacing: -0.02em;
          margin-bottom: 16px;
        }

        .contraband-subscribe-text {
          color: var(--cb-text-muted);
          margin-bottom: 32px;
          max-width: 480px;
          margin-left: auto;
          margin-right: auto;
        }

        .contraband-subscribe-form {
          display: flex;
          justify-content: center;
          gap: 0;
          max-width: 480px;
          margin: 0 auto;
        }

        .contraband-subscribe-form input {
          flex: 1;
          padding: 12px 16px;
          background: var(--cb-bg);
          border: 1px solid var(--cb-border);
          border-right: none;
          border-radius: 2px 0 0 2px;
          color: var(--cb-text);
          font-family: var(--cb-font-mono);
          font-size: 13px;
        }

        .contraband-subscribe-form input::placeholder {
          color: var(--cb-text-muted);
        }

        .contraband-subscribe-form input:focus {
          outline: none;
          border-color: #F7931A;
        }

        .contraband-subscribe-form button {
          padding: 12px 24px;
          background: #F7931A;
          border: 1px solid #F7931A;
          border-radius: 0 2px 2px 0;
          color: #ffffff;
          font-family: var(--cb-font-mono);
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          transition: opacity 0.15s ease;
        }

        .contraband-subscribe-form button:hover {
          opacity: 0.85;
        }

        .hero-view-toggle {
          display: inline-flex;
          align-items: center;
          gap: 0;
          margin-bottom: 24px;
          opacity: 0;
          animation: fadeIn 0.6s ease 0.1s forwards;
          position: relative;
          z-index: 1001;
          pointer-events: auto;
          background: var(--cb-surface);
          border: 1px solid var(--cb-border);
          border-radius: 2px;
          overflow: hidden;
        }

        .hero-view-label {
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--cb-text-muted);
          transition: color 0.15s ease, background 0.15s ease;
          cursor: pointer;
          pointer-events: auto;
          user-select: none;
          padding: 8px 20px;
          background: transparent;
          border: none;
          font-family: var(--cb-font-mono);
        }

        .hero-view-label:hover {
          color: var(--cb-text);
        }

        .hero-view-label.active {
          color: #ffffff;
          background: #F7931A;
        }

        .hero-chart-container {
          position: relative;
          width: 100%;
          max-width: 900px;
          aspect-ratio: 16/8;
          margin-bottom: 32px;
          border-radius: 2px;
          overflow: hidden;
          border: 1px solid var(--cb-border);
          opacity: 0;
          animation: fadeIn 0.6s ease forwards;
        }

        .hero-chart-container .tradingview-widget-container {
          width: 100%;
          height: 100%;
        }

        @media (max-width: 768px) {
          .contraband-section {
            padding: 64px 24px;
          }

          .contraband-content-grid {
            grid-template-columns: 1fr;
          }

          .contraband-featured {
            grid-template-columns: 1fr;
          }

          .contraband-featured-image {
            min-height: 200px;
          }

          .contraband-featured-content {
            border-left: none;
            border-top: 1px solid var(--cb-border);
          }

          .contraband-subscribe-section {
            padding: 48px 24px;
          }

          .contraband-subscribe-form {
            flex-direction: column;
          }

          .contraband-subscribe-form input {
            border-right: 1px solid var(--cb-border);
            border-bottom: none;
            border-radius: 2px 2px 0 0;
          }

          .contraband-subscribe-form button {
            border-radius: 0 0 2px 2px;
          }

          .contraband-hero {
            padding: 64px 24px 32px;
          }

          .hero-map-container,
          .hero-chart-container {
            max-width: 100%;
            aspect-ratio: 16/10;
          }
        }
      `}</style>

      <div className={`contraband-page ${isLightMode ? 'light-mode' : ''}`}>
        <ThemeToggle />
        <SiteNav blendMode />

        <section className="contraband-hero">
          <div className="hero-view-toggle">
            <button
              className={`hero-view-label ${heroView === 'map' ? 'active' : ''}`}
              onClick={() => setHeroView('map')}
            >
              Network
            </button>
            <button
              className={`hero-view-label ${heroView === 'chart' ? 'active' : ''}`}
              onClick={() => setHeroView('chart')}
            >
              Price
            </button>
          </div>

          <div className="hero-chart-container" style={{ display: heroView === 'chart' ? 'block' : 'none' }}>
            <div className="tradingview-widget-container" ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
          </div>

          <Link href="/dashboard" className="hero-map-container" style={{ display: heroView === 'map' ? 'block' : 'none' }}>
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
            <span className="hero-map-cta">View Dashboard ↗</span>
          </Link>
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
              <span className="contraband-btn">Read Now ↗</span>
            </div>
          </Link>

          <div className="contraband-content-grid">
            <Link href="/writings/bankmore" className="contraband-content-card">
              <span className="contraband-card-type">Essay</span>
              <h3 className="contraband-card-title">The Pirate's Guide to Banking</h3>
              <p className="contraband-card-excerpt">Why leaving the harbor means carrying more treasure.</p>
              <div className="contraband-card-meta">
                <span>15 min read</span>
                <span className="contraband-card-arrow">↗</span>
              </div>
            </Link>
            <Link href="/writings/nation-or-network" className="contraband-content-card">
              <span className="contraband-card-type">Analysis</span>
              <h3 className="contraband-card-title">The Network Eats the Nation</h3>
              <p className="contraband-card-excerpt">Borders are lines on maps. Networks are lines of code.</p>
              <div className="contraband-card-meta">
                <span>10 min read</span>
                <span className="contraband-card-arrow">↗</span>
              </div>
            </Link>
            <Link href="/writings/when-did-i-sign" className="contraband-content-card">
              <span className="contraband-card-type">Essay</span>
              <h3 className="contraband-card-title">The Contract You Never Signed</h3>
              <p className="contraband-card-excerpt">You can't breach an agreement you never made.</p>
              <div className="contraband-card-meta">
                <span>7 min read</span>
                <span className="contraband-card-arrow">↗</span>
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
