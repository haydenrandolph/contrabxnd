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

// CryptoPanic API v2 response types (per official docs)
export interface CryptoPanicPost {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  published_at: string;
  created_at: string;
  kind: 'news' | 'media' | 'blog' | 'twitter' | 'reddit';
  original_url?: string;
  url?: string;
  image?: string;
  source?: {
    title: string;
    region: string;
    domain: string;
    type: 'feed' | 'blog' | 'twitter' | 'media' | 'reddit';
  };
  votes?: {
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
  content?: {
    original: string | null;
    clean: string | null;
  };
}

export interface CryptoPanicResponse {
  next: string | null;
  previous: string | null;
  results: CryptoPanicPost[];
}

// X/Twitter API v2 response types
export interface XTweet {
  id: string;
  text: string;
  created_at: string;
  author_id: string;
  public_metrics?: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
  };
}

export interface XUser {
  id: string;
  username: string;
  name: string;
}

export interface XTimelineResponse {
  data?: XTweet[];
  includes?: {
    users?: XUser[];
  };
  meta?: {
    result_count: number;
    newest_id: string;
    oldest_id: string;
  };
}

export interface XSearchResponse {
  data?: XTweet[];
  includes?: {
    users?: XUser[];
  };
  meta?: {
    result_count: number;
    newest_id: string;
    oldest_id: string;
    next_token?: string;
  };
}
