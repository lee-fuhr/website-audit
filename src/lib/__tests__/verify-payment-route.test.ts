/**
 * Tests for src/app/api/verify-payment/route.ts
 *
 * Payment verification route — called when user returns from Stripe
 * checkout with session_id. Verifies payment and marks analysis as paid.
 *
 * All external dependencies mocked — no real API calls.
 *
 * Focus areas:
 *  - Missing params → 400
 *  - Missing STRIPE_SECRET_KEY → 503
 *  - Invalid Stripe session → error response
 *  - Metadata mismatch → 402
 *  - Unpaid session → 402
 *  - Successful verification → marks paid in KV, returns success
 *  - KV failure → logs error but still returns paid=true
 */

// ---------------------------------------------------------------------------
// Mock Stripe SDK
// ---------------------------------------------------------------------------

const mockSessionsRetrieve = jest.fn()

jest.mock('stripe', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      checkout: {
        sessions: {
          retrieve: mockSessionsRetrieve,
        },
      },
    })),
  }
})

// ---------------------------------------------------------------------------
// Mock @vercel/kv
// ---------------------------------------------------------------------------

const mockKvGet = jest.fn()
const mockKvSet = jest.fn()

jest.mock('@vercel/kv', () => ({
  kv: {
    get: (...args: unknown[]) => mockKvGet(...args),
    set: (...args: unknown[]) => mockKvSet(...args),
  },
}))

// ---------------------------------------------------------------------------
// Mock next/server
// ---------------------------------------------------------------------------

jest.mock('next/server', () => {
  class MockNextRequest {
    private _body: string

    constructor(url: string, init?: { method?: string; body?: string }) {
      this._body = init?.body || '{}'
    }

    async json() {
      return JSON.parse(this._body)
    }
  }

  return {
    NextRequest: MockNextRequest,
    NextResponse: {
      json: (body: unknown, init?: { status?: number }) => ({
        status: init?.status || 200,
        body,
        async json() { return body },
      }),
    },
  }
})

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { NextRequest } from 'next/server'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/verify-payment', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

