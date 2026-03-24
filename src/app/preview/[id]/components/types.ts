/**
 * Shared types for the preview page and its sub-components.
 */

export interface Finding {
  phrase: string
  problem: string
  rewrite: string
  location: string
  pageUrl: string
}

export interface PreviewData {
  commodityScore: number
  pagesScanned: number
  topIssues: Array<{
    title: string
    description: string
    severity: 'critical' | 'warning' | 'info'
    findings: Finding[]
  }>
  siteSnapshot: {
    title: string
    description: string
    h1?: string
    hasLinkedIn: boolean
    pagesFound: string[]
    spaWarning?: {
      isSPA: boolean
      indicators: string[]
      message: string
    }
  }
  teaserFinding?: Finding
  voiceSummary?: {
    currentTone: string
    authenticVoice: string
  }
  categoryScores?: {
    firstImpression: number
    differentiation: number
    customerClarity: number
    storyStructure: number
    trustSignals: number
    buttonClarity: number
  }
}

export interface CompetitorComparison {
  competitors: string[]
  yourScore: number
  averageScore: number
  gaps: string[]
  detailedScores?: Array<{
    url: string
    score: number
    categoryScores?: {
      firstImpression: number
      differentiation: number
      customerClarity: number
      storyStructure: number
      trustSignals: number
      buttonClarity: number
    }
    strengths?: string[]
    weaknesses?: string[]
  }>
}

export interface AnalysisResponse {
  id: string
  url: string
  status: string
  preview?: PreviewData
  paid?: boolean
  hasFullResults: boolean
  competitorComparison?: CompetitorComparison
  socialUrls?: string[]
}

export type ViewType = 'overview' | 'message' | 'audience' | 'trust' | 'copy' | 'competitors' | 'resources'

export type SectionType = 'positioning' | 'valueProps' | 'proofPoints' | 'socialProof' | 'ctas' | 'audience' | 'differentiators' | 'trustSignals' | 'features' | 'about'
