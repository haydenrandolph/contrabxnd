'use client';

import { useEffect, useRef } from 'react';
import type { NetworkBusiness } from '@/lib/network/types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface NetworkMapProps {
  businesses: NetworkBusiness[];
  selectedBusiness: NetworkBusiness | null;
  onSelectBusiness: (business: NetworkBusiness | null) => void;
  onBoundsChange?: (bounds: MapBounds, visibleBusinessIds: string[]) => void;
  userLocation: { lat: number; lon: number } | null;
  isLightMode: boolean;
}

// Custom Bitcoin marker icon
const createMarkerIcon = (isSelected: boolean) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: ${isSelected ? '36px' : '28px'};
        height: ${isSelected ? '36px' : '28px'};
        background: ${isSelected ? '#F7931A' : '#1a1a1a'};
        border: 2px solid ${isSelected ? '#fff' : '#F7931A'};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        transition: all 0.2s ease;
        cursor: pointer;
      ">
        <svg width="${isSelected ? '18' : '14'}" height="${isSelected ? '18' : '14'}" viewBox="0 0 24 24" fill="none" stroke="${isSelected ? '#fff' : '#F7931A'}" stroke-width="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
      </div>
    `,
    iconSize: [isSelected ? 36 : 28, isSelected ? 36 : 28],
    iconAnchor: [isSelected ? 18 : 14, isSelected ? 18 : 14],
  });
};

// User location marker
const userMarkerIcon = L.divIcon({
  className: 'user-marker',
  html: `
    <div style="
      width: 16px;
      height: 16px;
      background: #4ade80;
      border: 3px solid #fff;
      border-radius: 50%;
      box-shadow: 0 0 0 2px #4ade80, 0 2px 8px rgba(0,0,0,0.3);
    "></div>
  `,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

export default function NetworkMap({
  businesses,
  selectedBusiness,
  onSelectBusiness,
  onBoundsChange,
  userLocation,
  isLightMode,
}: NetworkMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const businessesRef = useRef<NetworkBusiness[]>(businesses);

  // Keep businesses ref updated
  useEffect(() => {
    businessesRef.current = businesses;
  }, [businesses]);

  // Calculate visible businesses within bounds
  const getVisibleBusinessIds = (bounds: L.LatLngBounds): string[] => {
    return businessesRef.current
      .filter(b => {
        if (!b.location) return false;
        return bounds.contains([b.location.lat, b.location.lon]);
      })
      .map(b => b.id);
  };

  // Emit bounds change
  const emitBoundsChange = () => {
    if (!mapRef.current || !onBoundsChange) return;

    const bounds = mapRef.current.getBounds();
    const mapBounds: MapBounds = {
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
    };
    const visibleIds = getVisibleBusinessIds(bounds);
    onBoundsChange(mapBounds, visibleIds);
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Default center (world view or user location)
    const defaultCenter: [number, number] = userLocation
      ? [userLocation.lat, userLocation.lon]
      : [20, 0];
    const defaultZoom = userLocation ? 10 : 2;

    mapRef.current = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: defaultZoom,
      zoomControl: false,
    });

    // Add zoom control to top-right
    L.control.zoom({ position: 'topright' }).addTo(mapRef.current);

    // Add event listeners for bounds changes
    mapRef.current.on('moveend', emitBoundsChange);
    mapRef.current.on('zoomend', emitBoundsChange);

    // Emit initial bounds after a short delay (to ensure map is ready)
    setTimeout(emitBoundsChange, 100);

    // Add tile layer (dark or light based on theme)
    const tileUrl = isLightMode
      ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

    L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
    }).addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.off('moveend', emitBoundsChange);
        mapRef.current.off('zoomend', emitBoundsChange);
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update tile layer when theme changes
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove existing tile layers
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        mapRef.current?.removeLayer(layer);
      }
    });

    // Add new tile layer
    const tileUrl = isLightMode
      ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

    L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
    }).addTo(mapRef.current);
  }, [isLightMode]);

  // Add user location marker
  useEffect(() => {
    if (!mapRef.current || !userLocation) return;

    const marker = L.marker([userLocation.lat, userLocation.lon], {
      icon: userMarkerIcon,
      zIndexOffset: 1000,
    }).addTo(mapRef.current);

    marker.bindTooltip('Your location', {
      permanent: false,
      direction: 'top',
      offset: [0, -10],
    });

    return () => {
      marker.remove();
    };
  }, [userLocation]);

  // Add business markers
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    // Add markers for businesses with locations
    const bounds: [number, number][] = [];

    businesses.forEach((business) => {
      if (!business.location) return;

      const isSelected = selectedBusiness?.id === business.id;
      const marker = L.marker([business.location.lat, business.location.lon], {
        icon: createMarkerIcon(isSelected),
      }).addTo(mapRef.current!);

      // Create popup content
      const popupContent = `
        <div style="font-family: 'JetBrains Mono', monospace; min-width: 200px;">
          <h3 style="font-family: 'Inter', serif; font-size: 1.1rem; margin: 0 0 4px 0;">${business.name}</h3>
          <p style="font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 8px 0;">${business.category}</p>
          ${business.location.city || business.location.country ? `
            <p style="font-size: 11px; color: #666; margin: 0 0 8px 0;">
              ${[business.location.city, business.location.country].filter(Boolean).join(', ')}
            </p>
          ` : ''}
          <div style="display: flex; gap: 4px; margin-bottom: 8px;">
            ${business.paymentMethods.map(method => `
              <span style="font-size: 9px; padding: 2px 6px; background: #1a1a1a; color: #F7931A; text-transform: uppercase;">
                ${method === 'both' ? 'LN + On-chain' : method}
              </span>
            `).join('')}
          </div>
          ${business.website ? `
            <a href="${business.website}" target="_blank" rel="noopener noreferrer"
               style="font-size: 11px; color: #F7931A; text-decoration: none;">
              Visit Website &rarr;
            </a>
          ` : ''}
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 300,
        className: 'btc-popup',
      });

      marker.on('click', () => {
        onSelectBusiness(business);
      });

      markersRef.current.set(business.id, marker);
      bounds.push([business.location.lat, business.location.lon]);
    });

    // Fit bounds if we have markers and no user location
    if (bounds.length > 0 && !userLocation && mapRef.current) {
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }, [businesses, selectedBusiness, onSelectBusiness, userLocation]);

  // Pan to selected business
  useEffect(() => {
    if (!mapRef.current || !selectedBusiness?.location) return;

    mapRef.current.setView(
      [selectedBusiness.location.lat, selectedBusiness.location.lon],
      Math.max(mapRef.current.getZoom(), 10),
      { animate: true }
    );

    // Open popup for selected marker
    const marker = markersRef.current.get(selectedBusiness.id);
    if (marker) {
      marker.openPopup();
    }
  }, [selectedBusiness]);

  return (
    <>
      <style jsx global>{`
        .btc-popup .leaflet-popup-content-wrapper {
          background: #141414;
          color: #e8e4dc;
          border-radius: 0;
          border: 1px solid #2a2a2a;
        }
        .btc-popup .leaflet-popup-tip {
          background: #141414;
          border: 1px solid #2a2a2a;
        }
        .btc-popup .leaflet-popup-close-button {
          color: #888 !important;
        }
        .btc-popup .leaflet-popup-close-button:hover {
          color: #F7931A !important;
        }
        .network-page.light-mode .btc-popup .leaflet-popup-content-wrapper {
          background: #f7f7f8;
          color: #0a0a0a;
          border-color: #d0d0d1;
        }
        .network-page.light-mode .btc-popup .leaflet-popup-tip {
          background: #f7f7f8;
          border-color: #d0d0d1;
        }
        .leaflet-control-zoom a {
          background: #141414 !important;
          color: #e8e4dc !important;
          border-color: #2a2a2a !important;
        }
        .leaflet-control-zoom a:hover {
          background: #1a1a1a !important;
          color: #F7931A !important;
        }
        .network-page.light-mode .leaflet-control-zoom a {
          background: #f7f7f8 !important;
          color: #0a0a0a !important;
          border-color: #d0d0d1 !important;
        }
      `}</style>
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '100%',
          background: isLightMode ? '#e8e4dc' : '#0a0a0a',
        }}
      />
    </>
  );
}
