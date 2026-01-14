import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET - Fetch all progress for current user
export async function GET() {
  const supabase = await createClient();

  if (!supabase) {
    return NextResponse.json({ error: 'Auth not configured' }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ progress: data });
}

// POST - Mark a lesson as complete
export async function POST(request: Request) {
  const supabase = await createClient();

  if (!supabase) {
    return NextResponse.json({ error: 'Auth not configured' }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { courseSlug, lessonSlug, completed } = await request.json();

  if (!courseSlug || !lessonSlug) {
    return NextResponse.json({ error: 'Missing course or lesson slug' }, { status: 400 });
  }

  // Upsert progress record
  const { data, error } = await supabase
    .from('lesson_progress')
    .upsert({
      user_id: user.id,
      course_slug: courseSlug,
      lesson_slug: lessonSlug,
      completed: completed ?? true,
      completed_at: completed ? new Date().toISOString() : null,
    }, {
      onConflict: 'user_id,course_slug,lesson_slug',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ progress: data });
}
