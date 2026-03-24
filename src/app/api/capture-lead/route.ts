import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { displayPrice } from '@shared/config/pricing'
import { logger } from '@shared/lib/logger'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

export async function POST(request: NextRequest) {
  try {
    const { email, analysisId, url } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    try {
      await getResend().emails.send({
        from: 'Website Audit <tools@leefuhr.com>',
        to: ['hi@leefuhr.com'],
        subject: `New lead: ${email} — Website Audit`,
        html: `<p style="font-family:sans-serif"><strong>${email}</strong> saw their free website audit preview and left their email.</p>
<p style="font-family:sans-serif">Site audited: <code>${url || 'unknown'}</code></p>
<p style="font-family:sans-serif">Analysis ID: <code>${analysisId || 'none'}</code></p>
<p style="font-family:sans-serif">They have not yet paid (${displayPrice('website-audit')}). Good time to follow up directly.</p>`,
      })
    } catch (emailErr) {
      logger.error('Failed to notify Lee', { tool: 'website-audit', fn: 'POST /api/capture-lead', err: String(emailErr) })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error('Capture lead error', { tool: 'website-audit', fn: 'POST /api/capture-lead', err: String(err) })
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
