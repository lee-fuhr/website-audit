/**
 * Tests for src/app/api/checkout/route.ts
 *
 * Stripe Checkout session creation route.
 * All external dependencies are mocked — no real API calls.
 *
 * Focus areas:
 *  - Missing/invalid input → 400
 *  - Stripe session creation failure → 500
 *  - Successful checkout → 200 with session URL
 *  - Promo code handling → correct price calculation
 *  - Stripe metadata → correct tool name, analysisId, etc.
 */

// ---------------------------------------------------------------------------
// Mock Stripe SDK
// ---------------------------------------------------------------------------

const mockSessionsCreate = jest.fn()

jest.mock('stripe', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      checkout: {
        sessions: {
          create: mockSessionsCreate,
        },
      },
    })),
  }
})

// ---------------------------------------------------------------------------
// Mock next/server — minimal NextRequest/NextResponse for route handler
// ---------------------------------------------------------------------------

jest.mock('next/server', () => {
  class MockNextRequest {
    private _body: string
    private _headers: Map<string, string>

    constructor(url: string, init?: { method?: string; body?: string; headers?: Record<string, string> }) {
      this._body = init?.body || '{}'
      this._headers = new Map(Object.entries(init?.headers || {}))
    }

    async json() {
      return JSON.parse(this._body)
    }

    get headers() {
      return {
        get: (name: string) => this._headers.get(name) || null,
      }
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
import { PRICING } from '@shared/config/pricing'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const pricing = PRICING['website-audit']

function makeRequest(body: Record<string, unknown>, headers?: Record<string, string>) {
  return new NextRequest('http://localhost/api/checkout', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { origin: 'https://websiteaudit.leefuhr.com', ...headers },
  })
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

let POST: (request: InstanceType<typeof NextRequest>) => Promise<{ status: number; body: unknown; json: () => Promise<unknown> }>

beforeAll(async () => {
  process.env.STRIPE_SECRET_KEY = 'sk_test_fake_key'
  const mod = await import('@/app/api/checkout/route')
  POST = mod.POST as typeof POST
})

beforeEach(() => {
  mockSessionsCreate.mockReset()
})

// ===========================================================================
// Unhappy paths
// ===========================================================================

describe('POST /api/checkout — unhappy paths', () => {
  it('returns 400 when analysisId is missing', async () => {
    const req = makeRequest({ email: 'test@example.com' })
    const res = await POST(req)

    expect(res.status).toBe(400)
    const data = await res.json() as Record<string, unknown>
    expect(data.success).toBe(false)
    expect(data.error).toMatch(/missing analysis/i)
  })

  it('returns 400 when analysisId is empty string', async () => {
    const req = makeRequest({ analysisId: '', email: 'test@example.com' })
    const res = await POST(req)

    expect(res.status).toBe(400)
    const data = await res.json() as Record<string, unknown>
    expect(data.success).toBe(false)
  })

  it('returns 500 when Stripe session creation fails', async () => {
    mockSessionsCreate.mockRejectedValueOnce(new Error('Stripe API down'))

    const req = makeRequest({ analysisId: 'abc-123', email: 'test@example.com' })
    const res = await POST(req)

    expect(res.status).toBe(500)
    const data = await res.json() as Record<string, unknown>
    expect(data.success).toBe(false)
    expect(data.error).toMatch(/failed to create checkout/i)
  })

  it('logs the error when Stripe fails', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    mockSessionsCreate.mockRejectedValueOnce(new Error('Stripe timeout'))

    const req = makeRequest({ analysisId: 'abc-123', email: 'test@example.com' })
    await POST(req)

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[ERROR]'),
      'Checkout error',
      expect.objectContaining({ tool: 'website-audit', fn: 'POST /api/checkout' })
    )
    consoleSpy.mockRestore()
  })
})

// ===========================================================================
// Happy paths
// ===========================================================================

describe('POST /api/checkout — happy paths', () => {
  it('returns 200 with session URL on successful checkout', async () => {
    mockSessionsCreate.mockResolvedValueOnce({
      id: 'cs_test_session_123',
      url: 'https://checkout.stripe.com/pay/cs_test_session_123',
    })

    const req = makeRequest({ analysisId: 'abc-123', email: 'buyer@example.com' })
    const res = await POST(req)

    expect(res.status).toBe(200)
    const data = await res.json() as Record<string, unknown>
    expect(data.success).toBe(true)
    expect(data.checkoutUrl).toBe('https://checkout.stripe.com/pay/cs_test_session_123')
    expect(data.sessionId).toBe('cs_test_session_123')
  })

  it('passes correct base price to Stripe (in cents)', async () => {
    mockSessionsCreate.mockResolvedValueOnce({ id: 'cs_1', url: 'https://stripe.com' })

    const req = makeRequest({ analysisId: 'abc-123', email: 'buyer@example.com' })
    await POST(req)

    expect(mockSessionsCreate).toHaveBeenCalledTimes(1)
    const createArgs = mockSessionsCreate.mock.calls[0][0]
    expect(createArgs.line_items[0].price_data.unit_amount).toBe(pricing.base * 100)
  })

  it('applies promo code discount correctly', async () => {
    mockSessionsCreate.mockResolvedValueOnce({ id: 'cs_promo', url: 'https://stripe.com' })

    const req = makeRequest({
      analysisId: 'abc-123',
      email: 'buyer@example.com',
      promoCode: pricing.promo.code,
    })
    await POST(req)

    const createArgs = mockSessionsCreate.mock.calls[0][0]
    expect(createArgs.line_items[0].price_data.unit_amount).toBe(pricing.promo.discounted * 100)
  })

  it('ignores invalid promo code and charges full price', async () => {
    mockSessionsCreate.mockResolvedValueOnce({ id: 'cs_full', url: 'https://stripe.com' })

    const req = makeRequest({
      analysisId: 'abc-123',
      email: 'buyer@example.com',
      promoCode: 'INVALID_CODE',
    })
    await POST(req)

    const createArgs = mockSessionsCreate.mock.calls[0][0]
    expect(createArgs.line_items[0].price_data.unit_amount).toBe(pricing.base * 100)
  })
})

// ===========================================================================
// Stripe metadata
// ===========================================================================

describe('POST /api/checkout — Stripe metadata', () => {
  it('includes tool name in metadata', async () => {
    mockSessionsCreate.mockResolvedValueOnce({ id: 'cs_meta', url: 'https://stripe.com' })

    const req = makeRequest({ analysisId: 'abc-123', email: 'buyer@example.com' })
    await POST(req)

    const createArgs = mockSessionsCreate.mock.calls[0][0]
    expect(createArgs.metadata.tool).toBe('Website Messaging Audit')
  })

  it('includes analysisId in metadata', async () => {
    mockSessionsCreate.mockResolvedValueOnce({ id: 'cs_meta2', url: 'https://stripe.com' })

    const req = makeRequest({ analysisId: 'my-analysis-42', email: 'buyer@example.com' })
    await POST(req)

    const createArgs = mockSessionsCreate.mock.calls[0][0]
    expect(createArgs.metadata.analysisId).toBe('my-analysis-42')
  })

  it('includes discount info in metadata when promo applied', async () => {
    mockSessionsCreate.mockResolvedValueOnce({ id: 'cs_discount', url: 'https://stripe.com' })
    const expectedDiscount = pricing.base - pricing.promo.discounted

    const req = makeRequest({
      analysisId: 'abc-123',
      email: 'buyer@example.com',
      promoCode: pricing.promo.code,
    })
    await POST(req)

    const createArgs = mockSessionsCreate.mock.calls[0][0]
    expect(createArgs.metadata.originalPrice).toBe(pricing.base.toString())
    expect(createArgs.metadata.discount).toBe(expectedDiscount.toString())
    expect(createArgs.metadata.promoCode).toBe(pricing.promo.code)
  })

  it('sets discount to 0 and promoCode to empty when no promo', async () => {
    mockSessionsCreate.mockResolvedValueOnce({ id: 'cs_nopromo', url: 'https://stripe.com' })

    const req = makeRequest({ analysisId: 'abc-123', email: 'buyer@example.com' })
    await POST(req)

    const createArgs = mockSessionsCreate.mock.calls[0][0]
    expect(createArgs.metadata.discount).toBe('0')
    expect(createArgs.metadata.promoCode).toBe('')
  })

  it('sets customer_email on the Stripe session', async () => {
    mockSessionsCreate.mockResolvedValueOnce({ id: 'cs_email', url: 'https://stripe.com' })

    const req = makeRequest({ analysisId: 'abc-123', email: 'buyer@example.com' })
    await POST(req)

    const createArgs = mockSessionsCreate.mock.calls[0][0]
    expect(createArgs.customer_email).toBe('buyer@example.com')
  })

  it('constructs correct success_url with analysisId', async () => {
    mockSessionsCreate.mockResolvedValueOnce({ id: 'cs_url', url: 'https://stripe.com' })

    const req = makeRequest({ analysisId: 'abc-123', email: 'buyer@example.com' })
    await POST(req)

    const createArgs = mockSessionsCreate.mock.calls[0][0]
    expect(createArgs.success_url).toContain('/preview/abc-123')
    expect(createArgs.success_url).toContain('{CHECKOUT_SESSION_ID}')
  })
})
