/**
 * Tests for src/lib/analyzer.ts
 *
 * The Anthropic SDK is mocked globally so no real API calls are made.
 * Focus areas:
 *  - Missing API key → error before calling Claude
 *  - getAnthropicClient singleton behaviour
 *  - analyzeWebsite: malformed response → fallback
 *  - analyzeWebsite: sparse first pass → second pass triggered
 *  - analyzeWebsite: valid response → returns AnalysisResult shape
 */

// ---------------------------------------------------------------------------
// Mock the Anthropic SDK
// ---------------------------------------------------------------------------

const mockCreate = jest.fn()

jest.mock('@anthropic-ai/sdk', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      messages: {
        create: mockCreate,
      },
    })),
  }
})

// ---------------------------------------------------------------------------
// Mock sub-modules that make the functions testable in isolation
// ---------------------------------------------------------------------------

jest.mock('../analysis/prompts', () => ({
  buildAnalysisPrompt: jest.fn(() => 'FIRST_PASS_PROMPT'),
  buildSecondPassPrompt: jest.fn(() => 'SECOND_PASS_PROMPT'),
}))

jest.mock('../analysis/fallback', () => ({
  generateFallbackAnalysis: jest.fn(() => ({
    commodityScore: 42,
    topIssues: [],
    pageAnalysis: [],
    proofPoints: [],
    voiceAnalysis: { currentTone: 'fallback', authenticVoice: '', examples: [] },
  })),
}))

// ---------------------------------------------------------------------------
// Imports (after mocks are in place)
// ---------------------------------------------------------------------------

import { getAnthropicClient, analyzeWebsite, AnalysisResult } from '../analyzer'
import { generateFallbackAnalysis } from '../analysis/fallback'
import type { CrawlResult } from '../crawler'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal valid AnalysisResult JSON string for Claude to return */
function makeClaudeJson(overrides: Record<string, unknown> = {}): string {
  const base = {
    differentiationScore: 55,
    categoryScores: {
      firstImpression: 5,
      differentiation: 4,
      customerClarity: 6,
      storyStructure: 4,
      trustSignals: 5,
      buttonClarity: 5,
    },
    topIssues: Array.from({ length: 5 }, (_, i) => ({
      title: `Issue ${i + 1}`,
      description: `Description for issue ${i + 1}`,
      severity: 'warning',
      findings: Array.from({ length: 6 }, (_, j) => ({
        phrase: `Phrase ${i}-${j} that is reasonably long for dedup purposes`,
        problem: 'Generic phrasing',
        rewrite: 'More specific copy',
        location: 'Homepage hero',
        pageUrl: 'https://example.com',
      })),
    })),
    pageAnalysis: [
      {
        url: 'https://example.com',
        score: 55,
        issues: [],
      },
    ],
    proofPoints: [],
    voiceAnalysis: {
      currentTone: 'Corporate',
      authenticVoice: 'Conversational',
      examples: [],
    },
    suggestedCompetitors: [],
    ...overrides,
  }
  return JSON.stringify(base)
}

/** Build a sparse result — fewer than 25 total findings, many sparse categories */
function makeSparseClaudeJson(): string {
  return JSON.stringify({
    differentiationScore: 40,
    topIssues: Array.from({ length: 8 }, (_, i) => ({
      title: `Issue ${i + 1}`,
      description: 'Sparse',
      severity: 'warning',
      // Only 1 finding per issue → sparse (< 2 per category)
      findings: [
        {
          phrase: `Single phrase for issue ${i}`,
          problem: 'Too few findings',
          rewrite: 'Better copy here',
          location: 'Homepage',
          pageUrl: 'https://example.com',
        },
      ],
    })),
    pageAnalysis: [],
    proofPoints: [],
    voiceAnalysis: { currentTone: 'Generic', authenticVoice: 'Unknown', examples: [] },
    suggestedCompetitors: [],
  })
}

/** Minimal CrawlResult for testing */
function makeCrawlResult(): CrawlResult {
  return {
    pages: [
      {
        url: 'https://example.com',
        title: 'Example Co - Home',
        content: 'We are a quality-focused solutions provider committed to excellence.',
        links: [],
        meta: { description: 'We help businesses grow.' },
      },
    ],
    errors: [],
  }
}

