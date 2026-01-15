export type PaymentMethod = 'lightning' | 'onchain' | 'both' | 'processor';

export interface Location {
  lat: number;
  lon: number;
  city?: string;
  country?: string;
  countryCode?: string;
}

export interface NetworkBusiness {
  id: string;
  name: string;
  website?: string;
  category: string;
  description?: string;
  paymentMethods: PaymentMethod[];
  source: 'btcmap' | 'application';
  verified: boolean;
  location?: Location;
  distance?: number; // Distance in km from user (calculated client-side)
}

export interface NetworkApplication {
  id: string;
  business_name: string;
  website: string;
  category: string;
  description?: string;
  contact_email: string;
  payment_method: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

// BTCMap API types
export interface BTCMapPlace {
  id: string;
  name: string;
  lat: number;
  lon: number;
  tags: {
    name?: string;
    website?: string;
    description?: string;
    'payment:bitcoin'?: string;
    'payment:lightning'?: string;
    'payment:onchain'?: string;
    shop?: string;
    amenity?: string;
    [key: string]: string | undefined;
  };
}

export interface BTCMapResponse {
  id: string;
  osm_json: {
    type: string;
    id: number;
    tags?: BTCMapPlace['tags'];
  };
  tags: BTCMapPlace['tags'];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export const BUSINESS_CATEGORIES = [
  'E-commerce',
  'SaaS',
  'Services',
  'Retail',
  'Food & Drink',
  'Travel',
  'Entertainment',
  'Education',
  'Finance',
  'Other',
] as const;

export type BusinessCategory = typeof BUSINESS_CATEGORIES[number];
