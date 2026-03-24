/**
 * Tests for src/app/api/webhook/route.ts
 *
 * Stripe webhook handler — processes payment confirmations,
 * marks analyses as paid in KV, sends receipt emails via Resend.
 *
 * All external dependencies mocked — no real API calls.
 *
 * Focus areas:
 *  - Missing/invalid signature → 400
 *  - Duplicate event (idempotency) → early return
 *  - checkout.session.completed → KV update + receipt email + Lee notification
 *  - Analysis not found → logs error, returns 200
 *  - Email failure → logs error, returns 200 (doesn't break webhook)
 *  - KV failure → logs error, continues
 *  - Non-checkout event → returns received:true
 */

// ---------------------------------------------------------------------------
// Mock Stripe SDK
// ---------------------------------------------------------------------------

const mockConstructEvent = jest.fn()
const mockSessionsRetrieve = jest.fn()

jest.mock('stripe', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      webhooks: {
        constructEvent: mockConstructEvent,
      },
      checkout: {
        sessions: {
          retrieve: mockSessionsRetrieve,
        },
      },
    })),
  }
})

// ---------------------------------------------------------------------------
// Mock Resend
// ---------------------------------------------------------------------------

const mockEmailsSend = jest.fn()

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: mockEmailsSend,
    },
  })),
}))

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
// Mock logger
// ---------------------------------------------------------------------------

const mockLoggerInfo = jest.fn()
const mockLoggerError = jest.fn()

