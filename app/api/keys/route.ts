import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';
import crypto from 'crypto';

function hashKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

function generateApiKey(): string {
  const bytes = crypto.randomBytes(32);
  return `cbx_${bytes.toString('hex')}`;
}

export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: keys } = await supabase
    .from('api_keys')
    .select('id, key_prefix, name, last_used_at, created_at, revoked_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return NextResponse.json({ keys: keys || [] });
}

export async function POST() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  const { data: existing } = await admin
    .from('api_keys')
    .select('id')
    .eq('user_id', user.id)
    .is('revoked_at', null);

  if (existing && existing.length >= 3) {
    return NextResponse.json({ error: 'Maximum 3 active keys' }, { status: 400 });
  }

  const rawKey = generateApiKey();
  const keyHash = hashKey(rawKey);
  const keyPrefix = rawKey.slice(0, 12) + '...';

  const { error } = await admin
    .from('api_keys')
    .insert({
      user_id: user.id,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      name: 'default',
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ key: rawKey, prefix: keyPrefix });
}

export async function DELETE(req: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Key ID required' }, { status: 400 });

  const { error } = await supabase
    .from('api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ revoked: true });
}
