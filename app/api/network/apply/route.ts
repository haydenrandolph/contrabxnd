import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { BUSINESS_CATEGORIES } from '@/lib/network/types';

// POST - Submit a new business application
export async function POST(request: Request) {
  const supabase = await createClient();

  if (!supabase) {
    return NextResponse.json({ error: 'Auth not configured' }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Please sign in to submit an application' }, { status: 401 });
  }

  const body = await request.json();
  const { businessName, website, category, description, contactEmail, paymentMethod } = body;

  // Validate required fields
  if (!businessName || !website || !category || !contactEmail || !paymentMethod) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Validate category
  if (!BUSINESS_CATEGORIES.includes(category)) {
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

  // Check for existing application with same website
  const { data: existing } = await supabase
    .from('network_applications')
    .select('id')
    .eq('website', website)
    .single();

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
