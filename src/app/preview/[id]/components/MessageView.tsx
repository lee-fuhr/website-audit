'use client'

import { ViewNavBar } from '@/components/ViewNavBar'
import { safeClipboardWrite } from '@/lib/utils'
import { LockedFindings } from './LockedFindings'
import { createTextFragmentUrl, getFindingsForSection } from './preview-utils'
import { Finding, PreviewData, ViewType } from './types'

interface View {
  id: ViewType
  label: string
  description?: string
}

interface MessageViewProps {
  preview: PreviewData
  isUnlocked: boolean
  prevView: View | null
  nextView: View | null
  onNavigate: (view: ViewType) => void
  onUnlock: () => void
}

export function MessageView({
  preview,
  isUnlocked,
  prevView,
  nextView,
  onNavigate,
  onUnlock,
}: MessageViewProps) {
  const positioningFindings = getFindingsForSection(preview.topIssues, 'positioning')
  const valuePropsFindings = getFindingsForSection(preview.topIssues, 'valueProps')

  return (
    <ViewNavBar prevView={prevView} nextView={nextView} onNavigate={onNavigate}>
      <section className="section">
        <div className="container">
          <h2 className="text-section mb-6">First impression clarity</h2>
          <div className="methodology-box">
            <h3 className="text-subsection mb-2">The 5-second test</h3>
            <p className="text-body mb-4">
              Your prospects open 10 tabs. You have 5 seconds to answer: &quot;Is this for me?&quot; If they can&apos;t
              immediately see what you do, who you serve, and why you&apos;re different - they close the tab.
            </p>
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded">
              <p className="text-sm font-bold text-gray-800 mb-2">
                Framework: StoryBrand clarity filter
                <a
                  href="https://en.wikipedia.org/wiki/Donald_Miller_(author)"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-xs font-normal text-gray-500 hover:text-gray-700 underline"
                >
                  Learn more →
                </a>
              </p>
              <p className="text-xs text-gray-600 mb-2">
                We measure how quickly visitors can answer these questions:
              </p>
              <ol className="text-xs text-gray-600 space-y-1 ml-4 list-decimal">
                <li>What do you offer?</li>
                <li>How will it make my life better?</li>
                <li>What do I need to do to buy it?</li>
              </ol>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-subsection mb-4">What we found</h3>
              <ul className="space-y-3">
                {preview.topIssues.slice(0, 3).map((issue) => (
                  <li key={issue.title} className="flex items-start gap-3">
                    <span
                      className={
                        issue.severity === 'critical'
                          ? 'text-[var(--error)]'
                          : issue.severity === 'warning'
                          ? 'text-[var(--warning)]'
                          : 'text-[var(--success)]'
                      }
                    >
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
                When a visitor lands on your site, they&apos;re deciding in seconds whether you&apos;re worth their
                time. The issues above are causing friction that costs you leads.
              </p>
              <p className="text-body text-[var(--muted-foreground)]">
                The full audit breaks down exactly how to fix each one with copy you can paste.
              </p>
            </div>
          </div>
          <div>
            <h3 className="text-subsection mb-4">What to do</h3>
            {positioningFindings.length > 0 ? (
              <div className="space-y-4">
                {positioningFindings.slice(0, 5).map((finding) => (
                  <FindingCardInline
                    key={finding.phrase}
                    finding={finding}
                    showCopyButton
                  />
                ))}
                <p className="text-sm text-[var(--accent)] font-medium">More fixes in the full audit →</p>
              </div>
            ) : preview.teaserFinding ? (
              <FindingCardInline finding={preview.teaserFinding} showCopyButton={false} />
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
              Most industrial websites lead with &quot;Our Services&quot; or &quot;Our Products.&quot; Wrong order.
              Prospects need to feel understood before they&apos;ll listen to your solution. The winning
              sequence: <strong> Pain → Outcome → Proof → Features → Next Step</strong>.
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
                comparison shopping. Many prospects are earlier in their journey - they have a problem
                and aren&apos;t sure how to solve it.
              </p>
            </div>
          </div>
          <div>
            <h3 className="text-subsection mb-4">What to do</h3>
            {isUnlocked && valuePropsFindings.length > 0 ? (
              <div className="space-y-4">
                {valuePropsFindings.slice(0, 5).map((finding) => (
                  <FindingCardInline key={finding.phrase} finding={finding} showCopyButton />
                ))}
              </div>
            ) : isUnlocked ? (
              <div className="p-6 bg-[var(--muted)] border-2 border-[var(--border)] rounded text-center">
                <p className="text-body text-[var(--muted-foreground)]">
                  No message structure findings in this audit.
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

// Inline finding card — the full FindingCard component in components/ is for
// sections that always show copy button. Here we need the conditional copy button
// behaviour that differs in the teaser vs. full-unlock contexts.
function FindingCardInline({
  finding,
  showCopyButton,
}: {
  finding: Finding
  showCopyButton: boolean
}) {
  return (
    <div className="border-2 border-[var(--border)] rounded-lg overflow-hidden">
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-3 h-3"
                >
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
            <p className="text-xs font-bold text-[var(--score-excellent)]">✓ REWRITE</p>
            {showCopyButton && (
              <button
                onClick={async () => {
                  await safeClipboardWrite(finding.rewrite)
                }}
                className="text-xs px-2 py-0.5 bg-white border border-green-300 rounded hover:bg-green-100 transition-colors text-green-700 font-medium"
              >
                Copy
              </button>
            )}
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
  )
}
