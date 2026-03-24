/**
 * Page-by-page analysis tab panel for the results page.
 */

import { ViewNavBar } from '@/components/ViewNavBar'
import { FullResults, ViewType, ViewDef, getScoreColor, getScoreLabel } from './types'

interface PageAnalysisViewProps {
  data: FullResults
  showAllViews: boolean
  currentView: ViewType
  prevView: ViewDef | null
  nextView: ViewDef | null
  onViewChange: (view: ViewType) => void
}

export function PageAnalysisView({ data, showAllViews, currentView, prevView, nextView, onViewChange }: PageAnalysisViewProps) {
  if (!showAllViews && currentView !== 'pages') return null

  return (
    <div role="tabpanel" id="tabpanel-pages" aria-labelledby="tab-pages">
      <ViewNavBar prevView={prevView} nextView={nextView} onNavigate={onViewChange} />
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
  )
}
