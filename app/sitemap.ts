import type { MetadataRoute } from 'next';
import { getAllWritingSlugs } from '@/lib/writings';
import fs from 'fs';
import path from 'path';

const SITE_URL = 'https://www.contrabxnd.io';

function getLessonSlugs(): string[] {
  const lessonsDir = path.join(process.cwd(), 'app/learn/boarding-pass');
  if (!fs.existsSync(lessonsDir)) return [];
  return fs.readdirSync(lessonsDir).filter(name => {
    const full = path.join(lessonsDir, name);
    return fs.statSync(full).isDirectory() && name !== '[slug]';
  });
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    { url: `${SITE_URL}`, changeFrequency: 'hourly' as const, priority: 1.0 },
    { url: `${SITE_URL}/learn`, changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${SITE_URL}/learn/boarding-pass`, changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${SITE_URL}/writings`, changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${SITE_URL}/network`, changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: `${SITE_URL}/toolkit`, changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: `${SITE_URL}/toolkit/converter`, changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${SITE_URL}/toolkit/dca`, changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${SITE_URL}/toolkit/time-machine`, changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${SITE_URL}/toolkit/mcp`, changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: `${SITE_URL}/about`, changeFrequency: 'monthly' as const, priority: 0.4 },
  ];

  const writingSlugs = getAllWritingSlugs();
  const writingPages = writingSlugs.map(slug => ({
    url: `${SITE_URL}/writings/${slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const lessonSlugs = getLessonSlugs();
  const lessonPages = lessonSlugs.map(slug => ({
    url: `${SITE_URL}/learn/boarding-pass/${slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...staticPages, ...writingPages, ...lessonPages];
}
