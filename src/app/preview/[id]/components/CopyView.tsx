'use client'

import { ViewNavBar } from '@/components/ViewNavBar'
import { FindingCard } from './FindingCard'
import { LockedFindings } from './LockedFindings'
import { PreviewData, ViewType } from './types'

interface View {
  id: ViewType
  label: string
  description?: string
}

interface CopyViewProps {
  preview: PreviewData
  isUnlocked: boolean
  prevView: View | null
  nextView: View | null
  onNavigate: (view: ViewType) => void
  onUnlock: () => void
}

export function CopyView({
  preview,
  isUnlocked,
  prevView,
  nextView,
  onNavigate,
  onUnlock,
}: CopyViewProps) {
  const secondaryFindings = preview.topIssues
    .slice(6)
    .flatMap((issue) => issue.findings || [])

  return (
    <ViewNavBar prevView={prevView} nextView={nextView} onNavigate={onNavigate}>
      <section className="section">
        <div className="container">
          <h2 className="text-section mb-2">Copy you can use today</h2>
          <p className="text-body-lg text-[var(--muted-foreground)] mb-6">
            Quick wins beyond the critical issues. These rewrites address secondary messaging gaps you
            can fix today while planning the bigger changes above.
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
                <a
                  href="https://en.wikipedia.org/wiki/Advertising"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-xs font-normal text-gray-500 hover:text-gray-700 underline"
                >
                  Learn more →
                </a>
              </p>
              <p className="text-xs text-gray-600 mb-2">We transform vague claims into concrete proof:</p>
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
                {[
                  'Homepage headline alternatives',
                  'Subheadline and supporting copy',
                  'Button text that converts',
                  'Trust bar and proof point formats',
                  'Service page messaging templates',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="text-[var(--accent)]">→</span>
                    <span>{item}</span>
                  </li>
                ))}
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
            {isUnlocked && secondaryFindings.length > 0 ? (
              <div className="space-y-4">
                {secondaryFindings.slice(0, 5).map((finding) => (
                  <FindingCard key={finding.phrase} finding={finding} showCopyButton />
                ))}
              </div>
            ) : isUnlocked ? (
              <div className="p-6 bg-[var(--muted)] border-2 border-[var(--border)] rounded text-center">
                <p className="text-body text-[var(--muted-foreground)]">
                  All rewrites shown in previous sections.
                </p>
              </div>
            ) : (
              <LockedFindings onUnlock={onUnlock} isUnlocked={isUnlocked} />
            )}
          </div>
        </div>
      </section>
    </ViewNavBar>
  )
}
