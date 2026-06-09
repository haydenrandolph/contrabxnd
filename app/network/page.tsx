'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from '@/contexts/ThemeContext';
import { UserMenu } from '@/components/auth';
import JoinNetworkModal from '@/components/network/JoinNetworkModal';
import type { NetworkBusiness } from '@/lib/network/types';
import { BUSINESS_CATEGORIES } from '@/lib/network/types';

import type { MapBounds } from '@/components/network/NetworkMap';

// Dynamically import map component (Leaflet requires window)
const NetworkMap = dynamic(() => import('@/components/network/NetworkMap'), {
  ssr: false,
  loading: () => (
    <div style={{
      width: '100%',
      height: '100%',
      background: '#0a0a0a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#5a5a5a',
      fontFamily: 'Space Mono, monospace',
      fontSize: '12px',
    }}>
      Loading map...
    </div>
  ),
});

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Get unique countries from businesses
function getUniqueCountries(businesses: NetworkBusiness[]): string[] {
  const countries = new Set<string>();
  businesses.forEach((b) => {
    if (b.location?.country) {
      countries.add(b.location.country);
    }
  });
  return Array.from(countries).sort();
}

interface UserLocation {
  lat: number;
  lon: number;
  city?: string;
  country?: string;
}

export default function NetworkPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [businesses, setBusinesses] = useState<NetworkBusiness[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<NetworkBusiness[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedCountry, setSelectedCountry] = useState<string>('All');
  const [sortByDistance, setSortByDistance] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [selectedBusiness, setSelectedBusiness] = useState<NetworkBusiness | null>(null);
  const [searchRadius, setSearchRadius] = useState<number>(500); // km
  const [searchMode, setSearchMode] = useState<'global' | 'nearby'>('global');
  const [visibleBusinessIds, setVisibleBusinessIds] = useState<string[] | null>(null);
  const [viewportSyncEnabled, setViewportSyncEnabled] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);
  const { isLightMode, toggleTheme } = useTheme();

  // Handle map bounds change - filter list to show only visible businesses
  const handleBoundsChange = useCallback((bounds: MapBounds, visibleIds: string[]) => {
    if (viewportSyncEnabled) {
      setVisibleBusinessIds(visibleIds);
    }
  }, [viewportSyncEnabled]);

  // Fetch businesses with optional location parameters
  const fetchBusinesses = useCallback(async (location?: { lat: number; lon: number }, radius?: number) => {
    setIsLoading(true);
    try {
      let url = '/api/network';
      if (location && searchMode === 'nearby') {
        url += `?lat=${location.lat}&lon=${location.lon}&radius=${radius || searchRadius}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setBusinesses(data.businesses || []);
        setFilteredBusinesses(data.businesses || []);
      }
    } catch (error) {
      console.error('Failed to fetch businesses:', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchMode, searchRadius]);

  // Initial fetch - global first
  useEffect(() => {
    fetchBusinesses();
  }, []);

  // Refetch when search mode or radius changes (and we have location)
  useEffect(() => {
    if (searchMode === 'nearby' && userLocation) {
      fetchBusinesses(userLocation, searchRadius);
    } else if (searchMode === 'global') {
      fetchBusinesses();
    }
  }, [searchMode, searchRadius, userLocation]);

  // Auto-detect user location on initial load
  useEffect(() => {
    if ('geolocation' in navigator) {
      setLocationStatus('loading');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
          setUserLocation(loc);
          setLocationStatus('success');
          setSortByDistance(true);
          // Auto-switch to nearby mode when location is detected
          setSearchMode('nearby');
        },
        (error) => {
          console.log('Geolocation error:', error.message);
          setLocationStatus('error');
        },
        { timeout: 10000, maximumAge: 300000 }
      );
    } else {
      setLocationStatus('error');
    }
  }, []);

  // Get unique countries for filter dropdown
  const availableCountries = getUniqueCountries(businesses);

  useEffect(() => {
    let filtered = businesses;

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter((b) => b.category === selectedCategory);
    }

    // Filter by country
    if (selectedCountry !== 'All') {
      filtered = filtered.filter((b) => b.location?.country === selectedCountry);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.name.toLowerCase().includes(query) ||
          (b.description && b.description.toLowerCase().includes(query)) ||
          (b.location?.city && b.location.city.toLowerCase().includes(query)) ||
          (b.location?.country && b.location.country.toLowerCase().includes(query))
      );
    }

    // Calculate distance if user location is available
    if (userLocation) {
      filtered = filtered.map((b) => ({
        ...b,
        distance: b.location
          ? calculateDistance(userLocation.lat, userLocation.lon, b.location.lat, b.location.lon)
          : undefined,
      }));
    }

    // Sort by distance if enabled and location is available
    if (sortByDistance && userLocation) {
      filtered = [...filtered].sort((a, b) => {
        if (a.distance === undefined && b.distance === undefined) return 0;
        if (a.distance === undefined) return 1;
        if (b.distance === undefined) return -1;
        return a.distance - b.distance;
      });
    }

    // Filter by visible map viewport if enabled
    if (viewportSyncEnabled && visibleBusinessIds !== null) {
      const visibleSet = new Set(visibleBusinessIds);
      filtered = filtered.filter(b => visibleSet.has(b.id));
    }

    setFilteredBusinesses(filtered);
  }, [businesses, selectedCategory, selectedCountry, searchQuery, userLocation, sortByDistance, viewportSyncEnabled, visibleBusinessIds]);

  // Scroll list to selected business when selected from map
  useEffect(() => {
    if (selectedBusiness && listRef.current) {
      const element = document.getElementById(`business-${selectedBusiness.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [selectedBusiness]);

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

        .network-page {
          background: #0a0a0a;
          color: #e8e4dc;
          font-family: 'Space Mono', monospace;
          font-size: 14px;
          line-height: 1.7;
          overflow-x: hidden;
          min-height: 100vh;
          -webkit-font-smoothing: antialiased;
        }

        .network-page.light-mode {
          background: #e8e4dc;
          color: #0a0a0a;
        }

        .network-page::before {
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

        .network-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          padding: 2rem 3rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 1000;
          background: linear-gradient(to bottom, #0a0a0a 0%, transparent 100%);
        }

        .network-page.light-mode .network-nav {
          background: linear-gradient(to bottom, #e8e4dc 0%, transparent 100%);
        }

        .network-logo-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
          color: #f5f3f0;
        }

        .network-page.light-mode .network-logo-link {
          color: #0a0a0a;
        }

        .network-logo-text {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
        }

        .network-nav-links {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 2.5rem;
        }

        .network-nav-links a {
          color: #f5f3f0;
          text-decoration: none;
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          position: relative;
          padding: 0.25rem 0;
        }

        .network-page.light-mode .network-nav-links a {
          color: #0a0a0a;
        }

        .network-nav-links a::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 1px;
          background: #F7931A;
          transition: width 0.3s ease;
        }

        .network-nav-links a:hover::after,
        .network-nav-links a.active::after {
          width: 100%;
        }

        .network-nav-links a.coming-soon {
          text-decoration: line-through;
          opacity: 0.5;
          cursor: not-allowed;
        }

        .network-nav-links a.coming-soon:hover::after {
          width: 0;
        }

        .network-nav-right {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

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
          background: #f5f3f0;
          transition: all 0.3s ease;
          margin: 3px 0;
        }

        .network-page.light-mode .mobile-menu-btn span {
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

        .network-page.light-mode .mobile-menu-overlay {
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

        .network-page.light-mode .mobile-menu-nav a {
          color: #0a0a0a;
        }

        .mobile-menu-nav a:active {
          color: #F7931A;
        }

        .mobile-menu-nav a.coming-soon {
          text-decoration: line-through;
          opacity: 0.5;
        }

        .network-theme-toggle {
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

        .network-theme-toggle:hover {
          background: #F7931A;
          border-color: #F7931A;
          transform: scale(1.1);
        }

        .network-theme-toggle svg {
          width: 24px;
          height: 24px;
          stroke: #e8e4dc;
        }

        .network-page.light-mode .network-theme-toggle {
          background: #f5f3f0;
          border-color: #c8c4bc;
        }

        .network-page.light-mode .network-theme-toggle svg {
          stroke: #070713;
        }

        .network-hero {
          padding: 12rem 3rem 4rem;
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
          margin: 0 auto 2rem;
          line-height: 1.7;
          opacity: 0;
          animation: fadeUp 1s ease 0.4s forwards;
        }

        .hero-cta {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 2rem;
          background: #F7931A;
          border: none;
          color: #fff;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s ease;
          opacity: 0;
          animation: fadeUp 1s ease 0.5s forwards;
        }

        .hero-cta:hover {
          background: #e8850f;
          transform: translateY(-2px);
        }

        .hero-cta svg {
          width: 16px;
          height: 16px;
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

        .network-controls {
          padding: 0 3rem 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .controls-row {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          align-items: center;
        }

        .search-input {
          flex: 1;
          min-width: 200px;
          padding: 0.75rem 1rem;
          background: #141414;
          border: 1px solid #2a2a2a;
          color: #e8e4dc;
          font-family: 'Space Mono', monospace;
          font-size: 13px;
          transition: border-color 0.2s ease;
        }

        .network-page.light-mode .search-input {
          background: #f5f3f0;
          border-color: #d8d4cc;
          color: #0a0a0a;
        }

        .search-input:focus {
          outline: none;
          border-color: #F7931A;
        }

        .search-input::placeholder {
          color: #5a5a5a;
        }

        .category-select {
          padding: 0.75rem 1rem;
          background: #141414;
          border: 1px solid #2a2a2a;
          color: #e8e4dc;
          font-family: 'Space Mono', monospace;
          font-size: 13px;
          cursor: pointer;
          transition: border-color 0.2s ease;
        }

        .network-page.light-mode .category-select {
          background: #f5f3f0;
          border-color: #d8d4cc;
          color: #0a0a0a;
        }

        .category-select:focus {
          outline: none;
          border-color: #F7931A;
        }

        .results-count {
          font-size: 12px;
          color: #5a5a5a;
          margin-left: auto;
        }

        .location-controls {
          display: flex;
          gap: 1rem;
          align-items: center;
          flex-wrap: wrap;
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #1a1a1a;
        }

        .network-page.light-mode .location-controls {
          border-top-color: #d8d4cc;
        }

        .location-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 11px;
          color: #5a5a5a;
        }

        .location-status svg {
          width: 14px;
          height: 14px;
        }

        .location-status.success {
          color: #4ade80;
        }

        .location-status.loading {
          color: #F7931A;
        }

        .sort-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: transparent;
          border: 1px solid #2a2a2a;
          color: #8a8a8a;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .network-page.light-mode .sort-toggle {
          border-color: #d8d4cc;
        }

        .sort-toggle:hover {
          border-color: #F7931A;
          color: #F7931A;
        }

        .sort-toggle.active {
          background: rgba(247, 147, 26, 0.1);
          border-color: #F7931A;
          color: #F7931A;
        }

        .sort-toggle svg {
          width: 14px;
          height: 14px;
        }

        .business-location {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 11px;
          color: #5a5a5a;
          margin-top: 0.5rem;
        }

        .business-location svg {
          width: 12px;
          height: 12px;
          flex-shrink: 0;
        }

        .business-distance {
          color: #F7931A;
          font-size: 10px;
          margin-left: auto;
        }

        .split-view {
          display: flex;
          height: calc(100vh - 200px);
          min-height: 500px;
          max-width: 1600px;
          margin: 0 auto;
          padding: 0 2rem 2rem;
          gap: 1.5rem;
        }

        .map-container {
          flex: 1;
          min-width: 0;
          border: 1px solid #1a1a1a;
          overflow: hidden;
        }

        .network-page.light-mode .map-container {
          border-color: #d8d4dc;
        }

        .list-panel {
          width: 400px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .list-header {
          padding-bottom: 1rem;
          border-bottom: 1px solid #1a1a1a;
          margin-bottom: 1rem;
        }

        .network-page.light-mode .list-header {
          border-bottom-color: #d8d4cc;
        }

        .list-header h3 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.2rem;
          font-weight: 400;
          margin-bottom: 0.25rem;
        }

        .list-count {
          font-size: 11px;
          color: #5a5a5a;
        }

        .business-cards {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding-right: 0.5rem;
        }

        .business-cards::-webkit-scrollbar {
          width: 6px;
        }

        .business-cards::-webkit-scrollbar-track {
          background: #1a1a1a;
        }

        .business-cards::-webkit-scrollbar-thumb {
          background: #3a3a3a;
          border-radius: 3px;
        }

        .business-cards::-webkit-scrollbar-thumb:hover {
          background: #F7931A;
        }

        .network-page.light-mode .business-cards::-webkit-scrollbar-track {
          background: #e8e4dc;
        }

        .network-page.light-mode .business-cards::-webkit-scrollbar-thumb {
          background: #c8c4bc;
        }

        .business-card {
          background: #141414;
          border: 1px solid #1a1a1a;
          padding: 1.25rem;
          transition: all 0.3s ease;
          cursor: pointer;
          flex-shrink: 0;
        }

        .network-page.light-mode .business-card {
          background: #f5f3f0;
          border-color: #d8d4cc;
        }

        .business-card:hover {
          border-color: #F7931A;
          transform: translateY(-2px);
        }

        .business-card.selected {
          border-color: #F7931A;
          background: rgba(247, 147, 26, 0.05);
        }

        .business-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .business-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.4rem;
          font-weight: 400;
          margin-right: 1rem;
        }

        .business-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.5rem;
          background: rgba(247, 147, 26, 0.1);
          border: 1px solid #F7931A;
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #F7931A;
          white-space: nowrap;
        }

        .business-category {
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #5a5a5a;
          margin-bottom: 0.75rem;
        }

        .business-description {
          font-size: 13px;
          color: #8a8a8a;
          line-height: 1.7;
          margin-bottom: 1.5rem;
        }

        .business-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 1rem;
          border-top: 1px solid #1a1a1a;
        }

        .network-page.light-mode .business-footer {
          border-top-color: #d8d4cc;
        }

        .payment-methods {
          display: flex;
          gap: 0.5rem;
        }

        .payment-tag {
          font-size: 10px;
          padding: 0.25rem 0.5rem;
          background: #1a1a1a;
          color: #8a8a8a;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .network-page.light-mode .payment-tag {
          background: #e8e4dc;
          color: #5a5a5a;
        }

        .visit-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #F7931A;
          text-decoration: none;
          transition: opacity 0.2s ease;
        }

        .visit-link:hover {
          opacity: 0.8;
        }

        .visit-link svg {
          width: 14px;
          height: 14px;
        }

        .loading-state {
          text-align: center;
          padding: 4rem 2rem;
          color: #5a5a5a;
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
        }

        .empty-state-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
        }

        .empty-state-text {
          color: #5a5a5a;
          font-size: 13px;
        }

        .network-footer {
          padding: 4rem 3rem;
          border-top: 1px solid #1a1a1a;
          max-width: 1400px;
          margin: 0 auto;
        }

        .network-page.light-mode .network-footer {
          border-top-color: #d8d4cc;
        }

        .network-footer-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .network-footer-left {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .network-footer-copy {
          font-size: 12px;
          color: #8a8a8a;
        }

        .network-footer-links {
          display: flex;
          gap: 2rem;
        }

        .network-footer-links a {
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #8a8a8a;
          text-decoration: none;
          transition: color 0.3s ease;
        }

        .network-footer-links a:hover {
          color: #F7931A;
        }

        @media (max-width: 768px) {
          .network-nav {
            padding: 1.5rem 2rem;
          }

          .network-nav-links {
            display: none;
          }

          .mobile-menu-btn {
            display: flex;
          }

          .network-hero {
            padding: 10rem 2rem 3rem;
          }

          .network-controls {
            padding: 0 2rem 2rem;
          }

          .controls-row {
            flex-direction: column;
            align-items: stretch;
          }

          .search-input,
          .category-select {
            width: 100%;
          }

          .results-count {
            margin-left: 0;
            text-align: center;
          }

          .split-view {
            flex-direction: column;
            height: auto;
            padding: 0 1rem 2rem;
          }

          .map-container {
            height: 300px;
            flex: none;
          }

          .list-panel {
            width: 100%;
          }

          .business-cards {
            max-height: 400px;
          }

          .network-footer-content {
            flex-direction: column;
            gap: 2rem;
            text-align: center;
          }

          .network-footer-left {
            flex-direction: column;
          }
        }
      `}</style>

      <div className={`network-page ${isLightMode ? 'light-mode' : ''}`}>
        <button
          className="network-theme-toggle"
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

        <nav className="network-nav">
          <Link href="/" className="network-logo-link">
            <Image
              src="/contraband-logo-v3.png"
              alt="Contraband logo"
              width={40}
              height={40}
            />
            <span className="network-logo-text">Contra₿and</span>
          </Link>
          <div className="network-nav-links">
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/learn">Stu₿y</Link>
            <Link href="/writings">Writings</Link>
            <Link href="/network" className="active">Network</Link>
            <a className="coming-soon" aria-disabled="true" aria-label="Podcasts — coming soon">Podcasts</a>
            <a className="coming-soon" aria-disabled="true" aria-label="Videos — coming soon">Videos</a>
            <a className="coming-soon" aria-disabled="true" aria-label="Merch — coming soon">Merch</a>
            <Link href="/about">About</Link>
          </div>
          <div className="network-nav-right">
            <UserMenu />
            <button
              className={`mobile-menu-btn ${menuOpen ? 'open' : ''}`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </nav>

        <div className={`mobile-menu-overlay ${menuOpen ? 'open' : ''}`}>
          <nav className="mobile-menu-nav">
            <Link href="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link>
            <Link href="/learn" onClick={() => setMenuOpen(false)}>Stu₿y</Link>
            <Link href="/writings" onClick={() => setMenuOpen(false)}>Writings</Link>
            <Link href="/network" onClick={() => setMenuOpen(false)}>Network</Link>
            <a className="coming-soon" aria-disabled="true" aria-label="Podcasts — coming soon">Podcasts</a>
            <a className="coming-soon" aria-disabled="true" aria-label="Videos — coming soon">Videos</a>
            <a className="coming-soon" aria-disabled="true" aria-label="Merch — coming soon">Merch</a>
            <Link href="/about" onClick={() => setMenuOpen(false)}>About</Link>
          </nav>
        </div>

        <section className="network-hero">
          <p className="hero-label">Contrabxnd Network</p>
          <h1 className="hero-title">Businesses that accept Bitcoin</h1>
          <p className="hero-subtitle">
            Discover merchants, services, and products you can buy with Bitcoin.
            Want to be listed? Join the network.
          </p>
          <button className="hero-cta" onClick={() => setShowJoinModal(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Join the Network
          </button>
        </section>

        <section className="network-controls">
          <div className="controls-row">
            <input
              type="text"
              className="search-input"
              placeholder="Search businesses, cities, countries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select
              className="category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              {BUSINESS_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {availableCountries.length > 0 && (
              <select
                className="category-select"
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
              >
                <option value="All">All Countries</option>
                {availableCountries.map((country) => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            )}
            <span className="results-count">
              {filteredBusinesses.length} {filteredBusinesses.length === 1 ? 'business' : 'businesses'}
            </span>
          </div>
          <div className="location-controls">
            <span className={`location-status ${locationStatus}`}>
              {locationStatus === 'loading' && (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="10" />
                  </svg>
                  Detecting location...
                </>
              )}
              {locationStatus === 'success' && (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  Location detected
                </>
              )}
              {locationStatus === 'error' && (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  Location unavailable
                </>
              )}
            </span>

            <button
              className={`sort-toggle ${searchMode === 'nearby' ? 'active' : ''}`}
              onClick={() => setSearchMode(searchMode === 'nearby' ? 'global' : 'nearby')}
              disabled={!userLocation}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              {searchMode === 'nearby' ? 'Nearby' : 'Global'}
            </button>

            {searchMode === 'nearby' && userLocation && (
              <select
                className="category-select"
                value={searchRadius}
                onChange={(e) => setSearchRadius(parseInt(e.target.value))}
              >
                <option value="50">50 km radius</option>
                <option value="100">100 km radius</option>
                <option value="250">250 km radius</option>
                <option value="500">500 km radius</option>
                <option value="1000">1000 km radius</option>
                <option value="5000">5000 km radius</option>
              </select>
            )}

            {userLocation && (
              <button
                className={`sort-toggle ${sortByDistance ? 'active' : ''}`}
                onClick={() => setSortByDistance(!sortByDistance)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M7 12h10M10 18h4"/>
                </svg>
                {sortByDistance ? 'By distance' : 'Sort'}
              </button>
            )}

            <button
              className={`sort-toggle ${viewportSyncEnabled ? 'active' : ''}`}
              onClick={() => {
                setViewportSyncEnabled(!viewportSyncEnabled);
                if (viewportSyncEnabled) {
                  // When disabling, reset to show all businesses
                  setVisibleBusinessIds(null);
                }
              }}
              title={viewportSyncEnabled ? 'List synced with map view' : 'Show all businesses'}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M9 3v18"/>
                <path d="M14 9l3 3-3 3"/>
              </svg>
              {viewportSyncEnabled ? 'Synced' : 'Show All'}
            </button>
          </div>
        </section>

        <section className="split-view">
          <div className="map-container">
            {isLoading ? (
              <div className="loading-state">Loading map...</div>
            ) : (
              <NetworkMap
                businesses={businesses}
                selectedBusiness={selectedBusiness}
                onSelectBusiness={setSelectedBusiness}
                onBoundsChange={handleBoundsChange}
                userLocation={userLocation}
                isLightMode={isLightMode}
              />
            )}
          </div>

          <div className="list-panel">
            <div className="list-header">
              <h3>Bitcoin Businesses</h3>
              <span className="list-count">
                {viewportSyncEnabled && visibleBusinessIds !== null ? (
                  <>
                    {filteredBusinesses.length} in view
                    <span style={{ color: '#5a5a5a', marginLeft: '0.5rem' }}>
                      ({businesses.length} total)
                    </span>
                  </>
                ) : (
                  `${filteredBusinesses.length} ${filteredBusinesses.length === 1 ? 'location' : 'locations'}`
                )}
              </span>
            </div>

            {isLoading ? (
              <div className="loading-state">Loading businesses...</div>
            ) : filteredBusinesses.length === 0 ? (
              <div className="empty-state">
                <h3 className="empty-state-title">No businesses found</h3>
                <p className="empty-state-text">
                  {viewportSyncEnabled && visibleBusinessIds !== null && visibleBusinessIds.length === 0
                    ? 'Pan or zoom the map to see businesses in this area'
                    : searchQuery || selectedCategory !== 'All' || selectedCountry !== 'All'
                    ? 'Try adjusting your filters'
                    : 'Be the first to join the network!'}
                </p>
              </div>
            ) : (
              <div className="business-cards" ref={listRef}>
                {filteredBusinesses.map((business) => (
                  <div
                    key={business.id}
                    id={`business-${business.id}`}
                    className={`business-card ${selectedBusiness?.id === business.id ? 'selected' : ''}`}
                    onClick={() => setSelectedBusiness(business)}
                  >
                    <div className="business-header">
                      <h3 className="business-name">{business.name}</h3>
                      <span className="business-badge">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                          <path d="M2 17l10 5 10-5"/>
                          <path d="M2 12l10 5 10-5"/>
                        </svg>
                        BTC
                      </span>
                    </div>
                    <p className="business-category">{business.category}</p>
                    {(business.location?.city || business.location?.country || business.distance !== undefined) && (
                      <div className="business-location">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        <span>
                          {[business.location?.city, business.location?.country].filter(Boolean).join(', ') || 'Location available'}
                        </span>
                        {business.distance !== undefined && (
                          <span className="business-distance">
                            {business.distance < 1
                              ? `${Math.round(business.distance * 1000)}m away`
                              : business.distance < 100
                              ? `${business.distance.toFixed(1)}km away`
                              : `${Math.round(business.distance)}km away`}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="business-footer">
                      <div className="payment-methods">
                        {business.paymentMethods.map((method) => (
                          <span key={method} className="payment-tag">
                            {method === 'both' ? 'LN + On-chain' : method}
                          </span>
                        ))}
                      </div>
                      {business.website && (
                        <a
                          href={business.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="visit-link"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Visit
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                            <polyline points="15 3 21 3 21 9"/>
                            <line x1="10" y1="14" x2="21" y2="3"/>
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <footer className="network-footer">
          <div className="network-footer-content">
            <div className="network-footer-left">
              <Image
                src="/contraband-logo-v3.png"
                alt="Contraband logo"
                width={32}
                height={32}
              />
              <span className="network-footer-copy">© 2025 Contraband. All rights reserved.</span>
            </div>
            <div className="network-footer-links">
              <a href="https://x.com/contrabxnd" target="_blank" rel="noopener noreferrer">Twitter</a>
              <a href="https://youtube.com/@contrabxnd" target="_blank" rel="noopener noreferrer">YouTube</a>
              <a style={{ textDecoration: 'line-through', opacity: 0.5, cursor: 'not-allowed' }} aria-disabled="true" aria-label="RSS — coming soon">RSS</a>
            </div>
          </div>
        </footer>
      </div>

      <JoinNetworkModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onSuccess={() => {
          setShowJoinModal(false);
          // Optionally refresh the list
          fetchBusinesses();
        }}
      />
    </>
  );
}
