'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from '@/contexts/ThemeContext';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
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
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div className="skeleton" style={{ width: '100%', height: '100%', borderRadius: '2px' }} />
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
  const { isLightMode } = useTheme();

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

        :root {
          --safe-top: env(safe-area-inset-top);
          --safe-bottom: env(safe-area-inset-bottom);
        }

        * {
          -webkit-tap-highlight-color: transparent;
        }

        .network-page {
          background: var(--cb-bg);
          color: var(--cb-text);
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          line-height: 1.7;
          overflow-x: hidden;
          min-height: 100vh;
          -webkit-font-smoothing: antialiased;
        }

        .page-header {
          max-width: 1100px;
          margin: 0 auto;
          padding: 80px 48px 0;
        }

        .page-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--cb-accent);
          margin-bottom: 16px;
        }

        .page-title {
          font-family: var(--cb-font-display, 'Inter', serif);
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 400;
          letter-spacing: -0.02em;
          line-height: 1.15;
          color: var(--cb-text);
          margin-bottom: 12px;
        }

        .page-subtitle {
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          color: var(--cb-text-muted);
          max-width: 600px;
          line-height: 1.6;
        }

        .page-divider {
          width: 100%;
          height: 1px;
          background: var(--cb-border);
          margin-top: 32px;
        }

        .page-content {
          max-width: 1100px;
          margin: 0 auto;
          padding: 48px 48px 96px;
        }

        .join-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: transparent;
          border: 1px solid var(--cb-border);
          border-radius: 2px;
          color: var(--cb-text);
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          transition: border-color 0.15s ease, color 0.15s ease;
          margin-bottom: 32px;
        }

        .join-btn:hover {
          border-color: var(--cb-accent);
          color: var(--cb-accent);
        }

        .join-btn svg {
          width: 14px;
          height: 14px;
        }

        .network-controls {
          padding: 0 48px 32px;
          max-width: 1100px;
          margin: 0 auto;
        }

        .controls-row {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          align-items: center;
        }

        .search-input {
          flex: 1;
          min-width: 200px;
          padding: 12px 16px;
          background: var(--cb-surface);
          border: 1px solid var(--cb-border);
          border-radius: 2px;
          color: var(--cb-text);
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          transition: border-color 0.15s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: var(--cb-accent);
        }

        .search-input::placeholder {
          color: var(--cb-text-muted);
        }

        .category-select {
          padding: 12px 16px;
          background: var(--cb-surface);
          border: 1px solid var(--cb-border);
          border-radius: 2px;
          color: var(--cb-text);
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          cursor: pointer;
          transition: border-color 0.15s ease;
        }

        .category-select:focus {
          outline: none;
          border-color: var(--cb-accent);
        }

        .results-count {
          font-size: 12px;
          color: var(--cb-text-muted);
          margin-left: auto;
        }

        .location-controls {
          display: flex;
          gap: 16px;
          align-items: center;
          flex-wrap: wrap;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--cb-border);
        }

        .location-status {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          color: var(--cb-text-muted);
        }

        .location-status svg {
          width: 14px;
          height: 14px;
        }

        .location-status.success {
          color: #4ade80;
        }

        .location-status.loading {
          color: var(--cb-accent);
        }

        .sort-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: transparent;
          border: 1px solid var(--cb-border);
          border-radius: 2px;
          color: var(--cb-text-muted);
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          cursor: pointer;
          transition: border-color 0.15s ease, color 0.15s ease;
        }

        .sort-toggle:hover {
          border-color: var(--cb-accent);
          color: var(--cb-accent);
        }

        .sort-toggle.active {
          border-color: var(--cb-accent);
          color: var(--cb-accent);
        }

        .sort-toggle svg {
          width: 14px;
          height: 14px;
        }

        .business-location {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          color: var(--cb-text-muted);
          margin-top: 8px;
        }

        .business-location svg {
          width: 12px;
          height: 12px;
          flex-shrink: 0;
        }

        .business-distance {
          color: var(--cb-accent);
          font-size: 10px;
          margin-left: auto;
        }

        .split-view {
          display: flex;
          height: calc(100vh - 200px);
          min-height: 500px;
          max-width: 1600px;
          margin: 0 auto;
          padding: 0 32px 32px;
          gap: 24px;
        }

        .map-container {
          flex: 1;
          min-width: 0;
          border: 1px solid var(--cb-border);
          border-radius: 2px;
          overflow: hidden;
        }

        .list-panel {
          width: 400px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .list-header {
          padding-bottom: 16px;
          border-bottom: 1px solid var(--cb-border);
          margin-bottom: 16px;
        }

        .list-header h3 {
          font-family: var(--cb-font-display, 'Inter', serif);
          font-size: 1.2rem;
          font-weight: 400;
          margin-bottom: 4px;
        }

        .list-count {
          font-size: 11px;
          color: var(--cb-text-muted);
        }

        .business-cards {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding-right: 8px;
        }

        .business-cards::-webkit-scrollbar {
          width: 6px;
        }

        .business-cards::-webkit-scrollbar-track {
          background: var(--cb-bg);
        }

        .business-cards::-webkit-scrollbar-thumb {
          background: var(--cb-border);
          border-radius: 2px;
        }

        .business-cards::-webkit-scrollbar-thumb:hover {
          background: var(--cb-accent);
        }

        .business-card {
          background: var(--cb-surface);
          border: 1px solid var(--cb-border);
          border-radius: 2px;
          padding: 20px;
          transition: border-color 0.15s ease;
          cursor: pointer;
          flex-shrink: 0;
        }

        .business-card:hover {
          border-color: var(--cb-accent);
        }

        .business-card.selected {
          border-color: var(--cb-accent);
        }

        .business-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .business-name {
          font-family: var(--cb-font-display, 'Inter', serif);
          font-size: 1.4rem;
          font-weight: 400;
          margin-right: 16px;
        }

        .business-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border: 1px solid var(--cb-accent);
          border-radius: 2px;
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--cb-accent);
          white-space: nowrap;
        }

        .business-category {
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--cb-text-muted);
          margin-bottom: 12px;
        }

        .business-description {
          font-size: 13px;
          color: var(--cb-text-muted);
          line-height: 1.7;
          margin-bottom: 24px;
        }

        .business-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 16px;
          border-top: 1px solid var(--cb-border);
        }

        .payment-methods {
          display: flex;
          gap: 8px;
        }

        .payment-tag {
          font-size: 10px;
          padding: 4px 8px;
          background: var(--cb-bg);
          border-radius: 2px;
          color: var(--cb-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .visit-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--cb-accent);
          text-decoration: none;
          transition: opacity 0.15s ease;
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
          padding: 64px 32px;
          color: var(--cb-text-muted);
        }

        .empty-state {
          text-align: center;
          padding: 64px 32px;
        }

        .empty-state-title {
          font-family: var(--cb-font-display, 'Inter', serif);
          font-size: 1.5rem;
          margin-bottom: 8px;
        }

        .empty-state-text {
          color: var(--cb-text-muted);
          font-size: 13px;
        }

        @media (max-width: 768px) {
          .page-header { padding: 72px 24px 0; }
          .page-content { padding: 32px 24px 64px; }

          .network-controls {
            padding: 0 32px 32px;
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
            padding: 0 16px 32px;
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
        }
      `}</style>

      <div className={`network-page ${isLightMode ? 'light-mode' : ''}`}>

        <SiteNav activePath="/network" />

        <div className="page-header">
          <div className="page-label">NETWORK</div>
          <h1 className="page-title">Bitcoin Merchants</h1>
          <p className="page-subtitle">Businesses that accept Bitcoin.</p>
          <div className="page-divider" />
        </div>
        <div className="page-content" style={{ paddingBottom: 0 }}>
          <button className="join-btn" onClick={() => setShowJoinModal(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Join the Network
          </button>
        </div>

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

        <SiteFooter />
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
