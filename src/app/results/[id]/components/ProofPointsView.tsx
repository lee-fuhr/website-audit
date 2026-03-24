/**
 * Proof points tab panel for the results page.
 */

import { ViewNavBar } from '@/components/ViewNavBar'
import { FullResults, ViewType, ViewDef } from './types'

interface ProofPointsViewProps {
  data: FullResults
  showAllViews: boolean
  currentView: ViewType
  prevView: ViewDef | null
  nextView: ViewDef | null
  onViewChange: (view: ViewType) => void
}

export function ProofPointsView({ data, showAllViews, currentView, prevView, nextView, onViewChange }: ProofPointsViewProps) {
  if (!showAllViews && currentView !== 'proof') return null

  return (
    <div role="tabpanel" id="tabpanel-proof" aria-labelledby="tab-proof">
      <ViewNavBar prevView={prevView} nextView={nextView} onNavigate={onViewChange} />
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
  )
}
