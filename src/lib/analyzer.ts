/**
 * AI-Powered Website Messaging Analyzer
 *
 * Uses Claude to analyze website content for commodity messaging
 * and generate specific recommendations.
 */

import { CrawledPage, CrawlResult } from './crawler'
import Anthropic from '@anthropic-ai/sdk'
import { buildAnalysisPrompt, buildSecondPassPrompt } from './analysis/prompts'
import { parseAnalysisResponse } from './analysis/parser'
import { countTotalFindings, findSparseCategories, mergeAnalysisResults } from './analysis/merge'
import { generateFallbackAnalysis } from './analysis/fallback'

let _anthropic: Anthropic | null = null

export async function getAnthropicClient() {
  if (!_anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY_BACKUP
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set')
    }
    console.log(`[AI] Initializing Anthropic client - key present: ${!!apiKey}, length: ${apiKey?.length || 0}`)
    _anthropic = new Anthropic({ apiKey })
  }
  return _anthropic
}

export interface Finding {
  phrase: string
  problem: string
  rewrite: string
  location: string
  pageUrl?: string
}

export interface AnalysisResult {
  commodityScore: number
  categoryScores?: {
    firstImpression: number  // 0-10
    differentiation: number  // 0-10
    customerClarity: number  // 0-10
    storyStructure: number   // 0-10
    trustSignals: number     // 0-10
    buttonClarity: number    // 0-10
  }
  topIssues: Array<{
    title: string
    description: string
    severity: 'critical' | 'warning' | 'info'
    findings?: Finding[] // Findings nested directly on each issue
  }>
  pageAnalysis: Array<{
    url: string
    title: string
    score: number
    issues: Finding[]
  }>
  proofPoints: Array<{
    quote: string
    source: string
    suggestedUse: string
  }>
  voiceAnalysis: {
    currentTone: string
    authenticVoice: string
    examples: string[]
  }
  suggestedCompetitors?: Array<{
    domain: string
    confidence: 'high' | 'medium' | 'low'
    reason: string
  }>
}

// Minimum findings thresholds for quality audit
const MIN_TOTAL_FINDINGS = 25
const MIN_FINDINGS_PER_CATEGORY = 2

/**
 * Analyze crawled website content using Claude.
 * Includes automatic second-pass retry for sparse results.
 */
export async function analyzeWebsite(
  crawlResult: CrawlResult,
  siteUrl: string
): Promise<AnalysisResult> {
  // Prepare content for analysis
  const pagesContent = crawlResult.pages.map(page => ({
    url: page.url,
    title: page.title,
    // Truncate content to avoid token limits
    content: page.content.slice(0, 3000),
    meta: page.meta,
  }))

  try {
    // Debug: Check API key at runtime
    const apiKeyPresent = !!process.env.ANTHROPIC_API_KEY
    const apiKeyLength = process.env.ANTHROPIC_API_KEY?.length || 0
    console.log(`[AI] API Key check - present: ${apiKeyPresent}, length: ${apiKeyLength}`)

    // ===== FIRST PASS =====
    console.log(`[AI] FIRST PASS: Analyzing ${siteUrl} with ${pagesContent.length} pages...`)
    const firstPassResult = await runAnalysisPass(siteUrl, pagesContent, crawlResult.pages)

    // Count findings
    const totalFindings = countTotalFindings(firstPassResult)
    const sparseCategories = findSparseCategories(firstPassResult, MIN_FINDINGS_PER_CATEGORY)

    console.log(`[AI] First pass complete: ${totalFindings} findings, ${sparseCategories.length} sparse categories`)

    // ===== SECOND PASS (if needed) =====
    if (totalFindings < MIN_TOTAL_FINDINGS || sparseCategories.length > 3) {
      console.log(`[AI] SECOND PASS: Need more findings (have ${totalFindings}, need ${MIN_TOTAL_FINDINGS})`)
      console.log(`[AI] Sparse categories: ${sparseCategories.join(', ')}`)

      try {
        const secondPassResult = await runSecondPass(
          siteUrl,
          pagesContent,
          crawlResult.pages,
          sparseCategories,
          firstPassResult
        )

        // Merge results
        const mergedResult = mergeAnalysisResults(firstPassResult, secondPassResult)
        const mergedTotal = countTotalFindings(mergedResult)
        console.log(`[AI] After merge: ${mergedTotal} total findings`)

        return mergedResult
      } catch (secondPassError) {
        console.error('[AI] Second pass failed, using first pass results:', secondPassError)
        return firstPassResult
      }
    }

    return firstPassResult
  } catch (error) {
    console.error('[AI] ===== ANALYSIS ERROR =====')
    console.error('[AI] Error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
    console.error('[AI] Error type:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('[AI] Error message:', error instanceof Error ? error.message : String(error))
    if (error instanceof Error && 'status' in error) {
      console.error('[AI] HTTP status:', (error as { status: number }).status)
    }
    if (error instanceof Error && 'response' in error) {
      console.error('[AI] Response:', JSON.stringify((error as { response: unknown }).response))
    }
    console.error('[AI] API Key configured:', !!process.env.ANTHROPIC_API_KEY)
    // Return fallback analysis if AI fails
    return generateFallbackAnalysis(crawlResult.pages, siteUrl)
  }
}

/** Run a single analysis pass */
async function runAnalysisPass(
  siteUrl: string,
  pagesContent: Array<{ url: string; title: string; content: string; meta: Record<string, string | undefined> }>,
  pages: CrawledPage[]
): Promise<AnalysisResult> {
  const prompt = buildAnalysisPrompt(siteUrl, pagesContent)

  const anthropic = await getAnthropicClient()
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    messages: [{ role: 'user', content: prompt }],
  })

  if (!message.content.length || message.content[0].type !== 'text') {
    throw new Error('Unexpected Claude response shape')
  }
  const responseText = message.content[0].text
  console.log(`[AI] Got response, length: ${responseText.length} chars`)

  return parseAnalysisResponse(responseText, pages)
}

/** Run focused second pass on sparse categories */
async function runSecondPass(
  siteUrl: string,
  pagesContent: Array<{ url: string; title: string; content: string; meta: Record<string, string | undefined> }>,
  pages: CrawledPage[],
  sparseCategories: string[],
  firstPassResult: AnalysisResult
): Promise<AnalysisResult> {
  const prompt = buildSecondPassPrompt(siteUrl, pagesContent, sparseCategories, firstPassResult)

  const anthropic = await getAnthropicClient()
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 6000,
    messages: [{ role: 'user', content: prompt }],
  })

  if (!message.content.length || message.content[0].type !== 'text') {
    throw new Error('Unexpected Claude response shape')
  }
  const responseText = message.content[0].text
  console.log(`[AI] Second pass response, length: ${responseText.length} chars`)

  return parseAnalysisResponse(responseText, pages)
}
