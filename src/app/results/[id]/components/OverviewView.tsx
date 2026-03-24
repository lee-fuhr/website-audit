/**
 * Overview tab panel for the results page.
 */

import { FullResults, ViewType, ViewDef, getScoreColor, getScoreLabel } from './types'

interface OverviewViewProps {
  data: FullResults
  showAllViews: boolean
  currentView: ViewType
  views: ViewDef[]
  onViewChange: (view: ViewType) => void
}

export function OverviewView({ data, showAllViews, currentView, views, onViewChange }: OverviewViewProps) {
  if (!showAllViews && currentView !== 'overview') return null

  return (
    <div role="tabpanel" id="tabpanel-overview" aria-labelledby="tab-overview">
      <section className="section">
        <div className="container">
          <h2 className="text-section mb-6">What&apos;s in this report</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {views.filter(v => v.id !== 'overview').map((view) => (
              <button
                key={view.id}
                onClick={() => onViewChange(view.id)}
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
                        <td className="text-sm text-[var(--muted-foreground)]">{comp.headline || '\u2014'}</td>
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
  )
}
