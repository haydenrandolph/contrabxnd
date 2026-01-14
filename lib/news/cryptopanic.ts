import type { NewsItem, CryptoPanicResponse, CryptoPanicPost } from './types';

const CRYPTOPANIC_API = 'https://cryptopanic.com/api/developer/v2/posts/';

function getSentiment(votes: CryptoPanicPost['votes']): NewsItem['sentiment'] {
  const positive = votes.positive + votes.liked;
  const negative = votes.negative + votes.disliked + votes.toxic;

  if (positive > negative * 1.5) return 'bullish';
  if (negative > positive * 1.5) return 'bearish';
  return 'neutral';
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
      kind: 'news',
      public: 'true',
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

    return data.results.map((post): NewsItem => ({
      id: `cp-${post.id}`,
      title: post.title,
      summary: post.metadata?.description || undefined,
      url: post.url,
      source: {
        name: post.source.title,
        type: 'news',
        icon: getSourceIcon(post.source.domain),
      },
      timestamp: new Date(post.published_at).getTime(),
      sentiment: getSentiment(post.votes),
      engagement: {
        likes: post.votes.positive + post.votes.liked,
        comments: post.votes.comments,
      },
      image: post.metadata?.image,
    }));
  } catch (error) {
    console.error('Failed to fetch CryptoPanic news:', error);
    return [];
  }
}
