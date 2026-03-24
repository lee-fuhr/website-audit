'use client'

import { ViewNavBar } from '@/components/ViewNavBar'
import { FindingCard } from './FindingCard'
import { LockedFindings } from './LockedFindings'
import { getFindingsForSection } from './preview-utils'
import { PreviewData, ViewType } from './types'

interface View {
  id: ViewType
  label: string
  description?: string
}

interface AudienceViewProps {
  preview: PreviewData
  isUnlocked: boolean
  prevView: View | null
  nextView: View | null
  onNavigate: (view: ViewType) => void
  onUnlock: () => void
}

export function AudienceView({
  preview,
  isUnlocked,
  prevView,
  nextView,
  onNavigate,
  onUnlock,
}: AudienceViewProps) {
  const audienceFindings = getFindingsForSection(preview.topIssues, 'audience')
  const differentiatorFindings = getFindingsForSection(preview.topIssues, 'differentiators')

  return (
    <ViewNavBar prevView={prevView} nextView={nextView} onNavigate={onNavigate}>
      <section className="section">
        <div className="container">
          <h2 className="text-section mb-6">Who you&apos;re really for</h2>
          <div className="methodology-box">
            <h3 className="text-subsection mb-2">The &quot;more of these&quot; principle</h3>
            <p className="text-body mb-4">
              Think of your best customers - the ones who pay on time, don&apos;t nickel-and-dime you, and
              refer others. Your website should speak directly to <em>that</em> company. When you write
              for everyone, you connect with no one.
            </p>
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded">
              <p className="text-sm font-bold text-gray-800 mb-2">
                Framework: Jobs-to-be-done
                <a
                  href="https://en.wikipedia.org/wiki/Outcome-Driven_Innovation"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-xs font-normal text-gray-500 hover:text-gray-700 underline"
                >
                  Learn more →
                </a>
              </p>
              <p className="text-xs text-gray-600 mb-2">We look for language that addresses:</p>
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
                Your site speaks broadly to multiple audiences without clearly identifying your ideal
                customer.
              </p>
              <div className="callout mt-4">
                <p className="text-body">
                  <strong>The tell:</strong> Generic language like &quot;serving clients across
                  industries&quot; signals you haven&apos;t defined who you&apos;re really for.
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
            {isUnlocked && audienceFindings.length > 0 ? (
              <div className="space-y-4">
                {audienceFindings.slice(0, 5).map((finding) => (
                  <FindingCard key={finding.phrase} finding={finding} showCopyButton />
                ))}
              </div>
            ) : isUnlocked ? (
              <div className="p-6 bg-[var(--muted)] border-2 border-[var(--border)] rounded text-center">
                <p className="text-body text-[var(--muted-foreground)]">
                  No customer clarity findings in this audit.
                </p>
              </div>
            ) : (
              <LockedFindings onUnlock={onUnlock} isUnlocked={isUnlocked} />
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
                <strong>Common problem:</strong> Words like &quot;quality,&quot; &quot;service,&quot; and &quot;trusted
                partner&quot; are table stakes, not differentiators. When everyone claims quality, no
                one&apos;s claim means anything.
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
            {isUnlocked && differentiatorFindings.length > 0 ? (
              <div className="space-y-4">
                {differentiatorFindings.slice(0, 5).map((finding) => (
                  <FindingCard key={finding.phrase} finding={finding} showCopyButton />
                ))}
              </div>
            ) : isUnlocked ? (
              <div className="p-6 bg-[var(--muted)] border-2 border-[var(--border)] rounded text-center">
                <p className="text-body text-[var(--muted-foreground)]">
                  No differentiation findings in this audit.
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
