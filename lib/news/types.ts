export interface NewsItem {
  id: string;
  title: string;
  summary?: string;
  content?: string;
  url: string;
  source: {
    name: string;
    type: 'news' | 'social' | 'nostr';
    icon?: string;
    handle?: string; // For social sources like @saylor
  };
  timestamp: number;
  sentiment?: 'bullish' | 'bearish' | 'neutral';
  engagement?: {
    likes?: number;
    reposts?: number;
    comments?: number;
  };
  image?: string;
}

export interface NewsSource {
  name: string;
  fetch: () => Promise<NewsItem[]>;
}

// CryptoPanic API response types
export interface CryptoPanicPost {
  id: number;
  title: string;
  published_at: string;
  url: string;
  source: {
    title: string;
    domain: string;
  };
  votes: {
    positive: number;
    negative: number;
    important: number;
    liked: number;
    disliked: number;
    lol: number;
    toxic: number;
    saved: number;
    comments: number;
  };
  metadata?: {
    description?: string;
    image?: string;
  };
}

export interface CryptoPanicResponse {
  count: number;
  results: CryptoPanicPost[];
}
