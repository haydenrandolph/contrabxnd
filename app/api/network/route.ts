import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { fetchBTCMapBusinesses, fetchBusinessesNearLocation, getAvailableCountries } from '@/lib/network/btcmap';
import type { NetworkBusiness } from '@/lib/network/types';

// GET - Fetch businesses from BTCMap + approved applications
// Query params:
//   - country: ISO country code (e.g., "us", "de") - filter by country
//   - lat, lon: coordinates for nearby search
//   - radius: search radius in km (default 100)
//   - countries: if "true", return list of available countries instead
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const countryCode = searchParams.get('country');
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    const radius = searchParams.get('radius');
    const getCountries = searchParams.get('countries');

    // Return available countries list
    if (getCountries === 'true') {
      const countries = await getAvailableCountries();
      return NextResponse.json({ countries });
    }

    let btcmapBusinesses: NetworkBusiness[];

    // Fetch based on location parameters
    if (lat && lon) {
      // Nearby search
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lon);
      const radiusKm = radius ? parseFloat(radius) : 100;

      if (!isNaN(latitude) && !isNaN(longitude)) {
        btcmapBusinesses = await fetchBusinessesNearLocation(latitude, longitude, radiusKm);
      } else {
        btcmapBusinesses = await fetchBTCMapBusinesses();
      }
    } else if (countryCode) {
      // Country-specific search
      btcmapBusinesses = await fetchBTCMapBusinesses(countryCode);
    } else {
      // Global search
      btcmapBusinesses = await fetchBTCMapBusinesses();
    }

    // Try to fetch approved applications from Supabase
    let approvedApplications: NetworkBusiness[] = [];

    const supabase = createAdminClient();
    if (supabase) {
      // This is a public endpoint, so select only the columns we expose —
      // never pull contact_email / user_id into memory here.
      const { data: applications } = await supabase
        .from('network_applications')
        .select('id, business_name, website, category, description, payment_method')
        .eq('status', 'approved');

      const validPaymentMethods = ['lightning', 'onchain', 'both', 'processor'] as const;
      type PaymentMethod = (typeof validPaymentMethods)[number];

      if (applications) {
        approvedApplications = applications.map((app) => {
          const method: PaymentMethod = validPaymentMethods.includes(app.payment_method)
            ? app.payment_method
            : 'onchain';
          return {
            id: `app-${app.id}`,
            name: app.business_name,
            website: app.website,
            category: app.category,
            description: app.description || undefined,
            paymentMethods: [method],
            source: 'application' as const,
            verified: true,
          };
        });
      }
    }

    // Combine and dedupe by website URL
    const allBusinesses = [...btcmapBusinesses, ...approvedApplications];
    const seenWebsites = new Set<string>();
    const uniqueBusinesses = allBusinesses.filter((business) => {
      if (!business.website) return true;
      const normalizedUrl = business.website.toLowerCase().replace(/\/$/, '');
      if (seenWebsites.has(normalizedUrl)) return false;
      seenWebsites.add(normalizedUrl);
      return true;
    });

    // Sort by name (unless it's a nearby search which is already sorted by distance)
    if (!lat || !lon) {
      uniqueBusinesses.sort((a, b) => a.name.localeCompare(b.name));
    }

    return NextResponse.json({
      businesses: uniqueBusinesses,
      count: uniqueBusinesses.length,
      query: {
        country: countryCode || undefined,
        lat: lat ? parseFloat(lat) : undefined,
        lon: lon ? parseFloat(lon) : undefined,
        radius: radius ? parseFloat(radius) : undefined,
      },
    });

  } catch (error) {
    console.error('Error fetching network businesses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch businesses' },
      { status: 500 }
    );
  }
}
