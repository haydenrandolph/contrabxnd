import type { NetworkBusiness, PaymentMethod, Location } from './types';

const BTCMAP_API_V2 = 'https://api.btcmap.org/v2';
const BTCMAP_API_V3 = 'https://api.btcmap.org/v3';

// Cache by country code (or 'global' for all)
const cache: Map<string, { businesses: NetworkBusiness[]; timestamp: number }> = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

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
    'btcmap:id'?: number;
    [key: string]: unknown;
  };
}

interface BTCMapAreaElement {
  id: number;
  area_id: number;
  element_id: number;
  updated_at: string;
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
  if (lat !== undefined && lon !== undefined) {
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

// Get BTCMap area ID for a country code
async function getAreaId(countryCode: string): Promise<number | null> {
  try {
    const response = await fetch(`${BTCMAP_API_V2}/areas/${countryCode.toLowerCase()}`);
    if (response.ok) {
      const area: BTCMapArea = await response.json();
      return area.tags['btcmap:id'] || null;
    }
  } catch (error) {
    console.error(`Failed to get area for ${countryCode}:`, error);
  }
  return null;
}

// Get element IDs for an area
async function getAreaElementIds(areaId: number): Promise<number[]> {
  try {
    const response = await fetch(
      `${BTCMAP_API_V3}/area-elements?updated_since=2020-01-01T00:00:00Z&limit=10000`
    );
    if (response.ok) {
      const areaElements: BTCMapAreaElement[] = await response.json();
      return areaElements
        .filter(ae => ae.area_id === areaId)
        .map(ae => ae.element_id);
    }
  } catch (error) {
    console.error('Failed to get area elements:', error);
  }
  return [];
}

// Fetch all elements (for global view or when we need full data)
async function fetchAllElements(limit: number = 10000): Promise<BTCMapElement[]> {
  try {
    const response = await fetch(`${BTCMAP_API_V2}/elements?limit=${limit}`, {
      headers: { 'Accept': 'application/json' },
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Failed to fetch elements:', error);
  }
  return [];
}

// Main function to fetch businesses, optionally filtered by country
export async function fetchBTCMapBusinesses(countryCode?: string): Promise<NetworkBusiness[]> {
  const cacheKey = countryCode?.toUpperCase() || 'global';
  const now = Date.now();

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_DURATION) {
    console.log(`Returning cached ${cacheKey} businesses (${cached.businesses.length})`);
    return cached.businesses;
  }

  try {
    let elements: BTCMapElement[];

    if (countryCode) {
      // Get area-specific elements
      const areaId = await getAreaId(countryCode);
      if (areaId) {
        const elementIds = await getAreaElementIds(areaId);
        console.log(`Found ${elementIds.length} element IDs for ${countryCode} (area ${areaId})`);

        if (elementIds.length > 0) {
          // Fetch all elements and filter by IDs
          // (BTCMap doesn't have a batch element endpoint, so we fetch all and filter)
          const allElements = await fetchAllElements(50000);

          // Create a map of element numeric IDs to elements
          // Element IDs in v2 are like "node:12345", we need to match the numeric part
          const elementIdSet = new Set(elementIds);
          elements = allElements.filter(el => {
            // Extract numeric ID from element id (e.g., "node:12345" -> 12345)
            const match = el.id.match(/:(\d+)$/);
            if (match) {
              const numId = parseInt(match[1], 10);
              // Also check v3 internal ID from tags
              const btcmapId = el.tags?.['btcmap:id'];
              return elementIdSet.has(numId) || (typeof btcmapId === 'number' && elementIdSet.has(btcmapId));
            }
            return false;
          });
          console.log(`Matched ${elements.length} elements for ${countryCode}`);
        } else {
          elements = [];
        }
      } else {
        console.warn(`No area found for country code: ${countryCode}`);
        elements = [];
      }
    } else {
      // Global fetch - get more elements
      elements = await fetchAllElements(50000);
    }

    // Convert to NetworkBusiness
    const businesses = elements
      .map(mapToNetworkBusiness)
      .filter((b): b is NetworkBusiness => b !== null);

    // Update cache
    cache.set(cacheKey, { businesses, timestamp: now });
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
    return [];
  }
}

// Fetch businesses near a location (bounding box approach)
export async function fetchBusinessesNearLocation(
  lat: number,
  lon: number,
  radiusKm: number = 100
): Promise<NetworkBusiness[]> {
  const cacheKey = `near_${lat.toFixed(2)}_${lon.toFixed(2)}_${radiusKm}`;
  const now = Date.now();

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_DURATION) {
    return cached.businesses;
  }

  try {
    // Calculate bounding box (rough approximation)
    const latDelta = radiusKm / 111; // ~111km per degree latitude
    const lonDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));

    const minLat = lat - latDelta;
    const maxLat = lat + latDelta;
    const minLon = lon - lonDelta;
    const maxLon = lon + lonDelta;

    // Fetch all elements
    const elements = await fetchAllElements(50000);

    // Filter by bounding box
    const nearbyElements = elements.filter(el => {
      const elLat = el.osm_json?.lat;
      const elLon = el.osm_json?.lon;
      if (elLat === undefined || elLon === undefined) return false;
      return elLat >= minLat && elLat <= maxLat && elLon >= minLon && elLon <= maxLon;
    });

    const businesses = nearbyElements
      .map(mapToNetworkBusiness)
      .filter((b): b is NetworkBusiness => b !== null);

    // Sort by distance
    businesses.sort((a, b) => {
      if (!a.location || !b.location) return 0;
      const distA = Math.sqrt(
        Math.pow(a.location.lat - lat, 2) + Math.pow(a.location.lon - lon, 2)
      );
      const distB = Math.sqrt(
        Math.pow(b.location.lat - lat, 2) + Math.pow(b.location.lon - lon, 2)
      );
      return distA - distB;
    });

    cache.set(cacheKey, { businesses, timestamp: now });
    console.log(`Found ${businesses.length} businesses near (${lat}, ${lon})`);

    return businesses;

  } catch (error) {
    console.error('Failed to fetch nearby businesses:', error);
    return [];
  }
}

// Get available countries that have businesses
export async function getAvailableCountries(): Promise<Array<{ code: string; name: string; count: number }>> {
  try {
    // Fetch areas that are countries
    const response = await fetch(`${BTCMAP_API_V2}/areas?limit=500`);
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
