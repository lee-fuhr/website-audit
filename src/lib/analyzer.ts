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
import { logger } from '@shared/lib/logger'

let _anthropic: Anthropic | null = null

export async function getAnthropicClient() {
  if (!_anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY_BACKUP
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set')
    }
    logger.info(`Initializing Anthropic client - key present: ${!!apiKey}, length: ${apiKey?.length || 0}`, { tool: 'website-audit', fn: 'getAnthropicClient' })
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
    logger.info(`API Key check - present: ${apiKeyPresent}, length: ${apiKeyLength}`, { tool: 'website-audit', fn: 'analyzeWebsite' })

    // ===== FIRST PASS =====
    logger.info(`FIRST PASS: Analyzing ${siteUrl} with ${pagesContent.length} pages`, { tool: 'website-audit', fn: 'analyzeWebsite' })
    const firstPassResult = await runAnalysisPass(siteUrl, pagesContent, crawlResult.pages)

    // Count findings
    const totalFindings = countTotalFindings(firstPassResult)
    const sparseCategories = findSparseCategories(firstPassResult, MIN_FINDINGS_PER_CATEGORY)

    logger.info(`First pass complete: ${totalFindings} findings, ${sparseCategories.length} sparse categories`, { tool: 'website-audit', fn: 'analyzeWebsite' })

    // ===== SECOND PASS (if needed) =====
    if (totalFindings < MIN_TOTAL_FINDINGS || sparseCategories.length > 3) {
      logger.info(`SECOND PASS: Need more findings (have ${totalFindings}, need ${MIN_TOTAL_FINDINGS})`, { tool: 'website-audit', fn: 'analyzeWebsite' })
      logger.info(`Sparse categories: ${sparseCategories.join(', ')}`, { tool: 'website-audit', fn: 'analyzeWebsite' })

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
        logger.info(`After merge: ${mergedTotal} total findings`, { tool: 'website-audit', fn: 'analyzeWebsite' })

        return mergedResult
      } catch (secondPassError) {
        logger.error('Second pass failed, using first pass results', { tool: 'website-audit', fn: 'analyzeWebsite', err: String(secondPassError) })
        return firstPassResult
      }
    }

    return firstPassResult
  } catch (error) {
    logger.error('Analysis failed', {
      tool: 'website-audit',
      fn: 'analyzeWebsite',
      err: error instanceof Error ? error.message : String(error),
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      httpStatus: error instanceof Error && 'status' in error ? (error as { status: number }).status : undefined,
      apiKeyConfigured: !!process.env.ANTHROPIC_API_KEY,
    })
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
  logger.info(`Got response, length: ${responseText.length} chars`, { tool: 'website-audit', fn: 'runAnalysisPass' })

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
  logger.info(`Second pass response, length: ${responseText.length} chars`, { tool: 'website-audit', fn: 'runSecondPass' })

  return parseAnalysisResponse(responseText, pages)
}
