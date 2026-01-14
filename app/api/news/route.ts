import { NextResponse } from 'next/server';
import { fetchCryptoPanicNews } from '@/lib/news/cryptopanic';
import type { NewsItem } from '@/lib/news/types';

// Demo news for when API key isn't configured
const DEMO_NEWS: NewsItem[] = [
  {
    id: 'demo-1',
    title: 'Bitcoin ETF Sees Record $1.2B Single-Day Inflow as Institutional Demand Surges',
    summary: 'BlackRock\'s IBIT led the charge with $800M in new investment.',
    url: 'https://example.com',
    source: { name: 'Bitcoin Magazine', type: 'news', icon: '📰' },
    timestamp: Date.now() - 1000 * 60 * 30, // 30 min ago
    sentiment: 'bullish',
    engagement: { likes: 142, comments: 28 },
  },
  {
    id: 'demo-2',
    title: 'Lightning Network Capacity Reaches New All-Time High of 5,000 BTC',
    summary: 'The Bitcoin scaling solution continues its growth trajectory.',
    url: 'https://example.com',
    source: { name: 'The Block', type: 'news', icon: '📰' },
    timestamp: Date.now() - 1000 * 60 * 60, // 1 hour ago
    sentiment: 'bullish',
    engagement: { likes: 89, comments: 12 },
  },
  {
    id: 'demo-3',
    title: 'Michael Saylor: "Bitcoin is the exit from financial repression"',
    summary: 'MicroStrategy chairman speaks at Bitcoin conference.',
    url: 'https://example.com',
    source: { name: 'Decrypt', type: 'news', icon: '📰' },
    timestamp: Date.now() - 1000 * 60 * 90, // 1.5 hours ago
    sentiment: 'bullish',
    engagement: { likes: 234, comments: 45 },
  },
  {
    id: 'demo-4',
    title: 'Mt. Gox Trustee Moves 2,000 BTC to Exchange Wallets',
    summary: 'Creditor repayments expected to continue through Q1.',
    url: 'https://example.com',
    source: { name: 'CoinDesk', type: 'news', icon: '📰' },
    timestamp: Date.now() - 1000 * 60 * 120, // 2 hours ago
    sentiment: 'bearish',
    engagement: { likes: 67, comments: 89 },
  },
  {
    id: 'demo-5',
    title: 'Bitcoin Mining Difficulty Adjusts Up 3.2% to New Record High',
    summary: 'Network hashrate continues to climb post-halving.',
    url: 'https://example.com',
    source: { name: 'Bitcoin Magazine', type: 'news', icon: '📰' },
    timestamp: Date.now() - 1000 * 60 * 180, // 3 hours ago
    sentiment: 'neutral',
    engagement: { likes: 45, comments: 8 },
  },
];

// In-memory cache for news items
let cachedNews: NewsItem[] = [];
let lastFetch = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  const now = Date.now();

  // Return cached data if still fresh
  if (cachedNews.length > 0 && now - lastFetch < CACHE_DURATION) {
    return NextResponse.json({ news: cachedNews, cached: true });
  }

  try {
    // Fetch from all sources
    const [cryptoPanicNews] = await Promise.all([
      fetchCryptoPanicNews(),
      // Add more sources here:
      // fetchNostrNews(),
      // fetchTwitterNews(),
    ]);

    // Combine and sort by timestamp (newest first)
    let allNews = [...cryptoPanicNews].sort(
      (a, b) => b.timestamp - a.timestamp
    );

    // Use demo news if no real news available
    if (allNews.length === 0) {
      allNews = DEMO_NEWS;
    }

    // Update cache
    cachedNews = allNews;
    lastFetch = now;

    return NextResponse.json({ news: allNews, cached: false });
  } catch (error) {
    console.error('Failed to fetch news:', error);

    // Return stale cache if available
    if (cachedNews.length > 0) {
      return NextResponse.json({ news: cachedNews, cached: true, stale: true });
    }

    // Return demo news as fallback
    return NextResponse.json({ news: DEMO_NEWS, cached: false, demo: true });
  }
}
