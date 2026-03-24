'use client'

import { ViewNavBar } from '@/components/ViewNavBar'
import { LockedFindings } from './LockedFindings'

type TrustItem = {
  signal: string
  present: boolean
  visible: string
  quality: string
  action: string
}

type ViewNavItem = { id: 'overview' | 'message' | 'audience' | 'trust' | 'copy'; label: string; description: string } | null

type TrustViewProps = {
  isPaid: boolean
  showAllViews: boolean
  onUnlock: () => void
  prevView: ViewNavItem
  nextView: ViewNavItem
  onNavigate: (view: 'overview' | 'message' | 'audience' | 'trust' | 'copy') => void
  trustInventory: TrustItem[]
}

export function TrustView({ isPaid, showAllViews, onUnlock, prevView, nextView, onNavigate, trustInventory }: TrustViewProps) {
  return (
    <>
      <ViewNavBar prevView={prevView} nextView={nextView} onNavigate={onNavigate} />

      {/* Trust Inventory */}
      <section id="trust" className="section section-alt">
        <div className="container">
          <h2 className="text-section mb-6">Your proof points</h2>

          <div className="methodology-box">
            <h3 className="text-subsection mb-2">The proof inventory</h3>
            <p className="text-body">
              You have proof. Certifications. Track records. Customer wins. But is it visible where it
              matters? I see this constantly: companies bury their best proof on About pages nobody reads.
              This analysis maps every proof point on your site and shows where to surface them for maximum impact.
            </p>
          </div>

          {(isPaid || showAllViews) ? (
          <>
          <div className="overflow-x-auto mb-8">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Signal type</th>
                  <th>Present?</th>
                  <th>Where</th>
                  <th>Quality</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {trustInventory.map((item) => (
                  <tr key={item.signal}>
                    <td className="font-semibold">{item.signal}</td>
                    <td>{item.present ? '✓' : '✗'}</td>
                    <td>{item.visible}</td>
                    <td>
                      <span className={
                        item.quality === 'good' ? 'text-[var(--success)]' :
                        item.quality === 'moderate' ? 'text-[var(--warning)]' :
                        item.quality === 'weak' ? 'text-[var(--warning)]' :
                        'text-[var(--error)]'
                      }>
                        {item.quality}
                      </span>
                    </td>
                    <td>{item.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="callout callout-warning mb-8">
            <h3 className="text-subsection mb-2">Critical gap</h3>
            <p className="text-body">
              Case studies are the most effective trust builder for B2B services. They show you've
              solved problems like theirs. Developing 2-3 detailed case studies with measurable
              results should be a top priority.
            </p>
          </div>

          <div>
            <h3 className="text-subsection mb-4">What to do</h3>
            <ul className="action-list">
              <li>
                <span className="effort-tag effort-easy">🟢 Easy</span>
                <span>Create a credibility strip on the homepage: client logos, cert badges, key stat</span>
              </li>
              <li>
                <span className="effort-tag effort-medium">🟡 Medium</span>
                <span>Develop 2-3 case studies with specific problems, solutions, and results</span>
              </li>
              <li>
                <span className="effort-tag effort-easy">🟢 Easy</span>
                <span>Add a "By the numbers" section: years in business, parts produced, clients served</span>
              </li>
            </ul>
          </div>
          </>
          ) : (
            <LockedFindings onUnlock={onUnlock} />
          )}
        </div>
      </section>

      {/* Button Journey */}
      <section id="buttons" className="section">
        <div className="container">
          <h2 className="text-section mb-6">Getting visitors to take action</h2>

          <div className="methodology-box">
            <h3 className="text-subsection mb-2">The decision funnel</h3>
            <p className="text-body">
              "Request a Quote" on your homepage? You're asking someone who just met you to make a
              commitment. That's like proposing on a first date. This analysis maps every call-to-action
              on your site against where visitors actually are in their decision process - and shows
              you what actions to offer at each stage.
            </p>
          </div>

          {(isPaid || showAllViews) ? (
          <>
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-subsection mb-4">What we found</h3>
              <p className="text-body mb-4">
                Your main button everywhere is "Contact Us." This is high-commitment for someone
                who just landed on your site.
              </p>
              <ul className="space-y-2 text-body">
                <li><strong>Homepage:</strong> Contact Us</li>
                <li><strong>Services:</strong> Contact Us</li>
                <li><strong>About:</strong> Contact Us</li>
                <li><strong>Footer:</strong> Contact Us</li>
              </ul>
              <p className="text-body mt-4">
                No middle-ground options for visitors who aren't ready to talk but want to learn more.
              </p>
            </div>
            <div>
              <h3 className="text-subsection mb-4">What this means for you</h3>
              <p className="text-body mb-4">
                "Contact Us" asks for commitment before you've built trust. Visitors who aren't
                ready to talk - but might be great fits - have no way to stay engaged.
              </p>
              <p className="text-body">
                Result: You only capture prospects who are already ready to buy. Everyone else leaves.
              </p>
            </div>
          </div>
          <div>
            <h3 className="text-subsection mb-4">What to do</h3>
            <ul className="action-list">
              <li>
                <span className="effort-tag effort-easy">🟢 Easy</span>
                <span>Rewrite your main button: "Get a quote in 24 hours" (sets expectation)</span>
              </li>
              <li>
                <span className="effort-tag effort-easy">🟢 Easy</span>
                <span>Add a secondary button: "See our capabilities" or "View case studies"</span>
              </li>
              <li>
                <span className="effort-tag effort-medium">🟡 Medium</span>
                <span>Create a low-commitment offer: downloadable guide, sample request, facility tour video</span>
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