jest.mock('@shared/lib/logger', () => ({
  logger: {
    info: (...args: unknown[]) => mockLoggerInfo(...args),
    error: (...args: unknown[]) => mockLoggerError(...args),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}))

// ---------------------------------------------------------------------------
// Mock next/server
// ---------------------------------------------------------------------------

jest.mock('next/server', () => {
  class MockNextRequest {
    private _body: string
    private _headers: Map<string, string>

    constructor(url: string, init?: { method?: string; body?: string; headers?: Record<string, string> }) {
      this._body = init?.body || ''
      this._headers = new Map(Object.entries(init?.headers || {}))
    }

    async text() {
      return this._body
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeWebhookRequest(body: string, signature?: string) {
  const headers: Record<string, string> = {}
  if (signature) headers['stripe-signature'] = signature
  return new NextRequest('http://localhost/api/webhook', {
    method: 'POST',
    body,
    headers,
  })
}

function makeCheckoutEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: 'evt_test_123',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_session_abc',
        metadata: {
          tool: 'Website Messaging Audit',
          analysisId: 'analysis-42',
        },
        customer_email: 'buyer@example.com',
        customer_details: { email: 'buyer@example.com' },
        amount_total: 40000, // $400 in cents
        ...overrides,
      },
    },
  }
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

let POST: (request: InstanceType<typeof NextRequest>) => Promise<{ status: number; body: unknown; json: () => Promise<unknown> }>

beforeAll(async () => {
  process.env.STRIPE_SECRET_KEY = 'sk_test_fake_key'
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret'
  process.env.RESEND_API_KEY = 're_test_key'
  process.env.KV_REST_API_URL = 'https://fake-kv.vercel.app'
  process.env.KV_REST_API_TOKEN = 'fake-token'
  const mod = await import('@/app/api/webhook/route')
  POST = mod.POST as typeof POST
})

beforeEach(() => {
  mockConstructEvent.mockReset()
  mockEmailsSend.mockReset()
  mockKvGet.mockReset()
  mockKvSet.mockReset()
  mockLoggerInfo.mockReset()
  mockLoggerError.mockReset()
})

// ===========================================================================
// Unhappy paths — signature validation
// ===========================================================================

describe('POST /api/webhook — signature validation', () => {
  it('returns 400 when stripe-signature header is missing', async () => {
    const req = makeWebhookRequest('{}')
    const res = await POST(req)

    expect(res.status).toBe(400)
    const data = await res.json() as Record<string, unknown>
    expect(data.error).toMatch(/missing signature/i)
  })

  it('returns 400 when signature is invalid', async () => {
    mockConstructEvent.mockImplementationOnce(() => {
      throw new Error('No signatures found matching the expected signature')
    })

    const req = makeWebhookRequest('{}', 'bad_sig')
    const res = await POST(req)

    expect(res.status).toBe(400)
    const data = await res.json() as Record<string, unknown>
    expect(data.error).toMatch(/invalid signature/i)
  })

  it('logs the signature verification failure', async () => {
    mockConstructEvent.mockImplementationOnce(() => {
      throw new Error('Sig mismatch')
    })

    const req = makeWebhookRequest('{}', 'bad_sig')
    await POST(req)

    expect(mockLoggerError).toHaveBeenCalledWith(
      'Webhook signature verification failed',
      expect.objectContaining({ tool: 'website-audit' })
    )
  })
})

// ===========================================================================
// Idempotency — duplicate event handling
// ===========================================================================

describe('POST /api/webhook — idempotency', () => {
  it('returns received:true without re-processing for duplicate events', async () => {
    const event = makeCheckoutEvent()
    mockConstructEvent.mockReturnValueOnce(event)
    mockKvGet.mockResolvedValueOnce(true) // already processed

    const req = makeWebhookRequest('{}', 'valid_sig')
    const res = await POST(req)

    expect(res.status).toBe(200)
    const data = await res.json() as Record<string, unknown>
    expect(data.received).toBe(true)

    // Should NOT have attempted KV state update or emails
    expect(mockEmailsSend).not.toHaveBeenCalled()
    // Only the idempotency check, not the analysis state check
    expect(mockKvGet).toHaveBeenCalledTimes(1)
    expect(mockKvGet).toHaveBeenCalledWith(`webhook:processed:${event.id}`)
  })
})

// ===========================================================================
// checkout.session.completed — KV state update
// ===========================================================================

describe('POST /api/webhook — KV state update', () => {
  it('marks analysis as paid in KV', async () => {
    const event = makeCheckoutEvent()
    mockConstructEvent.mockReturnValueOnce(event)
    mockKvGet
      .mockResolvedValueOnce(null) // not yet processed (idempotency)
      .mockResolvedValueOnce({ url: 'https://example.com', status: 'complete' }) // analysis state
    mockKvSet.mockResolvedValue(undefined)
    mockEmailsSend.mockResolvedValue({ id: 'email_1' })

    const req = makeWebhookRequest('{}', 'valid_sig')
    await POST(req)

    // Second kv.set call is the analysis state update (first may be the processed marker)
    const analysisSetCall = mockKvSet.mock.calls.find(
      (call: unknown[]) => typeof call[0] === 'string' && (call[0] as string).startsWith('analysis:')
    )
    expect(analysisSetCall).toBeDefined()
    expect(analysisSetCall![1]).toMatchObject({
      paid: true,
      paidAt: expect.any(String),
      customerEmail: 'buyer@example.com',
      amountPaid: 400,
    })
  })

  it('logs error when analysis not found in KV but returns 200', async () => {
    const event = makeCheckoutEvent()
    mockConstructEvent.mockReturnValueOnce(event)
    mockKvGet
      .mockResolvedValueOnce(null) // not yet processed
      .mockResolvedValueOnce(null) // analysis not found
    mockKvSet.mockResolvedValue(undefined)
    mockEmailsSend.mockResolvedValue({ id: 'email_1' })

    const req = makeWebhookRequest('{}', 'valid_sig')
    const res = await POST(req)

    expect(res.status).toBe(200)
    expect(mockLoggerError).toHaveBeenCalledWith(
      'Analysis not found in KV',
      expect.objectContaining({ analysisId: 'analysis-42' })
    )
  })

  it('logs error on KV failure during state update but returns 200', async () => {
    const event = makeCheckoutEvent()
    mockConstructEvent.mockReturnValueOnce(event)
    mockKvGet
      .mockResolvedValueOnce(null) // not yet processed
      .mockRejectedValueOnce(new Error('KV connection refused')) // KV fails
    mockKvSet.mockResolvedValue(undefined)
    mockEmailsSend.mockResolvedValue({ id: 'email_1' })

    const req = makeWebhookRequest('{}', 'valid_sig')
    const res = await POST(req)

    expect(res.status).toBe(200)
    expect(mockLoggerError).toHaveBeenCalledWith(
      'Failed to update analysis state in KV',
      expect.objectContaining({ tool: 'website-audit' })
    )
  })
})

// ===========================================================================
// checkout.session.completed — email sending
// ===========================================================================

describe('POST /api/webhook — email sending', () => {
  beforeEach(() => {
    // Standard setup for email tests: valid event, analysis exists
    const event = makeCheckoutEvent()
    mockConstructEvent.mockReturnValueOnce(event)
    mockKvGet
      .mockResolvedValueOnce(null) // not yet processed
      .mockResolvedValueOnce({ url: 'https://example.com', status: 'complete' })
    mockKvSet.mockResolvedValue(undefined)
  })

  it('sends receipt email to customer via Resend', async () => {
    mockEmailsSend.mockResolvedValue({ id: 'email_receipt' })

    const req = makeWebhookRequest('{}', 'valid_sig')
    await POST(req)

    // First call is customer receipt, second is Lee notification
    expect(mockEmailsSend).toHaveBeenCalledTimes(2)
    const receiptCall = mockEmailsSend.mock.calls[0][0]
    expect(receiptCall.to).toBe('buyer@example.com')
    expect(receiptCall.from).toContain('Lee Fuhr')
    expect(receiptCall.subject).toContain('results are ready')
  })

  it('sends notification email to Lee', async () => {
    mockEmailsSend.mockResolvedValue({ id: 'email_notif' })

    const req = makeWebhookRequest('{}', 'valid_sig')
    await POST(req)

    const notifyCall = mockEmailsSend.mock.calls[1][0]
    expect(notifyCall.to).toEqual(['hi@leefuhr.com'])
    expect(notifyCall.subject).toContain('buyer@example.com')
    expect(notifyCall.subject).toContain('$400')
  })

  it('constructs correct results URL for website audit (preview path)', async () => {
    mockEmailsSend.mockResolvedValue({ id: 'email_url' })

    const req = makeWebhookRequest('{}', 'valid_sig')
    await POST(req)

    const receiptCall = mockEmailsSend.mock.calls[0][0]
    expect(receiptCall.html).toContain('https://websiteaudit.leefuhr.com/preview/analysis-42')
  })

  it('logs error on email failure but returns 200', async () => {
    mockEmailsSend.mockRejectedValueOnce(new Error('Resend API down'))

    const req = makeWebhookRequest('{}', 'valid_sig')
    const res = await POST(req)

    expect(res.status).toBe(200)
    expect(mockLoggerError).toHaveBeenCalledWith(
      'Failed to send receipt email',
      expect.objectContaining({ tool: 'website-audit' })
    )
  })

  it('logs successful receipt send', async () => {
    mockEmailsSend.mockResolvedValue({ id: 'email_ok' })

    const req = makeWebhookRequest('{}', 'valid_sig')
    await POST(req)

    expect(mockLoggerInfo).toHaveBeenCalledWith(
      'Receipt sent',
      expect.objectContaining({ customerEmail: 'buyer@example.com' })
    )
  })
})

// ===========================================================================
// Non-checkout events
// ===========================================================================

describe('POST /api/webhook — non-checkout events', () => {
  it('returns received:true without processing for non-checkout events', async () => {
    mockConstructEvent.mockReturnValueOnce({
      id: 'evt_other',
      type: 'payment_intent.succeeded',
      data: { object: {} },
    })

    const req = makeWebhookRequest('{}', 'valid_sig')
    const res = await POST(req)

    expect(res.status).toBe(200)
    const data = await res.json() as Record<string, unknown>
    expect(data.received).toBe(true)

    // Should not touch KV or send emails
    expect(mockKvGet).not.toHaveBeenCalled()
    expect(mockEmailsSend).not.toHaveBeenCalled()
  })
})

// ===========================================================================
// Idempotency marker — marks event as processed
// ===========================================================================

describe('POST /api/webhook — processed marker', () => {
  it('marks event as processed in KV after handling', async () => {
    const event = makeCheckoutEvent()
    mockConstructEvent.mockReturnValueOnce(event)
    mockKvGet
      .mockResolvedValueOnce(null) // not yet processed
      .mockResolvedValueOnce({ url: 'https://example.com', status: 'complete' })
    mockKvSet.mockResolvedValue(undefined)
    mockEmailsSend.mockResolvedValue({ id: 'email_ok' })

    const req = makeWebhookRequest('{}', 'valid_sig')
    await POST(req)

    const processedCall = mockKvSet.mock.calls.find(
      (call: unknown[]) => typeof call[0] === 'string' && (call[0] as string).startsWith('webhook:processed:')
    )
    expect(processedCall).toBeDefined()
    expect(processedCall![0]).toBe(`webhook:processed:${event.id}`)
    expect(processedCall![1]).toBe(true)
    expect(processedCall![2]).toEqual({ ex: 86400 * 7 }) // 7-day TTL
  })
})
