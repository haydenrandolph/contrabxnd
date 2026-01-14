import type { NewsItem, XTweet, XUser, XSearchResponse } from './types';

const X_API_BASE = 'https://api.twitter.com/2';

// Cache X data separately with longer TTL (1 hour)
// This helps stay within the 100 posts/month free tier limit
let cachedXNews: NewsItem[] = [];
let lastXFetch = 0;
const X_CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// Curated Bitcoin accounts and their handles
const CURATED_HANDLES: Record<string, string> = {
  'saylor': 'Michael Saylor',
  'bitcoinmagazine': 'Bitcoin Magazine',
  'DocumentingBTC': 'Documenting Bitcoin',
  'BitcoinNewsCom': 'Bitcoin News',
};

function mapTweetToNewsItem(tweet: XTweet, users?: XUser[]): NewsItem {
  const user = users?.find(u => u.id === tweet.author_id);
  const handle = user?.username || 'unknown';
  const displayName = CURATED_HANDLES[handle] || user?.name || handle;

  return {
    id: `x-${tweet.id}`,
    title: tweet.text.length > 200
      ? tweet.text.substring(0, 200) + '...'
      : tweet.text,
    summary: tweet.text,
    url: `https://x.com/${handle}/status/${tweet.id}`,
    source: {
      name: displayName,
      type: 'social',
      icon: '𝕏',
      handle: `@${handle}`,
    },
    timestamp: new Date(tweet.created_at).getTime(),
    sentiment: undefined, // No sentiment data from X
    engagement: tweet.public_metrics ? {
      likes: tweet.public_metrics.like_count,
      reposts: tweet.public_metrics.retweet_count,
      comments: tweet.public_metrics.reply_count,
    } : undefined,
  };
}

export async function fetchTwitterNews(): Promise<NewsItem[]> {
  const bearerToken = process.env.X_BEARER_TOKEN;

  if (!bearerToken) {
    console.warn('X API bearer token not configured');
    return [];
  }

  // Return cached data if still fresh (1 hour cache for X)
  const now = Date.now();
  if (cachedXNews.length > 0 && now - lastXFetch < X_CACHE_DURATION) {
    return cachedXNews;
  }

  try {
    // Use recent search for Bitcoin-related tweets from curated accounts
    // Format: (from:user1 OR from:user2) Bitcoin
    const fromQuery = Object.keys(CURATED_HANDLES).map(h => `from:${h}`).join(' OR ');
    const query = `(${fromQuery})`;

    const params = new URLSearchParams({
      query: query,
      'max_results': '10', // Keep it small to conserve rate limits
      'tweet.fields': 'created_at,public_metrics,author_id',
      'expansions': 'author_id',
      'user.fields': 'username,name',
    });

    const response = await fetch(
      `${X_API_BASE}/tweets/search/recent?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      // Handle rate limiting (429) and access errors
      if (response.status === 429) {
        console.warn('X API rate limited (429). Free tier has very limited access - search requires Basic tier ($100/month).');
      } else if (response.status === 403) {
        console.warn('X API access denied (403). The free tier does not include search/timeline endpoints.');
      } else {
        console.error(`X API error: ${response.status}`, errorText);
      }

      // Return stale cache if available
      if (cachedXNews.length > 0) {
        console.warn('Returning stale X cache due to API error');
        return cachedXNews;
      }
      return [];
    }

    const data: XSearchResponse = await response.json();

    if (!data.data || data.data.length === 0) {
      console.warn('No tweets found from X API');
      // Return stale cache if available
      if (cachedXNews.length > 0) {
        return cachedXNews;
      }
      return [];
    }

    const tweets = data.data.map(tweet =>
      mapTweetToNewsItem(tweet, data.includes?.users)
    );

    // Sort by timestamp (newest first)
    tweets.sort((a, b) => b.timestamp - a.timestamp);

    // Update cache
    cachedXNews = tweets;
    lastXFetch = now;

    return tweets;

  } catch (error) {
    console.error('Failed to fetch X/Twitter news:', error);

    // Return stale cache if available
    if (cachedXNews.length > 0) {
      console.warn('Returning stale X cache due to fetch error');
      return cachedXNews;
    }
    return [];
  }
}
