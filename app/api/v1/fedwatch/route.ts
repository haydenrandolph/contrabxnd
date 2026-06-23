import { NextResponse } from 'next/server';
import { authenticateApiKey, apiResponse } from '@/lib/api-auth';

export async function GET(req: Request) {
  const auth = await authenticateApiKey(req);
  if (!auth.ok) return auth.response;

  try {
    const origin = new URL(req.url).origin;
    const res = await fetch(`${origin}/api/fedwatch`);
    if (!res.ok) return NextResponse.json({ error: 'FedWatch data unavailable' }, { status: 502 });

    const data = await res.json();
    return apiResponse({
      date: data.date ?? null,
      currentRate: data.current_rate ?? null,
      nextMeeting: data.next_meeting ?? null,
    }, auth);
  } catch {
    return NextResponse.json({ error: 'FedWatch data unavailable' }, { status: 502 });
  }
}
