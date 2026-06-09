import { NextResponse } from 'next/server';
import { requireUser, readJson } from '@/lib/supabase/auth';

// GET — fetch all bookmarks for current user
export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { supabase, user } = auth;

  const { data, error } = await supabase
    .from('bookmarks')
    .select('content_type, content_slug, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to load bookmarks:', error.message);
    return NextResponse.json({ error: 'Failed to load bookmarks' }, { status: 500 });
  }

  return NextResponse.json({ bookmarks: data });
}

// POST — add a bookmark
export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { supabase, user } = auth;

  const parsed = await readJson<{
    contentType?: unknown;
    contentSlug?: unknown;
  }>(request);
  if (parsed.error) return parsed.error;
  const { contentType, contentSlug } = parsed.body;

  if (typeof contentType !== 'string' || !contentType || typeof contentSlug !== 'string' || !contentSlug) {
    return NextResponse.json({ error: 'Missing contentType or contentSlug' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('bookmarks')
    .upsert({
      user_id: user.id,
      content_type: contentType,
      content_slug: contentSlug,
    }, {
      onConflict: 'user_id,content_type,content_slug',
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to save bookmark:', error.message);
    return NextResponse.json({ error: 'Failed to save bookmark' }, { status: 500 });
  }

  return NextResponse.json({ bookmark: data });
}

// DELETE — remove a bookmark
export async function DELETE(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { supabase, user } = auth;

  const parsed = await readJson<{
    contentType?: unknown;
    contentSlug?: unknown;
  }>(request);
  if (parsed.error) return parsed.error;
  const { contentType, contentSlug } = parsed.body;

  if (typeof contentType !== 'string' || !contentType || typeof contentSlug !== 'string' || !contentSlug) {
    return NextResponse.json({ error: 'Missing contentType or contentSlug' }, { status: 400 });
  }

  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('user_id', user.id)
    .eq('content_type', contentType)
    .eq('content_slug', contentSlug);

  if (error) {
    console.error('Failed to delete bookmark:', error.message);
    return NextResponse.json({ error: 'Failed to delete bookmark' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