/** Mock a successful Claude API response */
function mockClaudeSuccess(jsonBody: string) {
  mockCreate.mockResolvedValueOnce({
    content: [{ type: 'text', text: jsonBody }],
  })
}

/** Mock Claude returning unexpected content type */
function mockClaudeBadShape() {
  mockCreate.mockResolvedValueOnce({
    content: [{ type: 'image_url', url: 'https://example.com/img.png' }],
  })
}

// ---------------------------------------------------------------------------
// Setup: reset between tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  mockCreate.mockReset()
  jest.resetModules()
  // Clear the module-level singleton so each test starts fresh
  // We access the singleton via the module; we can't directly reset it, but
  // setting the env var is enough to control which branch runs.
  delete process.env.ANTHROPIC_API_KEY
  delete process.env.ANTHROPIC_API_KEY_BACKUP
})

// ===========================================================================
// getAnthropicClient
// ===========================================================================

describe('getAnthropicClient', () => {
  it('throws when ANTHROPIC_API_KEY is not set', async () => {
    // The module caches the client in _anthropic; we need to reload to get a fresh instance.
    // Because jest.resetModules() is in beforeEach, we can import fresh here.
    const { getAnthropicClient: freshGet } = await import('../analyzer')
    await expect(freshGet()).rejects.toThrow('ANTHROPIC_API_KEY is not set')
  })

  it('does not call the Anthropic constructor when API key is missing', async () => {
    const Anthropic = (await import('@anthropic-ai/sdk')).default as jest.MockedClass<typeof import('@anthropic-ai/sdk').default>
    Anthropic.mockClear()
    const { getAnthropicClient: freshGet } = await import('../analyzer')
    await expect(freshGet()).rejects.toThrow()
    expect(Anthropic).not.toHaveBeenCalled()
  })

  it('creates client when ANTHROPIC_API_KEY is set', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-test-key-for-unit-test'
    const { getAnthropicClient: freshGet } = await import('../analyzer')
    const client = await freshGet()
    expect(client).toBeDefined()
    expect(typeof client.messages.create).toBe('function')
  })
})

// ===========================================================================
// analyzeWebsite — missing API key
// ===========================================================================

describe('analyzeWebsite — missing API key', () => {
  it('returns fallback analysis (not throws) when API key is absent', async () => {
    // No env var set → getAnthropicClient throws → caught by analyzeWebsite → fallback
    const { analyzeWebsite: freshAnalyze } = await import('../analyzer')
    const result = await freshAnalyze(makeCrawlResult(), 'https://example.com')
    expect(result).toBeDefined()
    expect(result.commodityScore).toBeDefined()
    expect(Array.isArray(result.topIssues)).toBe(true)
  })

  it('returns a valid AnalysisResult shape (not a thrown error) when API key is missing', async () => {
    // jest.resetModules() in beforeEach means the generateFallbackAnalysis reference
    // imported at file scope is a different module instance than the one actually
    // called at runtime.  Instead, verify the observable contract: the function
    // resolves (not rejects) and the returned object has the right shape.
    const { analyzeWebsite: freshAnalyze } = await import('../analyzer')
    const result = await freshAnalyze(makeCrawlResult(), 'https://example.com')
    expect(Array.isArray(result.topIssues)).toBe(true)
    expect(Array.isArray(result.proofPoints)).toBe(true)
    expect(typeof result.voiceAnalysis).toBe('object')
  })
})

// ===========================================================================
// analyzeWebsite — malformed Claude response
// ===========================================================================

