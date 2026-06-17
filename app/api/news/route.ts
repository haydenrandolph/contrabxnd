import { NextResponse } from 'next/server';
import { fetchCryptoPanicNews } from '@/lib/news/cryptopanic';
import { fetchRssNews } from '@/lib/news/rss';
import type { NewsItem } from '@/lib/news/types';

let cachedNews: NewsItem[] = [];
let lastFetch = 0;
const CACHE_DURATION = 3 * 60 * 1000;

export async function GET() {
  const now = Date.now();

  if (cachedNews.length > 0 && now - lastFetch < CACHE_DURATION) {
    return NextResponse.json({ news: cachedNews, cached: true });
  }

  try {
    const [rssNews, cryptoPanicNews] = await Promise.all([
      fetchRssNews(),
      fetchCryptoPanicNews(),
    ]);

    const seen = new Set<string>();
    const allNews: NewsItem[] = [];

    for (const item of [...cryptoPanicNews, ...rssNews]) {
      const key = item.title.toLowerCase().substring(0, 60);
      if (seen.has(key)) continue;
      seen.add(key);
      allNews.push(item);
    }

    allNews.sort((a, b) => b.timestamp - a.timestamp);
    const news = allNews.slice(0, 25);

    if (news.length > 0) {
      cachedNews = news;
      lastFetch = now;
      return NextResponse.json({ news, cached: false });
    }

    if (cachedNews.length > 0) {
      return NextResponse.json({ news: cachedNews, cached: true, stale: true });
    }

    return NextResponse.json({ news: [], cached: false });
  } catch (error) {
    console.error('Failed to fetch news:', error);

    if (cachedNews.length > 0) {
      return NextResponse.json({ news: cachedNews, cached: true, stale: true });
    }

    return NextResponse.json({ news: [], cached: false });
  }
}
