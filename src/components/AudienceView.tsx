'use client'

import { ViewNavBar } from '@/components/ViewNavBar'
import { LockedFindings } from './LockedFindings'

type Competitor = {
  name: string
  positioning: string
  strength: string
  weakness: string
}

type ViewNavItem = { id: 'overview' | 'message' | 'audience' | 'trust' | 'copy'; label: string; description: string } | null

type AudienceViewProps = {
  isPaid: boolean
  showAllViews: boolean
  onUnlock: () => void
  prevView: ViewNavItem
  nextView: ViewNavItem
  onNavigate: (view: 'overview' | 'message' | 'audience' | 'trust' | 'copy') => void
  competitors: Competitor[]
}

export function AudienceView({ isPaid, showAllViews, onUnlock, prevView, nextView, onNavigate, competitors }: AudienceViewProps) {
  return (
    <>
      <ViewNavBar prevView={prevView} nextView={nextView} onNavigate={onNavigate} />

      {/* Ideal Customer Clarity */}
      <section id="customer" className="section">
        <div className="container">
          <h2 className="text-section mb-6">Who you're really for</h2>

          <div className="methodology-box">
            <h3 className="text-subsection mb-2">The "more of these" principle</h3>
            <p className="text-body">
              Think of your best customers - the ones who pay on time, don't nickel-and-dime you,
              and refer others. Your website should speak directly to <em>that</em> company. When
              you write for everyone, you connect with no one. This analysis identifies who your
              site is currently attracting - and whether that matches who you actually want.
            </p>
          </div>

          {(isPaid || showAllViews) ? (
          <>
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-subsection mb-4">What we found</h3>
              <p className="text-body mb-4">
                Your site speaks to "industrial clients" and "companies in aerospace, automotive,
                medical, and more." This is everyone - which means it's no one.
              </p>
              <div className="callout mt-4">
                <p className="text-body">
                  <strong>The tell:</strong> When I look at your testimonials and case studies,
                  85% are from medical device companies. But your homepage doesn't mention medical
                  devices once.
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-subsection mb-4">What this means for you</h3>
              <p className="text-body mb-4">
                A medical device engineer looking for a machining partner sees "aerospace, automotive,
                medical" and wonders if you really understand their world - FDA documentation, biocompatibility
                requirements, the stakes of a failed part.
              </p>
              <p className="text-body">
                Meanwhile, your competitors who explicitly focus on medical devices feel like a safer bet,
                even if you're actually better.
              </p>
            </div>
          </div>
          <div>
            <h3 className="text-subsection mb-4">What to do</h3>
            <ul className="action-list">
              <li>
                <span className="effort-tag effort-medium">🟡 Medium</span>
                <span>Define your ideal customer: company type, size, situation, what makes them your best fit</span>
              </li>
              <li>
                <span className="effort-tag effort-medium">🟡 Medium</span>
                <span>Rewrite your homepage to speak primarily to medical device manufacturers</span>
              </li>
              <li>
                <span className="effort-tag effort-hard">🔴 Hard</span>
                <span>Create industry-specific landing pages with tailored messaging for each vertical</span>
              </li>
            </ul>
          </div>
          </>
          ) : (
            <LockedFindings onUnlock={onUnlock} />
          )}
        </div>
      </section>

      {/* Differentiator Test */}
      <section id="differentiator" className="section section-alt">
        <div className="container">
          <h2 className="text-section mb-6">The differentiator test</h2>

          <div className="methodology-box">
            <h3 className="text-subsection mb-2">The "how the hell" question</h3>
            <p className="text-body">
              What would make your competitors ask: "How the hell did they do that?" Not aspirational
              claims - operational realities. The 12-year average tenure. The 0.02% defect rate.
              The custom fixturing. This analysis hunts for the proof you already have but aren't
              using - and shows you exactly where to put it.
            </p>
          </div>

          {(isPaid || showAllViews) ? (
          <>
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-subsection mb-4">What we found</h3>
              <p className="text-body mb-4">
                Your current differentiators are: "quality," "service," "trusted partner," and "on-time delivery."
              </p>
              <p className="text-body mb-4">
                <strong>The problem:</strong> Every manufacturing website uses these exact words. They're table
                stakes, not differentiators. When everyone claims quality, no one's claim means anything.
              </p>
              <div className="callout callout-warning mt-4">
                <p className="text-body">
                  <strong>Hidden on your About page:</strong> "Our average machinist has been with us 12 years."
                  That's a differentiator. Most shops have high turnover. This belongs on your homepage.
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-subsection mb-4">What this means for you</h3>
              <p className="text-body mb-4">
                When your messaging sounds like everyone else's, buyers compare on the only remaining
                variable: price. Your differentiation exists - it's just buried or unstated.
              </p>
              <p className="text-body">
                The goal isn't to invent differentiation. It's to surface what's already true about
                your business and make it visible.
              </p>
            </div>
          </div>
          <div>
            <h3 className="text-subsection mb-4">What to do</h3>
            <ul className="action-list">
              <li>
                <span className="effort-tag effort-medium">🟡 Medium</span>
                <span>Answer: What would make competitors say "how the hell do they do that?"</span>
              </li>
              <li>
                <span className="effort-tag effort-easy">🟢 Easy</span>
                <span>Surface hidden proof points (team tenure, defect rates, reorder rates) to homepage</span>
              </li>
              <li>
                <span className="effort-tag effort-medium">🟡 Medium</span>
                <span>Replace every "quality" and "service" mention with specific, provable claims</span>
              </li>
            </ul>
          </div>
          </>
          ) : (
            <LockedFindings onUnlock={onUnlock} />
          )}
        </div>
      </section>

      {/* Competitor Messaging Matrix */}
      <section id="competitors" className="section">
        <div className="container">
          <h2 className="text-section mb-6">Competitor messaging comparison</h2>

          <div className="methodology-box">
            <h3 className="text-subsection mb-2">Finding the white space</h3>
            <p className="text-body">
              If everyone claims "quality" and "service," those words mean nothing. I analyzed your
              three closest competitors to find what they're <em>not</em> saying - the position nobody's
              claimed. That's where you win. This analysis shows exactly where the opening is.
            </p>
          </div>

          {(isPaid || showAllViews) ? (
          <>
          <div className="overflow-x-auto mb-8">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Competitor</th>
                  <th>Their positioning</th>
                  <th>Strength</th>
                  <th>Weakness</th>
                </tr>
              </thead>
              <tbody>
                {competitors.map((comp) => (
                  <tr key={comp.name}>
                    <td className="font-semibold">{comp.name}</td>
                    <td>{comp.positioning}</td>
                    <td className="text-[var(--success)]">{comp.strength}</td>
                    <td className="text-[var(--error)]">{comp.weakness}</td>
                  </tr>
                ))}
                <tr className="bg-[var(--muted)]">
                  <td className="font-semibold">You (currently)</td>
                  <td>Broad capability, quality</td>
                  <td className="text-[var(--success)]">Professional appearance</td>
                  <td className="text-[var(--error)]">No clear differentiation</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="callout mb-8">
            <h3 className="text-subsection mb-2">💡 Opportunity spotted</h3>
            <p className="text-body">
              No competitor is claiming the "partnership" position - the long-term relationship angle.
              Your 12-year average machinist tenure and high customer retention rate could own this
              space: "The shop that becomes part of your team."
            </p>
          </div>

          <div>
            <h3 className="text-subsection mb-4">What to do</h3>
            <ul className="action-list">
              <li>
                <span className="effort-tag effort-medium">🟡 Medium</span>
                <span>Claim the "partnership/stability" position that competitors aren't using</span>
              </li>
              <li>
                <span className="effort-tag effort-hard">🔴 Hard</span>
                <span>Consider a "How we compare" page that addresses the competitive landscape directly</span>
              </li>
            </ul>
          </div>
          </>
          ) : (
            <LockedFindings onUnlock={onUnlock} />
          )}
        </div>
      </section>
    </>
  )
}
