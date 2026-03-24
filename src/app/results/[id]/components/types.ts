/**
 * Shared types for the results page and its sub-components.
 */

export interface FullResults {
  pageByPage: Array<{
    url: string
    title: string
    score: number
    issues: Array<{
      phrase: string
      problem: string
      rewrite: string
      location: string
    }>
  }>
  proofPoints: Array<{
    quote: string
    source: string
    suggestedUse: string
  }>
  competitorComparison?: {
    competitors: string[]
    yourScore: number
    averageScore: number
    gaps: string[]
    detailedScores?: Array<{ url: string; score: number; headline?: string }>
  }
  voiceAnalysis: {
    currentTone: string
    authenticVoice: string
    examples: string[]
  }
}

export type ViewType = 'overview' | 'pages' | 'voice' | 'proof'

export interface ViewDef {
  id: ViewType
  label: string
  description: string
}

export const views: ViewDef[] = [
  { id: 'overview', label: 'Overview', description: 'Summary and competitor comparison' },
  { id: 'pages', label: 'Page analysis', description: 'Issue-by-issue breakdown per page' },
  { id: 'voice', label: 'Voice analysis', description: 'Tone and authentic voice findings' },
  { id: 'proof', label: 'Proof points', description: 'Quotes and credibility material found' },
]

export function getScoreColor(score: number): string {
  if (score >= 7) return 'excellent'
  if (score >= 5) return 'moderate'
  return 'poor'
}

export function getScoreLabel(score: number): string {
  if (score >= 7) return 'Strong'
  if (score >= 5) return 'Needs work'
  return 'Critical gap'
}
