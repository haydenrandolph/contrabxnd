import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/supabase/auth';

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { supabase, user } = auth;

  // Fetch completed boarding-pass lessons
  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('lesson_slug, completed')
    .eq('user_id', user.id)
    .eq('course_slug', 'boarding-pass')
    .eq('completed', true);

  const completedCount = progress?.length || 0;
  const totalLessons = 21;
  const percentage = Math.round((completedCount / totalLessons) * 100);
  const barWidth = Math.round(520 * (completedCount / totalLessons));

  // Generate SVG share card
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="315" viewBox="0 0 600 315">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&amp;family=JetBrains+Mono:wght@400;700&amp;display=swap');
    </style>
  </defs>
  <rect width="600" height="315" fill="#0a0a0a"/>
  <rect x="0" y="0" width="600" height="4" fill="#F7931A"/>
  <text x="40" y="60" font-family="Inter, serif" font-size="36" fill="#e8e4dc" letter-spacing="4">CONTRA₿​AND</text>
  <text x="40" y="90" font-family="JetBrains Mono, monospace" font-size="11" fill="#8a8a8a" letter-spacing="2">BOARDING PASS PROGRESS</text>
  <text x="40" y="170" font-family="Inter, serif" font-size="72" fill="#F7931A" font-weight="600">${percentage}%</text>
  <text x="40" y="200" font-family="JetBrains Mono, monospace" font-size="13" fill="#e8e4dc">${completedCount} of ${totalLessons} lessons completed</text>
  <rect x="40" y="220" width="520" height="6" rx="3" fill="#1a1a1a"/>
  <rect x="40" y="220" width="${barWidth}" height="6" rx="3" fill="#F7931A"/>
  <text x="40" y="280" font-family="JetBrains Mono, monospace" font-size="10" fill="#8a8a8a" letter-spacing="1">contrabxnd.io</text>
  <text x="560" y="280" font-family="JetBrains Mono, monospace" font-size="10" fill="#3a3a3a" text-anchor="end">Learn Bitcoin. Think Different.</text>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'no-cache',
    },
  });
}
