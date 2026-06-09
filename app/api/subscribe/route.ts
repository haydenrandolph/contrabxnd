import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// Basic, conservative email shape check. Real validation happens when the
// address actually receives mail; this just rejects obvious garbage.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  let body: { email?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Subscriptions are not available right now.' }, { status: 503 });
  }

  const { error } = await supabase
    .from('subscribers')
    .insert({ email });

  // Treat a duplicate as success — the visitor is already on the list and
  // doesn't need to know the difference.
  if (error && error.code !== '23505') {
    console.error('Newsletter subscribe failed:', error.message);
    return NextResponse.json({ error: 'Could not complete your subscription. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
