import { NextResponse } from 'next/server';
import { requireUser, readJson } from '@/lib/supabase/auth';

// GET — fetch all highlights for current user (optionally filtered by contentType + contentSlug)
export async function GET(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { supabase, user } = auth;

  const { searchParams } = new URL(request.url);
  const contentType = searchParams.get('contentType');
  const contentSlug = searchParams.get('contentSlug');

  let query = supabase
    .from('highlights')
    .select('id, content_type, content_slug, text, note, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (contentType) {
    query = query.eq('content_type', contentType);
  }
  if (contentSlug) {
    query = query.eq('content_slug', contentSlug);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to load highlights:', error.message);
    return NextResponse.json({ error: 'Failed to load highlights' }, { status: 500 });
  }

  return NextResponse.json({ highlights: data });
}

// POST — save a new highlight
export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { supabase, user } = auth;

  const parsed = await readJson<{
    contentType?: unknown;
    contentSlug?: unknown;
    text?: unknown;
    note?: unknown;
  }>(request);
  if (parsed.error) return parsed.error;
  const { contentType, contentSlug, text, note } = parsed.body;

  if (
    typeof contentType !== 'string' || !contentType ||
    typeof contentSlug !== 'string' || !contentSlug ||
    typeof text !== 'string' || !text
  ) {
    return NextResponse.json({ error: 'Missing contentType, contentSlug, or text' }, { status: 400 });
  }

  const insertData: Record<string, unknown> = {
    user_id: user.id,
    content_type: contentType,
    content_slug: contentSlug,
    text,
  };

  if (typeof note === 'string' && note) {
    insertData.note = note;
  }

  const { data, error } = await supabase
    .from('highlights')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Failed to save highlight:', error.message);
    return NextResponse.json({ error: 'Failed to save highlight' }, { status: 500 });
  }

  return NextResponse.json({ highlight: data });
}

// DELETE — remove a highlight
export async function DELETE(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { supabase, user } = auth;

  const parsed = await readJson<{ id?: unknown }>(request);
  if (parsed.error) return parsed.error;
  const { id } = parsed.body;

  if (typeof id !== 'string' || !id) {
    return NextResponse.json({ error: 'Missing highlight id' }, { status: 400 });
  }

  const { error } = await supabase
    .from('highlights')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Failed to delete highlight:', error.message);
    return NextResponse.json({ error: 'Failed to delete highlight' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