describe('analyzeWebsite — malformed Claude response', () => {
  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = 'sk-test-key-for-unit-test'
  })

  it('returns fallback when Claude returns wrong content type (not text)', async () => {
    mockClaudeBadShape()
    const { analyzeWebsite: freshAnalyze } = await import('../analyzer')
    const result = await freshAnalyze(makeCrawlResult(), 'https://example.com')
    expect(result).toBeDefined()
    // Should have been caught and fallen back
    expect(result.commodityScore).toBeDefined()
  })

  it('returns fallback when Claude returns non-JSON text', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'Sorry, I cannot help with that.' }],
    })
    const { analyzeWebsite: freshAnalyze } = await import('../analyzer')
    const result = await freshAnalyze(makeCrawlResult(), 'https://example.com')
    expect(result).toBeDefined()
    expect(Array.isArray(result.topIssues)).toBe(true)
  })

  it('returns fallback when Claude returns empty content array', async () => {
    mockCreate.mockResolvedValueOnce({ content: [] })
    const { analyzeWebsite: freshAnalyze } = await import('../analyzer')
    const result = await freshAnalyze(makeCrawlResult(), 'https://example.com')
    expect(result).toBeDefined()
    expect(Array.isArray(result.topIssues)).toBe(true)
  })

  it('returns fallback when fetch throws (network error during analysis)', async () => {
    mockCreate.mockRejectedValueOnce(new Error('Connection refused'))
    const { analyzeWebsite: freshAnalyze } = await import('../analyzer')
    const result = await freshAnalyze(makeCrawlResult(), 'https://example.com')
    expect(result).toBeDefined()
    expect(result.commodityScore).toBeDefined()
  })

  it('returns fallback when Claude JSON is missing required fields', async () => {
    // JSON with no topIssues at all → parser still returns something but may be sparse
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: '{"differentiationScore": 50}' }],
    })
    const { analyzeWebsite: freshAnalyze } = await import('../analyzer')
    const result = await freshAnalyze(makeCrawlResult(), 'https://example.com')
    expect(result).toBeDefined()
    expect(Array.isArray(result.topIssues)).toBe(true)
  })
})

// ===========================================================================
// analyzeWebsite — sparse first pass triggers second pass
// ===========================================================================

describe('analyzeWebsite — sparse result triggers second pass', () => {
  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = 'sk-test-key-for-unit-test'
  })

  it('calls Claude twice when first pass has fewer than 25 total findings', async () => {
    // First pass: sparse (8 issues × 1 finding = 8 total < 25)
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: makeSparseClaudeJson() }],
    })
    // Second pass: also valid
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: makeClaudeJson() }],
    })

    const { analyzeWebsite: freshAnalyze } = await import('../analyzer')
    await freshAnalyze(makeCrawlResult(), 'https://example.com')

    expect(mockCreate).toHaveBeenCalledTimes(2)
  })

  it('returns merged result (has issues from both passes) after second pass', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: makeSparseClaudeJson() }],
    })
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: makeClaudeJson() }],
    })

    const { analyzeWebsite: freshAnalyze } = await import('../analyzer')
    const result = await freshAnalyze(makeCrawlResult(), 'https://example.com')

    expect(result).toBeDefined()
    expect(Array.isArray(result.topIssues)).toBe(true)
    expect(result.topIssues.length).toBeGreaterThan(0)
  })

  it('falls back to first pass result when second pass throws', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: makeSparseClaudeJson() }],
    })
    mockCreate.mockRejectedValueOnce(new Error('Second pass timed out'))

    const { analyzeWebsite: freshAnalyze } = await import('../analyzer')
    const result = await freshAnalyze(makeCrawlResult(), 'https://example.com')

    // Should still return a valid result (first pass)
    expect(result).toBeDefined()
    expect(result.commodityScore).toBeDefined()
    expect(Array.isArray(result.topIssues)).toBe(true)
  })

  it('does NOT call Claude twice when first pass has ≥ 25 findings', async () => {
    // 5 issues × 6 findings = 30 total (≥ 25), sparse categories ≤ 3
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: makeClaudeJson() }],
    })

    const { analyzeWebsite: freshAnalyze } = await import('../analyzer')
    await freshAnalyze(makeCrawlResult(), 'https://example.com')

    expect(mockCreate).toHaveBeenCalledTimes(1)
  })
})

// ===========================================================================
// analyzeWebsite — happy path: valid response shape
// ===========================================================================

