/**
 * Stripe Webhook Handler
 * Website Messaging Audit
 *
 * Handles payment confirmation and sends receipt emails
 */

// Force dynamic to skip static generation
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { Resend } from 'resend';
import { kv } from '@vercel/kv';
import { logger } from '@shared/lib/logger';

let _stripe: Stripe | null = null;
function getStripe() {
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-12-15.clover' });
  return _stripe;
}

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

// Check if KV is available
const useKV = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    logger.error('Webhook signature verification failed', { tool: 'website-audit', fn: 'route handler', err: String(err) });
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    // Idempotency check: prevent double-processing the same webhook event
    const eventId = event.id;
    if (useKV) {
      const alreadyProcessed = await kv.get(`webhook:processed:${eventId}`);
      if (alreadyProcessed) {
        return NextResponse.json({ received: true });
      }
    }

    const session = event.data.object as Stripe.Checkout.Session;

    const { tool, analysisId } = session.metadata || {};
    const customerEmail = session.customer_email || session.customer_details?.email;
    const amountPaid = (session.amount_total || 0) / 100;

    // CRITICAL: Update analysis state to mark as paid
    if (analysisId && useKV) {
      try {
        const state = await kv.get<Record<string, unknown>>(`analysis:${analysisId}`);
        if (state) {
          await kv.set(`analysis:${analysisId}`, {
            ...state,
            paid: true,
            paidAt: new Date().toISOString(),
            customerEmail,
            amountPaid,
          }, { ex: 86400 * 30 }); // Extend TTL to 30 days after payment
          logger.info('Marked analysis as paid', { tool: 'website-audit', fn: 'route handler', analysisId, customerEmail });
        } else {
          logger.error('Analysis not found in KV', { tool: 'website-audit', fn: 'route handler', analysisId });
        }
      } catch (kvError) {
        logger.error('Failed to update analysis state in KV', { tool: 'website-audit', fn: 'route handler', err: String(kvError) });
      }
    }

    if (customerEmail && analysisId) {
      try {
        const toolUrls: Record<string, string> = {
          'Website Messaging Audit': 'https://websiteaudit.leefuhr.com',
          'Proposal Analyzer': 'https://proposalanalyzer.leefuhr.com',
          'Risk Translator': 'https://risktranslator.leefuhr.com',
          'Case Study Extractor': 'https://casestudyextractor.leefuhr.com',
        };

        const baseUrl = toolUrls[tool || ''] || 'https://leefuhr.com';
        // Website audit uses /preview/ not /results/
        const pathSegment = tool === 'Website Messaging Audit' ? 'preview' : 'results';
        const resultsUrl = `${baseUrl}/${pathSegment}/${analysisId}`;

        await getResend().emails.send({
          from: 'Lee Fuhr <tools@leefuhr.com>',
          to: customerEmail,
          subject: `Your ${tool} results are ready`,
          html: generateReceiptEmail({
            toolName: tool || 'Analysis',
            price: amountPaid,
            resultsUrl,
          }),
        });

        logger.info('Receipt sent', { tool: 'website-audit', fn: 'route handler', customerEmail, toolName: tool });

        // Notify Lee
        await getResend().emails.send({
          from: 'LFI Tools <tools@leefuhr.com>',
          to: ['hi@leefuhr.com'],
          subject: `New paid lead: ${customerEmail} — ${tool} ($${amountPaid})`,
          html: `<p style="font-family:sans-serif"><strong>${customerEmail}</strong> just paid $${amountPaid} for ${tool}.</p><p style="font-family:sans-serif"><a href="${resultsUrl}">View their results →</a></p>`,
        });
      } catch (emailError) {
        logger.error('Failed to send receipt email', { tool: 'website-audit', fn: 'route handler', err: String(emailError) });
      }
    }

    // Mark event as processed to prevent double-sends (7-day TTL)
    if (useKV) {
      await kv.set(`webhook:processed:${eventId}`, true, { ex: 86400 * 7 });
    }
  }

  return NextResponse.json({ received: true });
}

function generateReceiptEmail({
  toolName,
  price,
  resultsUrl,
}: {
  toolName: string;
  price: number;
  resultsUrl: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 48px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px;">
          <tr>
            <td style="padding-bottom: 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="color: #0f172a; font-size: 18px; font-weight: 700; margin: 0;">Lee Fuhr</p>
                  </td>
                  <td align="right">
                    <p style="color: #64748b; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; margin: 0;">Receipt</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="background-color: #ffffff; padding: 48px; border: 1px solid #e2e8f0; border-radius: 8px;">
              <table cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="background-color: #d1fae5; padding: 8px 16px; border-radius: 4px;">
                    <p style="color: #059669; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin: 0;">
                      ✓ Payment confirmed
                    </p>
                  </td>
                </tr>
              </table>

              <h1 style="color: #0f172a; font-size: 28px; font-weight: 700; margin: 0 0 16px 0; line-height: 1.2;">
                Your results are ready
              </h1>

              <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
                Your ${toolName} analysis is complete. Click below to view your full report.
              </p>

              <table cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                <tr>
                  <td style="background-color: #1a3a5c; padding: 16px 32px; border-radius: 4px;">
                    <a href="${resultsUrl}" style="color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">
                      View your results →
                    </a>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="border-top: 1px solid #e2e8f0; padding-top: 24px;">
                <tr>
                  <td style="padding-bottom: 16px;">
                    <p style="color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; margin: 0;">
                      Order details
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #f8fafc; padding: 16px; border-radius: 4px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color: #0f172a; font-size: 14px; font-weight: 500;">${toolName}</td>
                        <td align="right" style="color: #0f172a; font-size: 14px; font-weight: 700;">$${price}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding-top: 32px; text-align: center;">
              <p style="color: #64748b; font-size: 13px; margin: 0 0 8px 0;">
                Questions? Reply to this email or contact <a href="mailto:hi@leefuhr.com" style="color: #1a3a5c; text-decoration: none; font-weight: 500;">hi@leefuhr.com</a>
              </p>
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                Lee Fuhr Inc · Messaging for manufacturers
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
