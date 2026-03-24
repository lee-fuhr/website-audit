'use client'

import { ViewNavBar } from '@/components/ViewNavBar'
import { Tooltip } from '@/components/Tooltip'
import { createTextFragmentUrl, getScoreColorClass, getScoreBgClass, getScoreBorderClass, getScoreLabel, getScoreDescription, scoreCategories } from './preview-utils'
import { LeadCaptureSection } from './LeadCaptureSection'
import { safeClipboardWrite } from '@/lib/utils'
import { PRICING } from '@shared/config/pricing'
import { AnalysisResponse, PreviewData, ViewType } from './types'

const AUDIT_PRICE = `$${PRICING['website-audit'].base}`

interface View {
  id: ViewType
  label: string
}

interface OverviewViewProps {
  preview: PreviewData
  data: AnalysisResponse
  hostname: string
  isUnlocked: boolean
  isCheckingOut: boolean
  expandedIssue: number | null
  leadEmail: string
  leadLoading: boolean
  leadCaptured: boolean
  prevView: View | null
  nextView: View | null
  onNavigate: (view: ViewType) => void
  onExpandIssue: (index: number | null) => void
  onOpenScorecard: (key: string) => void
  onUnlock: () => void
  onLeadEmailChange: (email: string) => void
  onLeadSubmit: () => void
}

