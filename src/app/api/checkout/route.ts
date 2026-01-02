/**
 * Stripe Checkout API Route
 * Website Messaging Audit - $400
 */

// Force dynamic to skip static generation
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Lazy initialization to avoid build-time errors
const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!);

const TOOL_NAME = 'Website Messaging Audit';
const TOOL_PRICE = 400;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { analysisId, email, promoCode } = body;

    if (!analysisId) {
      return NextResponse.json(
        { success: false, error: 'Missing analysis ID' },
        { status: 400 }
      );
    }

    // Calculate price (handle promo codes if needed)
    let finalPrice = TOOL_PRICE;
    let discount = 0;

    if (promoCode === 'LAUNCH30') {
      discount = Math.round(TOOL_PRICE * 0.3);
      finalPrice = TOOL_PRICE - discount;
    }

    // Get the base URL for redirects
    const origin = request.headers.get('origin') || 'https://websiteaudit.leefuhr.com';

    // Create Stripe Checkout session
    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: TOOL_NAME,
              description: `One-time analysis · Instant access · 30-day guarantee`,
            },
            unit_amount: finalPrice * 100,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/results/${analysisId}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/preview/${analysisId}`,
      customer_email: email,
      metadata: {
        tool: TOOL_NAME,
        analysisId,
        originalPrice: TOOL_PRICE.toString(),
        discount: discount.toString(),
        promoCode: promoCode || '',
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