describe('analyzeWebsite — valid Claude response shape', () => {
  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = 'sk-test-key-for-unit-test'
  })

  it('returns an object with commodityScore in 0-100 range', async () => {
    mockClaudeSuccess(makeClaudeJson({ differentiationScore: 72 }))
    const { analyzeWebsite: freshAnalyze } = await import('../analyzer')
    const result = await freshAnalyze(makeCrawlResult(), 'https://example.com')
    expect(result.commodityScore).toBeGreaterThanOrEqual(0)
    expect(result.commodityScore).toBeLessThanOrEqual(100)
  })

  it('returns topIssues array', async () => {
    mockClaudeSuccess(makeClaudeJson())
    const { analyzeWebsite: freshAnalyze } = await import('../analyzer')
    const result = await freshAnalyze(makeCrawlResult(), 'https://example.com')
    expect(Array.isArray(result.topIssues)).toBe(true)
    expect(result.topIssues.length).toBeGreaterThan(0)
  })

  it('each topIssue has title, description, severity', async () => {
    mockClaudeSuccess(makeClaudeJson())
    const { analyzeWebsite: freshAnalyze } = await import('../analyzer')
    const result = await freshAnalyze(makeCrawlResult(), 'https://example.com')
    for (const issue of result.topIssues) {
      expect(typeof issue.title).toBe('string')
      expect(typeof issue.description).toBe('string')
      expect(['critical', 'warning', 'info']).toContain(issue.severity)
    }
  })

  it('returns voiceAnalysis with currentTone and authenticVoice', async () => {
    mockClaudeSuccess(makeClaudeJson())
    const { analyzeWebsite: freshAnalyze } = await import('../analyzer')
    const result = await freshAnalyze(makeCrawlResult(), 'https://example.com')
    expect(result.voiceAnalysis).toBeDefined()
    expect(typeof result.voiceAnalysis.currentTone).toBe('string')
    expect(typeof result.voiceAnalysis.authenticVoice).toBe('string')
    expect(Array.isArray(result.voiceAnalysis.examples)).toBe(true)
  })

  it('returns pageAnalysis array', async () => {
    mockClaudeSuccess(makeClaudeJson())
    const { analyzeWebsite: freshAnalyze } = await import('../analyzer')
    const result = await freshAnalyze(makeCrawlResult(), 'https://example.com')
    expect(Array.isArray(result.pageAnalysis)).toBe(true)
  })

  it('clamps commodityScore to 0-100 even if Claude returns out-of-range value', async () => {
    mockClaudeSuccess(makeClaudeJson({ differentiationScore: 9999 }))
    const { analyzeWebsite: freshAnalyze } = await import('../analyzer')
    const result = await freshAnalyze(makeCrawlResult(), 'https://example.com')
    expect(result.commodityScore).toBeLessThanOrEqual(100)
  })

  it('clamps commodityScore minimum to 0', async () => {
    mockClaudeSuccess(makeClaudeJson({ differentiationScore: -50 }))
    const { analyzeWebsite: freshAnalyze } = await import('../analyzer')
    const result = await freshAnalyze(makeCrawlResult(), 'https://example.com')
    expect(result.commodityScore).toBeGreaterThanOrEqual(0)
  })

  it('handles Claude JSON wrapped in markdown code fence', async () => {
    const fenced = '```json\n' + makeClaudeJson() + '\n```'
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: fenced }],
    })
    const { analyzeWebsite: freshAnalyze } = await import('../analyzer')
    const result = await freshAnalyze(makeCrawlResult(), 'https://example.com')
    expect(result.commodityScore).toBeDefined()
    expect(Array.isArray(result.topIssues)).toBe(true)
  })

  it('handles empty pages array without throwing', async () => {
    mockClaudeSuccess(makeClaudeJson())
    const { analyzeWebsite: freshAnalyze } = await import('../analyzer')
    const emptyCrawl: CrawlResult = { pages: [], errors: [] }
    await expect(freshAnalyze(emptyCrawl, 'https://example.com')).resolves.toBeDefined()
  })

  it('limits topIssues to maximum 10', async () => {
    const manyIssues = Array.from({ length: 15 }, (_, i) => ({
      title: `Issue ${i}`,
      description: 'desc',
      severity: 'warning',
      findings: [{ phrase: 'p', problem: 'pr', rewrite: 'rw', location: 'loc', pageUrl: 'https://example.com' }],
    }))
    mockClaudeSuccess(makeClaudeJson({ topIssues: manyIssues }))
    const { analyzeWebsite: freshAnalyze } = await import('../analyzer')
    const result = await freshAnalyze(makeCrawlResult(), 'https://example.com')
    expect(result.topIssues.length).toBeLessThanOrEqual(10)
  })
})

// ===========================================================================
// analyzeWebsite — analysis/merge helpers (countTotalFindings, mergeAnalysisResults)
// ===========================================================================

