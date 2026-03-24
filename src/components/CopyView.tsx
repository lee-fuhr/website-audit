'use client'

import { ViewNavBar } from '@/components/ViewNavBar'
import { LockedFindings } from './LockedFindings'

type BeforeAfterExample = {
  source: string
  before: string
  after: string
  rationale: string
}

type EasyWin = {
  title: string
  description: string
  effort: string
}

type ViewNavItem = { id: 'overview' | 'message' | 'audience' | 'trust' | 'copy'; label: string; description: string } | null

type CopyViewProps = {
  isPaid: boolean
  showAllViews: boolean
  onUnlock: () => void
  prevView: ViewNavItem
  nextView: ViewNavItem
  onNavigate: (view: 'overview' | 'message' | 'audience' | 'trust' | 'copy') => void
  beforeAfter: BeforeAfterExample[]
  easyWins: EasyWin[]
}

export function CopyView({ isPaid, showAllViews, onUnlock, prevView, nextView, onNavigate, beforeAfter, easyWins }: CopyViewProps) {
  return (
    <>
      <ViewNavBar prevView={prevView} nextView={nextView} onNavigate={onNavigate} />

      {/* Before/After Examples */}
      <section id="before-after" className="section section-alt">
        <div className="container">
          <h2 className="text-section mb-6">Copy you can use today</h2>
          <p className="text-body-lg mb-8 max-w-3xl">
            These aren't suggestions - they're actual rewrites you can copy and paste. Each one
            transforms generic messaging into something specific, provable, and differentiated.
          </p>

          {(isPaid || showAllViews) ? (
          <div className="space-y-6">
            {beforeAfter.map((example, i) => (
              <div key={i} className="comparison-card">
                <div className="comparison-header">
                  <span className="text-label">{example.source}</span>
                </div>
                <div className="comparison-content">
                  <div className="comparison-before">
                    <span className="comparison-label before">
                      <span className="w-2 h-2 bg-[var(--error)] inline-block"></span>
                      Current
                    </span>
                    <p className="text-body">{example.before}</p>
                  </div>
                  <div className="comparison-after">
                    <span className="comparison-label after">
                      <span className="w-2 h-2 bg-[var(--success)] inline-block"></span>
                      Suggested
                    </span>
                    <p className="text-body font-medium">{example.after}</p>
                  </div>
                </div>
                <div className="p-4 border-t-2 border-[var(--border)] bg-white">
                  <p className="text-sm text-[var(--muted-foreground)]">
                    <strong>Why:</strong> {example.rationale}
                  </p>
                </div>
              </div>
            ))}
          </div>
          ) : (
            <LockedFindings onUnlock={onUnlock} />
          )}
        </div>
      </section>

      {/* Quick Wins */}
      <section id="quick-wins" className="section">
        <div className="container">
          <div className="quick-wins">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🟢</span>
              <h2 className="text-section text-[var(--success)]">Quick wins</h2>
            </div>
            <p className="text-body-lg mb-6">
              These changes take minimal effort but will immediately improve how visitors perceive you.
              Start here before tackling the bigger items.
            </p>
            {(isPaid || showAllViews) ? (
            <div className="space-y-4">
              {easyWins.map((action, i) => (
                <div key={i} className="bg-white p-4 border-l-4 border-[var(--success)]">
                  <h3 className="font-semibold mb-1">{action.title}</h3>
                  <p className="text-sm text-[var(--muted-foreground)]">{action.description}</p>
                </div>
              ))}
            </div>
            ) : (
              <LockedFindings onUnlock={onUnlock} />
            )}
          </div>
        </div>
      </section>
    </>
  )
}
