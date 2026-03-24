'use client'

import { ViewNavBar } from '@/components/ViewNavBar'
import { getScoreBgClass, getScoreColorClass, getScoreLabel } from './preview-utils'
import { AnalysisResponse, PreviewData, ViewType } from './types'
import { PositioningMap } from './competitors/PositioningMap'
import { ComparisonTable } from './competitors/ComparisonTable'
import { CompetitorInsightCard } from './competitors/CompetitorInsightCard'

interface View {
  id: ViewType
  label: string
  description?: string
}

interface CompetitorsViewProps {
  preview: PreviewData
  data: AnalysisResponse
  hostname: string
  hasCompetitorData: boolean
  isUnlocked: boolean
  isCheckingOut: boolean
  prevView: View | null
  nextView: View | null
  onNavigate: (view: ViewType) => void
  onUnlock: () => void
}

export function CompetitorsView({
  preview,
  data,
  hostname,
  hasCompetitorData,
  isUnlocked,
  isCheckingOut,
  prevView,
  nextView,
  onNavigate,
  onUnlock,
}: CompetitorsViewProps) {
  const comp = data.competitorComparison

  return (
    <ViewNavBar prevView={prevView} nextView={nextView} onNavigate={onNavigate}>
      <section className="section">
        <div className="container">
          <h2 className="text-section mb-6">Competitor comparison</h2>
          <div className="methodology-box">
            <h3 className="text-subsection mb-2">Why this matters</h3>
            <p className="text-body">
              When buyers compare you to competitors, they&apos;re looking for differentiation. If your
              messaging sounds the same, they default to price. This analysis shows how you stack up -
              and what to steal.
            </p>
          </div>

          {/* No competitor data */}
          {!hasCompetitorData && (
            <div className="p-8 bg-amber-50 border-2 border-amber-200 rounded text-center mb-8">
              <p className="text-lg font-semibold text-amber-900 mb-2">
                Competitor analysis not available
              </p>
              <p className="text-sm text-amber-700">
                We weren&apos;t able to gather competitor data for this analysis. This may happen if
                competitor sites block external access.
              </p>
            </div>
          )}

          {hasCompetitorData && comp && (
            <>
              {comp.competitors.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm text-[var(--muted-foreground)]">
                    <strong>Comparing against:</strong> {comp.competitors.join(', ')}
                  </p>
                </div>
              )}

              {!comp.detailedScores || comp.detailedScores.length === 0 ? (
                <div className="p-8 bg-amber-50 border-2 border-amber-200 rounded mb-8 text-center">
                  <p className="text-lg font-semibold text-amber-800 mb-2">
                    Competitor analysis incomplete
                  </p>
                  <p className="text-sm text-amber-700 mb-4">
                    We tried to analyze {comp.competitors.join(', ')} but couldn&apos;t access their
                    websites. Some companies block external access to their sites.
                  </p>
                  <p className="text-sm text-amber-600">
                    Try adding smaller competitors or direct industry rivals.
                  </p>
                </div>
              ) : (
                <>
                  {/* Score comparison cards */}
                  <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div
                      className={`${getScoreBgClass(comp.yourScore)} border-2 border-[var(--accent)] p-6 rounded text-center`}
                    >
                      <p className="text-label mb-2">YOUR SCORE</p>
                      <p className={`text-5xl font-bold ${getScoreColorClass(comp.yourScore)}`}>
                        {comp.yourScore}
                      </p>
                      <p className="text-sm text-[var(--muted-foreground)] mt-1">/100</p>
                      <p className={`text-sm font-semibold mt-2 ${getScoreColorClass(comp.yourScore)}`}>
                        {getScoreLabel(comp.yourScore)}
                      </p>
                    </div>
                    <div
                      className={`${getScoreBgClass(comp.averageScore)} border-2 border-[var(--border)] p-6 rounded text-center`}
                    >
                      <p className="text-label mb-2">COMPETITOR AVG</p>
                      <p className={`text-5xl font-bold ${getScoreColorClass(comp.averageScore)}`}>
                        {comp.averageScore}
                      </p>
                      <p className="text-sm text-[var(--muted-foreground)] mt-1">/100</p>
                      <p
                        className={`text-sm font-semibold mt-2 ${getScoreColorClass(comp.averageScore)}`}
                      >
                        {getScoreLabel(comp.averageScore)}
                      </p>
                    </div>
                    <div className="bg-[var(--muted)] border-2 border-[var(--border)] p-6 rounded text-center">
                      <p className="text-label mb-2">YOUR ADVANTAGE</p>
                      <p
                        className={`text-5xl font-bold ${
                          comp.yourScore > comp.averageScore
                            ? 'text-[var(--score-excellent)]'
                            : 'text-[var(--score-poor)]'
                        }`}
                      >
                        {comp.yourScore > comp.averageScore ? '+' : ''}
                        {comp.yourScore - comp.averageScore}
                      </p>
                      <p className="text-sm text-[var(--muted-foreground)] mt-1">points</p>
                      <p
                        className={`text-sm font-semibold mt-2 ${
                          comp.yourScore > comp.averageScore
                            ? 'text-[var(--score-excellent)]'
                            : 'text-[var(--score-poor)]'
                        }`}
                      >
                        {comp.yourScore > comp.averageScore ? "You're winning" : 'Room to improve'}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* Individual competitor breakdown */}
              {comp.detailedScores && comp.detailedScores.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-subsection mb-4">Individual competitor scores</h3>
                  <div className="grid gap-4">
                    {comp.detailedScores.map((competitor) => {
                      let compHostname: string
                      try {
                        compHostname = new URL(competitor.url).hostname.replace('www.', '')
                      } catch {
                        compHostname = competitor.url
                      }
                      const isWinning = comp.yourScore > competitor.score
                      return (
                        <div
                          key={competitor.url}
                          className={`p-5 border-2 rounded ${
                            isWinning ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <span className="font-semibold text-[var(--foreground)]">
                                {compHostname}
                              </span>
                              <span
                                className={`ml-3 text-xs px-2 py-1 rounded ${
                                  isWinning
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {isWinning ? "✓ You're ahead" : '⚠ They\'re ahead'}
                              </span>
                            </div>
                            <div className="text-right">
                              <span
                                className={`text-2xl font-bold ${getScoreColorClass(competitor.score)}`}
                              >
                                {competitor.score}
                              </span>
                              <span className="text-[var(--muted-foreground)]">/100</span>
                            </div>
                          </div>
                          <div className="score-bar mb-3">
                            <div
                              className={`score-bar-fill ${
                                competitor.score >= 60
                                  ? 'excellent'
                                  : competitor.score >= 40
                                  ? 'moderate'
                                  : 'poor'
                              }`}
                              style={{ width: `${competitor.score}%` }}
                            />
                          </div>
                          <p className="text-sm text-[var(--muted-foreground)]">
                            {isWinning
                              ? `Your messaging is ${comp.yourScore - competitor.score} points more differentiated than theirs.`
                              : isUnlocked
                              ? `They're ${competitor.score - comp.yourScore} points ahead. See the comparison table below for category-by-category breakdown.`
                              : `They're ${competitor.score - comp.yourScore} points ahead. The full audit shows exactly what they're doing better.`}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Key insights */}
              {comp.detailedScores &&
                comp.detailedScores.length > 0 &&
                comp.gaps.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-subsection mb-4">What we noticed</h3>
                    <div className="bg-white border-2 border-[var(--border)] p-6 rounded">
                      <ul className="space-y-3">
                        {comp.gaps.map((gap) => (
                          <li key={gap} className="flex items-start gap-3">
                            <span className="text-[var(--accent)] text-lg">→</span>
                            <span className="text-[var(--foreground)]">{gap}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

              {/* Gated deeper analysis */}
              {comp.detailedScores &&
                comp.detailedScores.length > 0 &&
                !isUnlocked && (
                  <div className="mb-8">
                    <h3 className="text-subsection mb-4">What you can steal</h3>
                    <div className="p-6 bg-[var(--muted)] border-2 border-dashed border-[var(--border)] rounded">
                      <div className="grid md:grid-cols-2 gap-6">
                        {[
                          { icon: '📋', title: 'Phrase-by-phrase comparison', desc: "See exactly which phrases they use that you don't" },
                          { icon: '🎯', title: 'Competitive positioning gaps', desc: 'Areas where you can differentiate immediately' },
                          { icon: '💡', title: "Proof points they're missing", desc: 'Your opportunities to stand out' },
                          { icon: '✍️', title: 'Competitive rewrites', desc: 'Copy that positions you against them specifically' },
                        ].map(({ icon, title, desc }) => (
                          <div key={title} className="text-center p-4">
                            <div className="w-12 h-12 bg-[var(--accent)]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                              <span className="text-2xl">{icon}</span>
                            </div>
                            <p className="font-semibold text-[var(--foreground)] mb-1">{title}</p>
                            <p className="text-sm text-[var(--muted-foreground)]">{desc}</p>
                          </div>
                        ))}
                      </div>
                      <div className="text-center mt-6 pt-6 border-t border-[var(--border)]">
                        <button
                          onClick={onUnlock}
                          disabled={isCheckingOut}
                          className="bg-[var(--accent)] text-white px-6 py-3 font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                          {isCheckingOut
                            ? 'Starting checkout...'
                            : 'Unlock competitive analysis — $400'}
                        </button>
                        <p className="text-xs text-[var(--muted-foreground)] mt-3">
                          Included with your full audit
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              {/* Unlocked: positioning map + table + insight cards */}
              {comp.detailedScores && comp.detailedScores.length > 0 && isUnlocked && (
                <>
                  <div className="mb-12">
                    <h3 className="text-subsection mb-6">How you compare</h3>
                    <PositioningMap
                      yourScore={preview?.commodityScore || 50}
                      competitors={comp.detailedScores}
                    />
                    <ComparisonTable
                      preview={preview}
                      hostname={hostname}
                      detailedScores={comp.detailedScores}
                    />
                  </div>

                  <div className="space-y-8">
                    <h3 className="text-subsection">What to steal (and where you win)</h3>
                    {comp.detailedScores.map((competitor) => (
                      <CompetitorInsightCard
                        key={competitor.url}
                        competitor={competitor}
                        yourScore={preview?.commodityScore || 50}
                        yourCategoryScores={preview?.categoryScores}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </section>
    </ViewNavBar>
  )
}
