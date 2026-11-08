'use client';

import { useEffect, useEffectEvent, useRef, useState } from 'react';
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

const tileUrl = process.env.NEXT_PUBLIC_MAP_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const tileAttribution = process.env.NEXT_PUBLIC_MAP_TILE_ATTRIBUTION ||
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

function createPopup(business: NetworkBusiness): HTMLElement {
  const content = document.createElement('div');
  content.className = 'merchant-popup';
  const title = document.createElement('h3');
  title.textContent = business.name;
  const category = document.createElement('p');
  category.textContent = business.category;
  const location = document.createElement('p');
  location.textContent = [business.location?.city, business.location?.country].filter(Boolean).join(', ');
  const payments = document.createElement('p');
  payments.className = 'merchant-popup-payments';
  payments.textContent = business.paymentMethods.map(method => method === 'both' ? 'LN + On-chain' : method).join(' / ');
  content.append(title, category, location, payments);

  if (business.website) {
    try {
      const url = new URL(business.website);
      if (url.protocol === 'https:' || url.protocol === 'http:') {
        const link = document.createElement('a');
        link.href = url.href;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = 'Visit website \u2192';
        content.append(link);
      }
    } catch {
      // Invalid upstream URLs should not prevent a merchant popup from opening.
    }
  }
  return content;
}

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
  const markersRef = useRef<Map<string, L.CircleMarker>>(new Map());
  const previousSelectionRef = useRef<L.CircleMarker | null>(null);
  const fittedPositionsRef = useRef<Set<string> | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const [tileError, setTileError] = useState(false);

  const emitBoundsChange = useEffectEvent(() => {
    const map = mapRef.current;
    if (!map || !onBoundsChange) return;
    const bounds = map.getBounds();
    onBoundsChange({
      north: bounds.getNorth(), south: bounds.getSouth(),
      east: bounds.getEast(), west: bounds.getWest(),
    }, businesses.filter(b => b.location && bounds.contains([b.location.lat, b.location.lon])).map(b => b.id));
  });
  const selectBusiness = useEffectEvent((business: NetworkBusiness) => onSelectBusiness(business));

  useEffect(() => {
    if (!mapContainerRef.current) return;
    const map = L.map(mapContainerRef.current, {
      center: [20, 0], zoom: 2, minZoom: 2, zoomControl: false,
      preferCanvas: true, worldCopyJump: true,
    });
    mapRef.current = map;
    L.control.zoom({ position: 'topright' }).addTo(map);
    const tiles = L.tileLayer(tileUrl, { attribution: tileAttribution, maxZoom: 19 }).addTo(map);
    tiles.on('tileerror', () => setTileError(true));
    tiles.on('tileload', () => setTileError(false));
    const onMove = () => emitBoundsChange();
    map.on('moveend', onMove);
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(mapContainerRef.current);
    return () => {
      observer.disconnect();
      // Remove paths before their canvas renderer, including during Strict Mode cleanup.
      map.eachLayer(layer => { if (layer instanceof L.Path) map.removeLayer(layer); });
      map.remove();
      mapRef.current = null;
      fittedPositionsRef.current = null;
      selectedIdRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const layer = L.layerGroup().addTo(map);
    markersRef.current.clear();
    previousSelectionRef.current = null;
    const bounds = L.latLngBounds([]);
    const positions = new Set<string>();
    businesses.forEach(business => {
      if (!business.location) return;
      const { lat, lon } = business.location;
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
      positions.add(`${business.id}:${lat}:${lon}`);
      const marker = L.circleMarker([lat, lon], {
        radius: 5, color: '#f7931a', weight: 1.5,
        fillColor: '#f7931a', fillOpacity: 0.55,
      }).addTo(layer);
      marker.bindPopup(() => createPopup(business), { maxWidth: 280, className: 'btc-popup' });
      marker.on('click', () => selectBusiness(business));
      markersRef.current.set(business.id, marker);
      bounds.extend([lat, lon]);
    });
    const previousPositions = fittedPositionsRef.current;
    const positionsChanged = !previousPositions || positions.size !== previousPositions.size ||
      [...positions].some(position => !previousPositions.has(position));
    // Let Leaflet finish its queued canvas draw before resetting the viewport.
    const frame = requestAnimationFrame(() => {
      if (bounds.isValid() && positionsChanged) {
        map.fitBounds(bounds, { padding: [32, 32], maxZoom: 12, animate: false });
      }
      fittedPositionsRef.current = positions;
      emitBoundsChange();
    });
    return () => { cancelAnimationFrame(frame); layer.remove(); };
  }, [businesses]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userLocation) return;
    const marker = L.circleMarker([userLocation.lat, userLocation.lon], {
      radius: 7, color: '#fff', weight: 2, fillColor: '#4ade80', fillOpacity: 1,
    }).addTo(map).bindTooltip('Your location');
    return () => { marker.remove(); };
  }, [userLocation]);

  useEffect(() => {
    previousSelectionRef.current?.setStyle({ radius: 5, color: '#f7931a', weight: 1.5, fillOpacity: 0.55 });
    previousSelectionRef.current?.closePopup();
    const selectionChanged = selectedIdRef.current !== (selectedBusiness?.id ?? null);
    selectedIdRef.current = selectedBusiness?.id ?? null;
    const marker = selectedBusiness ? markersRef.current.get(selectedBusiness.id) : undefined;
    if (!marker || !mapRef.current) return;
    marker.setStyle({ radius: 9, color: '#fff', weight: 2, fillOpacity: 1 });
    marker.bringToFront();
    previousSelectionRef.current = marker;
    if (!selectionChanged) return;
    mapRef.current.setView(marker.getLatLng(), Math.max(mapRef.current.getZoom(), 10), { animate: false });
    marker.openPopup();
  }, [selectedBusiness, businesses]);

  return (
    <div className={`merchant-map ${isLightMode ? 'light' : 'dark'}`}>
      <div ref={mapContainerRef} className="merchant-map-canvas" aria-label="Map of Bitcoin merchants" />
      <div className="map-legend"><span /> Bitcoin merchant {userLocation && <><span className="location-dot" /> You</>}</div>
      {tileError && <div className="map-error" role="status">Basemap unavailable. Merchant locations and the directory are still available.</div>}
      <style jsx global>{`
        .merchant-map { position: relative; height: 100%; isolation: isolate; }
        .merchant-map-canvas { height: 100%; width: 100%; background: #171a1c; }
        .merchant-map.dark .leaflet-tile-pane { filter: invert(1) hue-rotate(180deg) saturate(0.25) brightness(0.75) contrast(0.9); }
        .merchant-map.light .leaflet-tile-pane { filter: saturate(0.25); }
        .merchant-map .leaflet-container { font-family: 'JetBrains Mono', monospace; }
        .merchant-map .leaflet-control-zoom { border: 1px solid var(--cb-border); border-radius: var(--cb-radius); overflow: hidden; }
        .merchant-map .leaflet-control-zoom a { background: var(--cb-surface); color: var(--cb-text); border-color: var(--cb-border); }
        .merchant-map .leaflet-control-zoom a:hover { color: var(--cb-accent); background: var(--cb-bg); }
        .merchant-map .leaflet-control-attribution { background: var(--cb-surface); color: var(--cb-text-muted); font-size: 9px; }
        .merchant-map .leaflet-control-attribution a { color: var(--cb-text); }
        .map-legend { position: absolute; z-index: 500; left: 12px; top: 12px; display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: var(--cb-surface); border: 1px solid var(--cb-border); border-radius: var(--cb-radius); color: var(--cb-text-muted); font: 10px 'JetBrains Mono', monospace; pointer-events: none; }
        .map-legend span { width: 7px; height: 7px; border-radius: 50%; background: #f7931a; }
        .map-legend .location-dot { background: #4ade80; margin-left: 8px; }
        .map-error { position: absolute; z-index: 500; bottom: 30px; left: 12px; right: 12px; padding: 12px; background: var(--cb-surface); color: var(--cb-text); font-size: 11px; border: 1px solid var(--cb-border); }
        .btc-popup .leaflet-popup-content-wrapper, .btc-popup .leaflet-popup-tip { background: var(--cb-surface); color: var(--cb-text); border-radius: var(--cb-radius); }
        .btc-popup .leaflet-popup-content-wrapper { border: 1px solid var(--cb-border); }
        .btc-popup .leaflet-popup-close-button { color: var(--cb-text-muted); }
        .merchant-popup { min-width: 180px; font: 11px 'JetBrains Mono', monospace; }
        .merchant-popup h3 { font-family: var(--cb-font-display, 'Inter', sans-serif); font-size: 18px; line-height: 1.3; margin: 0 16px 12px 0; }
        .merchant-popup p { margin: 6px 0; color: var(--cb-text-muted); }
        .merchant-popup .merchant-popup-payments { text-transform: uppercase; font-size: 10px; padding: 8px 0; }
        .merchant-popup a { color: var(--cb-accent); }
      `}</style>
    </div>
  );
}