function makeStripeSession(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cs_test_session_123',
    payment_status: 'paid',
    metadata: {
      analysisId: 'analysis-42',
      tool: 'Website Messaging Audit',
    },
    customer_email: 'buyer@example.com',
    customer_details: { email: 'buyer@example.com' },
    amount_total: 40000,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

let POST: (request: InstanceType<typeof NextRequest>) => Promise<{ status: number; body: unknown; json: () => Promise<unknown> }>

beforeAll(async () => {
  process.env.STRIPE_SECRET_KEY = 'sk_test_fake_key'
  process.env.KV_REST_API_URL = 'https://fake-kv.vercel.app'
  process.env.KV_REST_API_TOKEN = 'fake-token'
  const mod = await import('@/app/api/verify-payment/route')
  POST = mod.POST as typeof POST
})

beforeEach(() => {
  mockSessionsRetrieve.mockReset()
  mockKvGet.mockReset()
  mockKvSet.mockReset()
})

// ===========================================================================
// Unhappy paths — input validation
// ===========================================================================

describe('POST /api/verify-payment — input validation', () => {
  it('returns 400 when analysisId is missing', async () => {
    const req = makeRequest({ sessionId: 'cs_test_123' })
    const res = await POST(req)

    expect(res.status).toBe(400)
    const data = await res.json() as Record<string, unknown>
    expect(data.success).toBe(false)
    expect(data.error).toMatch(/missing/i)
  })

  it('returns 400 when sessionId is missing', async () => {
    const req = makeRequest({ analysisId: 'analysis-42' })
    const res = await POST(req)

    expect(res.status).toBe(400)
    const data = await res.json() as Record<string, unknown>
    expect(data.success).toBe(false)
    expect(data.error).toMatch(/missing/i)
  })

  it('returns 400 when both params are missing', async () => {
    const req = makeRequest({})
    const res = await POST(req)

    expect(res.status).toBe(400)
  })
})

// ===========================================================================
// Unhappy paths — Stripe failures
// ===========================================================================

describe('POST /api/verify-payment — Stripe failures', () => {
  it('returns 400 when Stripe session cannot be retrieved', async () => {
    mockSessionsRetrieve.mockRejectedValueOnce(new Error('No such checkout session'))

    const req = makeRequest({ analysisId: 'analysis-42', sessionId: 'cs_invalid' })
    const res = await POST(req)

    expect(res.status).toBe(400)
    const data = await res.json() as Record<string, unknown>
    expect(data.success).toBe(false)
    expect(data.error).toMatch(/invalid session/i)
  })
})

// ===========================================================================
// Unhappy paths — payment not confirmed
// ===========================================================================

describe('POST /api/verify-payment — payment not confirmed', () => {
  it('returns 402 when payment_status is not paid', async () => {
    mockSessionsRetrieve.mockResolvedValueOnce(
      makeStripeSession({ payment_status: 'unpaid' })
    )

    const req = makeRequest({ analysisId: 'analysis-42', sessionId: 'cs_test_123' })
    const res = await POST(req)

    expect(res.status).toBe(402)
    const data = await res.json() as Record<string, unknown>
    expect(data.success).toBe(false)
    expect(data.paid).toBe(false)
  })

  it('returns 402 when analysisId in metadata does not match request', async () => {
    mockSessionsRetrieve.mockResolvedValueOnce(
      makeStripeSession({
        metadata: { analysisId: 'different-analysis', tool: 'Website Messaging Audit' },
      })
    )

    const req = makeRequest({ analysisId: 'analysis-42', sessionId: 'cs_test_123' })
    const res = await POST(req)

    expect(res.status).toBe(402)
    const data = await res.json() as Record<string, unknown>
    expect(data.success).toBe(false)
    expect(data.paid).toBe(false)
  })
})

// ===========================================================================
// Happy path — successful verification
// ===========================================================================

describe('POST /api/verify-payment — successful verification', () => {
  it('returns success with paid=true when Stripe confirms payment', async () => {
    mockSessionsRetrieve.mockResolvedValueOnce(makeStripeSession())
    mockKvGet.mockResolvedValueOnce({ url: 'https://example.com', status: 'complete' })
    mockKvSet.mockResolvedValue(undefined)

    const req = makeRequest({ analysisId: 'analysis-42', sessionId: 'cs_test_123' })
    const res = await POST(req)

    expect(res.status).toBe(200)
    const data = await res.json() as Record<string, unknown>
    expect(data.success).toBe(true)
    expect(data.paid).toBe(true)
  })

  it('marks analysis as paid in KV', async () => {
    mockSessionsRetrieve.mockResolvedValueOnce(makeStripeSession())
    mockKvGet.mockResolvedValueOnce({ url: 'https://example.com', status: 'complete' })
    mockKvSet.mockResolvedValue(undefined)

    const req = makeRequest({ analysisId: 'analysis-42', sessionId: 'cs_test_123' })
    await POST(req)

    expect(mockKvSet).toHaveBeenCalledWith(
      'analysis:analysis-42',
      expect.objectContaining({
        paid: true,
        paidAt: expect.any(String),
        customerEmail: 'buyer@example.com',
        amountPaid: 400,
      }),
      { ex: 86400 * 30 }
    )
  })

  it('skips KV update if analysis already marked as paid', async () => {
    mockSessionsRetrieve.mockResolvedValueOnce(makeStripeSession())
    mockKvGet.mockResolvedValueOnce({ url: 'https://example.com', status: 'complete', paid: true })

    const req = makeRequest({ analysisId: 'analysis-42', sessionId: 'cs_test_123' })
    const res = await POST(req)

    expect(res.status).toBe(200)
    const data = await res.json() as Record<string, unknown>
    expect(data.paid).toBe(true)
    // Should not write to KV since already paid
    expect(mockKvSet).not.toHaveBeenCalled()
  })

  it('uses customer_details.email as fallback when customer_email is null', async () => {
    mockSessionsRetrieve.mockResolvedValueOnce(
      makeStripeSession({ customer_email: null })
    )
    mockKvGet.mockResolvedValueOnce({ url: 'https://example.com', status: 'complete' })
    mockKvSet.mockResolvedValue(undefined)

    const req = makeRequest({ analysisId: 'analysis-42', sessionId: 'cs_test_123' })
    await POST(req)

    expect(mockKvSet).toHaveBeenCalledWith(
      'analysis:analysis-42',
      expect.objectContaining({
        customerEmail: 'buyer@example.com', // falls back to customer_details.email
      }),
      expect.any(Object)
    )
  })
})

// ===========================================================================
// KV failure during update
// ===========================================================================

describe('POST /api/verify-payment — KV failure', () => {
  it('returns paid=true even when KV update fails (Stripe is source of truth)', async () => {
    mockSessionsRetrieve.mockResolvedValueOnce(makeStripeSession())
    mockKvGet.mockRejectedValueOnce(new Error('KV connection refused'))

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    const req = makeRequest({ analysisId: 'analysis-42', sessionId: 'cs_test_123' })
    const res = await POST(req)

    expect(res.status).toBe(200)
    const data = await res.json() as Record<string, unknown>
    expect(data.paid).toBe(true)
    expect(data.success).toBe(true)

    consoleSpy.mockRestore()
  })

  it('logs the KV error', async () => {
    mockSessionsRetrieve.mockResolvedValueOnce(makeStripeSession())
    mockKvGet.mockRejectedValueOnce(new Error('KV timeout'))

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    const req = makeRequest({ analysisId: 'analysis-42', sessionId: 'cs_test_123' })
    await POST(req)

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[ERROR]'),
      'KV update failed',
      expect.objectContaining({ tool: 'website-audit', fn: 'POST /api/verify-payment' })
    )

    consoleSpy.mockRestore()
  })
})

