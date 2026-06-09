import { NextResponse } from 'next/server';
import { requireUser, readJson } from '@/lib/supabase/auth';

// GET - Fetch all progress for current user
export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { supabase, user } = auth;

  const { data, error } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false });

  if (error) {
    console.error('Failed to load progress:', error.message);
    return NextResponse.json({ error: 'Failed to load progress' }, { status: 500 });
  }

  return NextResponse.json({ progress: data });
}

// POST - Mark a lesson as complete
export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { supabase, user } = auth;

  const parsed = await readJson<{
    courseSlug?: unknown;
    lessonSlug?: unknown;
    completed?: boolean;
  }>(request);
  if (parsed.error) return parsed.error;
  const { courseSlug, lessonSlug, completed } = parsed.body;

  if (typeof courseSlug !== 'string' || !courseSlug || typeof lessonSlug !== 'string' || !lessonSlug) {
    return NextResponse.json({ error: 'Missing course or lesson slug' }, { status: 400 });
  }

  const isCompleted = completed ?? true;

  // Upsert progress record
  const { data, error } = await supabase
    .from('lesson_progress')
    .upsert({
      user_id: user.id,
      course_slug: courseSlug,
      lesson_slug: lessonSlug,
      completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null,
    }, {
      onConflict: 'user_id,course_slug,lesson_slug',
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to save progress:', error.message);
    return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 });
  }

  return NextResponse.json({ progress: data });
}
