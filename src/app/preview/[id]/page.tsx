'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ViewNavBar } from '@/components/ViewNavBar'
import { Footer } from '@/components/Footer'
import { Tooltip } from '@/components/Tooltip'
import { formatCompanyName, safeClipboardWrite, escapeHtml } from '@/lib/utils'

// Helper: Create text fragment URL (Arc-style deep linking to specific text)
// Format: url#:~:text=encoded%20text
function createTextFragmentUrl(baseUrl: string, phrase: string): string {
  if (!baseUrl || !phrase) return baseUrl;
  // Take first 50 chars of phrase to avoid URL length issues
  const truncatedPhrase = phrase.length > 50 ? phrase.slice(0, 50) : phrase;
  // Encode for URL (spaces become %20, etc.)
  const encodedText = encodeURIComponent(truncatedPhrase);
  // Add text fragment
  const separator = baseUrl.includes('#') ? '' : '#';
  return `${baseUrl}${separator}:~:text=${encodedText}`;
}

// Types for API response
interface Finding {
  phrase: string
  problem: string
  rewrite: string
  location: string
  pageUrl: string
}

interface PreviewData {
  commodityScore: number
  pagesScanned: number
  topIssues: Array<{
    title: string
    description: string
    severity: 'critical' | 'warning' | 'info'
    // Findings attached DIRECTLY to each issue (up to 5 per issue)
    findings: Finding[]
  }>
  siteSnapshot: {
    title: string
    description: string
    h1?: string  // Main H1 headline for comparison
    hasLinkedIn: boolean
    pagesFound: string[]
    spaWarning?: {
      isSPA: boolean
      indicators: string[]
      message: string
    }
  }
  // Legacy single teaser
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

interface CompetitorComparison {
  competitors: string[]
  yourScore: number
  averageScore: number
  gaps: string[]
  detailedScores?: Array<{
    url: string;
    score: number;
    categoryScores?: {
      firstImpression: number;
      differentiation: number;
      customerClarity: number;
      storyStructure: number;
      trustSignals: number;
      buttonClarity: number;
    };
    strengths?: string[];
    weaknesses?: string[];
  }>
}

interface AnalysisResponse {
  id: string
  url: string
  status: string
  preview?: PreviewData
  hasFullResults: boolean
  competitorComparison?: CompetitorComparison
  socialUrls?: string[]
}

type ViewType = 'overview' | 'message' | 'audience' | 'trust' | 'copy' | 'competitors' | 'resources'

// View icons (Streamline-style, 1px stroke)
const viewIcons: Record<ViewType, React.ReactNode> = {
  overview: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  message: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  ),
  audience: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  trust: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  copy: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  competitors: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  resources: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
}

const baseViews = [
  { id: 'overview' as ViewType, label: 'Overview', description: 'Your action plan and scores at a glance' },
  { id: 'message' as ViewType, label: 'Your message', description: 'How clearly you communicate what you do and why it matters' },
  { id: 'audience' as ViewType, label: 'Your audience', description: 'Who you\'re speaking to and how you compare to alternatives' },
  { id: 'trust' as ViewType, label: 'Building trust', description: 'Proof points and getting visitors to take action' },
  { id: 'copy' as ViewType, label: 'Copy to use', description: 'Ready-to-paste text you can implement today' },
]

const competitorsView = { id: 'competitors' as ViewType, label: 'Competitors', description: 'How you stack up against the competition' }
const resourcesView = { id: 'resources' as ViewType, label: 'Resources', description: 'Swipe file, copywriter brief, and export tools' }

// Score categories for display
const scoreCategories = [
  { key: 'firstImpression', label: 'First impression', question: 'Can visitors understand what you do in 5 seconds?' },
  { key: 'differentiation', label: 'Differentiation', question: 'Do you stand out from competitors?' },
  { key: 'customerClarity', label: 'Ideal customer clarity', question: 'Is your ideal customer obvious?' },
  { key: 'storyStructure', label: 'Story structure', question: 'Do you have a compelling narrative?' },
  { key: 'trustSignals', label: 'Proof & credibility', question: 'Can visitors verify your claims?' },
  { key: 'buttonClarity', label: 'Button clarity', question: 'Is the next step obvious and compelling?' },
]

// Helper functions - NOTE: 100 = best (well differentiated), lower = worse
function getScoreLabel(score: number): string {
  if (score >= 80) return 'Well differentiated'
  if (score >= 60) return 'Getting there'
  if (score >= 40) return 'Needs work'
  return 'Commodity territory'
}

function getScoreDescription(score: number): string {
  if (score >= 80) return 'Your website stands out from competitors. Keep refining your specific proof points.'
  if (score >= 60) return 'Some differentiation, but opportunities remain. A few targeted improvements could make a big difference.'
  if (score >= 40) return 'Your website sounds like most competitors. Buyers can\'t tell you apart and may default to price.'
  return 'Your website could be anyone\'s. You\'re competing purely on price - and losing to better marketers.'
}

function getScoreColorClass(score: number): string {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  if (score >= 40) return 'text-orange-500'
  return 'text-red-600'
}

function getScoreBgClass(score: number): string {
  if (score >= 80) return 'bg-green-50'
  if (score >= 60) return 'bg-yellow-50'
  if (score >= 40) return 'bg-orange-50'
  return 'bg-red-50'
}

function getScoreBorderClass(score: number): string {
  if (score >= 80) return 'border-green-600'
  if (score >= 60) return 'border-yellow-600'
  if (score >= 40) return 'border-orange-500'
  return 'border-red-600'
}

// Map section types to issue title keywords for matching
// This ensures findings appear under the correct section regardless of AI response order
type SectionType = 'positioning' | 'valueProps' | 'proofPoints' | 'socialProof' | 'ctas' | 'audience' | 'differentiators' | 'trustSignals' | 'features' | 'about'

