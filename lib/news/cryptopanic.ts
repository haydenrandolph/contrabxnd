import type { NewsItem, CryptoPanicResponse, CryptoPanicPost } from './types';

const CRYPTOPANIC_API = 'https://cryptopanic.com/api/developer/v2/posts/';

function getSentiment(votes?: CryptoPanicPost['votes']): NewsItem['sentiment'] {
  // Return undefined if no votes data (v2 API doesn't include this)
  if (!votes) return undefined;

  const positive = votes.positive + votes.liked;
  const negative = votes.negative + votes.disliked + votes.toxic;

  // Only return sentiment if there's meaningful engagement
  if (positive + negative < 3) return undefined;

  if (positive > negative * 1.5) return 'bullish';
  if (negative > positive * 1.5) return 'bearish';
  return undefined; // Return undefined for unclear sentiment
}

function getSourceIcon(domain: string): string {
  // Map common domains to icons/emojis
  const icons: Record<string, string> = {
    'bitcoinmagazine.com': '📰',
    'coindesk.com': '📰',
    'cointelegraph.com': '📰',
    'theblock.co': '📰',
    'decrypt.co': '📰',
    'bloomberg.com': '💼',
    'reuters.com': '🌐',
    'twitter.com': '𝕏',
    'x.com': '𝕏',
  };

  return icons[domain] || '📄';
}

export async function fetchCryptoPanicNews(): Promise<NewsItem[]> {
  const apiKey = process.env.CRYPTOPANIC_API_KEY;

  if (!apiKey) {
    console.warn('CryptoPanic API key not configured');
    return [];
  }

  try {
    const params = new URLSearchParams({
      auth_token: apiKey,
      currencies: 'BTC',
      public: 'true',
      // Don't filter by kind - get all content types (news, media, twitter, reddit)
    });

    const response = await fetch(`${CRYPTOPANIC_API}?${params}`, {
      next: { revalidate: 300 }, // Cache for 5 minutes
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`CryptoPanic API error: ${response.status}`);
    }

    const data: CryptoPanicResponse = await response.json();

    return data.results.map((post): NewsItem => {
      // Determine source type based on post kind
      const getSourceType = (): 'news' | 'social' | 'nostr' => {
        if (post.kind === 'twitter' || post.kind === 'reddit') return 'social';
        return 'news';
      };

      // Get appropriate icon based on source
      const getIcon = (): string => {
        if (post.kind === 'twitter') return '𝕏';
        if (post.kind === 'reddit') return '🔴';
        if (post.source?.domain) return getSourceIcon(post.source.domain);
        return '📰';
      };

      return {
        id: `cp-${post.id}`,
        title: post.title,
        summary: post.description || post.content?.clean || undefined,
        url: post.original_url || post.url || `https://cryptopanic.com/news/${post.slug}`,
        source: {
          name: post.source?.title || 'CryptoPanic',
          type: getSourceType(),
          icon: getIcon(),
        },
        timestamp: new Date(post.published_at).getTime(),
        sentiment: getSentiment(post.votes),
        engagement: post.votes ? {
          likes: post.votes.positive + post.votes.liked,
          comments: post.votes.comments,
        } : undefined,
        image: post.image,
      };
    });
  } catch (error) {
    console.error('Failed to fetch CryptoPanic news:', error);
    return [];
  }
}
