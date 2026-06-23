import { NextResponse } from 'next/server';
import { authenticateApiKey, apiResponse } from '@/lib/api-auth';
import { createAdminClient } from '@/lib/supabase/server';

// GET: discover agents via public API
export async function GET(req: Request) {
  const auth = await authenticateApiKey(req);
  if (!auth.ok) return auth.response;

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
      verified, featured, created_at,
      agent_credit_scores (composite_score, accuracy, volume)
    `)
    .eq('status', 'active')
    .order('featured', { ascending: false })
    .limit(limit);

  if (capability) query = query.contains('capabilities', [capability]);

  const { data: agents, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let results = (agents || []).map(a => {
    const scores = (a as Record<string, unknown>).agent_credit_scores as Record<string, unknown> | null;
    return {
      id: a.id,
      name: a.name,
      description: a.description,
      endpoint: a.endpoint,
      capabilities: a.capabilities,
      pricingModel: a.pricing_model,
      verified: a.verified,
      featured: a.featured,
      creditScore: scores?.composite_score ?? null,
      accuracy: scores?.accuracy ?? null,
      predictionVolume: scores?.volume ?? 0,
    };
  });

  if (minScore > 0) {
    results = results.filter(a => a.creditScore !== null && (a.creditScore as number) >= minScore);
  }

  return apiResponse({ agents: results, count: results.length }, auth);
}

// POST: register an agent via API key
export async function POST(req: Request) {
  const auth = await authenticateApiKey(req);
  if (!auth.ok) return auth.response;

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

  const body = await req.json();
  const { name, description, endpoint, capabilities, pricingModel, pubkey } = body;

  if (!name || !capabilities || !Array.isArray(capabilities)) {
    return NextResponse.json({ error: 'name and capabilities[] required' }, { status: 400 });
  }

  const { data: agent, error } = await admin
    .from('agents')
    .insert({
      owner_id: auth.userId,
      name,
      description: description || null,
      endpoint: endpoint || null,
      capabilities,
      pricing_model: pricingModel || 'free',
      pubkey: pubkey || null,
    })
    .select('id, name, capabilities, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from('agent_credit_scores').insert({ agent_id: agent.id });

  return apiResponse({ agent }, auth);
}