const sectionKeywords: Record<SectionType, string[]> = {
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
function findIssueBySection(issues: PreviewData['topIssues'], section: SectionType): PreviewData['topIssues'][0] | undefined {
  if (!issues || issues.length === 0) return undefined

  const keywords = sectionKeywords[section]
  // Guard against invalid section type
  if (!keywords) return undefined

  return issues.find(issue => {
    // Guard against null/undefined issue objects
    if (!issue) return false
    // Guard against missing title
    const titleLower = (issue.title || '').toLowerCase()
    return keywords.some(kw => titleLower.includes(kw))
  })
}

// Get findings for a specific section
// Strategy: Trust title matching first, use content scanning only as fallback
function getFindingsForSection(issues: PreviewData['topIssues'], section: SectionType): Finding[] {
  if (!issues || issues.length === 0) return []

  const keywords = sectionKeywords[section]
  if (!keywords) return []

  // Primary: find issue by title match and return its findings
  const issueByTitle = findIssueBySection(issues, section)
  if (issueByTitle && issueByTitle.findings && issueByTitle.findings.length > 0) {
    return issueByTitle.findings
  }

  // Fallback: if no title match found, scan ALL findings by content keywords
  // This catches cases where AI used unexpected issue titles
  const allFindings = issues.flatMap(issue => issue?.findings || [])
  const contentMatchedFindings = allFindings.filter(f => {
    const content = `${f.phrase || ''} ${f.problem || ''} ${f.location || ''}`.toLowerCase()
    return keywords.some(kw => content.includes(kw))
  })

  return contentMatchedFindings.slice(0, 5)
}

// Locked findings component
function LockedFindings({
  onUnlock,
  showTeaser = false,
  teaserFinding,
  isUnlocked = false
}: {
  onUnlock: () => void
  showTeaser?: boolean
  teaserFinding?: PreviewData['teaserFinding']
  isUnlocked?: boolean
}) {
  // If test unlocked, return empty (findings are shown elsewhere)
  if (isUnlocked) return null
  return (
    <div className="my-6">
      {showTeaser && teaserFinding && (
        <div className="mb-4 p-4 bg-white border-2 border-[var(--accent)] rounded">
          <p className="text-xs font-bold text-[var(--accent)] mb-3">REAL FINDING FROM YOUR SITE:</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-3 bg-red-50 border-l-4 border-red-400">
              <p className="text-xs font-bold text-red-600 mb-1">❌ CURRENT</p>
              <p className="text-sm italic text-[var(--foreground)]">&quot;{teaserFinding.phrase}&quot;</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-2">
                Found: {teaserFinding.location}
                {teaserFinding.pageUrl && (
                  <a href={createTextFragmentUrl(teaserFinding.pageUrl, teaserFinding.phrase)} target="_blank" rel="noopener noreferrer" className="ml-1 inline-flex items-center text-[var(--accent)] hover:text-[var(--accent-hover)]" title="View source page">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                  </a>
                )}
              </p>
            </div>
            <div className="p-3 bg-green-50 border-l-4 border-green-500">
              <div className="flex justify-between items-start gap-2 mb-1">
                <p className="text-xs font-bold text-green-600">✓ SUGGESTED REWRITE</p>
                <button
                  onClick={async () => {
                    const result = await safeClipboardWrite(teaserFinding.rewrite)
                    const el = document.getElementById('copy-rewrite-btn')
                    if (el) { el.textContent = result.success ? '✓ Copied' : '✗ Failed'; setTimeout(() => { el.textContent = 'Copy' }, 1500) }
                  }}
                  id="copy-rewrite-btn"
                  className="text-xs px-2 py-0.5 bg-white border border-green-300 rounded hover:bg-green-100 transition-colors text-green-700 font-medium"
                >
                  Copy
                </button>
              </div>
              <p className="text-sm text-[var(--foreground)]">&quot;{teaserFinding.rewrite}&quot;</p>
            </div>
          </div>
          <p className="text-xs text-[var(--muted-foreground)] mt-3 p-2 bg-[var(--muted)] rounded">
            <strong>Why this matters:</strong> {teaserFinding.problem}
          </p>
          <p className="text-xs text-[var(--accent)] font-medium mt-3">
            Your full audit includes 15-20 rewrites like this, all specific to YOUR site.
          </p>
        </div>
      )}

      <div className="p-6 bg-[var(--muted)] border-2 border-dashed border-[var(--border)] text-center">
        <div className="max-w-md mx-auto">
          <p className="text-sm font-medium text-[var(--foreground)] mb-1">Full findings locked</p>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">
            Includes all phrases from YOUR site, why they&apos;re hurting you, and copy-paste replacements.
          </p>
          <button
            onClick={onUnlock}
            className="bg-[var(--accent)] text-white px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Unlock full audit - $400
          </button>
        </div>
      </div>
    </div>
  )
}


export default function PreviewPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isTestUnlocked = searchParams.get('unlock') === 'test'
  const [data, setData] = useState<AnalysisResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [currentView, setCurrentView] = useState<ViewType>('overview')
  const [expandedIssue, setExpandedIssue] = useState<number | null>(0)
  const [openScorecard, setOpenScorecard] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Editable input fields
  const [editableUrl, setEditableUrl] = useState('')
  const [editableCompanyName, setEditableCompanyName] = useState('')
  const [editableEmail, setEditableEmail] = useState('')
  const [isRerunning, setIsRerunning] = useState(false)

  const currentYear = new Date().getFullYear()

  // Always show competitors tab - we'll find them or prompt user
  const hasCompetitorData = data?.competitorComparison && data.competitorComparison.detailedScores && data.competitorComparison.detailedScores.length > 0
  // Resources view always visible (tease value to free users)
  const views = [...baseViews, competitorsView, resourcesView]

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        const response = await fetch(`/api/analyze?id=${params.id}`)
        const result = await response.json()
        if (result.success) {
          setData(result.analysis)
          // Initialize editable fields from loaded data
          setEditableUrl(result.analysis.url || '')
          setEditableCompanyName(result.analysis.preview?.siteSnapshot?.title || '')
          // Email might come from the analysis or be empty
          setEditableEmail(result.analysis.contactEmail || '')
        } else {
          setError(result.error || 'Failed to load results')
        }
      } catch {
        setError('Something went wrong. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchPreview()
  }, [params.id])

  // Handle re-run when inputs change
  const handleRerun = useCallback(async () => {
    if (!editableUrl.trim()) return

    setIsRerunning(true)
    setError('')

    try {
      // Normalize URL
      let normalizedUrl = editableUrl.trim()
      if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
        normalizedUrl = 'https://' + normalizedUrl
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: normalizedUrl,
          companyName: editableCompanyName.trim() || undefined,
          contactEmail: editableEmail.trim() || undefined,
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Navigate to the new analysis
        router.push(`/processing?id=${result.analysisId}`)
      } else {
        setError(result.error || 'Failed to start new analysis.')
        setIsRerunning(false)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setIsRerunning(false)
    }
  }, [editableUrl, editableCompanyName, editableEmail, router])

  const handleUnlock = async () => {
    setIsCheckingOut(true)
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisId: params.id }),
      })
      const result = await response.json()
      if (result.success && result.checkoutUrl) {
        window.location.href = result.checkoutUrl
      } else {
        setError('Failed to start checkout. Please try again.')
        setIsCheckingOut(false)
      }
    } catch {
      setError('Failed to start checkout. Please try again.')
      setIsCheckingOut(false)
    }
  }

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const currentViewIndex = views.findIndex(v => v.id === currentView)
  const prevView = currentViewIndex > 0 ? views[currentViewIndex - 1] : null
  const nextView = currentViewIndex < views.length - 1 ? views[currentViewIndex + 1] : null

  const handleDownloadPDF = async () => {
    try {
      const html2pdf = (await import('html2pdf.js')).default

      // Category display names
      const catNames: Record<string, string> = {
        firstImpression: 'First Impression',
        differentiation: 'Differentiation',
        customerClarity: 'Customer Clarity',
        storyStructure: 'Story Structure',
        trustSignals: 'Trust Signals',
        buttonClarity: 'CTA Clarity'
      }

      // Simple severity color (just text color, no fancy badges)
      const getSeverityColor = (sev: string) => {
        if (sev === 'critical') return '#c00'
        if (sev === 'major' || sev === 'warning') return '#b45309'
        return '#666'
      }

      // Score color for table
      const getScoreColor = (score: number) => {
        if (score >= 7) return '#166534'
        if (score >= 4) return '#b45309'
        return '#c00'
      }

      // Proper company name - prefer clean name over hostname with domain
      const displayName = companyName && companyName !== hostname.split('.')[0] ? companyName : hostname
      const totalRewrites = preview.topIssues.reduce((acc: number, issue: { findings?: unknown[] }) => acc + (issue.findings?.length || 0), 0)

      // Build simple category scores table
      const categoryScoresHtml = preview.categoryScores
        ? Object.entries(preview.categoryScores).map(([key, val]) => `
            <tr>
              <td style="padding: 8px 12px; border-bottom: 1px solid #ddd;">${catNames[key] || key}</td>
              <td style="padding: 8px 12px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold; color: ${getScoreColor(val as number)};">${val}/10</td>
            </tr>
          `).join('')
        : ''

      // Build ALL issues HTML - no slice limits, include every finding
      const issuesHtml = preview.topIssues.slice(0, 6).map((issue: { title: string; severity: string; description: string; findings?: { phrase: string; rewrite: string; problem?: string; location?: string; pageUrl?: string }[] }, i: number) => `
        <div style="margin-bottom: 24px; page-break-inside: avoid;">
          <h3 style="font-size: 14px; margin: 0 0 4px 0; color: #111;">
            ${i + 1}. ${escapeHtml(issue.title)}
            <span style="font-size: 11px; font-weight: normal; color: ${getSeverityColor(issue.severity)}; text-transform: uppercase; margin-left: 8px;">[${issue.severity}]</span>
          </h3>
          <p style="color: #555; font-size: 12px; margin: 0 0 12px 0;">${escapeHtml(issue.description)}</p>
          ${(issue.findings || []).length > 0 ? (issue.findings || []).map((f: { phrase: string; rewrite: string; problem?: string; location?: string; pageUrl?: string }) => `
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 12px; table-layout: fixed;">
              <tr>
                <td style="width: 80px; padding: 8px; background: #f5f5f5; border: 1px solid #ddd; font-weight: bold; color: #666; vertical-align: top;">Before</td>
                <td style="padding: 8px; border: 1px solid #ddd; color: #666; word-wrap: break-word; overflow-wrap: break-word;">${escapeHtml(f.phrase)}</td>
              </tr>
              <tr>
                <td style="width: 80px; padding: 8px; background: #f0f9f0; border: 1px solid #ddd; font-weight: bold; color: #166534; vertical-align: top;">After</td>
                <td style="padding: 8px; border: 1px solid #ddd; color: #111; word-wrap: break-word; overflow-wrap: break-word;">${escapeHtml(f.rewrite)}</td>
              </tr>
              ${f.location ? `<tr><td colspan="2" style="padding: 4px 8px; border: 1px solid #ddd; font-size: 10px; color: #888; font-style: italic;">Found: ${escapeHtml(f.location)}${f.pageUrl ? ` (${escapeHtml(new URL(f.pageUrl).pathname)})` : ''}</td></tr>` : ''}
            </table>
          `).join('') : '<p style="color: #888; font-size: 11px; font-style: italic; margin: 0;">No specific rewrites for this issue - review the description above for guidance.</p>'}
        </div>
      `).join('')

      // Build "Copy you can use" section - issues 6+ with quick wins
      const copyIssues = preview.topIssues.slice(6)
      const copySectionHtml = copyIssues.length > 0 && copyIssues.some((i: { findings?: unknown[] }) => (i.findings?.length || 0) > 0)
        ? `
          <div style="page-break-before: always;">
            <h2 style="font-size: 16px; font-weight: bold; margin: 0 0 8px 0; padding-bottom: 8px; border-bottom: 2px solid #333;">Copy You Can Use Today</h2>
            <p style="font-size: 12px; color: #555; margin: 0 0 16px 0;">Quick wins beyond the critical issues. These rewrites address secondary messaging gaps you can fix today while planning the bigger changes above.</p>
            ${copyIssues.map((issue: { title: string; severity: string; description: string; findings?: { phrase: string; rewrite: string; problem?: string; location?: string; pageUrl?: string }[] }, i: number) =>
              (issue.findings?.length || 0) > 0 ? `
              <div style="margin-bottom: 20px; page-break-inside: avoid;">
                <h3 style="font-size: 13px; margin: 0 0 4px 0; color: #111;">
                  ${escapeHtml(issue.title)}
                  <span style="font-size: 10px; font-weight: normal; color: ${getSeverityColor(issue.severity)}; text-transform: uppercase; margin-left: 6px;">[${issue.severity}]</span>
                </h3>
                ${(issue.findings || []).map((f: { phrase: string; rewrite: string; location?: string; pageUrl?: string }) => `
                  <table style="width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 11px; table-layout: fixed;">
                    <tr>
                      <td style="width: 60px; padding: 6px; background: #f5f5f5; border: 1px solid #ddd; font-weight: bold; color: #666; vertical-align: top;">Before</td>
                      <td style="padding: 6px; border: 1px solid #ddd; color: #666; word-wrap: break-word;">${escapeHtml(f.phrase)}</td>
                    </tr>
                    <tr>
                      <td style="width: 60px; padding: 6px; background: #f0f9f0; border: 1px solid #ddd; font-weight: bold; color: #166534; vertical-align: top;">After</td>
                      <td style="padding: 6px; border: 1px solid #ddd; color: #111; word-wrap: break-word;">${escapeHtml(f.rewrite)}</td>
                    </tr>
                  </table>
                `).join('')}
              </div>
            ` : ''
            ).join('')}
          </div>
        `
        : ''

      // Build trust signal checklist for PDF
      const allPhrases = preview.topIssues
        .flatMap((issue: { findings?: { phrase?: string }[] }) => issue.findings || [])
        .map((f: { phrase?: string }) => f.phrase?.toLowerCase() || '')
        .join(' ')

      const trustSignals = [
        { label: 'Customer count', found: /\d+[\+]?\s*(customers?|clients?|users?|teams?|companies|businesses)/i.test(allPhrases), suggestion: '"Trusted by X+ customers"' },
        { label: 'Years in business', found: /(since|founded|established)\s*(19|20)\d{2}|\d+\+?\s*years/i.test(allPhrases), suggestion: '"Since 20XX" or "X+ years experience"' },
        { label: 'Testimonials', found: /(testimonial|review|said|quot|\")/i.test(allPhrases), suggestion: 'Add customer quotes with names' },
        { label: 'Case studies', found: /(case study|increased|improved|reduced|saved)\s*\d+/i.test(allPhrases), suggestion: '"Helped X achieve Y% improvement"' },
        { label: 'Certifications', found: /(iso|soc|hipaa|certified|accredited|award)/i.test(allPhrases), suggestion: 'List certifications/awards visibly' },
        { label: 'Guarantee', found: /(guarantee|warranty|money.?back|risk.?free)/i.test(allPhrases), suggestion: 'Add satisfaction guarantee' },
        { label: 'Team visibility', found: /(team|founder|ceo|leadership|about us)/i.test(allPhrases), suggestion: 'Show real people with names' },
        { label: 'Physical address', found: /\d+\s+[a-z]+\s+(st|street|ave|avenue|rd|road|blvd|way)|[a-z]+,\s*[a-z]{2}\s*\d{5}/i.test(allPhrases), suggestion: 'Display physical location' },
      ]

      const trustChecklistHtml = `
        <div style="margin-bottom: 24px;">
          <h2 style="font-size: 16px; font-weight: bold; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 2px solid #333;">Trust Signal Checklist</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            ${trustSignals.map(s => `
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee; width: 24px;">${s.found ? '✓' : '○'}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; color: ${s.found ? '#166534' : '#666'};">${s.label}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; color: ${s.found ? '#166534' : '#888'}; font-style: italic;">${s.found ? 'Found on site' : s.suggestion}</td>
              </tr>
            `).join('')}
          </table>
        </div>
      `

      // Build FULL competitor section with table AND detailed cards
      const competitorHtml = hasCompetitorData && data?.competitorComparison?.detailedScores?.length
        ? `
          <div style="page-break-before: always;">
            <h2 style="font-size: 16px; font-weight: bold; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 2px solid #333;">Competitive Analysis</h2>

            <!-- Summary Table -->
            <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 24px;">
              <thead>
                <tr style="background: #f5f5f5;">
                  <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Site</th>
                  <th style="text-align: center; padding: 8px; border: 1px solid #ddd;">Score</th>
                  <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Comparison</th>
                </tr>
              </thead>
              <tbody>
                <tr style="background: #f0f7ff;">
                  <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">${escapeHtml(hostname)} (You)</td>
                  <td style="padding: 8px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${preview.commodityScore}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">—</td>
                </tr>
                ${data.competitorComparison.detailedScores.map((c: { url: string; score: number }) => `
                  <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(c.url.replace(/^https?:\/\//, '').split('/')[0])}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${c.score}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; color: ${c.score > preview.commodityScore ? '#c00' : '#166534'};">
                      ${c.score > preview.commodityScore ? `Behind by ${c.score - preview.commodityScore}` : c.score < preview.commodityScore ? `Ahead by ${preview.commodityScore - c.score}` : 'Tied'}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <!-- Detailed Competitor Cards -->
            ${data.competitorComparison.detailedScores.map((c: { url: string; score: number; strengths?: string[]; weaknesses?: string[]; categoryScores?: Record<string, number> }) => `
              <div style="margin-bottom: 20px; padding: 16px; border: 1px solid #ddd; border-radius: 4px; page-break-inside: avoid;">
                <h3 style="font-size: 13px; margin: 0 0 8px 0; color: #111;">${escapeHtml(c.url.replace(/^https?:\/\//, '').split('/')[0])}</h3>
                <p style="font-size: 12px; color: #666; margin: 0 0 12px 0;">Score: <strong>${c.score}/100</strong></p>

                ${c.categoryScores ? `
                  <div style="margin-bottom: 12px;">
                    <p style="font-size: 11px; font-weight: bold; color: #333; margin: 0 0 4px 0;">Category Breakdown:</p>
                    <table style="width: 100%; font-size: 10px; border-collapse: collapse;">
                      ${Object.entries(c.categoryScores).map(([key, val]) => `
                        <tr>
                          <td style="padding: 2px 0; color: #555;">${catNames[key] || key}</td>
                          <td style="padding: 2px 0; text-align: right; font-weight: bold; color: ${getScoreColor(val as number)};">${val}/10</td>
                        </tr>
                      `).join('')}
                    </table>
                  </div>
                ` : ''}

                <div style="display: flex; gap: 16px;">
                  ${(c.strengths?.length || 0) > 0 ? `
                    <div style="flex: 1;">
                      <p style="font-size: 11px; font-weight: bold; color: #166534; margin: 0 0 4px 0;">✓ Where they're strong</p>
                      <ul style="font-size: 10px; color: #333; margin: 0; padding-left: 16px;">
                        ${(c.strengths || []).map((s: string) => `<li style="margin-bottom: 2px;">${escapeHtml(s)}</li>`).join('')}
                      </ul>
                    </div>
                  ` : ''}
                  ${(c.weaknesses?.length || 0) > 0 ? `
                    <div style="flex: 1;">
                      <p style="font-size: 11px; font-weight: bold; color: #c00; margin: 0 0 4px 0;">✗ Where they're weak</p>
                      <ul style="font-size: 10px; color: #333; margin: 0; padding-left: 16px;">
                        ${(c.weaknesses || []).map((w: string) => `<li style="margin-bottom: 2px;">${escapeHtml(w)}</li>`).join('')}
                      </ul>
                    </div>
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        `
        : ''

      // Build swipe file summary
      const allFindings = preview.topIssues.flatMap((issue: { findings?: { phrase: string; rewrite: string }[] }) => issue.findings || [])
      const swipeFileSummaryHtml = allFindings.length > 0
        ? `
          <div style="page-break-before: always;">
            <h2 style="font-size: 16px; font-weight: bold; margin: 0 0 8px 0; padding-bottom: 8px; border-bottom: 2px solid #333;">Swipe File Summary</h2>
            <p style="font-size: 12px; color: #555; margin: 0 0 16px 0;">${allFindings.length} rewrites ready to use. Each shows original copy and suggested replacement.</p>
            <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
              <thead>
                <tr style="background: #f5f5f5;">
                  <th style="text-align: left; padding: 6px; border: 1px solid #ddd; width: 45%;">Before</th>
                  <th style="text-align: left; padding: 6px; border: 1px solid #ddd; width: 45%;">After</th>
                </tr>
              </thead>
              <tbody>
                ${allFindings.slice(0, 20).map((f: { phrase: string; rewrite: string }) => `
                  <tr>
                    <td style="padding: 6px; border: 1px solid #ddd; color: #666; vertical-align: top; word-wrap: break-word;">${escapeHtml(f.phrase.substring(0, 100))}${f.phrase.length > 100 ? '...' : ''}</td>
                    <td style="padding: 6px; border: 1px solid #ddd; color: #111; vertical-align: top; word-wrap: break-word;">${escapeHtml(f.rewrite.substring(0, 100))}${f.rewrite.length > 100 ? '...' : ''}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            ${allFindings.length > 20 ? `<p style="font-size: 10px; color: #888; margin: 8px 0 0 0; font-style: italic;">Showing first 20 of ${allFindings.length} rewrites. See full report online for complete list.</p>` : ''}
          </div>
        `
        : ''

      // Build pages analyzed list
      const pagesAnalyzedHtml = preview.siteSnapshot?.pagesFound?.length
        ? `
          <div style="page-break-before: always;">
            <h2 style="font-size: 16px; font-weight: bold; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 2px solid #333;">Pages Analyzed</h2>
            <p style="font-size: 12px; color: #555; margin: 0 0 12px 0;">We scanned ${preview.pagesScanned} pages from your website:</p>
            <div style="columns: 2; column-gap: 24px; font-size: 11px;">
              ${preview.siteSnapshot.pagesFound.map((p: string) => `
                <p style="margin: 0 0 4px 0; padding: 4px 0; border-bottom: 1px solid #eee; break-inside: avoid; color: #333;">${escapeHtml(p)}</p>
              `).join('')}
            </div>
          </div>
        `
        : ''

      // Simple Word-style PDF document - COMPLETE REPORT
      const pdfHtml = document.createElement('div')
      pdfHtml.style.fontFamily = 'Georgia, Times, serif'
      pdfHtml.style.maxWidth = '700px'
      pdfHtml.style.margin = '0 auto'
      pdfHtml.style.padding = '40px'
      pdfHtml.style.lineHeight = '1.6'
      pdfHtml.style.color = '#111'
      pdfHtml.innerHTML = `
        <!-- HEADER -->
        <div style="text-align: center; padding-bottom: 24px; border-bottom: 2px solid #333; margin-bottom: 24px;">
          <h1 style="font-size: 24px; font-weight: bold; margin: 0 0 8px 0;">Website Messaging Audit</h1>
          <p style="font-size: 16px; color: #555; margin: 0 0 16px 0;">${escapeHtml(displayName)}</p>
          <p style="font-size: 36px; font-weight: bold; margin: 0; color: #2563eb;">${preview.commodityScore ?? 0}<span style="font-size: 18px; color: #666;">/100</span></p>
          <p style="font-size: 12px; color: #888; margin: 8px 0 0 0;">Messaging Differentiation Score</p>
        </div>

        <!-- SUMMARY -->
        <div style="margin-bottom: 24px;">
          <h2 style="font-size: 16px; font-weight: bold; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 2px solid #333;">Summary</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0;">Pages scanned:</td>
              <td style="padding: 6px 0; text-align: right; font-weight: bold;">${preview.pagesScanned}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0;">Issues found:</td>
              <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #c00;">${preview.topIssues.length}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0;">Rewrites ready:</td>
              <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #166534;">${totalRewrites}</td>
            </tr>
          </table>
        </div>

        <!-- CATEGORY SCORES -->
        <div style="margin-bottom: 24px;">
          <h2 style="font-size: 16px; font-weight: bold; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 2px solid #333;">Score Breakdown</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            ${categoryScoresHtml}
          </table>
        </div>

        ${preview.voiceSummary ? `
        <!-- VOICE SUMMARY -->
        <div style="margin-bottom: 24px;">
          <h2 style="font-size: 16px; font-weight: bold; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 2px solid #333;">Brand Voice Analysis</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 8px 0; width: 140px; vertical-align: top; color: #666;">Current Tone:</td>
              <td style="padding: 8px 0;">${escapeHtml(preview.voiceSummary.currentTone || '')}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; width: 140px; vertical-align: top; color: #666;">Authentic Voice:</td>
              <td style="padding: 8px 0;">${escapeHtml(preview.voiceSummary.authenticVoice || '')}</td>
            </tr>
          </table>
        </div>
        ` : ''}

        <!-- PRIORITY ISSUES (Top 6) -->
        <div style="page-break-before: always;">
          <h2 style="font-size: 16px; font-weight: bold; margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 2px solid #333;">Priority Issues & Rewrites</h2>
          ${issuesHtml}
        </div>

        <!-- COPY YOU CAN USE (Issues 6+) -->
        ${copySectionHtml}

        <!-- TRUST CHECKLIST -->
        <div style="page-break-before: always;">
          ${trustChecklistHtml}
        </div>

        <!-- COMPETITORS -->
        ${competitorHtml}

        <!-- SWIPE FILE SUMMARY -->
        ${swipeFileSummaryHtml}

        <!-- PAGES ANALYZED -->
        ${pagesAnalyzedHtml}

        <!-- FOOTER -->
        <div style="margin-top: 40px; padding-top: 16px; border-top: 1px solid #ddd; text-align: center;">
          <p style="font-size: 11px; color: #888; margin: 0;">Website Messaging Audit by Lee Fuhr | leefuhr.com</p>
          <p style="font-size: 10px; color: #aaa; margin: 4px 0 0 0;">Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      `

      const opt = {
        margin: [20, 20, 20, 20] as [number, number, number, number],
        filename: `website-audit-${hostname}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
        pagebreak: { mode: ['css'] as ('css')[], before: '[style*="page-break-before"]' }
      }

      await html2pdf().set(opt).from(pdfHtml).save()
    } catch (err) {
      console.error('PDF generation failed:', err)
      window.print()
    }
  }

  const handleDownloadBriefPDF = async () => {
    try {
      const html2pdf = (await import('html2pdf.js')).default

      // Proper company name for brief
      const briefDisplayName = hostname.includes('.') ? hostname : companyName

      // Get 3 sample rewrites from different issues
      const sampleRewrites = preview.topIssues
        .flatMap((issue: { findings?: { phrase: string; rewrite: string }[] }) => issue.findings?.slice(0, 1) || [])
        .slice(0, 3)

      // Competitive context if available
      const competitorContext = hasCompetitorData && data?.competitorComparison?.detailedScores?.length
        ? `Your score: ${data.competitorComparison.yourScore}/100 | Competitors avg: ${data.competitorComparison.averageScore}/100`
        : ''

      // Create a DENSE one-page brief - increased base font to 12px
      const briefHtml = document.createElement('div')
      briefHtml.style.fontFamily = 'system-ui, -apple-system, sans-serif'
      briefHtml.style.padding = '24px'
      briefHtml.style.maxWidth = '800px'
      briefHtml.style.margin = '0 auto'
      briefHtml.style.fontSize = '12px'
      briefHtml.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 16px;">
          <div>
            <h1 style="font-size: 20px; font-weight: bold; color: #1e293b; margin: 0;">Copywriter Brief</h1>
            <p style="font-size: 14px; color: #64748b; margin: 4px 0 0 0;">${briefDisplayName}</p>
          </div>
          <div style="text-align: right;">
            <p style="font-size: 28px; font-weight: bold; color: #2563eb; margin: 0;">${preview.commodityScore}<span style="font-size: 14px; color: #64748b;">/100</span></p>
            <p style="font-size: 11px; color: #64748b; margin: 0;">Differentiation Score</p>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 16px;">
          <div style="background: #f8fafc; padding: 10px; border-radius: 4px; text-align: center;">
            <p style="font-size: 18px; font-weight: bold; color: #1e293b; margin: 0;">${preview.pagesScanned}</p>
            <p style="font-size: 10px; color: #64748b; margin: 0;">Pages</p>
          </div>
          <div style="background: #f8fafc; padding: 10px; border-radius: 4px; text-align: center;">
            <p style="font-size: 18px; font-weight: bold; color: #1e293b; margin: 0;">${preview.topIssues.length}</p>
            <p style="font-size: 10px; color: #64748b; margin: 0;">Issues</p>
          </div>
          <div style="background: #f8fafc; padding: 10px; border-radius: 4px; text-align: center;">
            <p style="font-size: 18px; font-weight: bold; color: #1e293b; margin: 0;">${preview.topIssues.reduce((acc: number, issue: { findings?: unknown[] }) => acc + (issue.findings?.length || 0), 0)}</p>
            <p style="font-size: 10px; color: #64748b; margin: 0;">Rewrites</p>
          </div>
          <div style="background: #fef2f2; padding: 10px; border-radius: 4px; text-align: center;">
            <p style="font-size: 18px; font-weight: bold; color: #dc2626; margin: 0;">${preview.topIssues.filter((i: { severity: string }) => i.severity === 'critical').length}</p>
            <p style="font-size: 10px; color: #dc2626; margin: 0;">Critical</p>
          </div>
        </div>

        ${preview.voiceSummary ? `
        <div style="background: #f0f9ff; padding: 12px; border-radius: 4px; margin-bottom: 16px; border-left: 3px solid #2563eb;">
          <h2 style="font-size: 12px; font-weight: bold; color: #1e293b; margin: 0 0 6px 0;">Voice Snapshot</h2>
          <p style="margin: 0 0 4px 0; font-size: 11px;"><strong>Current:</strong> ${escapeHtml(preview.voiceSummary.currentTone || '')}</p>
          <p style="margin: 0; font-size: 11px;"><strong>Authentic:</strong> ${escapeHtml(preview.voiceSummary.authenticVoice || '')}</p>
        </div>
        ` : ''}

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div>
            <h2 style="font-size: 13px; font-weight: bold; color: #1e293b; margin: 0 0 8px 0; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0;">Top 5 Priorities</h2>
            ${preview.topIssues.slice(0, 5).map((issue: { title: string; severity: string }, i: number) => `
              <p style="margin: 0 0 5px 0; font-size: 11px;"><strong style="color: #2563eb;">${i + 1}.</strong> ${escapeHtml(issue.title)} <span style="color: ${issue.severity === 'critical' ? '#dc2626' : '#64748b'};">(${escapeHtml(issue.severity)})</span></p>
            `).join('')}

            <h2 style="font-size: 13px; font-weight: bold; color: #1e293b; margin: 16px 0 8px 0; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0;">Messaging Rules</h2>
            <p style="margin: 0 0 4px 0; font-size: 11px;">1. Lead with proof points (numbers, years)</p>
            <p style="margin: 0 0 4px 0; font-size: 11px;">2. Replace generic claims with outcomes</p>
            <p style="margin: 0 0 4px 0; font-size: 11px;">3. Name the ideal customer explicitly</p>
            <p style="margin: 0 0 4px 0; font-size: 11px;">4. Use active voice and direct CTAs</p>

            ${competitorContext ? `
            <div style="margin-top: 12px; padding: 8px; background: #fef3c7; border-radius: 4px;">
              <p style="font-size: 10px; font-weight: bold; color: #92400e; margin: 0;">Competitive Context</p>
              <p style="font-size: 11px; color: #78350f; margin: 4px 0 0 0;">${competitorContext}</p>
            </div>
            ` : ''}
          </div>

          <div>
            <h2 style="font-size: 13px; font-weight: bold; color: #1e293b; margin: 0 0 8px 0; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0;">Sample Rewrites</h2>
            ${sampleRewrites.map((f: { phrase: string; rewrite: string }) => `
              <div style="margin-bottom: 10px; padding: 8px; background: #f8fafc; border-radius: 4px; border-left: 2px solid #2563eb;">
                <p style="font-size: 10px; color: #ef4444; margin: 0; font-weight: 600;">BEFORE</p>
                <p style="font-size: 11px; color: #64748b; margin: 2px 0 6px 0; text-decoration: line-through;">${escapeHtml(f.phrase.slice(0, 70))}${f.phrase.length > 70 ? '...' : ''}</p>
                <p style="font-size: 10px; color: #22c55e; margin: 0; font-weight: 600;">AFTER</p>
                <p style="font-size: 11px; color: #1e293b; margin: 2px 0 0 0; font-weight: 500;">${escapeHtml(f.rewrite.slice(0, 70))}${f.rewrite.length > 70 ? '...' : ''}</p>
              </div>
            `).join('')}
          </div>
        </div>

        <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 10px; text-align: center;">
          Website Messaging Audit | leefuhr.com | ${new Date().toLocaleDateString()}
        </div>
      `

      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: `copywriter-brief-${hostname}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      }

      await html2pdf().set(opt).from(briefHtml).save()
    } catch (err) {
      console.error('Brief PDF generation failed:', err)
    }
  }

  const handleDownloadSwipePDF = async () => {
    try {
      const html2pdf = (await import('html2pdf.js')).default

      const allFindings = preview.topIssues.flatMap((issue: { findings?: { phrase: string; rewrite: string; problem?: string; location?: string }[] }) => issue.findings || [])

      const swipeHtml = document.createElement('div')
      swipeHtml.style.fontFamily = 'system-ui, -apple-system, sans-serif'
      swipeHtml.style.padding = '24px'
      swipeHtml.style.maxWidth = '800px'
      swipeHtml.style.margin = '0 auto'
      swipeHtml.style.fontSize = '11px'
      swipeHtml.innerHTML = `
        <div style="border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 16px;">
          <h1 style="font-size: 18px; font-weight: bold; color: #1e293b; margin: 0;">Messaging Swipe File</h1>
          <p style="font-size: 13px; color: #64748b; margin: 4px 0 0 0;">${hostname} • ${allFindings.length} rewrites</p>
        </div>

        ${allFindings.map((f: { phrase: string; rewrite: string; problem?: string; location?: string }, i: number) => `
          <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e2e8f0;">
            <p style="font-size: 9px; color: #94a3b8; margin: 0 0 4px 0;">${i + 1}/${allFindings.length}</p>
            <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
              <tr>
                <td style="width: 60px; padding: 4px 8px; background: #fef2f2; color: #dc2626; font-weight: bold; vertical-align: top;">BEFORE</td>
                <td style="padding: 4px 8px; background: #fef2f2; color: #374151;">${escapeHtml(f.phrase)}</td>
              </tr>
              <tr>
                <td style="width: 60px; padding: 4px 8px; background: #f0fdf4; color: #166534; font-weight: bold; vertical-align: top;">AFTER</td>
                <td style="padding: 4px 8px; background: #f0fdf4; color: #1e293b; font-weight: 500;">${escapeHtml(f.rewrite)}</td>
              </tr>
              ${f.problem ? `<tr><td colspan="2" style="padding: 4px 8px; color: #64748b; font-style: italic; font-size: 10px;"><strong>Why:</strong> ${escapeHtml(f.problem)}</td></tr>` : ''}
              ${f.location ? `<tr><td colspan="2" style="padding: 4px 8px; color: #94a3b8; font-size: 9px;">Found: ${escapeHtml(f.location)}</td></tr>` : ''}
            </table>
          </div>
        `).join('')}

        <div style="margin-top: 24px; text-align: center; color: #94a3b8; font-size: 10px;">
          Website Messaging Audit by Lee Fuhr | leefuhr.com
        </div>
      `

      const opt = {
        margin: [15, 15, 15, 15] as [number, number, number, number],
        filename: `swipe-file-${hostname}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      }

      await html2pdf().set(opt).from(swipeHtml).save()
    } catch (err) {
      console.error('Swipe PDF generation failed:', err)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-body text-lg">Loading your report...</p>
        </div>
      </main>
    )
  }

  if (error || !data || !data.preview) {
    return (
      <main className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-6xl mb-4">⚠️</p>
          <h1 className="text-section text-2xl mb-4">Something went wrong</h1>
          <p className="text-body mb-8">{error || 'Unable to load your results.'}</p>
          <Link href="/" className="bg-[var(--accent)] text-white px-6 py-3 font-semibold hover:opacity-90 transition-opacity inline-block">
            Try again
          </Link>
        </div>
      </main>
    )
  }

  const preview = data.preview
  const hostname = (() => {
    try { return new URL(data.url).hostname.replace('www.', '') }
    catch { return data.url }
  })()
  // Use page title if available and meaningful, otherwise format the hostname nicely
  const rawTitle = preview.siteSnapshot.title || ''
  const companyName = rawTitle && rawTitle.length > 2 && !rawTitle.toLowerCase().includes('home')
    ? rawTitle.split('|')[0].split('-')[0].split('–')[0].trim() // Clean common title separators
    : formatCompanyName(hostname)
  const scoreColorClass = getScoreColorClass(preview.commodityScore)
  const scoreBgClass = getScoreBgClass(preview.commodityScore)
  const scoreBorderClass = getScoreBorderClass(preview.commodityScore)

  return (
    <main className="min-h-screen bg-[var(--background)]">
      {/* Sticky TOC */}
      <nav className="hidden lg:block print:!hidden fixed top-0 left-0 w-64 h-screen bg-[var(--accent)] text-white p-8 overflow-y-auto z-40 flex flex-col">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-wider opacity-60 mb-1">Audit for</p>
          <button onClick={() => handleViewChange('overview')} className="font-semibold text-lg text-left hover:underline w-full capitalize">
            {companyName}
          </button>
          <p className="text-xs opacity-60 font-mono mt-1">{hostname}</p>
        </div>
        <ul className="space-y-1 flex-1">
          {views.map((view) => (
            <li key={view.id}>
              <button
                onClick={() => handleViewChange(view.id)}
                className={`w-full text-left py-3 px-4 text-sm transition-all flex items-center gap-3 ${
                  currentView === view.id ? 'bg-white/20 font-semibold' : 'opacity-70 hover:opacity-100 hover:bg-white/10'
                }`}
              >
                {viewIcons[view.id]}
                {view.label}
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-auto pt-8 border-t border-white/20 print:hidden space-y-2">
          <div className="relative group">
            {isTestUnlocked ? (
              <button
                onClick={handleDownloadPDF}
                className="w-full py-3 px-4 text-sm bg-white text-[var(--accent)] font-semibold transition-all flex items-center justify-center gap-2 opacity-100 cursor-pointer hover:bg-white/90"
              >
                📄 Download PDF
              </button>
            ) : (
              <>
                <button className="w-full py-3 px-4 text-sm bg-white/10 transition-all flex items-center justify-center gap-2 opacity-60 cursor-default">
                  🔒 Download PDF
                </button>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Included with full purchase
                </div>
              </>
            )}
          </div>
          <Link
            href="/"
            className="block w-full py-3 px-4 text-sm text-white/70 hover:text-white transition-all text-center"
          >
            Analyze another site →
          </Link>
        </div>
      </nav>

      {/* Mobile Navigation Header - visible only on mobile */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[var(--accent)] text-white px-4 py-3 flex items-center justify-between print:hidden">
        <div>
          <p className="text-xs opacity-60">Audit for</p>
          <p className="font-semibold capitalize">{companyName}</p>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 hover:bg-white/10 rounded transition-colors"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 print:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Menu panel */}
          <nav className="absolute top-[52px] left-0 right-0 bg-[var(--accent)] text-white max-h-[calc(100vh-52px)] overflow-y-auto">
            <ul className="py-2">
              {views.map((view) => (
                <li key={view.id}>
                  <button
                    onClick={() => {
                      handleViewChange(view.id)
                      setMobileMenuOpen(false)
                    }}
                    className={`w-full text-left py-4 px-6 text-base transition-all flex items-center gap-3 ${
                      currentView === view.id ? 'bg-white/20 font-semibold' : 'hover:bg-white/10'
                    }`}
                  >
                    {viewIcons[view.id]}
                    {view.label}
                    {currentView === view.id && (
                      <span className="ml-auto text-xs opacity-70">Current</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
            <div className="border-t border-white/20 p-4 space-y-3">
              {isTestUnlocked && (
                <button
                  onClick={() => {
                    handleDownloadPDF()
                    setMobileMenuOpen(false)
                  }}
                  className="w-full py-3 px-4 text-sm bg-white text-[var(--accent)] font-semibold rounded transition-all"
                >
                  📄 Download PDF
                </button>
              )}
              <Link
                href="/"
                className="block w-full py-3 px-4 text-sm text-white/70 hover:text-white transition-all text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Analyze another site →
              </Link>
            </div>
          </nav>
        </div>
      )}

      {/* Main content */}
      <div className="lg:ml-64 print:!ml-0 pt-[52px] lg:pt-0">
        {/* Header */}
        <header className="border-b-4 border-[var(--accent)] py-8 md:py-12">
          <div className="container">
            <p className="text-label mb-2">WEBSITE MESSAGING AUDIT</p>
            <h1 className="text-display mb-4 capitalize">{companyName}</h1>
            <div className="flex flex-wrap gap-4 text-[var(--muted-foreground)]">
              <span>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              <span>·</span>
              <span>Prepared by Lee Fuhr</span>
              <span>·</span>
              <span className="font-mono">{hostname}</span>
              {preview.siteSnapshot.hasLinkedIn && (
                <>
                  <span>·</span>
                  <span className="text-[var(--success)]">LinkedIn found ✓</span>
                </>
              )}
              {data.socialUrls && data.socialUrls.length > 0 && (
                <>
                  <span>·</span>
                  <span className="text-[var(--success)]">{data.socialUrls.length} social{data.socialUrls.length !== 1 ? 's' : ''} added ✓</span>
                </>
              )}
            </div>

            {/* SPA Warning */}
            {preview.siteSnapshot.spaWarning?.isSPA && (
              <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-yellow-800">JavaScript-rendered site detected</p>
                    <p className="text-sm text-yellow-700 mt-1">{preview.siteSnapshot.spaWarning.message}</p>
                    <details className="mt-2">
                      <summary className="text-xs text-yellow-600 cursor-pointer hover:text-yellow-800">Technical details</summary>
                      <ul className="text-xs text-yellow-600 mt-1 ml-4 list-disc">
                        {preview.siteSnapshot.spaWarning.indicators.map((ind, i) => (
                          <li key={i}>{ind}</li>
                        ))}
                      </ul>
                    </details>
                  </div>
                </div>
              </div>
            )}

            {/* Share buttons */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  const url = window.location.href
                  const text = `Check out this website messaging audit for ${companyName}`
                  window.open(`mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`, '_blank')
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-[var(--border)] hover:bg-[var(--muted)] transition-colors rounded"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="22,6 12,13 2,6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Share via email
              </button>
              <button
                onClick={() => {
                  const url = window.location.href
                  const text = `Website messaging audit for ${companyName} - score: ${preview.commodityScore}/100`
                  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank', 'width=600,height=400')
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-[var(--border)] hover:bg-[var(--muted)] transition-colors rounded"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                Share on LinkedIn
              </button>
              <button
                onClick={async () => {
                  const url = window.location.href
                  const result = await safeClipboardWrite(url)
                  if (result.success) {
                    const btn = document.getElementById('copy-link-btn')
                    if (btn) { btn.textContent = '✓ Copied!'; setTimeout(() => { btn.textContent = 'Copy Link' }, 1500) }
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-[var(--border)] hover:bg-[var(--muted)] transition-colors rounded"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span id="copy-link-btn">Copy share link</span>
              </button>
            </div>
          </div>
        </header>

        {/* OVERVIEW VIEW */}
        {currentView === 'overview' && (
          <ViewNavBar prevView={prevView} nextView={nextView} onNavigate={handleViewChange} hideTopNav={true}>
            {/* How this works */}
            <section className="section bg-[var(--muted)] border-b border-[var(--border)] print:hidden">
              <div className="container">
                <div className="max-w-3xl">
                  <p className="text-label mb-2">HOW THIS WORKS</p>
                  <h2 className="text-section mb-4">We find the proof you&apos;re already sitting on</h2>
                  <p className="text-body-lg mb-4">
                    Your website has gold buried in it - project counts, tolerances, on-time stats, specific outcomes. The problem? It&apos;s hidden in paragraph 3 of your About page while your homepage says &quot;quality service.&quot;
                  </p>
                  <p className="text-body text-[var(--muted-foreground)]">
                    This audit finds those proof points and shows you exactly how to use them. The rewrites aren&apos;t generic marketing copy - they&apos;re built from YOUR numbers.
                  </p>
                </div>
              </div>
            </section>

            {/* Differentiation Score */}
            <section className="section">
              <div className="container">
                <h2 className="text-section mb-6">Your differentiation score</h2>
                <div className={`${scoreBgClass} border-4 ${scoreBorderClass} p-8 mb-8 rounded text-center`}>
                  <div className="mb-4">
                    <span className={`text-7xl font-bold ${scoreColorClass}`}>{preview.commodityScore}</span>
                    <span className="text-2xl text-[var(--muted-foreground)]">/100</span>
                  </div>
                  <p className={`text-xl font-bold mb-2 ${scoreColorClass}`}>{getScoreLabel(preview.commodityScore)}</p>
                  <p className="text-body text-[var(--muted-foreground)] max-w-xl mx-auto">{getScoreDescription(preview.commodityScore)}</p>
                </div>
                <div className="bg-[var(--muted)] border-2 border-[var(--border)] p-4 rounded">
                  <p className="text-xs font-bold text-[var(--muted-foreground)] mb-3 text-center">HOW YOU COMPARE</p>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-orange-500">38</p>
                      <p className="text-xs text-[var(--muted-foreground)]">typical first audit</p>
                    </div>
                    <div className="border-x border-[var(--border)]">
                      <p className={`text-2xl font-bold ${scoreColorClass}`}>{preview.commodityScore}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">you today</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">85+</p>
                      <p className="text-xs text-[var(--muted-foreground)]">typical after fixes</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Top Priorities */}
            <section className="section section-alt">
              <div className="container">
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-section">Top priorities</h2>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-semibold uppercase tracking-wide">Preview included</span>
                </div>
                <p className="text-body-lg mb-8 max-w-3xl">
                  Below are the specific changes that will have the most impact. Click any issue to see what to do about it.
                </p>
                <div className="grid gap-4">
                  {preview.topIssues.map((issue, index) => {
                    const isExpanded = expandedIssue === index
                    const isFeatured = index === 0
                    return (
                      <div
                        key={index}
                        className={`action-card ${isFeatured ? 'featured' : ''} cursor-pointer hover:border-[var(--accent)] transition-colors`}
                        onClick={() => setExpandedIssue(isExpanded ? null : index)}
                      >
                        <div className="flex flex-col md:flex-row md:items-start gap-4">
                          <div className="flex items-center gap-4">
                            <span className="text-3xl font-bold text-[var(--accent)] shrink-0 w-12">{String(index + 1).padStart(2, '0')}</span>
                            {isFeatured && (
                              <span className="bg-[var(--accent)] text-white text-xs font-bold uppercase tracking-wider px-3 py-1">Start here</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                              <h3 className="text-subsection">{issue.title}</h3>
                              <Tooltip
                                content={
                                  issue.severity === 'critical'
                                    ? 'Critical - Actively hurting conversion rate. Address within 30 days.'
                                    : issue.severity === 'warning'
                                    ? 'Warning - Creates friction in buyer journey. Address within 60 days.'
                                    : 'Polish - Refinement opportunity for competitive positioning.'
                                }
                              >
                                <span
                                  className={`text-xs px-2 py-1 rounded font-bold uppercase tracking-wide cursor-pointer ${
                                    issue.severity === 'critical' ? 'bg-red-100 text-red-700' :
                                    issue.severity === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-green-100 text-green-700'
                                  }`}
                                >
                                  {issue.severity === 'critical' ? '🔴' : issue.severity === 'warning' ? '🟡' : '🟢'} {issue.severity}
                                </span>
                              </Tooltip>
                            </div>
                            <p className="text-body text-[var(--muted-foreground)]">{issue.description}</p>
                          </div>
                        </div>
                        <div className={`overflow-hidden transition-all duration-200 ease-in-out ${isExpanded ? 'max-h-[5000px] opacity-100 mt-6 pt-6 border-t-2 border-[var(--border)]' : 'max-h-0 opacity-0'}`}>
                          {/* Show ALL findings attached to this issue (up to 5) */}
                          {issue.findings && issue.findings.length > 0 ? (
                            <div className="mb-6">
                              <div className="space-y-6">
                                {issue.findings.map((finding, findingIndex) => (
                                  <div key={findingIndex} className="border-2 border-[var(--border)] rounded-lg overflow-hidden">
                                    <div className="grid md:grid-cols-2 gap-0">
                                      <div className="p-4 bg-red-50 border-r border-[var(--border)]">
                                        <p className="text-xs font-bold text-red-600 mb-2">❌ CURRENT</p>
                                        <p className="text-sm text-[var(--foreground)]">{finding.phrase}</p>
                                        <p className="text-xs text-[var(--muted-foreground)] mt-2">
                                          Found: {finding.location}
                                          {finding.pageUrl && (
                                            <a href={createTextFragmentUrl(finding.pageUrl, finding.phrase)} target="_blank" rel="noopener noreferrer" className="ml-1 inline-flex items-center text-[var(--accent)] hover:text-[var(--accent-hover)]" title="View source page">
                                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                                            </a>
                                          )}
                                        </p>
                                      </div>
                                      <div className="p-4 bg-green-50">
                                        <div className="flex justify-between items-start gap-2 mb-2">
                                          <p className="text-xs font-bold text-green-600">✓ SUGGESTED REWRITE</p>
                                          <button
                                            onClick={async (e) => {
                                              e.stopPropagation()
                                              await safeClipboardWrite(finding.rewrite)
                                              const btn = e.currentTarget
                                              btn.textContent = '✓ Copied'
                                              setTimeout(() => { btn.textContent = 'Copy' }, 1500)
                                            }}
                                            className="text-xs px-2 py-0.5 bg-white border border-green-300 rounded hover:bg-green-100 transition-colors text-green-700 font-medium"
                                          >
                                            Copy
                                          </button>
                                        </div>
                                        <p className="text-sm text-[var(--foreground)]">{finding.rewrite}</p>
                                      </div>
                                    </div>
                                    <div className="p-3 bg-[var(--muted)] border-t border-[var(--border)]">
                                      <p className="text-sm text-[var(--foreground)]">
                                        <strong>Why this matters:</strong> {finding.problem}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="mb-4">
                              <div className={`p-4 rounded border-l-4 ${
                                issue.severity === 'critical'
                                  ? 'bg-red-50 border-red-500'
                                  : issue.severity === 'warning'
                                  ? 'bg-amber-50 border-amber-500'
                                  : 'bg-slate-50 border-slate-400'
                              }`}>
                                <p className="text-sm text-[var(--foreground)] mb-2">
                                  <strong>Why this matters:</strong> {
                                    issue.severity === 'critical'
                                      ? 'This is actively hurting your conversion rate. Visitors are leaving because of this issue.'
                                      : issue.severity === 'warning'
                                      ? 'This creates friction in the buyer journey. Fixing it will noticeably improve engagement.'
                                      : 'This is a refinement opportunity that can improve your competitive positioning.'
                                  }
                                </p>
                                <p className="text-sm text-[var(--muted-foreground)]">
                                  {issue.severity === 'critical'
                                    ? 'Address this within 30 days for meaningful improvement.'
                                    : issue.severity === 'warning'
                                    ? 'Plan to address this within 60 days.'
                                    : 'Address after higher-priority items are complete.'}
                                </p>
                              </div>
                            </div>
                          )}
                          <div className="flex items-center gap-4">
                            <button
                              onClick={(e) => { e.stopPropagation(); setExpandedIssue(null) }}
                              className="text-sm text-[var(--muted-foreground)] hover:text-[var(--accent)] font-medium"
                            >
                              ↑ Collapse
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </section>

            {/* Scores - fully visible in preview Overview */}
            <section className="section">
              <div className="container">
                <h2 className="text-section mb-4">Where you stand</h2>
                <p className="text-body-lg mb-8 max-w-3xl">
                  Detailed breakdowns of each score are available in the full audit.
                </p>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {scoreCategories.map((cat) => {
                    // Use AI-generated category scores if available, otherwise derive from overall with variance
                    const aiScore = preview?.categoryScores?.[cat.key as keyof typeof preview.categoryScores]
                    // Add variance per category so fallback scores aren't all identical
                    const categoryVariance: Record<string, number> = {
                      firstImpression: 0,
                      differentiation: -1,
                      customerClarity: 1,
                      storyStructure: -1,
                      trustSignals: 1,
                      buttonClarity: 0,
                    }
                    const baseScore = Math.round((preview?.commodityScore || 50) / 12.5)
                    const variance = categoryVariance[cat.key] || 0
                    const score = aiScore !== undefined
                      ? Math.max(1, Math.min(10, aiScore))
                      : Math.max(1, Math.min(10, baseScore + variance))
                    const color = score >= 7 ? 'excellent' : score >= 5 ? 'moderate' : 'poor'
                    const label = score >= 7 ? 'Strong' : score >= 5 ? 'Needs work' : 'Critical'

                    // Sub-factors for each category
                    const subFactors: Record<string, string[]> = {
                      firstImpression: ['Hero headline clarity', 'Value prop visibility', 'Visual hierarchy'],
                      differentiation: ['Unique proof points', 'Specific vs generic claims', 'Competitive positioning'],
                      customerClarity: ['Target audience specificity', 'Problem/solution fit', 'Use case examples'],
                      storyStructure: ['Narrative flow', 'Benefit-led messaging', 'Emotional connection'],
                      trustSignals: ['Social proof quality', 'Credential visibility', 'Risk reducers'],
                      buttonClarity: ['CTA copy specificity', 'Next step obviousness', 'Value reinforcement'],
                    }

                    return (
                      <button
                        key={cat.key}
                        onClick={() => setOpenScorecard(cat.key)}
                        className={`score-card text-left border-2 border-[var(--border)] p-6 rounded cursor-pointer hover:border-[var(--accent)] hover:shadow-md transition-all ${color === 'excellent' ? 'bg-green-50' : color === 'moderate' ? 'bg-amber-50' : 'bg-red-50'}`}
                      >
                        <p className="text-label mb-1">{cat.label}</p>
                        <div className="flex items-baseline justify-between mb-2">
                          <div className="flex items-baseline gap-2">
                            <span className={`text-4xl font-bold score-${color}`}>{score}</span>
                            <span className="text-[var(--muted-foreground)]">/10</span>
                          </div>
                          <span className={`text-sm font-semibold score-${color}`}>{label}</span>
                        </div>
                        <div className="score-bar mb-3">
                          <div className={`score-bar-fill ${color}`} style={{ width: `${score * 10}%` }}></div>
                        </div>
                        <p className="text-sm text-[var(--muted-foreground)]">{cat.question}</p>
                        {/* What we measure - sub-factors */}
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs font-semibold text-gray-600 mb-2">What we measure:</p>
                          <ul className="text-xs text-gray-500 space-y-0.5">
                            {(subFactors[cat.key] || []).map((factor, idx) => (
                              <li key={idx}>• {factor}</li>
                            ))}
                          </ul>
                        </div>
                        <p className="text-xs text-[var(--accent)] mt-3 font-medium">See breakdown →</p>
                      </button>
                    )
                  })}
                </div>
              </div>
            </section>

            {/* What we found - Intelligence Summary */}
            <section className="section bg-gray-50 border-t-2 border-gray-200">
              <div className="container">
                <h2 className="text-section mb-6">What we scanned</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="p-6 bg-white border-2 border-gray-300 rounded-lg shadow-sm">
                    <p className="text-5xl font-bold text-[var(--accent)] mb-2">
                      {preview?.topIssues?.reduce((total, issue) => total + (issue.findings?.length || 0), 0) || 0}
                    </p>
                    <p className="text-sm font-bold mb-2">Copy-paste rewrites</p>
                    <p className="text-xs text-gray-600">
                      Specific phrases from YOUR site with suggested replacements
                    </p>
                  </div>
                  <div className="p-6 bg-white border-2 border-gray-300 rounded-lg shadow-sm">
                    <p className="text-5xl font-bold text-[var(--accent)] mb-2">
                      {data?.competitorComparison?.detailedScores?.length || 0}
                    </p>
                    <p className="text-sm font-bold mb-2">Competitors analyzed</p>
                    <p className="text-xs text-gray-600">
                      Full category scoring and insights per competitor
                    </p>
                  </div>
                  <div className="p-6 bg-white border-2 border-gray-300 rounded-lg shadow-sm">
                    <p className="text-5xl font-bold text-[var(--accent)] mb-2">
                      {preview?.pagesScanned || 0}
                    </p>
                    <p className="text-sm font-bold mb-2">Pages crawled</p>
                    <p className="text-xs text-gray-600">
                      Complete content audit across your entire site
                    </p>
                  </div>
                </div>

                {/* Expandable pages list */}
                {preview?.siteSnapshot?.pagesFound?.length > 0 && (
                  <details className="mt-6 bg-gray-50 border border-gray-200 rounded-lg">
                    <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                      View all {preview.siteSnapshot.pagesFound.length} pages we analyzed
                    </summary>
                    <div className="px-4 py-3 border-t border-gray-200 max-h-64 overflow-y-auto">
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {preview.siteSnapshot.pagesFound.map((page: string, idx: number) => (
                          <a
                            key={idx}
                            href={`https://${hostname}${page}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-gray-600 hover:text-[var(--accent)] hover:underline truncate block py-1"
                            title={page}
                          >
                            {page}
                          </a>
                        ))}
                      </div>
                    </div>
                  </details>
                )}
              </div>
            </section>

            {/* Unlock CTA */}
            {!isTestUnlocked && (
            <section className="bg-[var(--accent)] text-white py-12 md:py-16">
              <div className="container">
                <div className="max-w-3xl mx-auto">
                  <p className="text-xs uppercase tracking-widest text-white/60 text-center mb-2">Ready to differentiate?</p>
                  <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Get your complete audit for $400</h2>
                  <div className="grid md:grid-cols-2 gap-4 mb-8">
                    <div className="p-4 bg-white/10 backdrop-blur rounded border border-white/20">
                      <p className="font-bold text-white mb-1">📄 Copy-paste rewrites</p>
                      <p className="text-sm text-white/80">Specific replacement copy for every issue found</p>
                    </div>
                    <div className="p-4 bg-white/10 backdrop-blur rounded border border-white/20">
                      <p className="font-bold text-white mb-1">📊 Complete score breakdown</p>
                      <p className="text-sm text-white/80">Deep dive into each area with specific fixes</p>
                    </div>
                    <div className="p-4 bg-white/10 backdrop-blur rounded border border-white/20">
                      <p className="font-bold text-white mb-1">💎 Your hidden proof points</p>
                      <p className="text-sm text-white/80">Gold buried on your site, surfaced and ready</p>
                    </div>
                    <div className="p-4 bg-white/10 backdrop-blur rounded border border-white/20">
                      <p className="font-bold text-white mb-1">📍 Page-by-page breakdown</p>
                      <p className="text-sm text-white/80">Every page analyzed with exact locations</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <button
                      onClick={handleUnlock}
                      disabled={isCheckingOut}
                      className="bg-white text-[var(--accent)] px-10 py-4 text-lg font-bold hover:bg-white/90 transition-all shadow-lg disabled:opacity-50"
                    >
                      {isCheckingOut ? 'Starting checkout...' : 'Unlock full audit - $400'}
                    </button>
                    <p className="text-xs text-white/60 mt-4">
                      One-time payment. No subscription. Instant access.
                    </p>
                  </div>
                </div>
              </div>
            </section>
            )}

          </ViewNavBar>
        )}

        {/* MESSAGE VIEW */}
        {currentView === 'message' && (
          <ViewNavBar prevView={prevView} nextView={nextView} onNavigate={handleViewChange}>
            <section className="section">
              <div className="container">
                <h2 className="text-section mb-6">First impression clarity</h2>
                <div className="methodology-box">
                  <h3 className="text-subsection mb-2">The 5-second test</h3>
                  <p className="text-body mb-4">
                    Your prospects open 10 tabs. You have 5 seconds to answer: &quot;Is this for me?&quot; If they can&apos;t
                    immediately see what you do, who you serve, and why you&apos;re different - they close the tab.
                  </p>
                  {/* Framework reference */}
                  <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded">
                    <p className="text-sm font-bold text-gray-800 mb-2">
                      Framework: StoryBrand clarity filter
                      <a href="https://en.wikipedia.org/wiki/Donald_Miller_(author)" target="_blank" rel="noopener noreferrer" className="ml-2 text-xs font-normal text-gray-500 hover:text-gray-700 underline">Learn more →</a>
                    </p>
                    <p className="text-xs text-gray-600 mb-2">
                      We measure how quickly visitors can answer these questions:
                    </p>
                    <ol className="text-xs text-gray-600 space-y-1 ml-4 list-decimal">
                      <li>What do you offer?</li>
                      <li>How will it make my life better?</li>
                      <li>What do I need to do to buy it?</li>
                    </ol>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <h3 className="text-subsection mb-4">What we found</h3>
                    <ul className="space-y-3">
                      {preview.topIssues.slice(0, 3).map((issue, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className={issue.severity === 'critical' ? 'text-[var(--error)]' : issue.severity === 'warning' ? 'text-[var(--warning)]' : 'text-[var(--success)]'}>
                            {issue.severity === 'critical' ? '✗' : issue.severity === 'warning' ? '⚠' : '✓'}
                          </span>
                          <span>{issue.title}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-subsection mb-4">What this means for you</h3>
                    <p className="text-body mb-4">
                      When a visitor lands on your site, they&apos;re deciding in seconds whether you&apos;re worth their time.
                      The issues above are causing friction that costs you leads.
                    </p>
                    <p className="text-body text-[var(--muted-foreground)]">
                      The full audit breaks down exactly how to fix each one with copy you can paste.
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="text-subsection mb-4">What to do</h3>
                  {/* FULLY UNLOCKED - show all first impression findings */}
                  {getFindingsForSection(preview.topIssues, 'positioning').length > 0 ? (
                    <div className="space-y-4">
                      {getFindingsForSection(preview.topIssues, 'positioning').slice(0, 5).map((finding, idx) => (
                        <div key={idx} className="border-2 border-[var(--border)] rounded-lg overflow-hidden">
                          <div className="grid md:grid-cols-2 gap-0">
                            <div className="p-4 bg-red-50 border-r border-[var(--border)]">
                              <p className="text-xs font-bold text-red-600 mb-2">❌ CURRENT</p>
                              <p className="text-sm text-[var(--foreground)]">{finding.phrase}</p>
                              <p className="text-xs text-[var(--muted-foreground)] mt-2">
                                          Found: {finding.location}
                                          {finding.pageUrl && (
                                            <a href={createTextFragmentUrl(finding.pageUrl, finding.phrase)} target="_blank" rel="noopener noreferrer" className="ml-1 inline-flex items-center text-[var(--accent)] hover:text-[var(--accent-hover)]" title="View source page">
                                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                                            </a>
                                          )}
                                        </p>
                            </div>
                            <div className="p-4 bg-green-50">
                              <div className="flex justify-between items-start gap-2 mb-2">
                                <p className="text-xs font-bold text-green-600">✓ REWRITE</p>
                                <button
                                  onClick={async () => {
                                    await safeClipboardWrite(finding.rewrite)
                                  }}
                                  className="text-xs px-2 py-0.5 bg-white border border-green-300 rounded hover:bg-green-100 transition-colors text-green-700 font-medium"
                                >
                                  Copy
                                </button>
                              </div>
                              <p className="text-sm text-[var(--foreground)]">{finding.rewrite}</p>
                            </div>
                          </div>
                          <div className="p-3 bg-[var(--muted)] border-t border-[var(--border)]">
                            <p className="text-sm text-[var(--foreground)]">
                              <strong>Why:</strong> {finding.problem}
                            </p>
                          </div>
                        </div>
                      ))}
                      <p className="text-sm text-[var(--accent)] font-medium">
                        More fixes in the full audit →
                      </p>
                    </div>
                  ) : preview.teaserFinding ? (
                    <div className="border-2 border-[var(--border)] rounded-lg overflow-hidden">
                      <div className="grid md:grid-cols-2 gap-0">
                        <div className="p-4 bg-red-50 border-r border-[var(--border)]">
                          <p className="text-xs font-bold text-red-600 mb-2">❌ CURRENT</p>
                          <p className="text-sm text-[var(--foreground)]">{preview.teaserFinding.phrase}</p>
                          <p className="text-xs text-[var(--muted-foreground)] mt-2">
                            Found: {preview.teaserFinding.location}
                            {preview.teaserFinding.pageUrl && (
                              <a href={createTextFragmentUrl(preview.teaserFinding.pageUrl, preview.teaserFinding.phrase)} target="_blank" rel="noopener noreferrer" className="ml-1 inline-flex items-center text-[var(--accent)] hover:text-[var(--accent-hover)]" title="View source page">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                              </a>
                            )}
                          </p>
                        </div>
                        <div className="p-4 bg-green-50">
                          <p className="text-xs font-bold text-green-600 mb-2">✓ REWRITE</p>
                          <p className="text-sm text-[var(--foreground)]">{preview.teaserFinding.rewrite}</p>
                        </div>
                      </div>
                      <div className="p-3 bg-[var(--muted)] border-t border-[var(--border)]">
                        <p className="text-sm text-[var(--foreground)]">
                          <strong>Why:</strong> {preview.teaserFinding.problem}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-body text-[var(--muted-foreground)]">
                      Specific rewrites are included in your full audit.
                    </p>
                  )}
                </div>
              </div>
            </section>
            <section className="section section-alt">
              <div className="container">
                <h2 className="text-section mb-6">The order of your message</h2>
                <div className="methodology-box">
                  <h3 className="text-subsection mb-2">Why sequence matters</h3>
                  <p className="text-body">
                    Most industrial websites lead with &quot;Our Services&quot; or &quot;Our Products.&quot; Wrong order. Prospects
                    need to feel understood before they&apos;ll listen to your solution. The winning sequence:
                    <strong> Pain → Outcome → Proof → Features → Next Step</strong>.
                  </p>
                </div>
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <h3 className="text-subsection mb-4">What we found</h3>
                    <p className="text-body mb-4">
                      Your site leads with capabilities and features before establishing the problem you solve.
                    </p>
                    <p className="text-body">
                      <strong>Current sequence:</strong> Features → Features → Contact Us
                    </p>
                  </div>
                  <div>
                    <h3 className="text-subsection mb-4">What this means for you</h3>
                    <p className="text-body">
                      Leading with features assumes visitors already know they need your solution and are
                      comparison shopping. Many prospects are earlier in their journey - they have a
                      problem and aren&apos;t sure how to solve it.
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="text-subsection mb-4">What to do</h3>
                  {isTestUnlocked && getFindingsForSection(preview.topIssues, 'valueProps').length > 0 ? (
                    <div className="space-y-4">
                      {getFindingsForSection(preview.topIssues, 'valueProps').slice(0, 5).map((finding, idx) => (
                        <div key={idx} className="border-2 border-[var(--border)] rounded-lg overflow-hidden">
                          <div className="grid md:grid-cols-2 gap-0">
                            <div className="p-4 bg-red-50 border-r border-[var(--border)]">
                              <p className="text-xs font-bold text-red-600 mb-2">❌ CURRENT</p>
                              <p className="text-sm text-[var(--foreground)]">{finding.phrase}</p>
                              <p className="text-xs text-[var(--muted-foreground)] mt-2">
                                          Found: {finding.location}
                                          {finding.pageUrl && (
                                            <a href={createTextFragmentUrl(finding.pageUrl, finding.phrase)} target="_blank" rel="noopener noreferrer" className="ml-1 inline-flex items-center text-[var(--accent)] hover:text-[var(--accent-hover)]" title="View source page">
                                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                                            </a>
                                          )}
                                        </p>
                            </div>
                            <div className="p-4 bg-green-50">
                              <div className="flex justify-between items-start gap-2 mb-2">
                                <p className="text-xs font-bold text-green-600">✓ REWRITE</p>
                                <button
                                  onClick={async () => {
                                    await safeClipboardWrite(finding.rewrite)
                                  }}
                                  className="text-xs px-2 py-0.5 bg-white border border-green-300 rounded hover:bg-green-100 transition-colors text-green-700 font-medium"
                                >
                                  Copy
                                </button>
                              </div>
                              <p className="text-sm text-[var(--foreground)]">{finding.rewrite}</p>
                            </div>
                          </div>
                          <div className="p-3 bg-[var(--muted)] border-t border-[var(--border)]">
                            <p className="text-sm text-[var(--foreground)]">
                              <strong>Why:</strong> {finding.problem}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : isTestUnlocked ? (
                    <div className="p-6 bg-[var(--muted)] border-2 border-[var(--border)] rounded text-center">
                      <p className="text-body text-[var(--muted-foreground)]">
                        No message structure findings in this audit.
                      </p>
                    </div>
                  ) : (
                    <LockedFindings onUnlock={handleUnlock} isUnlocked={isTestUnlocked} />
                  )}
                </div>
              </div>
            </section>
          </ViewNavBar>
        )}

        {/* AUDIENCE VIEW */}
        {currentView === 'audience' && (
          <ViewNavBar prevView={prevView} nextView={nextView} onNavigate={handleViewChange}>
            <section className="section">
              <div className="container">
                <h2 className="text-section mb-6">Who you&apos;re really for</h2>
                <div className="methodology-box">
                  <h3 className="text-subsection mb-2">The &quot;more of these&quot; principle</h3>
                  <p className="text-body mb-4">
                    Think of your best customers - the ones who pay on time, don&apos;t nickel-and-dime you,
                    and refer others. Your website should speak directly to <em>that</em> company. When
                    you write for everyone, you connect with no one.
                  </p>
                  {/* Framework reference */}
                  <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded">
                    <p className="text-sm font-bold text-gray-800 mb-2">
                      Framework: Jobs-to-be-done
                      <a href="https://en.wikipedia.org/wiki/Outcome-Driven_Innovation" target="_blank" rel="noopener noreferrer" className="ml-2 text-xs font-normal text-gray-500 hover:text-gray-700 underline">Learn more →</a>
                    </p>
                    <p className="text-xs text-gray-600 mb-2">
                      We look for language that addresses:
                    </p>
                    <ul className="text-xs text-gray-600 space-y-1 ml-4 list-disc">
                      <li>The specific situation triggering their search</li>
                      <li>The outcome they&apos;re trying to achieve</li>
                      <li>Barriers preventing them from getting there</li>
                    </ul>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <h3 className="text-subsection mb-4">What we found</h3>
                    <p className="text-body mb-4">
                      Your site speaks broadly to multiple audiences without clearly identifying your ideal customer.
                    </p>
                    <div className="callout mt-4">
                      <p className="text-body">
                        <strong>The tell:</strong> Generic language like &quot;serving clients across industries&quot; signals
                        you haven&apos;t defined who you&apos;re really for.
                      </p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-subsection mb-4">What this means for you</h3>
                    <p className="text-body mb-4">
                      When prospects can&apos;t quickly tell if you serve people like them, they leave.
                      Competitors who speak directly to your ideal customer feel like a safer bet.
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="text-subsection mb-4">What to do</h3>
                  {isTestUnlocked && getFindingsForSection(preview.topIssues, 'audience').length > 0 ? (
                    <div className="space-y-4">
                      {getFindingsForSection(preview.topIssues, 'audience').slice(0, 5).map((finding, idx) => (
                        <div key={idx} className="border-2 border-[var(--border)] rounded-lg overflow-hidden">
                          <div className="grid md:grid-cols-2 gap-0">
                            <div className="p-4 bg-red-50 border-r border-[var(--border)]">
                              <p className="text-xs font-bold text-red-600 mb-2">❌ CURRENT</p>
                              <p className="text-sm text-[var(--foreground)]">{finding.phrase}</p>
                              <p className="text-xs text-[var(--muted-foreground)] mt-2">
                                          Found: {finding.location}
                                          {finding.pageUrl && (
                                            <a href={createTextFragmentUrl(finding.pageUrl, finding.phrase)} target="_blank" rel="noopener noreferrer" className="ml-1 inline-flex items-center text-[var(--accent)] hover:text-[var(--accent-hover)]" title="View source page">
                                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                                            </a>
                                          )}
                                        </p>
                            </div>
                            <div className="p-4 bg-green-50">
                              <div className="flex justify-between items-start gap-2 mb-2">
                                <p className="text-xs font-bold text-green-600">✓ REWRITE</p>
                                <button
                                  onClick={async () => {
                                    await safeClipboardWrite(finding.rewrite)
                                  }}
                                  className="text-xs px-2 py-0.5 bg-white border border-green-300 rounded hover:bg-green-100 transition-colors text-green-700 font-medium"
                                >
                                  Copy
                                </button>
                              </div>
                              <p className="text-sm text-[var(--foreground)]">{finding.rewrite}</p>
                            </div>
                          </div>
                          <div className="p-3 bg-[var(--muted)] border-t border-[var(--border)]">
                            <p className="text-sm text-[var(--foreground)]">
                              <strong>Why:</strong> {finding.problem}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : isTestUnlocked ? (
                    <div className="p-6 bg-[var(--muted)] border-2 border-[var(--border)] rounded text-center">
                      <p className="text-body text-[var(--muted-foreground)]">
                        No customer clarity findings in this audit.
                      </p>
                    </div>
                  ) : (
                    <LockedFindings onUnlock={handleUnlock} isUnlocked={isTestUnlocked} />
                  )}
                </div>
              </div>
            </section>
            <section className="section section-alt">
              <div className="container">
                <h2 className="text-section mb-6">The differentiator test</h2>
                <div className="methodology-box">
                  <h3 className="text-subsection mb-2">The &quot;how the hell&quot; question</h3>
                  <p className="text-body">
                    What would make your competitors ask: &quot;How the hell did they do that?&quot; Not aspirational
                    claims - operational realities. The proof you already have but aren&apos;t using.
                  </p>
                </div>
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <h3 className="text-subsection mb-4">What we found</h3>
                    <p className="text-body mb-4">
                      Your current differentiators rely on generic claims that every competitor uses.
                    </p>
                    <p className="text-body">
                      <strong>Common problem:</strong> Words like &quot;quality,&quot; &quot;service,&quot; and &quot;trusted partner&quot;
                      are table stakes, not differentiators. When everyone claims quality, no one&apos;s claim means anything.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-subsection mb-4">What this means for you</h3>
                    <p className="text-body">
                      When your messaging sounds like everyone else&apos;s, buyers compare on the only remaining
                      variable: price. Your differentiation likely exists - it&apos;s just buried or unstated.
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="text-subsection mb-4">What to do</h3>
                  {isTestUnlocked && getFindingsForSection(preview.topIssues, 'differentiators').length > 0 ? (
                    <div className="space-y-4">
                      {getFindingsForSection(preview.topIssues, 'differentiators').slice(0, 5).map((finding, idx) => (
                        <div key={idx} className="border-2 border-[var(--border)] rounded-lg overflow-hidden">
                          <div className="grid md:grid-cols-2 gap-0">
                            <div className="p-4 bg-red-50 border-r border-[var(--border)]">
                              <p className="text-xs font-bold text-red-600 mb-2">❌ CURRENT</p>
                              <p className="text-sm text-[var(--foreground)]">{finding.phrase}</p>
                              <p className="text-xs text-[var(--muted-foreground)] mt-2">
                                          Found: {finding.location}
                                          {finding.pageUrl && (
                                            <a href={createTextFragmentUrl(finding.pageUrl, finding.phrase)} target="_blank" rel="noopener noreferrer" className="ml-1 inline-flex items-center text-[var(--accent)] hover:text-[var(--accent-hover)]" title="View source page">
                                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                                            </a>
                                          )}
                                        </p>
                            </div>
                            <div className="p-4 bg-green-50">
                              <div className="flex justify-between items-start gap-2 mb-2">
                                <p className="text-xs font-bold text-green-600">✓ REWRITE</p>
                                <button
                                  onClick={async () => {
                                    await safeClipboardWrite(finding.rewrite)
                                  }}
                                  className="text-xs px-2 py-0.5 bg-white border border-green-300 rounded hover:bg-green-100 transition-colors text-green-700 font-medium"
                                >
                                  Copy
                                </button>
                              </div>
                              <p className="text-sm text-[var(--foreground)]">{finding.rewrite}</p>
                            </div>
                          </div>
                          <div className="p-3 bg-[var(--muted)] border-t border-[var(--border)]">
                            <p className="text-sm text-[var(--foreground)]">
                              <strong>Why:</strong> {finding.problem}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : isTestUnlocked ? (
                    <div className="p-6 bg-[var(--muted)] border-2 border-[var(--border)] rounded text-center">
                      <p className="text-body text-[var(--muted-foreground)]">
                        No differentiation findings in this audit.
                      </p>
                    </div>
                  ) : (
                    <LockedFindings onUnlock={handleUnlock} isUnlocked={isTestUnlocked} />
                  )}
                </div>
              </div>
            </section>
          </ViewNavBar>
        )}

        {/* TRUST VIEW */}
        {currentView === 'trust' && (
          <ViewNavBar prevView={prevView} nextView={nextView} onNavigate={handleViewChange}>
            <section className="section">
              <div className="container">
                <h2 className="text-section mb-6">Your proof points</h2>
                <div className="methodology-box">
                  <h3 className="text-subsection mb-2">The proof inventory</h3>
                  <p className="text-body">
                    You have proof. Certifications. Track records. Customer wins. But is it visible where it
                    matters? Companies constantly bury their best proof on About pages nobody reads.
                  </p>
                  <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded">
                    <p className="text-sm font-bold text-gray-800 mb-2">
                      Framework: Trust hierarchy
                      <a href="https://en.wikipedia.org/wiki/Social_proof" target="_blank" rel="noopener noreferrer" className="ml-2 text-xs font-normal text-gray-500 hover:text-gray-700 underline">Learn more →</a>
                    </p>
                    <p className="text-xs text-gray-600 mb-2">
                      We evaluate credibility signals in order of impact:
                    </p>
                    <ol className="text-xs text-gray-600 space-y-1 ml-4 list-decimal">
                      <li>Third-party proof (certifications, awards, client logos)</li>
                      <li>Social proof (testimonials, case studies, usage stats)</li>
                      <li>Transparency (team bios, pricing clarity, guarantees)</li>
                    </ol>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <h3 className="text-subsection mb-4">What we found</h3>
                    <p className="text-body mb-4">
                      Your trust signals exist but aren&apos;t positioned for maximum impact.
                    </p>
                    <ul className="space-y-2 text-body">
                      <li className="flex items-start gap-2"><span className="text-[var(--accent)]">→</span> Certifications buried in footer or About page</li>
                      <li className="flex items-start gap-2"><span className="text-[var(--accent)]">→</span> Testimonials hidden or absent from homepage</li>
                      <li className="flex items-start gap-2"><span className="text-[var(--accent)]">→</span> No quantified results or metrics visible</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-subsection mb-4">What this means for you</h3>
                    <p className="text-body">
                      Visitors need to trust you before they&apos;ll contact you. When proof is hidden, they either
                      leave or treat you as a commodity - comparing on price alone.
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="text-subsection mb-4">What to do</h3>
                  {isTestUnlocked && getFindingsForSection(preview.topIssues, 'proofPoints').length > 0 ? (
                    <div className="space-y-4">
                      {getFindingsForSection(preview.topIssues, 'proofPoints').slice(0, 5).map((finding, idx) => (
                        <div key={idx} className="border-2 border-[var(--border)] rounded-lg overflow-hidden">
                          <div className="grid md:grid-cols-2 gap-0">
                            <div className="p-4 bg-red-50 border-r border-[var(--border)]">
                              <p className="text-xs font-bold text-red-600 mb-2">❌ CURRENT</p>
                              <p className="text-sm text-[var(--foreground)]">{finding.phrase}</p>
                              <p className="text-xs text-[var(--muted-foreground)] mt-2">
                                          Found: {finding.location}
                                          {finding.pageUrl && (
                                            <a href={createTextFragmentUrl(finding.pageUrl, finding.phrase)} target="_blank" rel="noopener noreferrer" className="ml-1 inline-flex items-center text-[var(--accent)] hover:text-[var(--accent-hover)]" title="View source page">
                                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                                            </a>
                                          )}
                                        </p>
                            </div>
                            <div className="p-4 bg-green-50">
                              <div className="flex justify-between items-start gap-2 mb-2">
                                <p className="text-xs font-bold text-green-600">✓ REWRITE</p>
                                <button
                                  onClick={async () => {
                                    await safeClipboardWrite(finding.rewrite)
                                  }}
                                  className="text-xs px-2 py-0.5 bg-white border border-green-300 rounded hover:bg-green-100 transition-colors text-green-700 font-medium"
                                >
                                  Copy
                                </button>
                              </div>
                              <p className="text-sm text-[var(--foreground)]">{finding.rewrite}</p>
                            </div>
                          </div>
                          <div className="p-3 bg-[var(--muted)] border-t border-[var(--border)]">
                            <p className="text-sm text-[var(--foreground)]">
                              <strong>Why:</strong> {finding.problem}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : isTestUnlocked ? (
                    <div className="p-6 bg-[var(--muted)] border-2 border-[var(--border)] rounded text-center">
                      <p className="text-body text-[var(--muted-foreground)]">
                        No trust signal findings in this audit.
                      </p>
                    </div>
                  ) : (
                    <LockedFindings onUnlock={handleUnlock} isUnlocked={isTestUnlocked} />
                  )}
                </div>
              </div>
            </section>
            <section className="section section-alt">
              <div className="container">
                <h2 className="text-section mb-6">Getting visitors to take action</h2>
                <div className="methodology-box">
                  <h3 className="text-subsection mb-2">The decision funnel</h3>
                  <p className="text-body">
                    &quot;Request a Quote&quot; on your homepage? You&apos;re asking someone who just met you to make a
                    commitment. That&apos;s like proposing on a first date.
                  </p>
                  <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded">
                    <p className="text-sm font-bold text-gray-800 mb-2">
                      Framework: Micro-commitment ladder
                      <a href="https://en.wikipedia.org/wiki/Purchase_funnel" target="_blank" rel="noopener noreferrer" className="ml-2 text-xs font-normal text-gray-500 hover:text-gray-700 underline">Learn more →</a>
                    </p>
                    <p className="text-xs text-gray-600 mb-2">
                      We score CTAs by commitment level vs visitor trust:
                    </p>
                    <ol className="text-xs text-gray-600 space-y-1 ml-4 list-decimal">
                      <li>Low barrier: "See examples", "Watch demo" (appropriate early)</li>
                      <li>Medium: "Download guide", "Get pricing" (after some trust)</li>
                      <li>High: "Request quote", "Schedule call" (homepage = friction)</li>
                    </ol>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <h3 className="text-subsection mb-4">What we found</h3>
                    <p className="text-body mb-4">
                      Your calls-to-action are high-commitment without building trust first.
                    </p>
                    <p className="text-body">
                      Generic &quot;Contact Us&quot; buttons everywhere with no lower-commitment options for visitors
                      who aren&apos;t ready to talk yet.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-subsection mb-4">What this means for you</h3>
                    <p className="text-body">
                      You only capture prospects who are already ready to buy. Everyone else - including great
                      fits who need more time - has no way to stay engaged.
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="text-subsection mb-4">What to do</h3>
                  {isTestUnlocked && getFindingsForSection(preview.topIssues, 'ctas').length > 0 ? (
                    <div className="space-y-4">
                      {getFindingsForSection(preview.topIssues, 'ctas').slice(0, 5).map((finding, idx) => (
                        <div key={idx} className="border-2 border-[var(--border)] rounded-lg overflow-hidden">
                          <div className="grid md:grid-cols-2 gap-0">
                            <div className="p-4 bg-red-50 border-r border-[var(--border)]">
                              <p className="text-xs font-bold text-red-600 mb-2">❌ CURRENT</p>
                              <p className="text-sm text-[var(--foreground)]">{finding.phrase}</p>
                              <p className="text-xs text-[var(--muted-foreground)] mt-2">
                                          Found: {finding.location}
                                          {finding.pageUrl && (
                                            <a href={createTextFragmentUrl(finding.pageUrl, finding.phrase)} target="_blank" rel="noopener noreferrer" className="ml-1 inline-flex items-center text-[var(--accent)] hover:text-[var(--accent-hover)]" title="View source page">
                                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                                            </a>
                                          )}
                                        </p>
                            </div>
                            <div className="p-4 bg-green-50">
                              <div className="flex justify-between items-start gap-2 mb-2">
                                <p className="text-xs font-bold text-green-600">✓ REWRITE</p>
                                <button
                                  onClick={async () => {
                                    await safeClipboardWrite(finding.rewrite)
                                  }}
                                  className="text-xs px-2 py-0.5 bg-white border border-green-300 rounded hover:bg-green-100 transition-colors text-green-700 font-medium"
                                >
                                  Copy
                                </button>
                              </div>
                              <p className="text-sm text-[var(--foreground)]">{finding.rewrite}</p>
                            </div>
                          </div>
                          <div className="p-3 bg-[var(--muted)] border-t border-[var(--border)]">
                            <p className="text-sm text-[var(--foreground)]">
                              <strong>Why:</strong> {finding.problem}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : isTestUnlocked ? (
                    <div className="p-6 bg-[var(--muted)] border-2 border-[var(--border)] rounded text-center">
                      <p className="text-body text-[var(--muted-foreground)]">
                        No CTA findings in this audit.
                      </p>
                    </div>
                  ) : (
                    <LockedFindings onUnlock={handleUnlock} isUnlocked={isTestUnlocked} />
                  )}
                </div>
              </div>
            </section>
          </ViewNavBar>
        )}

        {/* COPY VIEW */}
        {currentView === 'copy' && (
          <ViewNavBar prevView={prevView} nextView={nextView} onNavigate={handleViewChange}>
            <section className="section">
              <div className="container">
                <h2 className="text-section mb-2">Copy you can use today</h2>
                <p className="text-body-lg text-[var(--muted-foreground)] mb-6">
                  Quick wins beyond the critical issues. These rewrites address secondary messaging gaps you can fix today while planning the bigger changes above.
                </p>
                <div className="methodology-box mb-8">
                  <h3 className="text-subsection mb-2">Why generic copy kills conversions</h3>
                  <p className="text-body">
                    Generic copy sounds safe but performs terribly. When every competitor claims
                    &quot;excellence&quot; and &quot;customer focus,&quot; nobody believes anyone.
                  </p>
                  <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded">
                    <p className="text-sm font-bold text-gray-800 mb-2">
                      Framework: Specificity ladder
                      <a href="https://en.wikipedia.org/wiki/Advertising" target="_blank" rel="noopener noreferrer" className="ml-2 text-xs font-normal text-gray-500 hover:text-gray-700 underline">Learn more →</a>
                    </p>
                    <p className="text-xs text-gray-600 mb-2">
                      We transform vague claims into concrete proof:
                    </p>
                    <ol className="text-xs text-gray-600 space-y-1 ml-4 list-decimal">
                      <li>&quot;Quality service&quot; → &quot;98.7% on-time delivery rate&quot;</li>
                      <li>&quot;Industry experts&quot; → &quot;47 years combined aerospace experience&quot;</li>
                      <li>&quot;Customer focused&quot; → &quot;Dedicated rep answers in under 2 hours&quot;</li>
                    </ol>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <h3 className="text-subsection mb-4">What&apos;s included</h3>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <span className="text-[var(--accent)]">→</span>
                        <span>Homepage headline alternatives</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-[var(--accent)]">→</span>
                        <span>Subheadline and supporting copy</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-[var(--accent)]">→</span>
                        <span>Button text that converts</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-[var(--accent)]">→</span>
                        <span>Trust bar and proof point formats</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-[var(--accent)]">→</span>
                        <span>Service page messaging templates</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-subsection mb-4">How it works</h3>
                    <p className="text-body mb-4">
                      Each rewrite shows your current copy, the suggested replacement, and the reasoning
                      behind the change. Copy and paste directly into your website.
                    </p>
                    {preview.teaserFinding && (
                      <div className="p-4 bg-[var(--muted)] border-l-4 border-[var(--accent)]">
                        <p className="text-sm text-[var(--accent)] font-semibold">Example from your site:</p>
                        <p className="text-sm text-[var(--muted-foreground)] mt-1">
                          &quot;{preview.teaserFinding.phrase}&quot; → &quot;{preview.teaserFinding.rewrite}&quot;
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-subsection mb-4">Get all rewrites</h3>
                  {isTestUnlocked && preview.topIssues.slice(6).flatMap(issue => issue.findings || []).length > 0 ? (
                    <div className="space-y-4">
                      {preview.topIssues.slice(6).flatMap(issue => issue.findings || []).slice(0, 5).map((finding, idx) => (
                        <div key={idx} className="border-2 border-[var(--border)] rounded-lg overflow-hidden">
                          <div className="grid md:grid-cols-2 gap-0">
                            <div className="p-4 bg-red-50 border-r border-[var(--border)]">
                              <p className="text-xs font-bold text-red-600 mb-2">❌ CURRENT</p>
                              <p className="text-sm text-[var(--foreground)]">{finding.phrase}</p>
                              <p className="text-xs text-[var(--muted-foreground)] mt-2">
                                          Found: {finding.location}
                                          {finding.pageUrl && (
                                            <a href={createTextFragmentUrl(finding.pageUrl, finding.phrase)} target="_blank" rel="noopener noreferrer" className="ml-1 inline-flex items-center text-[var(--accent)] hover:text-[var(--accent-hover)]" title="View source page">
                                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                                            </a>
                                          )}
                                        </p>
                            </div>
                            <div className="p-4 bg-green-50">
                              <div className="flex justify-between items-start gap-2 mb-2">
                                <p className="text-xs font-bold text-green-600">✓ REWRITE</p>
                                <button
                                  onClick={async () => {
                                    await safeClipboardWrite(finding.rewrite)
                                  }}
                                  className="text-xs px-2 py-0.5 bg-white border border-green-300 rounded hover:bg-green-100 transition-colors text-green-700 font-medium"
                                >
                                  Copy
                                </button>
                              </div>
                              <p className="text-sm text-[var(--foreground)]">{finding.rewrite}</p>
                            </div>
                          </div>
                          <div className="p-3 bg-[var(--muted)] border-t border-[var(--border)]">
                            <p className="text-sm text-[var(--foreground)]">
                              <strong>Why:</strong> {finding.problem}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : isTestUnlocked ? (
                    <div className="p-6 bg-[var(--muted)] border-2 border-[var(--border)] rounded text-center">
                      <p className="text-body text-[var(--muted-foreground)]">
                        All rewrites shown in previous sections.
                      </p>
                    </div>
                  ) : (
                    <LockedFindings onUnlock={handleUnlock} isUnlocked={isTestUnlocked} />
                  )}
                </div>
              </div>
            </section>
          </ViewNavBar>
        )}

        {/* COMPETITORS VIEW */}
        {currentView === 'competitors' && (
          <ViewNavBar prevView={prevView} nextView={nextView} onNavigate={handleViewChange}>
            <section className="section">
              <div className="container">
                <h2 className="text-section mb-6">Competitor comparison</h2>
                <div className="methodology-box">
                  <h3 className="text-subsection mb-2">Why this matters</h3>
                  <p className="text-body">
                    When buyers compare you to competitors, they&apos;re looking for differentiation. If your messaging
                    sounds the same, they default to price. This analysis shows how you stack up - and what to steal.
                  </p>
                </div>

                {/* No competitor data - show static message */}
                {!hasCompetitorData && (
                  <div className="p-8 bg-amber-50 border-2 border-amber-200 rounded text-center mb-8">
                    <p className="text-lg font-semibold text-amber-900 mb-2">Competitor analysis not available</p>
                    <p className="text-sm text-amber-700">
                      We weren&apos;t able to gather competitor data for this analysis. This may happen if competitor sites block external access.
                    </p>
                  </div>
                )}

                {/* Show which competitors we're comparing against */}
                {hasCompetitorData && data.competitorComparison && (
                  <>
                {data.competitorComparison.competitors.length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm text-[var(--muted-foreground)]">
                      <strong>Comparing against:</strong>{' '}
                      {data.competitorComparison.competitors.join(', ')}
                    </p>
                  </div>
                )}

                {/* Check if we actually have competitor data */}
                {(!data.competitorComparison.detailedScores || data.competitorComparison.detailedScores.length === 0) ? (
                  <div className="p-8 bg-amber-50 border-2 border-amber-200 rounded mb-8 text-center">
                    <p className="text-lg font-semibold text-amber-800 mb-2">Competitor analysis incomplete</p>
                    <p className="text-sm text-amber-700 mb-4">
                      We tried to analyze {data.competitorComparison.competitors.join(', ')} but couldn&apos;t access their websites.
                      Some companies block external access to their sites.
                    </p>
                    <p className="text-sm text-amber-600">
                      Try adding smaller competitors or direct industry rivals.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Score comparison cards */}
                    <div className="grid md:grid-cols-3 gap-6 mb-8">
                      <div className={`${getScoreBgClass(data.competitorComparison.yourScore)} border-2 border-[var(--accent)] p-6 rounded text-center`}>
                        <p className="text-label mb-2">YOUR SCORE</p>
                        <p className={`text-5xl font-bold ${getScoreColorClass(data.competitorComparison.yourScore)}`}>
                          {data.competitorComparison.yourScore}
                        </p>
                        <p className="text-sm text-[var(--muted-foreground)] mt-1">/100</p>
                        <p className={`text-sm font-semibold mt-2 ${getScoreColorClass(data.competitorComparison.yourScore)}`}>
                          {getScoreLabel(data.competitorComparison.yourScore)}
                        </p>
                      </div>
                      <div className={`${getScoreBgClass(data.competitorComparison.averageScore)} border-2 border-[var(--border)] p-6 rounded text-center`}>
                        <p className="text-label mb-2">COMPETITOR AVG</p>
                        <p className={`text-5xl font-bold ${getScoreColorClass(data.competitorComparison.averageScore)}`}>
                          {data.competitorComparison.averageScore}
                        </p>
                        <p className="text-sm text-[var(--muted-foreground)] mt-1">/100</p>
                        <p className={`text-sm font-semibold mt-2 ${getScoreColorClass(data.competitorComparison.averageScore)}`}>
                          {getScoreLabel(data.competitorComparison.averageScore)}
                        </p>
                      </div>
                      <div className="bg-[var(--muted)] border-2 border-[var(--border)] p-6 rounded text-center">
                        <p className="text-label mb-2">YOUR ADVANTAGE</p>
                        <p className={`text-5xl font-bold ${
                          data.competitorComparison.yourScore > data.competitorComparison.averageScore
                            ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {data.competitorComparison.yourScore > data.competitorComparison.averageScore ? '+' : ''}
                          {data.competitorComparison.yourScore - data.competitorComparison.averageScore}
                        </p>
                        <p className="text-sm text-[var(--muted-foreground)] mt-1">points</p>
                        <p className={`text-sm font-semibold mt-2 ${
                          data.competitorComparison.yourScore > data.competitorComparison.averageScore
                            ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {data.competitorComparison.yourScore > data.competitorComparison.averageScore
                            ? 'You\'re winning' : 'Room to improve'}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* Individual competitor breakdown */}
                {data.competitorComparison.detailedScores && data.competitorComparison.detailedScores.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-subsection mb-4">Individual competitor scores</h3>
                    <div className="grid gap-4">
                      {data.competitorComparison.detailedScores.map((comp, i) => {
                        const compHostname = (() => {
                          try { return new URL(comp.url).hostname.replace('www.', '') }
                          catch { return comp.url }
                        })()
                        const compDisplayName = formatCompanyName(compHostname)
                        const isWinning = data.competitorComparison && data.competitorComparison.yourScore > comp.score
                        return (
                          <div key={i} className={`p-5 border-2 rounded ${isWinning ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <span className="font-semibold text-[var(--foreground)]">{compDisplayName}</span>
                                <span className={`ml-3 text-xs px-2 py-1 rounded ${isWinning ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                  {isWinning ? '✓ You\'re ahead' : '⚠ They\'re ahead'}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className={`text-2xl font-bold ${getScoreColorClass(comp.score)}`}>
                                  {comp.score}
                                </span>
                                <span className="text-[var(--muted-foreground)]">/100</span>
                              </div>
                            </div>
                            <div className="score-bar mb-3">
                              <div className={`score-bar-fill ${comp.score >= 60 ? 'excellent' : comp.score >= 40 ? 'moderate' : 'poor'}`} style={{ width: `${comp.score}%` }}></div>
                            </div>
                            <p className="text-sm text-[var(--muted-foreground)]">
                              {isWinning
                                ? `Your messaging is ${data.competitorComparison && data.competitorComparison.yourScore - comp.score} points more differentiated than theirs.`
                                : isTestUnlocked
                                  ? `They're ${comp.score - (data.competitorComparison?.yourScore || 0)} points ahead. See the comparison table below for category-by-category breakdown.`
                                  : `They're ${comp.score - (data.competitorComparison?.yourScore || 0)} points ahead. The full audit shows exactly what they're doing better.`
                              }
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Key insights - visible only when we have detailed scores */}
                {data.competitorComparison.detailedScores && data.competitorComparison.detailedScores.length > 0 && data.competitorComparison.gaps.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-subsection mb-4">What we noticed</h3>
                    <div className="bg-white border-2 border-[var(--border)] p-6 rounded">
                      <ul className="space-y-3">
                        {data.competitorComparison.gaps.map((gap, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="text-[var(--accent)] text-lg">→</span>
                            <span className="text-[var(--foreground)]">{gap}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Gated deeper analysis - only when we have competitor data */}
                {data.competitorComparison.detailedScores && data.competitorComparison.detailedScores.length > 0 && !isTestUnlocked && (
                <div className="mb-8">
                  <h3 className="text-subsection mb-4">What you can steal</h3>
                  <div className="p-6 bg-[var(--muted)] border-2 border-dashed border-[var(--border)] rounded">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="text-center p-4">
                        <div className="w-12 h-12 bg-[var(--accent)]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                          <span className="text-2xl">📋</span>
                        </div>
                        <p className="font-semibold text-[var(--foreground)] mb-1">Phrase-by-phrase comparison</p>
                        <p className="text-sm text-[var(--muted-foreground)]">See exactly which phrases they use that you don&apos;t</p>
                      </div>
                      <div className="text-center p-4">
                        <div className="w-12 h-12 bg-[var(--accent)]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                          <span className="text-2xl">🎯</span>
                        </div>
                        <p className="font-semibold text-[var(--foreground)] mb-1">Competitive positioning gaps</p>
                        <p className="text-sm text-[var(--muted-foreground)]">Areas where you can differentiate immediately</p>
                      </div>
                      <div className="text-center p-4">
                        <div className="w-12 h-12 bg-[var(--accent)]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                          <span className="text-2xl">💡</span>
                        </div>
                        <p className="font-semibold text-[var(--foreground)] mb-1">Proof points they&apos;re missing</p>
                        <p className="text-sm text-[var(--muted-foreground)]">Your opportunities to stand out</p>
                      </div>
                      <div className="text-center p-4">
                        <div className="w-12 h-12 bg-[var(--accent)]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                          <span className="text-2xl">✍️</span>
                        </div>
                        <p className="font-semibold text-[var(--foreground)] mb-1">Competitive rewrites</p>
                        <p className="text-sm text-[var(--muted-foreground)]">Copy that positions you against them specifically</p>
                      </div>
                    </div>
                    <div className="text-center mt-6 pt-6 border-t border-[var(--border)]">
                      <button
                        onClick={handleUnlock}
                        disabled={isCheckingOut}
                        className="bg-[var(--accent)] text-white px-6 py-3 font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        {isCheckingOut ? 'Starting checkout...' : 'Unlock competitive analysis - $400'}
                      </button>
                      <p className="text-xs text-[var(--muted-foreground)] mt-3">
                        Included with your full audit
                      </p>
                    </div>
                  </div>
                </div>
                )}

                {/* Unlocked competitive analysis - Comparison Table + Insight Cards */}
                {data.competitorComparison.detailedScores && data.competitorComparison.detailedScores.length > 0 && isTestUnlocked && (
                <>
                  {/* BIG COMPARISON TABLE */}
                  <div className="mb-12">
                    <h3 className="text-subsection mb-6">How you compare</h3>

                    {/* POSITIONING MAP - Editorial style comparison */}
                    {(() => {
                      const yourScore = preview?.commodityScore || 50;
                      const competitors = data.competitorComparison.detailedScores || [];
                      const competitorAvg = competitors.length > 0
                        ? Math.round(competitors.reduce((sum, c) => sum + c.score, 0) / competitors.length)
                        : null;

                      // Helper to get initials from URL
                      const getInitials = (url: string) => {
                        const domain = url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('.')[0];
                        return domain.slice(0, 2).toUpperCase();
                      };

                      // Zone styling
                      const getZoneName = (score: number) => score < 40 ? 'Commodity' : score < 70 ? 'Average' : 'Differentiated';
                      const getZoneColor = (score: number) => score < 40 ? '#be123c' : score < 70 ? '#b45309' : '#059669';

                      return (
                        <div className="mb-8">
                          {/* Header with your score callout */}
                          <div className="flex items-end justify-between mb-6">
                            <div>
                              <p className="font-mono text-xs tracking-widest text-gray-400 uppercase mb-1">Your position</p>
                              <div className="flex items-baseline gap-3">
                                <span className="text-5xl font-black tracking-tight" style={{ fontFamily: 'var(--font-display)', color: '#1e3a5f' }}>
                                  {yourScore}
                                </span>
                                <span className="text-lg text-gray-400">/100</span>
                              </div>
                              <p className="text-sm mt-1" style={{ fontFamily: 'var(--font-body)', color: getZoneColor(yourScore) }}>
                                {getZoneName(yourScore)} zone
                              </p>
                            </div>
                            {competitorAvg !== null && (
                              <div className="text-right">
                                <p className="font-mono text-xs tracking-widest text-gray-400 uppercase mb-1">Competitor avg</p>
                                <span className="text-3xl font-bold text-gray-400" style={{ fontFamily: 'var(--font-display)' }}>
                                  {competitorAvg}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* The positioning track */}
                          <div className="relative">
                            {/* Zone backgrounds with integrated labels */}
                            <div className="flex h-20 rounded-sm overflow-hidden border border-gray-200">
                              {/* Commodity zone: 0-40 */}
                              <div className="relative bg-rose-50 border-r border-rose-200" style={{ width: '40%' }}>
                                <span className="absolute top-2 left-3 font-mono text-[10px] tracking-widest uppercase text-rose-400">
                                  Commodity
                                </span>
                                <span className="absolute bottom-2 left-3 font-mono text-[10px] text-gray-300">0</span>
                              </div>
                              {/* Average zone: 40-70 */}
                              <div className="relative bg-amber-50/50 border-r border-amber-200" style={{ width: '30%' }}>
                                <span className="absolute top-2 left-3 font-mono text-[10px] tracking-widest uppercase text-amber-400">
                                  Average
                                </span>
                                <span className="absolute bottom-2 left-3 font-mono text-[10px] text-gray-300">40</span>
                              </div>
                              {/* Differentiated zone: 70-100 */}
                              <div className="relative bg-emerald-50" style={{ width: '30%' }}>
                                <span className="absolute top-2 left-3 font-mono text-[10px] tracking-widest uppercase text-emerald-400">
                                  Differentiated
                                </span>
                                <span className="absolute bottom-2 left-3 font-mono text-[10px] text-gray-300">70</span>
                                <span className="absolute bottom-2 right-3 font-mono text-[10px] text-gray-300">100</span>
                              </div>
                            </div>

                            {/* Individual competitor markers */}
                            {competitors.map((competitor, index) => (
                              <div
                                key={competitor.url}
                                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group"
                                style={{ left: `${competitor.score}%`, zIndex: 10 + index }}
                              >
                                <div className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white shadow-sm flex items-center justify-center cursor-default transition-transform hover:scale-110">
                                  <span className="font-mono text-[10px] font-medium text-gray-600">
                                    {getInitials(competitor.url)}
                                  </span>
                                </div>
                                {/* Tooltip on hover */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                                  {competitor.url.replace(/^https?:\/\//, '').replace(/^www\./, '')} · {competitor.score}
                                </div>
                              </div>
                            ))}

                            {/* Average dashed line */}
                            {competitorAvg !== null && (
                              <div
                                className="absolute top-0 bottom-0 w-px"
                                style={{
                                  left: `${competitorAvg}%`,
                                  background: 'repeating-linear-gradient(to bottom, #9ca3af 0, #9ca3af 4px, transparent 4px, transparent 8px)',
                                  zIndex: 5
                                }}
                              >
                                <span className="absolute top-full mt-1 left-1/2 -translate-x-1/2 font-mono text-[9px] text-gray-400 whitespace-nowrap">
                                  avg
                                </span>
                              </div>
                            )}

                            {/* YOUR score marker - prominent */}
                            <div
                              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                              style={{ left: `${yourScore}%`, zIndex: 50 }}
                            >
                              {/* Connecting line to label */}
                              <div className="absolute left-1/2 -translate-x-1/2 w-px bg-[#1e3a5f]" style={{ bottom: '100%', height: '20px' }} />
                              {/* "YOU" label above */}
                              <div
                                className="absolute left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-widest font-bold px-2 py-0.5 rounded-sm"
                                style={{ bottom: 'calc(100% + 24px)', backgroundColor: '#1e3a5f', color: 'white' }}
                              >
                                YOU
                              </div>
                              {/* Main marker */}
                              <div className="w-11 h-11 rounded-full border-4 border-white shadow-lg flex items-center justify-center" style={{ backgroundColor: '#1e3a5f' }}>
                                <span className="text-base font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                                  {yourScore}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Legend */}
                          <div className="flex items-center gap-6 mt-8 pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#1e3a5f' }} />
                              <span className="font-mono text-xs text-gray-500">Your site</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-gray-300 border border-gray-200" />
                              <span className="font-mono text-xs text-gray-500">Competitors ({competitors.length})</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 border-t-2 border-dashed border-gray-400" />
                              <span className="font-mono text-xs text-gray-500">Avg: {competitorAvg}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="overflow-x-auto">
                      <table className="w-full border-2 border-[var(--border)] rounded-lg">
                        <thead>
                          <tr className="bg-gray-100 border-b-2 border-gray-300">
                            <th className="text-left p-4 font-bold sticky left-0 bg-gray-100 z-10 min-w-[140px]">Site</th>
                            <th className="text-center p-4 font-bold min-w-[80px]">Overall</th>
                            <th className="text-center p-4 font-bold text-sm min-w-[70px]">First<br/>Impr.</th>
                            <th className="text-center p-4 font-bold text-sm min-w-[70px]">Differ-<br/>ent.</th>
                            <th className="text-center p-4 font-bold text-sm min-w-[70px]">Customer<br/>Clarity</th>
                            <th className="text-center p-4 font-bold text-sm min-w-[70px]">Story</th>
                            <th className="text-center p-4 font-bold text-sm min-w-[70px]">Trust</th>
                            <th className="text-center p-4 font-bold text-sm min-w-[70px]">Buttons</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* USER ROW - highlighted */}
                          <tr className="bg-blue-50 border-b-4 border-blue-600">
                            <td className="p-4 font-bold sticky left-0 bg-blue-50 z-10">
                              {hostname}
                              <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded ml-2">YOU</span>
                            </td>
                            <td className="text-center p-4">
                              <span className={`text-2xl font-bold ${
                                (preview?.commodityScore || 50) >= 70 ? 'text-green-600' :
                                (preview?.commodityScore || 50) >= 40 ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {preview?.commodityScore || 50}
                              </span>
                            </td>
                            {preview?.categoryScores ? (
                              <>
                                {[
                                  preview.categoryScores.firstImpression,
                                  preview.categoryScores.differentiation,
                                  preview.categoryScores.customerClarity,
                                  preview.categoryScores.storyStructure,
                                  preview.categoryScores.trustSignals,
                                  preview.categoryScores.buttonClarity
                                ].map((val, idx) => (
                                  <td key={idx} className={`text-center p-4 font-bold text-lg ${
                                    val >= 7 ? 'bg-green-100 text-green-700' :
                                    val >= 4 ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    {val}
                                  </td>
                                ))}
                              </>
                            ) : (
                              <td colSpan={6} className="text-center text-gray-500 p-4">N/A</td>
                            )}
                          </tr>

                          {/* COMPETITOR ROWS */}
                          {data.competitorComparison.detailedScores.map((comp, i) => {
                            const compDomain = comp.url.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0]
                            return (
                              <tr key={i} className="border-b border-gray-200 hover:bg-gray-50">
                                <td className="p-4 font-mono text-sm sticky left-0 bg-white hover:bg-gray-50 z-10">
                                  {compDomain}
                                </td>
                                <td className="text-center p-4">
                                  <span className={`text-xl font-bold ${
                                    comp.score >= 70 ? 'text-green-600' :
                                    comp.score >= 40 ? 'text-yellow-600' :
                                    'text-red-600'
                                  }`}>
                                    {comp.score}
                                  </span>
                                </td>
                                {comp.categoryScores ? (
                                  <>
                                    {[
                                      comp.categoryScores.firstImpression,
                                      comp.categoryScores.differentiation,
                                      comp.categoryScores.customerClarity,
                                      comp.categoryScores.storyStructure,
                                      comp.categoryScores.trustSignals,
                                      comp.categoryScores.buttonClarity
                                    ].map((val, idx) => (
                                      <td key={idx} className={`text-center p-4 font-semibold ${
                                        val >= 7 ? 'bg-green-100 text-green-700' :
                                        val >= 4 ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-red-100 text-red-700'
                                      }`}>
                                        {val}
                                      </td>
                                    ))}
                                  </>
                                ) : (
                                  <td colSpan={6} className="text-center text-xs text-gray-400 p-4">Basic scoring only</td>
                                )}
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex gap-4 mt-3 text-xs">
                      <span><span className="inline-block w-3 h-3 bg-green-100 border border-green-600 rounded mr-1"></span> 7-10 = Strong</span>
                      <span><span className="inline-block w-3 h-3 bg-yellow-100 border border-yellow-600 rounded mr-1"></span> 4-6 = Needs work</span>
                      <span><span className="inline-block w-3 h-3 bg-red-100 border border-red-600 rounded mr-1"></span> 0-3 = Critical</span>
                    </div>
                  </div>

                  {/* WHAT TO STEAL (and where you win) - Insight Cards */}
                  <div className="space-y-8">
                    <h3 className="text-subsection">What to steal (and where you win)</h3>
                    {data.competitorComparison.detailedScores.map((comp, i) => {
                      const yourScore = preview?.commodityScore || 50
                      const gap = comp.score - yourScore
                      const isAhead = gap > 0
                      const compDomain = comp.url.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0]

                      return (
                        <div key={i} className="border-2 border-gray-300 rounded-lg p-6 bg-white shadow-sm">
                          <div className="flex items-center justify-between mb-6">
                            <h4 className="text-xl font-bold font-mono flex items-center gap-2">
                              {compDomain}
                              <a href={comp.url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600 transition-colors" title="Open competitor site">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                  <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clipRule="evenodd" />
                                  <path fillRule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" clipRule="evenodd" />
                                </svg>
                              </a>
                            </h4>
                            <div className="text-right">
                              <div className={`text-3xl font-bold ${
                                comp.score >= 70 ? 'text-green-600' :
                                comp.score >= 40 ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {comp.score}/100
                              </div>
                              <div className={`text-sm font-semibold ${isAhead ? 'text-red-600' : 'text-green-600'}`}>
                                {isAhead ? `They're ahead +${gap}` : `You're ahead +${Math.abs(gap)}`}
                              </div>
                            </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-6 mb-6">
                            <div>
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-2xl">✓</span>
                                <h5 className="font-bold text-green-700 uppercase tracking-wide text-sm">What they do well</h5>
                              </div>
                              {comp.strengths && comp.strengths.length > 0 ? (
                                <ul className="space-y-2">
                                  {comp.strengths.map((strength, idx) => (
                                    <li key={idx} className="text-sm bg-green-50 border-l-4 border-green-600 p-3 rounded">
                                      {strength}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-sm text-gray-500 italic">No standout strengths that apply to you</p>
                              )}
                            </div>

                            <div>
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-2xl">✗</span>
                                <h5 className="font-bold text-red-700 uppercase tracking-wide text-sm">Where they&apos;re weak</h5>
                              </div>
                              {comp.weaknesses && comp.weaknesses.length > 0 ? (
                                <ul className="space-y-2">
                                  {comp.weaknesses.map((weakness, idx) => (
                                    <li key={idx} className="text-sm bg-red-50 border-l-4 border-red-600 p-3 rounded">
                                      {weakness}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-sm text-gray-500 italic">No notable weaknesses found</p>
                              )}
                            </div>
                          </div>

                          {/* YOUR OPPORTUNITY */}
                          {(() => {
                            // Find where they beat you and where you beat them by category
                            const categoryNames: Record<string, string> = {
                              firstImpression: 'first impression',
                              differentiation: 'differentiation',
                              customerClarity: 'customer clarity',
                              storyStructure: 'story structure',
                              trustSignals: 'trust signals',
                              buttonClarity: 'button clarity'
                            }
                            const categoryActions: Record<string, { steal: string; attack: string }> = {
                              firstImpression: {
                                steal: 'Study their above-fold headline structure and value proposition placement',
                                attack: 'Your hero section already communicates value faster - keep refining clarity'
                              },
                              differentiation: {
                                steal: 'Analyze how they position against alternatives and claim unique territory',
                                attack: 'Your unique positioning is landing - double down on what makes you different'
                              },
                              customerClarity: {
                                steal: 'Note how they describe their ideal customer and speak to specific pain points',
                                attack: 'You already speak to your customer specifically - keep that focus sharp'
                              },
                              storyStructure: {
                                steal: 'Map their narrative arc - problem → solution → transformation flow',
                                attack: 'Your story flow is stronger - consider adding more customer transformation moments'
                              },
                              trustSignals: {
                                steal: 'Catalog their proof points: specifics numbers, names, logos, testimonials',
                                attack: 'You have stronger proof - make sure it\'s visible above the fold'
                              },
                              buttonClarity: {
                                steal: 'Review their CTA language and button placement patterns',
                                attack: 'Your CTAs are clearer - ensure consistency across all pages'
                              }
                            }

                            if (!comp.categoryScores || !preview?.categoryScores) {
                              return (
                                <div className={`p-4 rounded border-l-4 ${isAhead ? 'bg-amber-50 border-amber-600' : 'bg-blue-50 border-blue-600'}`}>
                                  <p className={`font-bold text-xs uppercase tracking-wider mb-1 ${isAhead ? 'text-amber-900' : 'text-blue-900'}`}>YOUR OPPORTUNITY</p>
                                  <p className={`text-sm ${isAhead ? 'text-amber-800' : 'text-blue-800'}`}>
                                    {isAhead
                                      ? `Visit ${compDomain} directly and note what makes their messaging effective.`
                                      : `You're ahead - keep refining what's already working.`}
                                  </p>
                                </div>
                              )
                            }

                            // Find their best category vs yours
                            const categories = Object.keys(comp.categoryScores) as (keyof typeof comp.categoryScores)[]
                            let theirBest = categories[0]
                            let yourBest = categories[0]
                            let biggestGapCategory = categories[0]
                            let biggestGap = 0

                            categories.forEach(cat => {
                              const theirVal = comp.categoryScores![cat] || 0
                              const yourVal = preview?.categoryScores?.[cat] || 0
                              if (theirVal > (comp.categoryScores![theirBest] || 0)) theirBest = cat
                              if (yourVal > (preview?.categoryScores?.[yourBest] || 0)) yourBest = cat
                              if (theirVal - yourVal > biggestGap) {
                                biggestGap = theirVal - yourVal
                                biggestGapCategory = cat
                              }
                            })

                            const theirBestName = categoryNames[theirBest] || theirBest
                            const yourBestName = categoryNames[yourBest] || yourBest
                            const gapCatName = categoryNames[biggestGapCategory] || biggestGapCategory
                            const actions = categoryActions[biggestGapCategory] || { steal: 'Analyze their approach', attack: 'Keep refining' }

                            return (
                              <div className={`p-4 rounded border-l-4 ${isAhead ? 'bg-amber-50 border-amber-600' : 'bg-blue-50 border-blue-600'}`}>
                                <p className={`font-bold text-xs uppercase tracking-wider mb-2 ${isAhead ? 'text-amber-900' : 'text-blue-900'}`}>YOUR OPPORTUNITY</p>
                                <div className={`text-sm space-y-2 ${isAhead ? 'text-amber-800' : 'text-blue-800'}`}>
                                  {isAhead ? (
                                    <>
                                      <p><strong>Learn from them:</strong> They score highest on {theirBestName} ({comp.categoryScores![theirBest]}/10). {actions.steal}.</p>
                                      {biggestGap > 2 && <p><strong>Biggest gap:</strong> You're {biggestGap} points behind on {gapCatName}. This is your highest-ROI improvement area.</p>}
                                      <p><strong>Your edge:</strong> You lead on {yourBestName} ({preview?.categoryScores?.[yourBest]}/10) - don't lose this while catching up elsewhere.</p>
                                    </>
                                  ) : (
                                    <>
                                      <p><strong>Your advantage:</strong> You lead on {yourBestName} ({preview?.categoryScores?.[yourBest]}/10). {actions.attack}.</p>
                                      <p><strong>Widen the gap:</strong> They're weakest on {theirBestName.replace(theirBestName, Object.entries(comp.categoryScores!).sort((a, b) => a[1] - b[1])[0][0]).replace(/([A-Z])/g, ' $1').toLowerCase().trim()} - this is where you can pull further ahead.</p>
                                    </>
                                  )}
                                </div>
                              </div>
                            )
                          })()}
                        </div>
                      )
                    })}
                  </div>
                </>
                )}
                  </>
                )}
              </div>
            </section>
          </ViewNavBar>
        )}

        {/* RESOURCES VIEW - Swipe file, copywriter brief, export tools */}
        {currentView === 'resources' && (
          <ViewNavBar prevView={prevView} nextView={nextView} onNavigate={handleViewChange}>
            <section className="bg-white py-12 px-4 sm:px-6 lg:px-8 min-h-[60vh]">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-section mb-2">Resources</h2>
                <p className="text-body-lg text-[var(--muted-foreground)] mb-8">
                  Everything you need to implement changes or hand off to a copywriter.
                </p>

                {/* GATED TEASER FOR FREE USERS */}
                {!isTestUnlocked && (
                  <>
                    {/* Swipe file teaser */}
                    <div className="mb-8">
                      <h3 className="text-subsection mb-4">Swipe file</h3>
                      <p className="text-body text-[var(--muted-foreground)] mb-4">
                        All {preview.topIssues.reduce((acc, issue) => acc + (issue.findings?.length || 0), 0)} rewrites in one place, ready to copy and paste.
                      </p>
                      <div className="p-6 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg text-center">
                        <p className="text-[var(--muted-foreground)]">🔒 Unlock to access your full swipe file</p>
                      </div>
                    </div>

                    {/* Copywriter brief teaser */}
                    <div className="mb-8">
                      <h3 className="text-subsection mb-4">Copywriter brief</h3>
                      <p className="text-body text-[var(--muted-foreground)] mb-4">
                        A one-page summary you can hand to a copywriter or share with your team.
                      </p>
                      <div className="p-6 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg text-center">
                        <p className="text-[var(--muted-foreground)]">🔒 Unlock to download your copywriter brief</p>
                      </div>
                    </div>

                    {/* Trust checklist teaser */}
                    <div className="mb-8">
                      <h3 className="text-subsection mb-4">Trust signal checklist</h3>
                      <p className="text-body text-[var(--muted-foreground)] mb-4">
                        Specific proof points to add to your site, with copy suggestions and placement tips.
                      </p>
                      <div className="p-6 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg text-center">
                        <p className="text-[var(--muted-foreground)]">🔒 Unlock to access your personalized checklist</p>
                      </div>
                    </div>

                    {/* Competitor comparison teaser */}
                    <div className="mb-8">
                      <h3 className="text-subsection mb-4">Competitor comparison</h3>
                      <p className="text-body text-[var(--muted-foreground)] mb-4">
                        Side-by-side analysis of your strongest and weakest areas vs. each competitor.
                      </p>
                      <div className="p-6 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg text-center">
                        <p className="text-[var(--muted-foreground)]">🔒 Unlock to see detailed competitor breakdowns</p>
                      </div>
                    </div>

                    {/* Unlock CTA */}
                    <div className="mt-12 p-8 bg-gradient-to-br from-[var(--accent)] to-[#1e3a5f] rounded-lg text-center">
                      <h3 className="text-xl font-bold text-white mb-2">Unlock your full resource kit</h3>
                      <p className="text-sm text-white/80 mb-6">Swipe file, copywriter brief, trust checklist, and competitor analysis - all export-ready.</p>
                      <button
                        onClick={handleUnlock}
                        disabled={isCheckingOut}
                        className="bg-white text-[var(--accent)] px-8 py-3 text-lg font-bold hover:bg-white/90 transition-all shadow-lg disabled:opacity-50"
                      >
                        {isCheckingOut ? 'Starting checkout...' : 'Unlock resources - $400'}
                      </button>
                    </div>
                  </>
                )}

                {/* UNLOCKED CONTENT */}
                {isTestUnlocked && (
                  <>

                {/* SWIPE FILE - All rewrites in one place */}
                <div className="mb-12">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-subsection">Swipe file</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={handleDownloadSwipePDF}
                        className="text-sm bg-[var(--accent)] text-white px-4 py-2 font-semibold hover:opacity-90 transition-opacity"
                      >
                        Download PDF
                      </button>
                      <button
                        onClick={async () => {
                          const allRewrites = preview.topIssues
                            .flatMap(issue => issue.findings || [])
                            .map(f => `BEFORE: ${f.phrase}\nAFTER: ${f.rewrite}\nWHY: ${f.problem}\n`)
                            .join('\n---\n\n')
                          const result = await safeClipboardWrite(allRewrites)
                          const btn = document.getElementById('copy-swipe-btn')
                          if (btn) { btn.textContent = result.success ? 'Copied!' : 'Failed'; setTimeout(() => btn.textContent = 'Copy all', 2000) }
                        }}
                        id="copy-swipe-btn"
                        className="text-sm bg-gray-200 text-gray-700 px-4 py-2 font-semibold hover:bg-gray-300 transition-opacity"
                      >
                        Copy all
                      </button>
                    </div>
                  </div>
                  <p className="text-body text-[var(--muted-foreground)] mb-4">
                    {preview.topIssues.reduce((acc, issue) => acc + (issue.findings?.length || 0), 0)} rewrites ready to paste. Click any to copy individually, or copy all above.
                  </p>
                  <div className="space-y-4 max-h-[500px] overflow-y-auto border-2 border-gray-200 rounded-lg p-4">
                    {preview.topIssues.flatMap((issue, issueIdx) =>
                      (issue.findings || []).map((finding, findingIdx) => {
                        const itemId = `swipe-${issueIdx}-${findingIdx}`
                        return (
                          <div
                            key={itemId}
                            className="group border-l-4 border-[var(--accent)] bg-gray-50 p-4 rounded-r cursor-pointer hover:bg-green-50 hover:border-green-500 transition-all relative"
                            onClick={async (e) => {
                              await safeClipboardWrite(finding.rewrite)
                              const afterEl = document.getElementById(`${itemId}-after`)
                              if (afterEl) {
                                afterEl.classList.add('bg-green-200', 'scale-[1.02]')
                                afterEl.textContent = '✓ Copied!'
                                setTimeout(() => {
                                  afterEl.classList.remove('bg-green-200', 'scale-[1.02]')
                                  afterEl.textContent = finding.rewrite
                                }, 500)
                              }
                            }}
                          >
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-xs bg-green-600 text-white px-2 py-1 rounded font-semibold">Click to copy</span>
                            </div>
                            <p className="text-xs text-red-600 font-medium mb-1">BEFORE</p>
                            <p className="text-sm text-gray-500 line-through mb-3">{finding.phrase}</p>
                            <p className="text-xs text-green-600 font-medium mb-1">AFTER</p>
                            <p
                              id={`${itemId}-after`}
                              className="text-sm text-[var(--foreground)] font-semibold mb-2 p-2 -m-2 rounded transition-all group-hover:bg-green-100"
                            >
                              {finding.rewrite}
                            </p>
                            <p className="text-xs text-[var(--muted-foreground)]">
                              {finding.location}
                              {finding.pageUrl && (
                                <a
                                  href={createTextFragmentUrl(finding.pageUrl, finding.phrase)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="ml-1 inline-flex items-center text-[var(--accent)] hover:text-[var(--accent-hover)]"
                                  title="View source page"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                                </a>
                              )}
                            </p>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>

                {/* COPYWRITER BRIEF */}
                <div className="mb-12">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-subsection">Copywriter brief</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={handleDownloadBriefPDF}
                        className="text-sm bg-[var(--accent)] text-white px-4 py-2 font-semibold hover:opacity-90 transition-opacity"
                      >
                        Download PDF
                      </button>
                      <button
                        onClick={async () => {
                          const brief = `# Website Messaging Brief for ${companyName}

## Overview
Messaging Differentiation Score: ${preview.commodityScore}/100
Pages Analyzed: ${preview.pagesScanned}
Date: ${new Date().toLocaleDateString()}

## Brand Voice Summary
${preview.voiceSummary ? `Current tone: ${preview.voiceSummary.currentTone}\nAuthentic voice: ${preview.voiceSummary.authenticVoice}` : 'See detailed findings below for voice patterns.'}

## Priority Fixes (Top 5)
${preview.topIssues.slice(0, 5).map((issue, i) => `${i + 1}. ${issue.title} (${issue.severity})\n   ${issue.description}`).join('\n\n')}

## Competitive Context
${hasCompetitorData && data?.competitorComparison?.detailedScores ? `Your score: ${data.competitorComparison.yourScore}/100\nCompetitors analyzed: ${data.competitorComparison.detailedScores.map(c => c.url.replace(/^https?:\/\//, '').split('/')[0]).join(', ')}` : 'See competitor analysis section for positioning context.'}

## Key Messaging Rules
1. Lead with specific proof points (numbers, years, certifications)
2. Replace generic claims with specific outcomes
3. Name the ideal customer explicitly
4. Use active voice and direct CTAs

## Sample Rewrites
${preview.topIssues.slice(0, 3).flatMap(issue => issue.findings?.slice(0, 1) || []).map(f => `Before: "${f.phrase}"\nAfter: "${f.rewrite}"`).join('\n\n')}

---
Generated by Website Messaging Audit | leefuhr.com`
                          const result = await safeClipboardWrite(brief)
                          const btn = document.getElementById('copy-brief-btn')
                          if (btn) { btn.textContent = result.success ? 'Copied!' : 'Failed'; setTimeout(() => btn.textContent = 'Copy', 2000) }
                        }}
                        id="copy-brief-btn"
                        className="text-sm bg-gray-200 text-gray-700 px-4 py-2 font-semibold hover:bg-gray-300 transition-opacity"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <p className="text-body text-[var(--muted-foreground)] mb-4">
                    A one-page summary you can hand to a copywriter or share with your team.
                  </p>
                  <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide mb-1">Differentiation score</p>
                        <p className="text-2xl font-bold">{preview.commodityScore}/100</p>
                      </div>
                      <div>
                        <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide mb-1">Pages analyzed</p>
                        <p className="text-2xl font-bold">{preview.pagesScanned}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide mb-1">Total rewrites</p>
                        <p className="text-2xl font-bold">{preview.topIssues.reduce((acc, issue) => acc + (issue.findings?.length || 0), 0)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide mb-1">Critical issues</p>
                        <p className="text-2xl font-bold">{preview.topIssues.filter(i => i.severity === 'critical').length}</p>
                      </div>
                    </div>
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide mb-2">Top 3 priorities</p>
                      <ol className="space-y-2">
                        {preview.topIssues.slice(0, 3).map((issue, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-[var(--accent)] font-bold">{i + 1}.</span>
                            <span className="text-sm">{issue.title}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </div>

                {/* TRUST SIGNAL CHECKLIST */}
                <div className="mb-12">
                  <h3 className="text-subsection mb-4">Trust signal checklist</h3>
                  <p className="text-body text-[var(--muted-foreground)] mb-4">
                    Specific proof points to add to your site, based on what we found (and didn&apos;t find).
                  </p>
                  <div className="bg-white border-2 border-gray-200 rounded-lg divide-y divide-gray-200">
                    {(() => {
                      // Extract all phrases from findings to check what exists on site
                      const allPhrases = preview.topIssues
                        .flatMap(issue => issue.findings || [])
                        .map(f => f.phrase?.toLowerCase() || '')
                        .join(' ')

                      // Check for specific trust signals in the scanned content
                      const hasCustomerCount = /\d+[\+]?\s*(customers?|clients?|users?|teams?|companies|businesses)/i.test(allPhrases)
                      const hasYears = /(since|founded|established)\s*(19|20)\d{2}|\d+\+?\s*years/i.test(allPhrases)
                      const hasTestimonials = /(testimonial|review|said|quot|\")/i.test(allPhrases)
                      const hasCaseStudy = /(case study|increased|improved|reduced|saved)\s*\d+/i.test(allPhrases)
                      const hasCertifications = /(iso|soc|hipaa|certified|accredited|award)/i.test(allPhrases)
                      const hasGuarantee = /(guarantee|warranty|money.?back|risk.?free)/i.test(allPhrases)
                      const hasTeam = /(team|founder|ceo|leadership|about us)/i.test(allPhrases)
                      const hasAddress = /\d+\s+[a-z]+\s+(st|street|ave|avenue|rd|road|blvd|way)|[a-z]+,\s*[a-z]{2}\s*\d{5}/i.test(allPhrases)

                      const trustItems = [
                        {
                          check: 'Customer count',
                          found: hasCustomerCount,
                          tip: 'Add to hero section, above fold',
                          suggestion: hasCustomerCount ? null : `"Trusted by [X]+ ${preview.topIssues[0]?.findings?.[0]?.rewrite?.includes('business') ? 'businesses' : 'customers'}" - use your actual count`
                        },
                        {
                          check: 'Years in business',
                          found: hasYears,
                          tip: 'Footer or About page, also consider hero',
                          suggestion: hasYears ? null : '"Since [year]" or "[X]+ years of experience" - this builds credibility fast'
                        },
                        {
                          check: 'Named testimonials',
                          found: hasTestimonials,
                          tip: 'Logo bar near hero, testimonials on key pages',
                          suggestion: hasTestimonials ? null : 'Add 2-3 customer quotes with names, titles, and company logos'
                        },
                        {
                          check: 'Case study with numbers',
                          found: hasCaseStudy,
                          tip: 'Link from homepage, include % improvements',
                          suggestion: hasCaseStudy ? null : '"Helped [client] achieve [X]% improvement in [metric]" - pick your best result'
                        },
                        {
                          check: 'Certifications or awards',
                          found: hasCertifications,
                          tip: 'Footer badges, dedicated trust section',
                          suggestion: hasCertifications ? null : 'Add any industry certifications, compliance badges, or awards you hold'
                        },
                        {
                          check: 'Guarantee statement',
                          found: hasGuarantee,
                          tip: 'Near pricing or CTA, reduces risk',
                          suggestion: hasGuarantee ? null : '"[X]-day money-back guarantee" or "Satisfaction guaranteed" - reduces perceived risk'
                        },
                        {
                          check: 'Team visibility',
                          found: hasTeam,
                          tip: 'About page, humanizes the brand',
                          suggestion: hasTeam ? null : 'Add team photos or founder story - people buy from people'
                        },
                        {
                          check: 'Physical presence',
                          found: hasAddress,
                          tip: 'Footer, builds trust for B2B',
                          suggestion: hasAddress ? null : 'Add office address or "Headquartered in [city]" - signals legitimacy'
                        },
                      ]

                      return trustItems.map((item, i) => (
                        <div key={i} className={`flex items-start gap-4 p-4 ${item.found ? 'bg-green-50' : ''}`}>
                          <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${item.found ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                            {item.found ? '✓' : ''}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className={`font-medium ${item.found ? 'text-green-700' : 'text-[var(--foreground)]'}`}>{item.check}</p>
                              {item.found && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Found</span>}
                              {!item.found && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">Missing</span>}
                            </div>
                            <p className="text-sm text-[var(--muted-foreground)]">{item.tip}</p>
                            {item.suggestion && (
                              <p className="text-sm mt-2 p-2 bg-blue-50 border-l-2 border-blue-400 text-blue-800">
                                <strong>Add:</strong> {item.suggestion}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    })()}
                  </div>
                </div>

                {/* COMPETITOR HEADLINES */}
                {hasCompetitorData && data?.competitorComparison?.detailedScores && (
                  <div className="mb-12">
                    <h3 className="text-subsection mb-4">Competitor headline comparison</h3>
                    <p className="text-body text-[var(--muted-foreground)] mb-4">
                      Side-by-side positioning. What are they saying vs. what are you saying?
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full border-2 border-gray-200 rounded-lg text-sm">
                        <thead>
                          <tr className="bg-gray-100 border-b-2 border-gray-300">
                            <th className="text-left p-4 font-bold">Site</th>
                            <th className="text-left p-4 font-bold">Headline</th>
                            <th className="text-left p-4 font-bold">Score</th>
                            <th className="text-left p-4 font-bold">Strongest area</th>
                            <th className="text-left p-4 font-bold">Weakest area</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="bg-blue-50 border-b-2 border-blue-300">
                            <td className="p-4 font-bold">{hostname} <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded ml-2">YOU</span></td>
                            <td className="p-4 italic text-gray-700 max-w-xs truncate" title={preview.siteSnapshot?.h1 || 'No H1 found'}>
                              {preview.siteSnapshot?.h1 ? `"${preview.siteSnapshot.h1.length > 60 ? preview.siteSnapshot.h1.substring(0, 60) + '...' : preview.siteSnapshot.h1}"` : '-'}
                            </td>
                            <td className="p-4 font-bold">{preview.commodityScore}</td>
                            <td className="p-4">
                              {preview.categoryScores && (() => {
                                const entries = Object.entries(preview.categoryScores) as [string, number][]
                                const best = entries.sort((a, b) => b[1] - a[1])[0]
                                const name = best[0].replace(/([A-Z])/g, ' $1').trim()
                                return best ? `${name.charAt(0).toUpperCase() + name.slice(1)} (${best[1]}/10)` : '-'
                              })()}
                            </td>
                            <td className="p-4">
                              {preview.categoryScores && (() => {
                                const entries = Object.entries(preview.categoryScores) as [string, number][]
                                const worst = entries.sort((a, b) => a[1] - b[1])[0]
                                const name = worst[0].replace(/([A-Z])/g, ' $1').trim()
                                return worst ? `${name.charAt(0).toUpperCase() + name.slice(1)} (${worst[1]}/10)` : '-'
                              })()}
                            </td>
                          </tr>
                          {data.competitorComparison.detailedScores.map((comp, i) => (
                            <tr key={i} className="border-b border-gray-200 hover:bg-gray-50">
                              <td className="p-4 font-mono">{comp.url.replace(/^https?:\/\//, '').split('/')[0]}</td>
                              <td className="p-4 italic text-gray-600 max-w-xs truncate" title={(comp as { headline?: string }).headline || 'No H1 found'}>
                                {(comp as { headline?: string }).headline ? `"${(comp as { headline?: string }).headline!.length > 60 ? (comp as { headline?: string }).headline!.substring(0, 60) + '...' : (comp as { headline?: string }).headline}"` : '-'}
                              </td>
                              <td className="p-4">{comp.score}</td>
                              <td className="p-4">
                                {comp.categoryScores && (() => {
                                  const entries = Object.entries(comp.categoryScores) as [string, number][]
                                  const best = entries.sort((a, b) => b[1] - a[1])[0]
                                  const name = best[0].replace(/([A-Z])/g, ' $1').trim()
                                  return best ? `${name.charAt(0).toUpperCase() + name.slice(1)} (${best[1]}/10)` : '-'
                                })()}
                              </td>
                              <td className="p-4">
                                {comp.categoryScores && (() => {
                                  const entries = Object.entries(comp.categoryScores) as [string, number][]
                                  const worst = entries.sort((a, b) => a[1] - b[1])[0]
                                  const name = worst[0].replace(/([A-Z])/g, ' $1').trim()
                                  return worst ? `${name.charAt(0).toUpperCase() + name.slice(1)} (${worst[1]}/10)` : '-'
                                })()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                  </>
                )}

              </div>
            </section>
          </ViewNavBar>
        )}

        <Footer context={`Audit for ${companyName}`} />
      </div>

      {/* Scorecard Modal */}
      {openScorecard && (() => {
        const cat = scoreCategories.find(c => c.key === openScorecard)
        if (!cat) return null

        // Calculate score (use AI-generated category scores if available, otherwise derive from overall with variance)
        const aiScore = preview?.categoryScores?.[cat.key as keyof typeof preview.categoryScores]
        // Add variance per category so fallback scores aren't all identical
        const categoryVariance: Record<string, number> = {
          firstImpression: 0,
          differentiation: -1,
          customerClarity: 1,
          storyStructure: -1,
          trustSignals: 1,
          buttonClarity: 0,
        }
        const baseScore = Math.round((preview?.commodityScore || 50) / 12.5)
        const variance = categoryVariance[cat.key] || 0
        const score = aiScore !== undefined
          ? Math.max(1, Math.min(10, aiScore))
          : Math.max(1, Math.min(10, baseScore + variance))
        const color = score >= 7 ? 'excellent' : score >= 5 ? 'moderate' : 'poor'
        const label = score >= 7 ? 'Strong' : score >= 5 ? 'Needs work' : 'Critical'

        // Map to detail views
        const viewMap: Record<string, ViewType> = {
          'firstImpression': 'message',
          'differentiation': 'audience',
          'customerClarity': 'audience',
          'storyStructure': 'message',
          'trustSignals': 'trust',
          'buttonClarity': 'trust',
        }
        const targetView = viewMap[cat.key] || 'message'

        // Breakdown explanations
        const breakdowns: Record<string, { factors: string[], insight: string }> = {
          'firstImpression': {
            factors: [
              'Headline clarity and specificity',
              'Value proposition visibility',
              'Industry/customer identification speed',
              'Visual hierarchy guiding attention',
            ],
            insight: 'Your homepage headline and opening section need to immediately answer "what do you do?" and "is this for me?" Most visitors decide in under 5 seconds.',
          },
          'differentiation': {
            factors: [
              'Unique claims vs. competitor language',
              'Specific proof points used',
              'Commodity phrase frequency',
              'Competitive positioning statements',
            ],
            insight: 'When you sound like everyone else, buyers compare on price. Your differentiators likely exist - they\'re just buried or unstated.',
          },
          'customerClarity': {
            factors: [
              'Ideal customer description specificity',
              'Industry/vertical mentions',
              'Problem/pain point articulation',
              'Customer language vs. company language',
            ],
            insight: 'Speaking to "everyone" means connecting with no one. Your best customers should feel like you\'re speaking directly to them.',
          },
          'storyStructure': {
            factors: [
              'Problem → Solution narrative arc',
              'Customer journey acknowledgment',
              'Emotional vs. logical appeal balance',
              'Story coherence across pages',
            ],
            insight: 'Most sites lead with features. Winning sites lead with the customer\'s problem, then position themselves as the guide to solving it.',
          },
          'trustSignals': {
            factors: [
              'Social proof visibility and placement',
              'Quantified results and metrics',
              'Third-party validation (certifications, awards)',
              'Case study and testimonial depth',
            ],
            insight: 'Trust signals exist on most sites - they\'re just buried. Moving proof to visible locations dramatically increases conversion.',
          },
          'buttonClarity': {
            factors: [
              'CTA specificity and value proposition',
              'Commitment level appropriateness',
              'Next step clarity for visitor',
              'Multiple commitment-level options',
            ],
            insight: '"Contact Us" assumes visitors are ready to talk. Many aren\'t. Offering lower-commitment options captures leads who need more time.',
          },
        }

        const breakdown = breakdowns[cat.key] || { factors: [], insight: '' }

        return (
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setOpenScorecard(null)}
          >
            <div
              className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`p-6 ${color === 'excellent' ? 'bg-green-600' : color === 'moderate' ? 'bg-amber-500' : 'bg-red-600'}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-white/70 mb-1">{cat.label}</p>
                    <p className="text-sm text-white/80">{cat.question}</p>
                  </div>
                  <button
                    onClick={() => setOpenScorecard(null)}
                    className="text-white/60 hover:text-white text-2xl leading-none"
                  >
                    ×
                  </button>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-bold text-white">{score}</span>
                  <span className="text-xl text-white/60">/10</span>
                  <span className="text-sm font-semibold text-white ml-auto">{label}</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full mt-4">
                  <div className="h-full bg-white rounded-full" style={{ width: `${score * 10}%` }}></div>
                </div>
              </div>

              <div className="p-6">
                <h4 className="font-bold text-[var(--foreground)] mb-3">How we calculated this</h4>
                <ul className="space-y-2 mb-6">
                  {breakdown.factors.map((factor, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[var(--muted-foreground)]">
                      <span className="text-[var(--accent)]">→</span>
                      {factor}
                    </li>
                  ))}
                </ul>

                <div className="p-4 bg-[var(--muted)] rounded mb-6">
                  <p className="text-sm text-[var(--foreground)]">
                    <strong>What this means:</strong> {breakdown.insight}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setOpenScorecard(null)
                      handleViewChange(targetView)
                    }}
                    className="flex-1 bg-[var(--accent)] text-white px-4 py-3 font-semibold hover:opacity-90 transition-opacity text-sm"
                  >
                    See detailed findings →
                  </button>
                  <button
                    onClick={() => setOpenScorecard(null)}
                    className="px-4 py-3 border-2 border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--accent)] transition-colors text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </main>
  )
}
