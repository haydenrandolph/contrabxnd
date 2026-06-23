import { NextResponse } from 'next/server';
import { authenticateApiKey, apiResponse } from '@/lib/api-auth';

export async function GET(req: Request) {
  const auth = await authenticateApiKey(req);
  if (!auth.ok) return auth.response;

  try {
    const origin = new URL(req.url).origin;
    const res = await fetch(`${origin}/api/slr`);
    if (!res.ok) return NextResponse.json({ error: 'SLR data unavailable' }, { status: 502 });

    const data = await res.json();
    return apiResponse({
      date: data.date ?? null,
      policySignal: data.policy_signal ?? null,
      policyLabel: data.policy_label ?? null,
      leverageSubindex: data.leverage_subindex ?? null,
      policyEvent: data.policy_event ?? null,
    }, auth);
  } catch {
    return NextResponse.json({ error: 'SLR data unavailable' }, { status: 502 });
  }
}
