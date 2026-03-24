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

interface TrustViewProps {
  preview: PreviewData
  isUnlocked: boolean
  prevView: View | null
  nextView: View | null
  onNavigate: (view: ViewType) => void
  onUnlock: () => void
}

export function TrustView({
  preview,
  isUnlocked,
  prevView,
  nextView,
  onNavigate,
  onUnlock,
}: TrustViewProps) {
  const proofPointFindings = getFindingsForSection(preview.topIssues, 'proofPoints')
  const ctaFindings = getFindingsForSection(preview.topIssues, 'ctas')

  return (
    <ViewNavBar prevView={prevView} nextView={nextView} onNavigate={onNavigate}>
      <section className="section">
        <div className="container">
          <h2 className="text-section mb-6">Your proof points</h2>
          <div className="methodology-box">
            <h3 className="text-subsection mb-2">The proof inventory</h3>
            <p className="text-body">
              You have proof. Certifications. Track records. Customer wins. But is it visible where it
              matters? Companies constantly bury their best proof on About pages nobody reads.
            </p>
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded">
              <p className="text-sm font-bold text-gray-800 mb-2">
                Framework: Trust hierarchy
                <a
                  href="https://en.wikipedia.org/wiki/Social_proof"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-xs font-normal text-gray-500 hover:text-gray-700 underline"
                >
                  Learn more →
                </a>
              </p>
              <p className="text-xs text-gray-600 mb-2">
                We evaluate credibility signals in order of impact:
              </p>
              <ol className="text-xs text-gray-600 space-y-1 ml-4 list-decimal">
                <li>Third-party proof (certifications, awards, client logos)</li>
                <li>Social proof (testimonials, case studies, usage stats)</li>
                <li>Transparency (team bios, pricing clarity, guarantees)</li>
              </ol>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-subsection mb-4">What we found</h3>
              <p className="text-body mb-4">
                Your trust signals exist but aren&apos;t positioned for maximum impact.
              </p>
              <ul className="space-y-2 text-body">
                <li className="flex items-start gap-2">
                  <span className="text-[var(--accent)]">→</span>
                  Certifications buried in footer or About page
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--accent)]">→</span>
                  Testimonials hidden or absent from homepage
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--accent)]">→</span>
                  No quantified results or metrics visible
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-subsection mb-4">What this means for you</h3>
              <p className="text-body">
                Visitors need to trust you before they&apos;ll contact you. When proof is hidden, they
                either leave or treat you as a commodity - comparing on price alone.
              </p>
            </div>
          </div>
          <div>
            <h3 className="text-subsection mb-4">What to do</h3>
            {isUnlocked && proofPointFindings.length > 0 ? (
              <div className="space-y-4">
                {proofPointFindings.slice(0, 5).map((finding) => (
                  <FindingCard key={finding.phrase} finding={finding} showCopyButton />
                ))}
              </div>
            ) : isUnlocked ? (
              <div className="p-6 bg-[var(--muted)] border-2 border-[var(--border)] rounded text-center">
                <p className="text-body text-[var(--muted-foreground)]">
                  No trust signal findings in this audit.
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
          <h2 className="text-section mb-6">Getting visitors to take action</h2>
          <div className="methodology-box">
            <h3 className="text-subsection mb-2">The decision funnel</h3>
            <p className="text-body">
              &quot;Request a Quote&quot; on your homepage? You&apos;re asking someone who just met you to make a
              commitment. That&apos;s like proposing on a first date.
            </p>
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded">
              <p className="text-sm font-bold text-gray-800 mb-2">
                Framework: Micro-commitment ladder
                <a
                  href="https://en.wikipedia.org/wiki/Purchase_funnel"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-xs font-normal text-gray-500 hover:text-gray-700 underline"
                >
                  Learn more →
                </a>
              </p>
              <p className="text-xs text-gray-600 mb-2">
                We score CTAs by commitment level vs visitor trust:
              </p>
              <ol className="text-xs text-gray-600 space-y-1 ml-4 list-decimal">
                <li>Low barrier: "See examples", "Watch demo" (appropriate early)</li>
                <li>Medium: "Download guide", "Get pricing" (after some trust)</li>
                <li>High: "Request quote", "Schedule call" (homepage = friction)</li>
              </ol>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-subsection mb-4">What we found</h3>
              <p className="text-body mb-4">
                Your calls-to-action are high-commitment without building trust first.
              </p>
              <p className="text-body">
                Generic &quot;Contact Us&quot; buttons everywhere with no lower-commitment options for visitors
                who aren&apos;t ready to talk yet.
              </p>
            </div>
            <div>
              <h3 className="text-subsection mb-4">What this means for you</h3>
              <p className="text-body">
                You only capture prospects who are already ready to buy. Everyone else - including
                great fits who need more time - has no way to stay engaged.
              </p>
            </div>
          </div>
          <div>
            <h3 className="text-subsection mb-4">What to do</h3>
            {isUnlocked && ctaFindings.length > 0 ? (
              <div className="space-y-4">
                {ctaFindings.slice(0, 5).map((finding) => (
                  <FindingCard key={finding.phrase} finding={finding} showCopyButton />
                ))}
              </div>
            ) : isUnlocked ? (
              <div className="p-6 bg-[var(--muted)] border-2 border-[var(--border)] rounded text-center">
                <p className="text-body text-[var(--muted-foreground)]">
                  No CTA findings in this audit.
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
