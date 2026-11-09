import type { NetworkBusiness, PaymentMethod, Location } from './types';
import { validNearbyLocation } from '../audit-guards';

const BTCMAP_API_V2 = 'https://api.btcmap.org/v2';

// Cache by country code (or 'global' for all)
const cache: Map<string, { businesses: NetworkBusiness[]; timestamp: number }> = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const MAX_COUNTRY_CACHE_ENTRIES = 32;
let globalRefresh: Promise<NetworkBusiness[]> | null = null;

// BTCMap v2 element structure
interface BTCMapElement {
  id: string;
  osm_json: {
    type: string;
    id: number;
    lat?: number;
    lon?: number;
    tags?: Record<string, string>;
  };
  tags: {
    category?: string;
    [key: string]: string | unknown;
  };
  created_at: string;
  updated_at: string;
  deleted_at: string;
}

interface BTCMapArea {
  id: string;
  tags: {
    name?: string;
    geo_json?: {
      type: 'Polygon';
      coordinates: number[][][];
    } | {
      type: 'MultiPolygon';
      coordinates: number[][][][];
    };
    [key: string]: unknown;
  };
}

function categorizePlace(osmTags: Record<string, string>, btcmapCategory?: string): string {
  if (btcmapCategory) {
    const cat = btcmapCategory.toLowerCase();
    if (cat === 'restaurant' || cat === 'cafe' || cat === 'bar' || cat === 'pub') return 'Food & Drink';
    if (cat === 'hotel' || cat === 'hostel') return 'Travel';
    if (cat === 'atm') return 'Finance';
  }

  if (osmTags.shop) {
    const shopType = osmTags.shop.toLowerCase();
    if (['electronics', 'computer', 'mobile_phone'].includes(shopType)) return 'E-commerce';
    if (['supermarket', 'grocery', 'convenience'].includes(shopType)) return 'Retail';
    if (['clothes', 'fashion', 'jewelry'].includes(shopType)) return 'Retail';
    return 'Retail';
  }

  if (osmTags.amenity) {
    const amenityType = osmTags.amenity.toLowerCase();
    if (['restaurant', 'cafe', 'bar', 'pub', 'fast_food'].includes(amenityType)) return 'Food & Drink';
    if (['hotel', 'hostel', 'guest_house'].includes(amenityType)) return 'Travel';
    if (['school', 'university', 'library'].includes(amenityType)) return 'Education';
    if (['cinema', 'theatre', 'nightclub'].includes(amenityType)) return 'Entertainment';
    if (['bank', 'atm', 'bureau_de_change'].includes(amenityType)) return 'Finance';
  }

  if (osmTags.office) return 'Services';
  if (osmTags.leisure) return 'Entertainment';
  if (osmTags.tourism) return 'Travel';

  if (osmTags.website && !osmTags.shop && !osmTags.amenity) {
    return 'Services';
  }

  return 'Other';
}

function getPaymentMethods(osmTags: Record<string, string>): PaymentMethod[] {
  const methods: PaymentMethod[] = [];

  if (osmTags['payment:lightning'] === 'yes') {
    methods.push('lightning');
  }
  if (osmTags['payment:onchain'] === 'yes' || osmTags['currency:XBT'] === 'yes') {
    methods.push('onchain');
  }

  if (methods.includes('lightning') && methods.includes('onchain')) {
    return ['both'];
  }

  if (methods.length === 0) {
    return ['onchain'];
  }

  return methods;
}

function mapToNetworkBusiness(element: BTCMapElement): NetworkBusiness | null {
  if (element.deleted_at) return null;

  const osmTags = element.osm_json?.tags || {};
  const name = osmTags.name || osmTags['name:en'];

  if (!name) return null;

  const website = osmTags.website || osmTags['contact:website'];
  const lat = element.osm_json?.lat;
  const lon = element.osm_json?.lon;

  let location: Location | undefined;
  if (lat !== undefined && lon !== undefined && validNearbyLocation(lat, lon, 1)) {
    location = {
      lat,
      lon,
      city: osmTags['addr:city'],
      country: osmTags['addr:country'],
      countryCode: osmTags['addr:country']?.substring(0, 2).toUpperCase(),
    };
  }

  return {
    id: `btcmap-${element.id}`,
    name,
    website: website ? (website.startsWith('http') ? website : `https://${website}`) : undefined,
    category: categorizePlace(osmTags, element.tags?.category as string),
    description: osmTags.description,
    paymentMethods: getPaymentMethods(osmTags),
    source: 'btcmap',
    verified: true,
    location,
  };
}