// ===========================================================================
// Missing STRIPE_SECRET_KEY
// ===========================================================================

describe('POST /api/verify-payment — missing Stripe key', () => {
  it('returns 503 when STRIPE_SECRET_KEY is not set', async () => {
    // We need a fresh module import with no STRIPE_SECRET_KEY
    const savedKey = process.env.STRIPE_SECRET_KEY
    delete process.env.STRIPE_SECRET_KEY

    // Clear module cache to re-evaluate the route with new env
    jest.resetModules()

    // Re-apply mocks after resetModules
    jest.mock('stripe', () => ({
      __esModule: true,
      default: jest.fn().mockImplementation(() => ({
        checkout: { sessions: { retrieve: mockSessionsRetrieve } },
      })),
    }))
    jest.mock('@vercel/kv', () => ({
      kv: {
        get: (...args: unknown[]) => mockKvGet(...args),
        set: (...args: unknown[]) => mockKvSet(...args),
      },
    }))
    jest.mock('next/server', () => {
      class MockNextRequest {
        private _body: string
        constructor(url: string, init?: { method?: string; body?: string }) {
          this._body = init?.body || '{}'
        }
        async json() { return JSON.parse(this._body) }
      }
      return {
        NextRequest: MockNextRequest,
        NextResponse: {
          json: (body: unknown, init?: { status?: number }) => ({
            status: init?.status || 200,
            body,
            async json() { return body },
          }),
        },
      }
    })

    const { NextRequest: FreshNextRequest } = await import('next/server')
    const freshMod = await import('@/app/api/verify-payment/route')
    const freshPOST = freshMod.POST as typeof POST

    const req = new FreshNextRequest('http://localhost/api/verify-payment', {
      method: 'POST',
      body: JSON.stringify({ analysisId: 'analysis-42', sessionId: 'cs_test_123' }),
    })
    const res = await freshPOST(req)

    expect(res.status).toBe(503)
    const data = await res.json() as Record<string, unknown>
    expect(data.error).toMatch(/unavailable/i)

    // Restore
    process.env.STRIPE_SECRET_KEY = savedKey
  })
})
