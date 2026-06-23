import { NextResponse } from 'next/server';
import { authenticateApiKey, apiResponse } from '@/lib/api-auth';

export async function GET(req: Request) {
  const auth = await authenticateApiKey(req);
  if (!auth.ok) return auth.response;

  try {
    const origin = new URL(req.url).origin;
    const res = await fetch(`${origin}/api/calendar`);
    if (!res.ok) return NextResponse.json({ error: 'Calendar data unavailable' }, { status: 502 });

    const data = await res.json();
    return apiResponse({ events: data.events ?? [] }, auth);
  } catch {
    return NextResponse.json({ error: 'Calendar data unavailable' }, { status: 502 });
  }
}
