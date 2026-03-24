import { NextResponse } from 'next/server'

export async function GET() {
  const checks: Record<string, boolean | string> = {}

  // Check KV
  try {
    const { kv } = await import('@vercel/kv')
    await kv.ping()
    checks.kv = true
  } catch {
    checks.kv = 'unavailable'
  }

  // Check Anthropic API key present (validate config, don't ping)
  checks.anthropic = !!process.env.ANTHROPIC_API_KEY

  // Check Stripe key present
  checks.stripe = !!process.env.STRIPE_SECRET_KEY

  // Check Resend key present
  checks.resend = !!process.env.RESEND_API_KEY

  const healthy = !Object.values(checks).some(v => typeof v === 'string')

  return NextResponse.json(
    {
      status: healthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
      version: process.env.npm_package_version || 'unknown',
    },
    { status: healthy ? 200 : 503 }
  )
}
