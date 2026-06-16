import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://api.alternative.me/fng/?limit=1', {
      next: { revalidate: 300 },
    });

    if (!res.ok) throw new Error('Fear & Greed API failed');

    const data = await res.json();
    const entry = data?.data?.[0];

    if (!entry) throw new Error('No data');

    return NextResponse.json({
      value: parseInt(entry.value, 10),
      label: entry.value_classification,
      timestamp: parseInt(entry.timestamp, 10) * 1000,
    });
  } catch {
    return NextResponse.json({ value: null, label: null, timestamp: null }, { status: 502 });
  }
}
