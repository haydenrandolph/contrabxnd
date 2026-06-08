import { NextResponse } from 'next/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

// Shared auth/parse helpers for API routes. Every authenticated route used to
// repeat the same createClient() -> 503 -> getUser() -> 401 dance and parse
// the body with no error handling; these centralize both.

type Ok = { supabase: SupabaseClient; user: User; error?: undefined };
type Err = { error: NextResponse; supabase?: undefined; user?: undefined };

/**
 * Returns an authenticated Supabase client + user, or an `error` NextResponse
 * to return directly. Usage:
 *
 *   const auth = await requireUser();
 *   if (auth.error) return auth.error;
 *   const { supabase, user } = auth;
 */
export async function requireUser(): Promise<Ok | Err> {
  const supabase = await createClient();

  if (!supabase) {
    return { error: NextResponse.json({ error: 'Auth not configured' }, { status: 503 }) };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  return { supabase, user };
}

/**
 * Safely parses a JSON request body. Returns `{ body }` or an `error`
 * NextResponse (400) so a malformed body becomes a clean 400 instead of an
 * unhandled SyntaxError / generic 500.
 */
export async function readJson<T = Record<string, unknown>>(
  request: Request,
): Promise<{ body: T; error?: undefined } | { error: NextResponse; body?: undefined }> {
  try {
    return { body: (await request.json()) as T };
  } catch {
    return { error: NextResponse.json({ error: 'Invalid request body.' }, { status: 400 }) };
  }
}
