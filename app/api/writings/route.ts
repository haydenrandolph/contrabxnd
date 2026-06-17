import { NextResponse } from 'next/server';
import { getAllWritings } from '@/lib/writings';

export const dynamic = 'force-static';

export async function GET() {
  const all = getAllWritings().filter(w => w.slug !== 'example-post');
  const writings = all.map(w => ({
    slug: w.slug,
    title: w.title,
    subtitle: w.subtitle,
    date: w.date,
    type: w.type,
    readTime: w.readTime,
  }));
  return NextResponse.json({ writings });
}