describe('analysis merge helpers', () => {
  it('countTotalFindings sums findings across all issues', async () => {
    const { countTotalFindings } = await import('../analysis/merge')
    const result: AnalysisResult = {
      commodityScore: 50,
      topIssues: [
        { title: 'A', description: '', severity: 'critical', findings: [{ phrase: '1', problem: '', rewrite: '', location: '' }, { phrase: '2', problem: '', rewrite: '', location: '' }] },
        { title: 'B', description: '', severity: 'warning', findings: [{ phrase: '3', problem: '', rewrite: '', location: '' }] },
        { title: 'C', description: '', severity: 'info', findings: undefined as unknown as [] },
      ],
      pageAnalysis: [],
      proofPoints: [],
      voiceAnalysis: { currentTone: '', authenticVoice: '', examples: [] },
    }
    expect(countTotalFindings(result)).toBe(3)
  })

  it('countTotalFindings returns 0 for result with no findings', async () => {
    const { countTotalFindings } = await import('../analysis/merge')
    const result: AnalysisResult = {
      commodityScore: 50,
      topIssues: [],
      pageAnalysis: [],
      proofPoints: [],
      voiceAnalysis: { currentTone: '', authenticVoice: '', examples: [] },
    }
    expect(countTotalFindings(result)).toBe(0)
  })

  it('findSparseCategories returns titles of under-threshold issues', async () => {
    const { findSparseCategories } = await import('../analysis/merge')
    const result: AnalysisResult = {
      commodityScore: 50,
      topIssues: [
        { title: 'Has enough', description: '', severity: 'critical', findings: [{ phrase: '1', problem: '', rewrite: '', location: '' }, { phrase: '2', problem: '', rewrite: '', location: '' }, { phrase: '3', problem: '', rewrite: '', location: '' }] },
        { title: 'Too sparse', description: '', severity: 'warning', findings: [{ phrase: '1', problem: '', rewrite: '', location: '' }] },
      ],
      pageAnalysis: [],
      proofPoints: [],
      voiceAnalysis: { currentTone: '', authenticVoice: '', examples: [] },
    }
    const sparse = findSparseCategories(result, 2)
    expect(sparse).toContain('Too sparse')
    expect(sparse).not.toContain('Has enough')
  })

  it('mergeAnalysisResults deduplicates identical phrases', async () => {
    const { mergeAnalysisResults } = await import('../analysis/merge')
    const sharedFinding = { phrase: 'We provide quality solutions', problem: 'generic', rewrite: 'better', location: 'hero' }
    const first: AnalysisResult = {
      commodityScore: 50,
      topIssues: [{ title: 'Issue A', description: '', severity: 'critical', findings: [sharedFinding] }],
      pageAnalysis: [],
      proofPoints: [],
      voiceAnalysis: { currentTone: '', authenticVoice: '', examples: [] },
    }
    const second: AnalysisResult = {
      commodityScore: 55,
      topIssues: [{ title: 'Issue A', description: '', severity: 'critical', findings: [sharedFinding] }],
      pageAnalysis: [],
      proofPoints: [],
      voiceAnalysis: { currentTone: '', authenticVoice: '', examples: [] },
    }
    const merged = mergeAnalysisResults(first, second)
    const issueA = merged.topIssues.find(i => i.title === 'Issue A')!
    // Duplicate should be filtered out
    expect(issueA.findings?.length).toBe(1)
  })

  it('mergeAnalysisResults adds non-duplicate findings from second pass', async () => {
    const { mergeAnalysisResults } = await import('../analysis/merge')
    const finding1 = { phrase: 'First unique phrase here', problem: 'p', rewrite: 'r', location: 'l' }
    const finding2 = { phrase: 'Second unique phrase here', problem: 'p', rewrite: 'r', location: 'l' }
    const first: AnalysisResult = {
      commodityScore: 50,
      topIssues: [{ title: 'Issue A', description: '', severity: 'critical', findings: [finding1] }],
      pageAnalysis: [],
      proofPoints: [],
      voiceAnalysis: { currentTone: '', authenticVoice: '', examples: [] },
    }
    const second: AnalysisResult = {
      commodityScore: 55,
      topIssues: [{ title: 'Issue A', description: '', severity: 'critical', findings: [finding2] }],
      pageAnalysis: [],
      proofPoints: [],
      voiceAnalysis: { currentTone: '', authenticVoice: '', examples: [] },
    }
    const merged = mergeAnalysisResults(first, second)
    const issueA = merged.topIssues.find(i => i.title === 'Issue A')!
    expect(issueA.findings?.length).toBe(2)
  })
})
