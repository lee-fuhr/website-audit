'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ViewNavBar } from '@/components/ViewNavBar'
import { Footer } from '@/components/Footer'
import { Tooltip } from '@/components/Tooltip'

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
    hasLinkedIn: boolean
    pagesFound: string[]
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
  detailedScores?: Array<{ url: string; score: number }>
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

type ViewType = 'overview' | 'message' | 'audience' | 'trust' | 'copy' | 'competitors'

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
}

const baseViews = [
  { id: 'overview' as ViewType, label: 'Overview', description: 'Your action plan and scores at a glance' },
  { id: 'message' as ViewType, label: 'Your message', description: 'How clearly you communicate what you do and why it matters' },
  { id: 'audience' as ViewType, label: 'Your audience', description: 'Who you\'re speaking to and how you compare to alternatives' },
  { id: 'trust' as ViewType, label: 'Building trust', description: 'Proof points and getting visitors to take action' },
  { id: 'copy' as ViewType, label: 'Copy to use', description: 'Ready-to-paste text you can implement today' },
]

const competitorsView = { id: 'competitors' as ViewType, label: 'Competitors', description: 'How you stack up against the competition' }

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
              <p className="text-xs font-bold text-red-600 mb-1">❌ ON YOUR SITE NOW</p>
              <p className="text-sm italic text-[var(--foreground)]">&quot;{teaserFinding.phrase}&quot;</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-2">Found: {teaserFinding.location}</p>
            </div>
            <div className="p-3 bg-green-50 border-l-4 border-green-500">
              <div className="flex justify-between items-start gap-2 mb-1">
                <p className="text-xs font-bold text-green-600">✓ SUGGESTED REWRITE</p>
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(teaserFinding.rewrite)
                    const el = document.getElementById('copy-rewrite-btn')
                    if (el) { el.textContent = '✓ Copied'; setTimeout(() => { el.textContent = 'Copy' }, 1500) }
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

  // Editable input fields
  const [editableUrl, setEditableUrl] = useState('')
  const [editableCompanyName, setEditableCompanyName] = useState('')
  const [editableEmail, setEditableEmail] = useState('')
  const [isRerunning, setIsRerunning] = useState(false)

  const currentYear = new Date().getFullYear()

  // Always show competitors tab - we'll find them or prompt user
  const hasCompetitorData = data?.competitorComparison && data.competitorComparison.detailedScores && data.competitorComparison.detailedScores.length > 0
  const views = [...baseViews, competitorsView]

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
  const companyName = preview.siteSnapshot.title || hostname.split('.')[0]
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
                onClick={async () => {
                  try {
                    const response = await fetch(`/api/generate-pdf?id=${params.id}`)
                    if (response.ok) {
                      const blob = await response.blob()
                      const url = window.URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `audit-${hostname}.pdf`
                      document.body.appendChild(a)
                      a.click()
                      window.URL.revokeObjectURL(url)
                      document.body.removeChild(a)
                    }
                  } catch (err) {
                    console.error('PDF download failed:', err)
                  }
                }}
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

      {/* Main content */}
      <div className="lg:ml-64 print:!ml-0">
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
                  await navigator.clipboard.writeText(url)
                  alert('Link copied!')
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-[var(--border)] hover:bg-[var(--muted)] transition-colors rounded"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Copy share link
              </button>
            </div>
          </div>
        </header>

        {/* OVERVIEW VIEW */}
        {currentView === 'overview' && (
          <>
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
                              <p className="text-xs font-bold text-[var(--accent)] mb-4 uppercase tracking-wide">
                                Copy-paste fixes from your site ({issue.findings.length} option{issue.findings.length !== 1 ? 's' : ''}):
                              </p>
                              <div className="space-y-6">
                                {issue.findings.map((finding, findingIndex) => (
                                  <div key={findingIndex} className="border-2 border-[var(--border)] rounded-lg overflow-hidden">
                                    <div className="grid md:grid-cols-2 gap-0">
                                      <div className="p-4 bg-red-50 border-r border-[var(--border)]">
                                        <p className="text-xs font-bold text-red-600 mb-2">❌ CURRENT - on your site</p>
                                        <p className="text-sm text-[var(--foreground)]">{finding.phrase}</p>
                                        <p className="text-xs text-[var(--muted-foreground)] mt-2">Found: {finding.location}</p>
                                      </div>
                                      <div className="p-4 bg-green-50">
                                        <div className="flex justify-between items-start gap-2 mb-2">
                                          <p className="text-xs font-bold text-green-600">✓ SUGGESTED REWRITE</p>
                                          <button
                                            onClick={async (e) => {
                                              e.stopPropagation()
                                              await navigator.clipboard.writeText(finding.rewrite)
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
                    // Map score categories to detail views
                    const viewMap: Record<string, ViewType> = {
                      'firstImpression': 'message',
                      'differentiation': 'audience',
                      'customerClarity': 'audience',
                      'storyStructure': 'message',
                      'trustSignals': 'trust',
                      'buttonClarity': 'trust',
                    }
                    const targetView = viewMap[cat.key] || 'message'

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
                        <p className="text-xs text-[var(--accent)] mt-2 font-medium">See breakdown →</p>
                      </button>
                    )
                  })}
                </div>
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

            {/* Next section CTA */}
            <section className="section border-t-2 border-[var(--border)]">
              <div className="container">
                <div className="max-w-xl ml-auto">
                  <button
                    onClick={() => handleViewChange('message')}
                    className="w-full text-left p-6 bg-[var(--accent)] text-white rounded hover:bg-[var(--accent)]/90 transition-colors"
                  >
                    <p className="text-xs uppercase tracking-wider text-white/70 mb-2">Continue reading →</p>
                    <h3 className="text-lg font-semibold text-white mb-1">Your message</h3>
                    <p className="text-sm text-white/80">Detailed first impression and story structure analysis</p>
                  </button>
                </div>
              </div>
            </section>
          </>
        )}

        {/* MESSAGE VIEW */}
        {currentView === 'message' && (
          <>
            <ViewNavBar prevView={prevView} nextView={nextView} onNavigate={handleViewChange} />
            <section className="section">
              <div className="container">
                <h2 className="text-section mb-6">First impression clarity</h2>
                <div className="methodology-box">
                  <h3 className="text-subsection mb-2">The 5-second test</h3>
                  <p className="text-body">
                    Your prospects open 10 tabs. You have 5 seconds to answer: &quot;Is this for me?&quot; If they can&apos;t
                    immediately see what you do, who you serve, and why you&apos;re different - they close the tab.
                  </p>
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
                  {preview.topIssues[0]?.findings && preview.topIssues[0].findings.length > 0 ? (
                    <div className="space-y-4">
                      <p className="text-xs font-bold text-[var(--accent)] uppercase tracking-wide">
                        Copy-paste fixes for first impression ({preview.topIssues[0].findings.length} option{preview.topIssues[0].findings.length !== 1 ? 's' : ''}):
                      </p>
                      {preview.topIssues[0].findings.slice(0, 3).map((finding, idx) => (
                        <div key={idx} className="border-2 border-[var(--border)] rounded-lg overflow-hidden">
                          <div className="grid md:grid-cols-2 gap-0">
                            <div className="p-4 bg-red-50 border-r border-[var(--border)]">
                              <p className="text-xs font-bold text-red-600 mb-2">❌ CURRENT</p>
                              <p className="text-sm text-[var(--foreground)]">{finding.phrase}</p>
                              <p className="text-xs text-[var(--muted-foreground)] mt-2">Found: {finding.location}</p>
                            </div>
                            <div className="p-4 bg-green-50">
                              <div className="flex justify-between items-start gap-2 mb-2">
                                <p className="text-xs font-bold text-green-600">✓ REWRITE</p>
                                <button
                                  onClick={async () => {
                                    await navigator.clipboard.writeText(finding.rewrite)
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
                          <p className="text-xs text-[var(--muted-foreground)] mt-2">Found: {preview.teaserFinding.location}</p>
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
                  {isTestUnlocked && preview.topIssues[1]?.findings && preview.topIssues[1].findings.length > 0 ? (
                    <div className="space-y-4">
                      <p className="text-xs font-bold text-[var(--accent)] uppercase tracking-wide">
                        Copy-paste fixes for message structure ({preview.topIssues[1].findings.length} option{preview.topIssues[1].findings.length !== 1 ? 's' : ''}):
                      </p>
                      {preview.topIssues[1].findings.slice(0, 3).map((finding, idx) => (
                        <div key={idx} className="border-2 border-[var(--border)] rounded-lg overflow-hidden">
                          <div className="grid md:grid-cols-2 gap-0">
                            <div className="p-4 bg-red-50 border-r border-[var(--border)]">
                              <p className="text-xs font-bold text-red-600 mb-2">❌ CURRENT</p>
                              <p className="text-sm text-[var(--foreground)]">{finding.phrase}</p>
                              <p className="text-xs text-[var(--muted-foreground)] mt-2">Found: {finding.location}</p>
                            </div>
                            <div className="p-4 bg-green-50">
                              <div className="flex justify-between items-start gap-2 mb-2">
                                <p className="text-xs font-bold text-green-600">✓ REWRITE</p>
                                <button
                                  onClick={async () => {
                                    await navigator.clipboard.writeText(finding.rewrite)
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
          </>
        )}

        {/* AUDIENCE VIEW */}
        {currentView === 'audience' && (
          <>
            <ViewNavBar prevView={prevView} nextView={nextView} onNavigate={handleViewChange} />
            <section className="section">
              <div className="container">
                <h2 className="text-section mb-6">Who you&apos;re really for</h2>
                <div className="methodology-box">
                  <h3 className="text-subsection mb-2">The &quot;more of these&quot; principle</h3>
                  <p className="text-body">
                    Think of your best customers - the ones who pay on time, don&apos;t nickel-and-dime you,
                    and refer others. Your website should speak directly to <em>that</em> company. When
                    you write for everyone, you connect with no one.
                  </p>
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
                  {isTestUnlocked && preview.topIssues[2]?.findings && preview.topIssues[2].findings.length > 0 ? (
                    <div className="space-y-4">
                      <p className="text-xs font-bold text-[var(--accent)] uppercase tracking-wide">
                        Copy-paste fixes for customer clarity ({preview.topIssues[2].findings.length} option{preview.topIssues[2].findings.length !== 1 ? 's' : ''}):
                      </p>
                      {preview.topIssues[2].findings.slice(0, 3).map((finding, idx) => (
                        <div key={idx} className="border-2 border-[var(--border)] rounded-lg overflow-hidden">
                          <div className="grid md:grid-cols-2 gap-0">
                            <div className="p-4 bg-red-50 border-r border-[var(--border)]">
                              <p className="text-xs font-bold text-red-600 mb-2">❌ CURRENT</p>
                              <p className="text-sm text-[var(--foreground)]">{finding.phrase}</p>
                              <p className="text-xs text-[var(--muted-foreground)] mt-2">Found: {finding.location}</p>
                            </div>
                            <div className="p-4 bg-green-50">
                              <div className="flex justify-between items-start gap-2 mb-2">
                                <p className="text-xs font-bold text-green-600">✓ REWRITE</p>
                                <button
                                  onClick={async () => {
                                    await navigator.clipboard.writeText(finding.rewrite)
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
                  {isTestUnlocked && preview.topIssues[3]?.findings && preview.topIssues[3].findings.length > 0 ? (
                    <div className="space-y-4">
                      <p className="text-xs font-bold text-[var(--accent)] uppercase tracking-wide">
                        Copy-paste fixes for differentiation ({preview.topIssues[3].findings.length} option{preview.topIssues[3].findings.length !== 1 ? 's' : ''}):
                      </p>
                      {preview.topIssues[3].findings.slice(0, 3).map((finding, idx) => (
                        <div key={idx} className="border-2 border-[var(--border)] rounded-lg overflow-hidden">
                          <div className="grid md:grid-cols-2 gap-0">
                            <div className="p-4 bg-red-50 border-r border-[var(--border)]">
                              <p className="text-xs font-bold text-red-600 mb-2">❌ CURRENT</p>
                              <p className="text-sm text-[var(--foreground)]">{finding.phrase}</p>
                              <p className="text-xs text-[var(--muted-foreground)] mt-2">Found: {finding.location}</p>
                            </div>
                            <div className="p-4 bg-green-50">
                              <div className="flex justify-between items-start gap-2 mb-2">
                                <p className="text-xs font-bold text-green-600">✓ REWRITE</p>
                                <button
                                  onClick={async () => {
                                    await navigator.clipboard.writeText(finding.rewrite)
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
          </>
        )}

        {/* TRUST VIEW */}
        {currentView === 'trust' && (
          <>
            <ViewNavBar prevView={prevView} nextView={nextView} onNavigate={handleViewChange} />
            <section className="section">
              <div className="container">
                <h2 className="text-section mb-6">Your proof points</h2>
                <div className="methodology-box">
                  <h3 className="text-subsection mb-2">The proof inventory</h3>
                  <p className="text-body">
                    You have proof. Certifications. Track records. Customer wins. But is it visible where it
                    matters? Companies constantly bury their best proof on About pages nobody reads.
                  </p>
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
                  {isTestUnlocked && preview.topIssues[4]?.findings && preview.topIssues[4].findings.length > 0 ? (
                    <div className="space-y-4">
                      <p className="text-xs font-bold text-[var(--accent)] uppercase tracking-wide">
                        Copy-paste fixes for trust signals ({preview.topIssues[4].findings.length} option{preview.topIssues[4].findings.length !== 1 ? 's' : ''}):
                      </p>
                      {preview.topIssues[4].findings.slice(0, 3).map((finding, idx) => (
                        <div key={idx} className="border-2 border-[var(--border)] rounded-lg overflow-hidden">
                          <div className="grid md:grid-cols-2 gap-0">
                            <div className="p-4 bg-red-50 border-r border-[var(--border)]">
                              <p className="text-xs font-bold text-red-600 mb-2">❌ CURRENT</p>
                              <p className="text-sm text-[var(--foreground)]">{finding.phrase}</p>
                              <p className="text-xs text-[var(--muted-foreground)] mt-2">Found: {finding.location}</p>
                            </div>
                            <div className="p-4 bg-green-50">
                              <div className="flex justify-between items-start gap-2 mb-2">
                                <p className="text-xs font-bold text-green-600">✓ REWRITE</p>
                                <button
                                  onClick={async () => {
                                    await navigator.clipboard.writeText(finding.rewrite)
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
                  {isTestUnlocked && preview.topIssues[5]?.findings && preview.topIssues[5].findings.length > 0 ? (
                    <div className="space-y-4">
                      <p className="text-xs font-bold text-[var(--accent)] uppercase tracking-wide">
                        Copy-paste fixes for CTAs ({preview.topIssues[5].findings.length} option{preview.topIssues[5].findings.length !== 1 ? 's' : ''}):
                      </p>
                      {preview.topIssues[5].findings.slice(0, 3).map((finding, idx) => (
                        <div key={idx} className="border-2 border-[var(--border)] rounded-lg overflow-hidden">
                          <div className="grid md:grid-cols-2 gap-0">
                            <div className="p-4 bg-red-50 border-r border-[var(--border)]">
                              <p className="text-xs font-bold text-red-600 mb-2">❌ CURRENT</p>
                              <p className="text-sm text-[var(--foreground)]">{finding.phrase}</p>
                              <p className="text-xs text-[var(--muted-foreground)] mt-2">Found: {finding.location}</p>
                            </div>
                            <div className="p-4 bg-green-50">
                              <div className="flex justify-between items-start gap-2 mb-2">
                                <p className="text-xs font-bold text-green-600">✓ REWRITE</p>
                                <button
                                  onClick={async () => {
                                    await navigator.clipboard.writeText(finding.rewrite)
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
          </>
        )}

        {/* COPY VIEW */}
        {currentView === 'copy' && (
          <>
            <ViewNavBar prevView={prevView} nextView={nextView} onNavigate={handleViewChange} />
            <section className="section">
              <div className="container">
                <h2 className="text-section mb-6">Copy you can use today</h2>
                <p className="text-body-lg mb-8 max-w-3xl">
                  The full audit includes 15-20 before/after rewrites specific to YOUR site. Each one
                  transforms generic messaging into something specific, provable, and differentiated.
                </p>
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
                      <p className="text-xs font-bold text-[var(--accent)] uppercase tracking-wide">
                        Additional copy fixes ({preview.topIssues.slice(6).flatMap(issue => issue.findings || []).length} option{preview.topIssues.slice(6).flatMap(issue => issue.findings || []).length !== 1 ? 's' : ''}):
                      </p>
                      {preview.topIssues.slice(6).flatMap(issue => issue.findings || []).slice(0, 5).map((finding, idx) => (
                        <div key={idx} className="border-2 border-[var(--border)] rounded-lg overflow-hidden">
                          <div className="grid md:grid-cols-2 gap-0">
                            <div className="p-4 bg-red-50 border-r border-[var(--border)]">
                              <p className="text-xs font-bold text-red-600 mb-2">❌ CURRENT</p>
                              <p className="text-sm text-[var(--foreground)]">{finding.phrase}</p>
                              <p className="text-xs text-[var(--muted-foreground)] mt-2">Found: {finding.location}</p>
                            </div>
                            <div className="p-4 bg-green-50">
                              <div className="flex justify-between items-start gap-2 mb-2">
                                <p className="text-xs font-bold text-green-600">✓ REWRITE</p>
                                <button
                                  onClick={async () => {
                                    await navigator.clipboard.writeText(finding.rewrite)
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
          </>
        )}

        {/* COMPETITORS VIEW */}
        {currentView === 'competitors' && (
          <>
            <ViewNavBar prevView={prevView} nextView={nextView} onNavigate={handleViewChange} />
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
                        const isWinning = data.competitorComparison && data.competitorComparison.yourScore > comp.score
                        return (
                          <div key={i} className={`p-5 border-2 rounded ${isWinning ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <span className="font-semibold text-[var(--foreground)]">{compHostname}</span>
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

                {/* Unlocked competitive analysis */}
                {data.competitorComparison.detailedScores && data.competitorComparison.detailedScores.length > 0 && isTestUnlocked && (
                <div className="mb-8">
                  <h3 className="text-subsection mb-4">What you can steal</h3>
                  <div className="space-y-6">
                    {data.competitorComparison.detailedScores.map((competitor, idx) => (
                      <div key={idx} className="p-6 bg-[var(--muted)] border border-[var(--border)] rounded">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-[var(--foreground)]">{competitor.name}</h4>
                          <span className={`text-sm font-medium px-2 py-1 rounded ${
                            competitor.score > (preview?.commodityScore || 50)
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            Score: {competitor.score}
                          </span>
                        </div>
                        {competitor.strengths && competitor.strengths.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-[var(--foreground)] mb-2">Their strengths to learn from:</p>
                            <ul className="space-y-1">
                              {competitor.strengths.map((strength, sIdx) => (
                                <li key={sIdx} className="text-sm text-[var(--muted-foreground)] flex items-start gap-2">
                                  <span className="text-green-600 mt-0.5">→</span>
                                  <span>{strength}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {competitor.weaknesses && competitor.weaknesses.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-[var(--foreground)] mb-2">Where you can beat them:</p>
                            <ul className="space-y-1">
                              {competitor.weaknesses.map((weakness, wIdx) => (
                                <li key={wIdx} className="text-sm text-[var(--muted-foreground)] flex items-start gap-2">
                                  <span className="text-[var(--accent)] mt-0.5">→</span>
                                  <span>{weakness}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                )}
                  </>
                )}
              </div>
            </section>
          </>
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
