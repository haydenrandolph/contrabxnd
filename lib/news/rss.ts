import type { NewsItem } from './types';

interface RssFeed {
  url: string;
  name: string;
}

const FEEDS: RssFeed[] = [
  { url: 'https://bitcoinmagazine.com/feed', name: 'Bitcoin Magazine' },
  { url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', name: 'CoinDesk' },
  { url: 'https://cointelegraph.com/rss', name: 'Cointelegraph' },
];

function parseItems(xml: string, sourceName: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];

    const title = block.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)?.[1]?.trim();
    const link = block.match(/<link>(.*?)<\/link>/)?.[1]?.trim();
    const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1]?.trim();
    const description = block.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/)?.[1]?.trim();

    if (!title || !link) continue;

    const timestamp = pubDate ? new Date(pubDate).getTime() : Date.now();
    if (isNaN(timestamp)) continue;

    const cleanDesc = description
      ?.replace(/<[^>]+>/g, '')
      ?.replace(/&amp;/g, '&')
      ?.replace(/&lt;/g, '<')
      ?.replace(/&gt;/g, '>')
      ?.replace(/&quot;/g, '"')
      ?.replace(/&#039;/g, "'")
      ?.substring(0, 300) || undefined;

    items.push({
      id: `rss-${sourceName.toLowerCase().replace(/\s/g, '')}-${timestamp}`,
      title: title
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'"),
      summary: cleanDesc,
      url: link,
      source: {
        name: sourceName,
        type: 'news',
      },
      timestamp,
    });
  }

  return items;
}

async function fetchFeed(feed: RssFeed): Promise<NewsItem[]> {
  try {
    const res = await fetch(feed.url, {
      next: { revalidate: 300 },
      headers: { 'Accept': 'application/rss+xml, application/xml, text/xml' },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseItems(xml, feed.name);
  } catch {
    return [];
  }
}

export async function fetchRssNews(): Promise<NewsItem[]> {
  const results = await Promise.all(FEEDS.map(fetchFeed));
  const all = results.flat();
  all.sort((a, b) => b.timestamp - a.timestamp);
  return all.slice(0, 30);
}
