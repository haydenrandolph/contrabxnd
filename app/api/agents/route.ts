import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';

// GET: discover agents (public, filterable by capability)
export async function GET(req: Request) {
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

  const url = new URL(req.url);
  const capability = url.searchParams.get('capability');
  const minScore = Number(url.searchParams.get('min_score')) || 0;
  const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 100);

  let query = admin
    .from('agents')
    .select(`
      id, name, description, endpoint, capabilities, pricing_model,
      pricing_detail, verified, featured, status, created_at,
      agent_credit_scores (composite_score, accuracy, volume, total_predictions)
    `)
    .eq('status', 'active')
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (capability) {
    query = query.contains('capabilities', [capability]);
  }

  const { data: agents, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let results = (agents || []).map(a => ({
    id: a.id,
    name: a.name,
    description: a.description,
    endpoint: a.endpoint,
    capabilities: a.capabilities,
    pricingModel: a.pricing_model,
    pricingDetail: a.pricing_detail,
    verified: a.verified,
    featured: a.featured,
    createdAt: a.created_at,
    creditScore: (a as Record<string, unknown>).agent_credit_scores
      ? ((a as Record<string, unknown>).agent_credit_scores as Record<string, unknown>)
      : null,
  }));

  if (minScore > 0) {
    results = results.filter(a =>
      a.creditScore && (a.creditScore as Record<string, number>).composite_score >= minScore
    );
  }

  return NextResponse.json({ agents: results, count: results.length });
}

// POST: register a new agent (authenticated)
export async function POST(req: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, description, endpoint, capabilities, pricingModel, pricingDetail, pubkey } = body;

  if (!name || !capabilities || !Array.isArray(capabilities)) {
    return NextResponse.json({ error: 'name and capabilities[] required' }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

  // Max 10 agents per user
  const { data: existing } = await admin
    .from('agents')
    .select('id')
    .eq('owner_id', user.id)
    .eq('status', 'active');

  if (existing && existing.length >= 10) {
    return NextResponse.json({ error: 'Maximum 10 active agents per account' }, { status: 400 });
  }

  const { data: agent, error } = await admin
    .from('agents')
    .insert({
      owner_id: user.id,
      name,
      description: description || null,
      endpoint: endpoint || null,
      capabilities,
      pricing_model: pricingModel || 'free',
      pricing_detail: pricingDetail || null,
      pubkey: pubkey || null,
    })
    .select('id, name, capabilities, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Initialize empty credit score row
  await admin.from('agent_credit_scores').insert({ agent_id: agent.id });

  return NextResponse.json({ agent }, { status: 201 });
}
