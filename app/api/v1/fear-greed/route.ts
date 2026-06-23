import { NextResponse } from 'next/server';
import { authenticateApiKey, apiResponse } from '@/lib/api-auth';

export async function GET(req: Request) {
  const auth = await authenticateApiKey(req);
  if (!auth.ok) return auth.response;

  try {
    const res = await fetch('https://api.alternative.me/fng/?limit=1');
    if (!res.ok) return NextResponse.json({ error: 'Upstream unavailable' }, { status: 502 });
    const json = await res.json();
    const entry = json.data?.[0];
    if (!entry) return NextResponse.json({ error: 'No data' }, { status: 502 });

    return apiResponse({
      value: Number(entry.value),
      label: entry.value_classification,
      timestamp: Number(entry.timestamp),
    }, auth);
  } catch {
    return NextResponse.json({ error: 'Fear & Greed data unavailable' }, { status: 502 });
  }
}