function isInRing(lat: number, lon: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if ((yi > lat) !== (yj > lat) && lon < (xj - xi) * (lat - yi) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

// Fetch all elements (for global view or when we need full data)
async function fetchAllElements(limit: number = 10000): Promise<BTCMapElement[]> {
  const response = await fetch(`${BTCMAP_API_V2}/elements?limit=${limit}`, {
    headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    throw new Error(`BTCMap elements request failed (${response.status})`);
  }
  const elements = await response.json();
  if (!Array.isArray(elements)) throw new Error('Invalid BTCMap elements');
  return elements.slice(0, limit);
}

// Main function to fetch businesses, optionally filtered by country
export async function fetchBTCMapBusinesses(countryCode?: string): Promise<NetworkBusiness[]> {
  if (countryCode !== undefined && !/^[a-zA-Z]{2}$/.test(countryCode)) throw new Error('Invalid country code');
  const cacheKey = countryCode?.toUpperCase() || 'global';
  const now = Date.now();

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_DURATION) {
    console.log(`Returning cached ${cacheKey} businesses (${cached.businesses.length})`);
    return cached.businesses;
  }

  try {
    let businesses: NetworkBusiness[];
    let timestamp: number;

    if (countryCode) {
      const response = await fetch(`${BTCMAP_API_V2}/areas/${encodeURIComponent(countryCode.toLowerCase())}`, { signal: AbortSignal.timeout(15_000) });
      if (!response.ok) {
        throw new Error(`BTCMap country request failed (${response.status})`);
      }
      const area: BTCMapArea = await response.json();
      const geometry = area.tags.geo_json;
      if (area.tags.type !== 'country' || !geometry || !['Polygon', 'MultiPolygon'].includes(geometry.type)) {
        throw new Error('BTCMap country geometry is unavailable');
      }

      // v3 relationship IDs are internal IDs, not the OSM IDs returned by v2.
      const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
      const globalBusinesses = await fetchBTCMapBusinesses();
      businesses = globalBusinesses.filter(business => {
        if (!business.location) return false;
        const { lat, lon } = business.location;
        return polygons.some(polygon =>
          polygon.length > 0 && isInRing(lat, lon, polygon[0]) &&
          !polygon.slice(1).some(hole => isInRing(lat, lon, hole))
        );
      });
      timestamp = cache.get('global')!.timestamp;
    } else {
      if (globalRefresh) return await globalRefresh;
      globalRefresh = fetchAllElements(50000).then(elements => elements
        .map(mapToNetworkBusiness)
        .filter((b): b is NetworkBusiness => b !== null));
      try {
        businesses = await globalRefresh;
      } finally {
        globalRefresh = null;
      }
      timestamp = Date.now();
    }

    // Derived results retain the global snapshot's age, including stale fallbacks.
    if (countryCode && !cache.has(cacheKey) && cache.size >= MAX_COUNTRY_CACHE_ENTRIES + 1) {
      const oldestCountry = [...cache.keys()].find(key => key !== 'global');
      if (oldestCountry) cache.delete(oldestCountry);
    }
    cache.set(cacheKey, { businesses, timestamp });
    console.log(`Fetched ${businesses.length} businesses for ${cacheKey}`);

    return businesses;

  } catch (error) {
    console.error('Failed to fetch BTCMap businesses:', error);

    // Return stale cache if available
    const stale = cache.get(cacheKey);
    if (stale) {
      console.warn('Returning stale cache due to error');
      return stale.businesses;
    }
    throw error;
  }
}

// Fetch businesses within a great-circle radius, nearest first.
export async function fetchBusinessesNearLocation(
  lat: number,
  lon: number,
  radiusKm: number = 100
): Promise<NetworkBusiness[]> {
  if (!validNearbyLocation(lat, lon, radiusKm)) throw new Error('Invalid nearby coordinates or radius');
  const globalBusinesses = await fetchBTCMapBusinesses();
  const radians = Math.PI / 180;
  const businesses = globalBusinesses
    .flatMap(business => {
      if (!business.location) return [];
      const { lat: businessLat, lon: businessLon } = business.location;
      const a = Math.sin((businessLat - lat) * radians / 2) ** 2 +
        Math.cos(lat * radians) * Math.cos(businessLat * radians) *
        Math.sin((businessLon - lon) * radians / 2) ** 2;
      const distance = 2 * 6371 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, a))));
      return distance <= radiusKm ? [{ business, distance }] : [];
    })
    .sort((a, b) => a.distance - b.distance)
    .map(({ business }) => business);

  console.log(`Found ${businesses.length} businesses near (${lat}, ${lon})`);

  return businesses;
}

// Get available countries that have businesses
export async function getAvailableCountries(): Promise<Array<{ code: string; name: string; count: number }>> {
  try {
    // Fetch areas that are countries
    const response = await fetch(`${BTCMAP_API_V2}/areas?limit=500`, { signal: AbortSignal.timeout(15_000) });
    if (!response.ok) return [];

    const areas: BTCMapArea[] = await response.json();
    const countries = areas
      .filter(a => a.tags?.type === 'country' && a.tags?.name)
      .map(a => ({
        code: a.id,
        name: a.tags.name as string,
        count: 0, // Would need separate call to get counts
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return countries;
  } catch (error) {
    console.error('Failed to fetch countries:', error);
    return [];
  }
}
