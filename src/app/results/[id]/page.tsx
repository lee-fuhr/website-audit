'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ViewNavBar } from '@/components/ViewNavBar'

// Types mirrored from the API route
interface FullResults {
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

type ViewType = 'overview' | 'pages' | 'voice' | 'proof'

const views = [
  { id: 'overview' as ViewType, label: 'Overview', description: 'Summary and competitor comparison' },
  { id: 'pages' as ViewType, label: 'Page analysis', description: 'Issue-by-issue breakdown per page' },
  { id: 'voice' as ViewType, label: 'Voice analysis', description: 'Tone and authentic voice findings' },
  { id: 'proof' as ViewType, label: 'Proof points', description: 'Quotes and credibility material found' },
]

function getScoreColor(score: number): string {
  if (score >= 7) return 'excellent'
  if (score >= 5) return 'moderate'
  return 'poor'
}

function getScoreLabel(score: number): string {
  if (score >= 7) return 'Strong'
  if (score >= 5) return 'Needs work'
  return 'Critical gap'
}

export default function ResultsPage() {
  const params = useParams()
  const id = params?.id as string
  const router = useRouter()
  const [data, setData] = useState<FullResults | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentView, setCurrentView] = useState<ViewType>('overview')
  const [isPrintMode, setIsPrintMode] = useState(false)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    if (!id) return
    fetch(`/api/analyze?id=${id}`)
      .then(r => r.json())
      .then(res => {
        if (!res.success) {
          setError(res.error || 'Analysis not found')
          return
        }
        const state = res.analysis
        // PAYMENT_GATE_ENABLED: set to 'false' in env to bypass payment check (emergency debugging)
        const paymentGateEnabled = process.env.NEXT_PUBLIC_PAYMENT_GATE_ENABLED !== 'false'
        if (paymentGateEnabled && (!state.paid || !state.fullResults)) {
          router.replace(`/preview/${id}`)
          return
        }
        if (!paymentGateEnabled && !state.fullResults) {
          router.replace(`/preview/${id}`)
          return
        }
        setData(state.fullResults)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id, router])

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault()
      const nextIndex = (index + 1) % views.length
      tabRefs.current[nextIndex]?.focus()
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault()
      const prevIndex = (index - 1 + views.length) % views.length
      tabRefs.current[prevIndex]?.focus()
    } else if (e.key === 'Home') {
      e.preventDefault()
      tabRefs.current[0]?.focus()
    } else if (e.key === 'End') {
      e.preventDefault()
      tabRefs.current[views.length - 1]?.focus()
    }
  }

  const handlePrintPDF = () => {
    setIsPrintMode(true)
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.print()
      setIsPrintMode(false)
    }))
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <p className="text-section mb-4">Error</p>
          <p className="text-body mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-[var(--accent)] text-white px-6 py-3 font-semibold hover:opacity-90 transition-opacity"
          >
            Start over
          </button>
        </div>
      </main>
    )
  }

  if (!data) return null

  const showAllViews = isPrintMode
  const currentViewIndex = views.findIndex(v => v.id === currentView)
  const prevView = currentViewIndex > 0 ? views[currentViewIndex - 1] : null
  const nextView = currentViewIndex < views.length - 1 ? views[currentViewIndex + 1] : null
  const currentYear = new Date().getFullYear()

  return (
    <main className="min-h-screen bg-[var(--background)]">
      {/* Sticky sidebar TOC */}
      <nav aria-label="Audit sections" className="hidden lg:block print:!hidden fixed top-0 left-0 w-64 h-screen bg-[var(--accent)] text-white p-8 overflow-y-auto z-40 flex flex-col">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-wider opacity-60 mb-1">Full audit</p>
          <button
            onClick={() => handleViewChange('overview')}
            className="font-semibold text-lg text-left hover:underline w-full"
          >
            Website Messaging Audit
          </button>
        </div>
        <ul role="tablist" aria-orientation="vertical" className="space-y-1 flex-1">
          {views.map((view, index) => {
            const isActive = currentView === view.id
            return (
              <li key={view.id} role="presentation">
                <button
                  ref={(el) => { tabRefs.current[index] = el }}
                  role="tab"
                  id={`tab-${view.id}`}
                  aria-selected={isActive}
                  aria-controls={`tabpanel-${view.id}`}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => handleViewChange(view.id)}
                  onKeyDown={(e) => handleTabKeyDown(e, index)}
                  className={`w-full text-left py-3 px-4 text-sm transition-all flex items-center gap-3 ${
                    isActive
                      ? 'bg-white/20 font-semibold'
                      : 'opacity-70 hover:opacity-100 hover:bg-white/10'
                  }`}
                >
                  {view.label}
                </button>
              </li>
            )
          })}
        </ul>
        <div className="mt-auto pt-8 border-t border-white/20 print:hidden">
          <button
            onClick={handlePrintPDF}
            className="w-full py-3 px-4 text-sm bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center gap-2"
          >
            Download PDF
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Main content */}
      <div className="lg:ml-64 print:!ml-0">
        {/* Header */}
        <header className="border-b-4 border-[var(--accent)] py-8 md:py-12">
          <div className="container">
            <p className="text-label mb-2">WEBSITE MESSAGING AUDIT — FULL REPORT</p>
            <h1 className="text-display mb-4">Full Audit Results</h1>
            <div className="flex flex-wrap gap-4 text-[var(--muted-foreground)]">
              <span>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              <span>·</span>
              <span>Prepared by Lee Fuhr</span>
            </div>
          </div>
        </header>

        {/* OVERVIEW VIEW */}
        {(showAllViews || currentView === 'overview') && (
          <div role="tabpanel" id="tabpanel-overview" aria-labelledby="tab-overview">
            <section className="section">
              <div className="container">
                <h2 className="text-section mb-6">What&apos;s in this report</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {views.filter(v => v.id !== 'overview').map((view) => (
                    <button
                      key={view.id}
                      onClick={() => handleViewChange(view.id)}
                      className="text-left p-6 bg-white border-2 border-[var(--border)] hover:border-[var(--accent)] transition-colors rounded"
                    >
                      <h3 className="text-subsection text-[var(--accent)] mb-2">{view.label}</h3>
                      <p className="text-body text-[var(--muted-foreground)]">{view.description}</p>
                      <p className="text-sm text-[var(--accent)] mt-3">Explore →</p>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Page scores summary */}
            <section className="section section-alt">
              <div className="container">
                <h2 className="text-section mb-6">Page scores at a glance</h2>
                <div className="grid gap-4">
                  {data.pageByPage.map((page) => {
                    const color = getScoreColor(page.score)
                    return (
                      <div key={page.url} className="bg-white border-2 border-[var(--border)] p-4 rounded flex items-center gap-4">
                        <div className="shrink-0 text-center w-16">
                          <span className={`text-3xl font-bold score-${color}`}>{page.score}</span>
                          <p className="text-xs text-[var(--muted-foreground)]">/10</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{page.title || page.url}</p>
                          <p className="text-sm text-[var(--muted-foreground)] truncate">{page.url}</p>
                          <p className="text-xs text-[var(--muted-foreground)] mt-1">{page.issues.length} issue{page.issues.length !== 1 ? 's' : ''} found</p>
                        </div>
                        <span className={`text-sm font-semibold score-${color} shrink-0`}>{getScoreLabel(page.score)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </section>

            {/* Competitor comparison */}
            {data.competitorComparison && data.competitorComparison.competitors.length > 0 && (
              <section className="section">
                <div className="container">
                  <h2 className="text-section mb-6">Competitor comparison</h2>
                  <div className="grid md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white border-2 border-[var(--accent)] p-6 rounded text-center">
                      <p className="text-label mb-2">Your score</p>
                      <p className="text-5xl font-bold text-[var(--accent)]">{data.competitorComparison.yourScore}</p>
                    </div>
                    <div className="bg-white border-2 border-[var(--border)] p-6 rounded text-center">
                      <p className="text-label mb-2">Competitor average</p>
                      <p className="text-5xl font-bold text-[var(--muted-foreground)]">{data.competitorComparison.averageScore}</p>
                    </div>
                    <div className="bg-white border-2 border-[var(--border)] p-6 rounded text-center">
                      <p className="text-label mb-2">Competitors analyzed</p>
                      <p className="text-5xl font-bold text-[var(--foreground)]">{data.competitorComparison.competitors.length}</p>
                    </div>
                  </div>
                  {data.competitorComparison.gaps.length > 0 && (
                    <div className="callout">
                      <h3 className="text-subsection mb-3">Gaps identified</h3>
                      <ul className="space-y-2">
                        {data.competitorComparison.gaps.map((gap, i) => (
                          <li key={`gap-${i}-${gap.slice(0, 20)}`} className="flex items-start gap-2 text-body">
                            <span className="text-[var(--accent)]">→</span>
                            <span>{gap}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {data.competitorComparison.detailedScores && data.competitorComparison.detailedScores.length > 0 && (
                    <div className="overflow-x-auto mt-6">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Competitor</th>
                            <th>Score</th>
                            <th>Headline</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.competitorComparison.detailedScores.map((comp) => (
                            <tr key={comp.url}>
                              <td className="font-mono text-sm">{comp.url}</td>
                              <td>
                                <span className={`font-bold score-${getScoreColor(comp.score / 10)}`}>{comp.score}</span>
                              </td>
                              <td className="text-sm text-[var(--muted-foreground)]">{comp.headline || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        )}

        {/* PAGE ANALYSIS VIEW */}
        {(showAllViews || currentView === 'pages') && (
          <div role="tabpanel" id="tabpanel-pages" aria-labelledby="tab-pages">
            <ViewNavBar prevView={prevView} nextView={nextView} onNavigate={handleViewChange} />
            <section className="section">
              <div className="container">
                <h2 className="text-section mb-6">Page-by-page analysis</h2>
                <p className="text-body-lg mb-8 max-w-3xl">
                  Every issue found on every page, with specific rewrites you can implement.
                </p>
                <div className="space-y-8">
                  {data.pageByPage.map((page) => {
                    const color = getScoreColor(page.score)
                    return (
                      <div key={page.url} className="border-2 border-[var(--border)] rounded overflow-hidden">
                        <div className={`p-6 border-b-2 border-[var(--border)] flex items-center gap-4 ${color === 'excellent' ? 'bg-green-50' : color === 'moderate' ? 'bg-amber-50' : 'bg-red-50'}`}>
                          <div className="shrink-0 text-center">
                            <span className={`text-4xl font-bold score-${color}`}>{page.score}</span>
                            <p className="text-xs text-[var(--muted-foreground)]">/10</p>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-subsection truncate">{page.title || 'Untitled page'}</h3>
                            <p className="text-sm text-[var(--muted-foreground)] truncate font-mono">{page.url}</p>
                          </div>
                          <span className={`text-sm font-semibold score-${color} shrink-0`}>{getScoreLabel(page.score)}</span>
                        </div>
                        {page.issues.length === 0 ? (
                          <div className="p-6 text-[var(--muted-foreground)]">No issues found on this page.</div>
                        ) : (
                          <div className="divide-y-2 divide-[var(--border)]">
                            {page.issues.map((issue, i) => (
                              <div key={`${page.url}-issue-${i}`} className="p-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                  <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded">
                                    <p className="text-xs font-bold text-[var(--error)] mb-2">CURRENT — {issue.location}</p>
                                    <p className="text-body italic">&quot;{issue.phrase}&quot;</p>
                                    <p className="text-sm text-[var(--muted-foreground)] mt-2">{issue.problem}</p>
                                  </div>
                                  <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded">
                                    <p className="text-xs font-bold text-[var(--success)] mb-2">SUGGESTED REWRITE</p>
                                    <p className="text-body font-medium">{issue.rewrite}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* VOICE ANALYSIS VIEW */}
        {(showAllViews || currentView === 'voice') && (
          <div role="tabpanel" id="tabpanel-voice" aria-labelledby="tab-voice">
            <ViewNavBar prevView={prevView} nextView={nextView} onNavigate={handleViewChange} />
            <section className="section">
              <div className="container">
                <h2 className="text-section mb-6">Voice analysis</h2>
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div className="bg-white border-2 border-[var(--border)] p-6 rounded">
                    <h3 className="text-subsection mb-4">Current tone</h3>
                    <p className="text-body">{data.voiceAnalysis.currentTone}</p>
                  </div>
                  <div className="bg-white border-2 border-[var(--accent)] p-6 rounded">
                    <h3 className="text-subsection mb-4">Your authentic voice</h3>
                    <p className="text-body">{data.voiceAnalysis.authenticVoice}</p>
                  </div>
                </div>
                {data.voiceAnalysis.examples.length > 0 && (
                  <div>
                    <h3 className="text-subsection mb-4">Examples from your site</h3>
                    <ul className="space-y-3">
                      {data.voiceAnalysis.examples.map((example, i) => (
                        <li key={`voice-example-${i}`} className="flex items-start gap-3 text-body">
                          <span className="text-[var(--accent)] shrink-0">→</span>
                          <span>{example}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {/* PROOF POINTS VIEW */}
        {(showAllViews || currentView === 'proof') && (
          <div role="tabpanel" id="tabpanel-proof" aria-labelledby="tab-proof">
            <ViewNavBar prevView={prevView} nextView={nextView} onNavigate={handleViewChange} />
            <section className="section">
              <div className="container">
                <h2 className="text-section mb-6">Proof points we found</h2>
                <p className="text-body-lg mb-8 max-w-3xl">
                  These are credibility elements from your site that can be surfaced more prominently.
                </p>
                {data.proofPoints.length === 0 ? (
                  <div className="callout callout-warning">
                    <p className="text-body">No strong proof points were found on your site. This is a critical gap — adding specific, verifiable claims is the highest-leverage improvement you can make.</p>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {data.proofPoints.map((point, i) => (
                      <div key={`proof-${i}-${point.source.slice(0, 20)}`} className="bg-white border-2 border-[var(--border)] p-6 rounded">
                        <p className="text-body-lg italic mb-3 border-l-4 border-[var(--accent)] pl-4">&quot;{point.quote}&quot;</p>
                        <p className="text-sm text-[var(--muted-foreground)] mb-4">Source: {point.source}</p>
                        <div className="bg-[var(--muted)] p-4 rounded">
                          <p className="text-xs font-bold text-[var(--accent)] mb-1">SUGGESTED USE</p>
                          <p className="text-body">{point.suggestedUse}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {/* Footer */}
        <footer className="bg-black text-white py-12 md:py-16">
          <div className="container">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4">About this audit</h3>
                <p className="opacity-90 mb-4">
                  This audit uses Lee Fuhr&apos;s proprietary messaging evaluation methodology, refined across
                  50+ B2B websites. It draws from proven frameworks including Emma Stratton&apos;s
                  story methodology and value-benefit-feature sequencing, adapted specifically
                  for mid-market manufacturers.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4">Questions?</h3>
                <p className="opacity-90 mb-4">
                  If something in this audit is unclear or you want to discuss a specific recommendation, I&apos;m happy to chat.
                </p>
                <p className="opacity-90">
                  <a href="mailto:hi@leefuhr.com" className="hover:underline">hi@leefuhr.com</a>
                </p>
                <p className="opacity-70 text-sm mt-4">
                  Lee Fuhr · <a href="https://leefuhr.com" className="hover:underline">leefuhr.com</a>
                </p>
              </div>
            </div>
            <div className="border-t border-white/20 mt-8 pt-8 text-sm">
              <p className="text-center opacity-70">
                © {currentYear} Lee Fuhr Inc · Website Messaging Audit
              </p>
            </div>
          </div>
        </footer>
      </div>
    </main>
  )
}
