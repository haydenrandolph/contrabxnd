import { NextResponse } from 'next/server';
import { BUSINESS_CATEGORIES } from '@/lib/network/types';
import { requireUser, readJson } from '@/lib/supabase/auth';

// POST - Submit a new business application
export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { supabase, user } = auth;

  const parsed = await readJson<{
    businessName?: string;
    website?: string;
    category?: string;
    description?: string;
    contactEmail?: string;
    paymentMethod?: string;
  }>(request);
  if (parsed.error) return parsed.error;
  const { businessName, website, category, description, contactEmail, paymentMethod } = parsed.body;

  // Validate required fields
  if (!businessName || !website || !category || !contactEmail || !paymentMethod) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Validate category
  if (!(BUSINESS_CATEGORIES as readonly string[]).includes(category)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
  }

  // Validate payment method
  const validPaymentMethods = ['lightning', 'onchain', 'both', 'processor'];
  if (!validPaymentMethods.includes(paymentMethod)) {
    return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
  }

  // Validate website URL
  try {
    new URL(website);
  } catch {
    return NextResponse.json({ error: 'Invalid website URL' }, { status: 400 });
  }

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(contactEmail)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  // Check for existing application with same website. maybeSingle() returns
  // null (not an error) when there's no match — the common case.
  const { data: existing } = await supabase
    .from('network_applications')
    .select('id')
    .eq('website', website)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: 'An application for this website already exists' },
      { status: 409 }
    );
  }

  // Insert application
  const { data, error } = await supabase
    .from('network_applications')
    .insert({
      business_name: businessName,
      website,
      category,
      description: description || null,
      contact_email: contactEmail,
      payment_method: paymentMethod,
      user_id: user.id,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('Error inserting application:', error);
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    application: data,
  });
}
