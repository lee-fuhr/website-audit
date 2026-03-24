/**
 * Payment Verification API Route
 * Website Messaging Audit
 *
 * Called when user returns from Stripe checkout with session_id.
 * Verifies payment with Stripe and marks analysis as paid in KV.
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { kv } from '@vercel/kv';

let _stripe: Stripe | null = null;
function getStripe() {
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-12-15.clover' });
  return _stripe;
}
const useKV = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;

export async function POST(request: NextRequest) {
  try {
    const { analysisId, sessionId } = await request.json();

    if (!analysisId || !sessionId) {
      return NextResponse.json(
        { success: false, error: 'Missing analysisId or sessionId' },
        { status: 400 }
      );
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { success: false, error: 'Payment verification unavailable' },
        { status: 503 }
      );
    }

    // Retrieve Stripe session and verify payment
    let session: Stripe.Checkout.Session;
    try {
      session = await getStripe().checkout.sessions.retrieve(sessionId);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 400 }
      );
    }

    // Verify the session is actually paid and belongs to this analysis
    if (
      session.payment_status !== 'paid' ||
      session.metadata?.analysisId !== analysisId
    ) {
      return NextResponse.json(
        { success: false, error: 'Payment not confirmed', paid: false },
        { status: 402 }
      );
    }

    // Mark analysis as paid in KV
    if (useKV) {
      try {
        const state = await kv.get<Record<string, unknown>>(`analysis:${analysisId}`);
        if (state && !state.paid) {
          await kv.set(
            `analysis:${analysisId}`,
            {
              ...state,
              paid: true,
              paidAt: new Date().toISOString(),
              customerEmail: session.customer_email || session.customer_details?.email,
              amountPaid: (session.amount_total || 0) / 100,
            },
            { ex: 86400 * 30 } // 30 days post-payment
          );
        }
      } catch (kvError) {
        console.error('[verify-payment] KV update failed:', kvError);
        // Still return paid=true since Stripe confirmed payment
      }
    }

    return NextResponse.json({ success: true, paid: true });
  } catch (error) {
    console.error('[verify-payment] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Verification failed' },
      { status: 500 }
    );
  }
}
