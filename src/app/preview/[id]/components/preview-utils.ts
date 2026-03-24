/**
 * Pure utility functions for the preview page.
 * No React dependencies — importable anywhere.
 */

import { Finding, PreviewData, SectionType, ViewType } from './types'

// Helper: Create text fragment URL (Arc-style deep linking to specific text)
// Format: url#:~:text=encoded%20text
export function createTextFragmentUrl(baseUrl: string, phrase: string): string {
  if (!baseUrl || !phrase) return baseUrl
  const truncatedPhrase = phrase.length > 50 ? phrase.slice(0, 50) : phrase
  const encodedText = encodeURIComponent(truncatedPhrase)
  const separator = baseUrl.includes('#') ? '' : '#'
  return `${baseUrl}${separator}:~:text=${encodedText}`
}

// Score label helpers — NOTE: 100 = best (well differentiated), lower = worse
export function getScoreLabel(score: number): string {
  if (score >= 80) return 'Well differentiated'
  if (score >= 60) return 'Getting there'
  if (score >= 40) return 'Needs work'
  return 'Commodity territory'
}

export function getScoreDescription(score: number): string {
  if (score >= 80) return 'Your website stands out from competitors. Keep refining your specific proof points.'
  if (score >= 60) return 'Some differentiation, but opportunities remain. A few targeted improvements could make a big difference.'
  if (score >= 40) return "Your website sounds like most competitors. Buyers can't tell you apart and may default to price."
  return "Your website could be anyone's. You're competing purely on price - and losing to better marketers."
}

export function getScoreColorClass(score: number): string {
  if (score >= 80) return 'text-[var(--score-excellent)]'
  if (score >= 60) return 'text-[var(--score-good)]'
  if (score >= 40) return 'text-[var(--score-fair)]'
  return 'text-[var(--score-poor)]'
}

export function getScoreBgClass(score: number): string {
  if (score >= 80) return 'bg-green-50'
  if (score >= 60) return 'bg-yellow-50'
  if (score >= 40) return 'bg-orange-50'
  return 'bg-red-50'
}

export function getScoreBorderClass(score: number): string {
  if (score >= 80) return 'border-green-600'
  if (score >= 60) return 'border-yellow-600'
  if (score >= 40) return 'border-orange-500'
  return 'border-red-600'
}

// Map section types to issue title keywords for matching.
// Ensures findings appear under the correct section regardless of AI response order.
export const sectionKeywords: Record<SectionType, string[]> = {
  positioning: ['positioning', 'hero', 'headline', 'generic positioning', 'vague positioning', 'generic hero', 'weak positioning'],
  valueProps: ['value proposition', 'vague value', 'subhead', 'missing value', 'weak value', 'value prop'],
  proofPoints: ['proof point', 'proof points', 'missing proof', 'buried proof', 'hidden proof', 'weak proof'],
  socialProof: ['social proof', 'weak social', 'testimonial', 'missing social', 'no social'],
  ctas: ['cta', 'call-to-action', 'call to action', 'generic cta', 'button', 'missing cta', 'weak cta'],
  audience: ['target audience', 'unclear target', 'audience', 'who is this for', 'missing target', 'unclear audience', 'no clear audience'],
  differentiators: ['differentiator', 'missing differentiator', 'why choose', 'differentiation', 'weak differentiator', 'no differentiator'],
  trustSignals: ['trust signal', 'trust gap', 'trust gaps', 'certification', 'award', 'validation', 'missing trust'],
  features: ['feature-first', 'feature first', 'features instead', 'leading with feature', 'feature driven', 'features over', 'feature focused'],
  about: ['about', 'team messaging', 'company description', 'generic about', 'ineffective about', 'about page', 'team page', 'weak about'],
}

// Find an issue by matching its title to section keywords
export function findIssueBySection(
  issues: PreviewData['topIssues'],
  section: SectionType
): PreviewData['topIssues'][0] | undefined {
  if (!issues || issues.length === 0) return undefined
  const keywords = sectionKeywords[section]
  if (!keywords) return undefined
  return issues.find(issue => {
    if (!issue) return false
    const titleLower = (issue.title || '').toLowerCase()
    return keywords.some(kw => titleLower.includes(kw))
  })
}

// Get findings for a specific section.
// Strategy: title match first, content-scan as fallback.
export function getFindingsForSection(issues: PreviewData['topIssues'], section: SectionType): Finding[] {
  if (!issues || issues.length === 0) return []
  const keywords = sectionKeywords[section]
  if (!keywords) return []

  const issueByTitle = findIssueBySection(issues, section)
  if (issueByTitle?.findings?.length) {
    return issueByTitle.findings
  }

  // Fallback: content scan across all findings
  const allFindings = issues.flatMap(issue => issue?.findings || [])
  return allFindings
    .filter(f => {
      const content = `${f.phrase || ''} ${f.problem || ''} ${f.location || ''}`.toLowerCase()
      return keywords.some(kw => content.includes(kw))
    })
    .slice(0, 5)
}

// View metadata
export const baseViews = [
  { id: 'overview' as ViewType, label: 'Overview', description: 'Your action plan and scores at a glance' },
  { id: 'message' as ViewType, label: 'Your message', description: 'How clearly you communicate what you do and why it matters' },
  { id: 'audience' as ViewType, label: 'Your audience', description: "Who you're speaking to and how you compare to alternatives" },
  { id: 'trust' as ViewType, label: 'Building trust', description: 'Proof points and getting visitors to take action' },
  { id: 'copy' as ViewType, label: 'Copy to use', description: 'Ready-to-paste text you can implement today' },
]

export const competitorsView = { id: 'competitors' as ViewType, label: 'Competitors', description: 'How you stack up against the competition' }
export const resourcesView = { id: 'resources' as ViewType, label: 'Resources', description: 'Swipe file, copywriter brief, and export tools' }

export const scoreCategories = [
  { key: 'firstImpression', label: 'First impression', question: 'Can visitors understand what you do in 5 seconds?' },
  { key: 'differentiation', label: 'Differentiation', question: 'Do you stand out from competitors?' },
  { key: 'customerClarity', label: 'Ideal customer clarity', question: 'Is your ideal customer obvious?' },
  { key: 'storyStructure', label: 'Story structure', question: 'Do you have a compelling narrative?' },
  { key: 'trustSignals', label: 'Proof & credibility', question: 'Can visitors verify your claims?' },
  { key: 'buttonClarity', label: 'Button clarity', question: 'Is the next step obvious and compelling?' },
]