export function OverviewView({
  preview,
  data,
  hostname,
  isUnlocked,
  isCheckingOut,
  expandedIssue,
  leadEmail,
  leadLoading,
  leadCaptured,
  prevView,
  nextView,
  onNavigate,
  onExpandIssue,
  onOpenScorecard,
  onUnlock,
  onLeadEmailChange,
  onLeadSubmit,
}: OverviewViewProps) {
  const scoreColorClass = getScoreColorClass(preview.commodityScore)
  const scoreBgClass = getScoreBgClass(preview.commodityScore)
  const scoreBorderClass = getScoreBorderClass(preview.commodityScore)

  const categoryVariance: Record<string, number> = {
    firstImpression: 0,
    differentiation: -1,
    customerClarity: 1,
    storyStructure: -1,
    trustSignals: 1,
    buttonClarity: 0,
  }

  const subFactors: Record<string, string[]> = {
    firstImpression: ['Hero headline clarity', 'Value prop visibility', 'Visual hierarchy'],
    differentiation: ['Unique proof points', 'Specific vs generic claims', 'Competitive positioning'],
    customerClarity: ['Target audience specificity', 'Problem/solution fit', 'Use case examples'],
    storyStructure: ['Narrative flow', 'Benefit-led messaging', 'Emotional connection'],
    trustSignals: ['Social proof quality', 'Credential visibility', 'Risk reducers'],
    buttonClarity: ['CTA copy specificity', 'Next step obviousness', 'Value reinforcement'],
  }

  return (
    <ViewNavBar prevView={prevView} nextView={nextView} onNavigate={onNavigate}>
      {/* How this works */}
      <section className="section bg-[var(--muted)] border-b border-[var(--border)] print:hidden">
        <div className="container">
          <div className="max-w-3xl">
            <p className="text-label mb-2">HOW THIS WORKS</p>
            <h2 className="text-section mb-4">We find the proof you&apos;re already sitting on</h2>
            <p className="text-body-lg mb-4">
              Your website has gold buried in it - project counts, tolerances, on-time stats, specific
              outcomes. The problem? It&apos;s hidden in paragraph 3 of your About page while your homepage
              says &quot;quality service.&quot;
            </p>
            <p className="text-body text-[var(--muted-foreground)]">
              This audit finds those proof points and shows you exactly how to use them. The rewrites
              aren&apos;t generic marketing copy - they&apos;re built from YOUR numbers.
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
            <p className={`text-xl font-bold mb-2 ${scoreColorClass}`}>
              {getScoreLabel(preview.commodityScore)}
            </p>
            <p className="text-body text-[var(--muted-foreground)] max-w-xl mx-auto">
              {getScoreDescription(preview.commodityScore)}
            </p>
          </div>
          <div className="bg-[var(--muted)] border-2 border-[var(--border)] p-4 rounded">
            <p className="text-xs font-bold text-[var(--muted-foreground)] mb-3 text-center">HOW YOU COMPARE</p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-[var(--score-fair)]">38</p>
                <p className="text-xs text-[var(--muted-foreground)]">typical first audit</p>
              </div>
              <div className="border-x border-[var(--border)]">
                <p className={`text-2xl font-bold ${scoreColorClass}`}>{preview.commodityScore}</p>
                <p className="text-xs text-[var(--muted-foreground)]">you today</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--score-excellent)]">85+</p>
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
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-semibold uppercase tracking-wide">
              Preview included
            </span>
          </div>
          <p className="text-body-lg mb-8 max-w-3xl">
            Below are the specific changes that will have the most impact. Click any issue to see what to
            do about it.
          </p>
          <div className="grid gap-4">
            {preview.topIssues.map((issue, index) => {
              const isExpanded = expandedIssue === index
              const isFeatured = index === 0
              return (
                <div
                  key={issue.title}
                  className={`action-card ${isFeatured ? 'featured' : ''} cursor-pointer hover:border-[var(--accent)] transition-colors`}
                  onClick={() => onExpandIssue(isExpanded ? null : index)}
                >
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="flex items-center gap-4">
                      <span className="text-3xl font-bold text-[var(--accent)] shrink-0 w-12">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      {isFeatured && (
                        <span className="bg-[var(--accent)] text-white text-xs font-bold uppercase tracking-wider px-3 py-1">
                          Start here
                        </span>
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
                              issue.severity === 'critical'
                                ? 'bg-red-100 text-red-700'
                                : issue.severity === 'warning'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {issue.severity === 'critical' ? '🔴' : issue.severity === 'warning' ? '🟡' : '🟢'}{' '}
                            {issue.severity}
                          </span>
                        </Tooltip>
                      </div>
                      <p className="text-body text-[var(--muted-foreground)]">{issue.description}</p>
                    </div>
                  </div>
                  <div
                    className={`overflow-hidden transition-all duration-200 ease-in-out ${
                      isExpanded
                        ? 'max-h-[5000px] opacity-100 mt-6 pt-6 border-t-2 border-[var(--border)]'
                        : 'max-h-0 opacity-0'
                    }`}
                  >
                    {issue.findings && issue.findings.length > 0 ? (
                      <div className="mb-6">
                        <div className="space-y-6">
                          {issue.findings.map((finding, findingIndex) => (
                            <div key={findingIndex} className="border-2 border-[var(--border)] rounded-lg overflow-hidden">
                              <div className="grid md:grid-cols-2 gap-0">
                                <div className="p-4 bg-red-50 border-r border-[var(--border)]">
                                  <p className="text-xs font-bold text-[var(--score-poor)] mb-2">❌ CURRENT</p>
                                  <p className="text-sm text-[var(--foreground)]">{finding.phrase}</p>
                                  <p className="text-xs text-[var(--muted-foreground)] mt-2">
                                    Found: {finding.location}
                                    {finding.pageUrl && (
                                      <a
                                        href={createTextFragmentUrl(finding.pageUrl, finding.phrase)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="ml-1 inline-flex items-center text-[var(--accent)] hover:text-[var(--accent-hover)]"
                                        title="View source page"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                          <polyline points="15 3 21 3 21 9" />
                                          <line x1="10" y1="14" x2="21" y2="3" />
                                        </svg>
                                      </a>
                                    )}
                                  </p>
                                </div>
                                <div className="p-4 bg-green-50">
                                  <div className="flex justify-between items-start gap-2 mb-2">
                                    <p className="text-xs font-bold text-[var(--score-excellent)]">✓ SUGGESTED REWRITE</p>
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
                        <div
                          className={`p-4 rounded border-l-4 ${
                            issue.severity === 'critical'
                              ? 'bg-red-50 border-red-500'
                              : issue.severity === 'warning'
                              ? 'bg-amber-50 border-amber-500'
                              : 'bg-slate-50 border-slate-400'
                          }`}
                        >
                          <p className="text-sm text-[var(--foreground)] mb-2">
                            <strong>Why this matters:</strong>{' '}
                            {issue.severity === 'critical'
                              ? 'This is actively hurting your conversion rate. Visitors are leaving because of this issue.'
                              : issue.severity === 'warning'
                              ? 'This creates friction in the buyer journey. Fixing it will noticeably improve engagement.'
                              : 'This is a refinement opportunity that can improve your competitive positioning.'}
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
                        onClick={(e) => {
                          e.stopPropagation()
                          onExpandIssue(null)
                        }}
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

      {/* Score cards */}
      <section className="section">
        <div className="container">
          <h2 className="text-section mb-4">Where you stand</h2>
          <p className="text-body-lg mb-8 max-w-3xl">
            Detailed breakdowns of each score are available in the full audit.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scoreCategories.map((cat) => {
              const aiScore = preview?.categoryScores?.[cat.key as keyof typeof preview.categoryScores]
              const baseScore = Math.round((preview?.commodityScore || 50) / 12.5)
              const variance = categoryVariance[cat.key] || 0
              const score =
                aiScore !== undefined
                  ? Math.max(1, Math.min(10, aiScore))
                  : Math.max(1, Math.min(10, baseScore + variance))
              const color = score >= 7 ? 'excellent' : score >= 5 ? 'moderate' : 'poor'
              const label = score >= 7 ? 'Strong' : score >= 5 ? 'Needs work' : 'Critical'

              return (
                <button
                  key={cat.key}
                  onClick={() => onOpenScorecard(cat.key)}
                  className={`score-card text-left border-2 border-[var(--border)] p-6 rounded cursor-pointer hover:border-[var(--accent)] hover:shadow-md transition-all ${
                    color === 'excellent' ? 'bg-green-50' : color === 'moderate' ? 'bg-amber-50' : 'bg-red-50'
                  }`}
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
                    <div className={`score-bar-fill ${color}`} style={{ width: `${score * 10}%` }} />
                  </div>
                  <p className="text-sm text-[var(--muted-foreground)]">{cat.question}</p>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-600 mb-2">What we measure:</p>
                    <ul className="text-xs text-gray-500 space-y-0.5">
                      {(subFactors[cat.key] || []).map((factor) => (
                        <li key={factor}>• {factor}</li>
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

      {/* What we scanned */}
      <section className="section bg-gray-50 border-t-2 border-gray-200">
        <div className="container">
          <h2 className="text-section mb-6">What we scanned</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 bg-white border-2 border-gray-300 rounded-lg shadow-sm">
              <p className="text-5xl font-bold text-[var(--accent)] mb-2">
                {preview?.topIssues?.reduce((total, issue) => total + (issue.findings?.length || 0), 0) || 0}
              </p>
              <p className="text-sm font-bold mb-2">Copy-paste rewrites</p>
              <p className="text-xs text-gray-600">Specific phrases from YOUR site with suggested replacements</p>
            </div>
            <div className="p-6 bg-white border-2 border-gray-300 rounded-lg shadow-sm">
              <p className="text-5xl font-bold text-[var(--accent)] mb-2">
                {data?.competitorComparison?.detailedScores?.length || 0}
              </p>
              <p className="text-sm font-bold mb-2">Competitors analyzed</p>
              <p className="text-xs text-gray-600">Full category scoring and insights per competitor</p>
            </div>
            <div className="p-6 bg-white border-2 border-gray-300 rounded-lg shadow-sm">
              <p className="text-5xl font-bold text-[var(--accent)] mb-2">{preview?.pagesScanned || 0}</p>
              <p className="text-sm font-bold mb-2">Pages crawled</p>
              <p className="text-xs text-gray-600">Complete content audit across your entire site</p>
            </div>
          </div>

          {preview?.siteSnapshot?.pagesFound?.length > 0 && (
            <details className="mt-6 bg-gray-50 border border-gray-200 rounded-lg">
              <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                View all {preview.siteSnapshot.pagesFound.length} pages we analyzed
              </summary>
              <div className="px-4 py-3 border-t border-gray-200 max-h-64 overflow-y-auto">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {preview.siteSnapshot.pagesFound.map((page: string) => (
                    <a
                      key={page}
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

      {/* Lead capture — before paywall */}
      {!isUnlocked && (
        <LeadCaptureSection
          leadEmail={leadEmail}
          onEmailChange={onLeadEmailChange}
          onSubmit={onLeadSubmit}
          leadLoading={leadLoading}
          leadCaptured={leadCaptured}
        />
      )}

      {/* Unlock CTA */}
      {!isUnlocked && (
        <section className="bg-[var(--accent)] text-white py-12 md:py-16">
          <div className="container">
            <div className="max-w-3xl mx-auto">
              <p className="text-xs uppercase tracking-widest text-white/60 text-center mb-2">
                The hard part is done.
              </p>
              <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
                Your rewrites are written. Get them.
              </h2>
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                {[
                  { icon: '📄', title: 'Copy-paste rewrites', desc: 'Specific replacement copy for every issue found' },
                  { icon: '📊', title: 'Complete score breakdown', desc: 'Deep dive into each area with specific fixes' },
                  { icon: '💎', title: 'Your hidden proof points', desc: 'Gold buried on your site, surfaced and ready' },
                  { icon: '📍', title: 'Page-by-page breakdown', desc: 'Every page analyzed with exact locations' },
                ].map((item) => (
                  <div key={item.title} className="p-4 bg-white/10 backdrop-blur rounded border border-white/20">
                    <p className="font-bold text-white mb-1">{item.icon} {item.title}</p>
                    <p className="text-sm text-white/80">{item.desc}</p>
                  </div>
                ))}
              </div>
              <div className="text-center">
                <button
                  onClick={onUnlock}
                  disabled={isCheckingOut}
                  className="bg-white text-[var(--accent)] px-10 py-4 text-lg font-bold hover:bg-white/90 transition-all shadow-lg disabled:opacity-50"
                >
                  {isCheckingOut ? 'Starting checkout...' : `Unlock full audit — ${AUDIT_PRICE}`}
                </button>
                <p className="text-xs text-white/60 mt-4">One-time payment. No subscription. Instant access.</p>
              </div>
            </div>
          </div>
        </section>
      )}
    </ViewNavBar>
  )
}
