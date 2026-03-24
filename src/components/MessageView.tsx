'use client'

import { ViewNavBar } from '@/components/ViewNavBar'
import { LockedFindings } from './LockedFindings'

type ViewNavItem = { id: 'overview' | 'message' | 'audience' | 'trust' | 'copy'; label: string; description: string } | null

type MessageViewProps = {
  isPaid: boolean
  showAllViews: boolean
  onUnlock: () => void
  prevView: ViewNavItem
  nextView: ViewNavItem
  onNavigate: (view: 'overview' | 'message' | 'audience' | 'trust' | 'copy') => void
}

export function MessageView({ isPaid, showAllViews, onUnlock, prevView, nextView, onNavigate }: MessageViewProps) {
  return (
    <>
      <ViewNavBar prevView={prevView} nextView={nextView} onNavigate={onNavigate} />

      {/* First Impression Analysis */}
      <section id="first-impression" className="section">
        <div className="container">
          <h2 className="text-section mb-6">First impression clarity</h2>

          <div className="methodology-box">
            <h3 className="text-subsection mb-2">The 5-second test</h3>
            <p className="text-body">
              Your prospects open 10 tabs. You have 5 seconds to answer: "Is this for me?" If they can't
              immediately see what you do, who you serve, and why you're different - they close the tab.
              This analysis applies the same framework I use with $5M+ manufacturing clients to diagnose
              exactly where that clarity breaks down.
            </p>
          </div>

          {(isPaid || showAllViews) ? (
          <>
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-subsection mb-4">What we found</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-[var(--success)]">✓</span>
                  <span><strong>What you do:</strong> Clear that you're a manufacturing company</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[var(--warning)]">⚠</span>
                  <span><strong>Who it's for:</strong> "Industrial clients" is too vague</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[var(--error)]">✗</span>
                  <span><strong>Why you're different:</strong> No clear differentiator visible</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[var(--warning)]">⚠</span>
                  <span><strong>What to do next:</strong> Button exists but generic</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[var(--success)]">✓</span>
                  <span><strong>Trust:</strong> Professional appearance builds credibility</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-subsection mb-4">What this means for you</h3>
              <p className="text-body mb-4">
                Visitors understand you're a manufacturer, but they can't immediately tell if you're
                right for <em>them</em> or why they should choose you over the next search result.
              </p>
              <p className="text-body">
                When a purchasing manager has 10 tabs open, generic messaging means you blend into the
                pile. They close your tab and move on to someone who speaks to their specific situation.
              </p>
            </div>
          </div>
          <div>
            <h3 className="text-subsection mb-4">What to do</h3>
            <ul className="action-list">
              <li>
                <span className="effort-tag effort-easy">🟢 Easy</span>
                <span>Rewrite your headline to include a specific outcome and audience segment</span>
              </li>
              <li>
                <span className="effort-tag effort-easy">🟢 Easy</span>
                <span>Add proof points (certifications, stats) to the top of your homepage</span>
              </li>
              <li>
                <span className="effort-tag effort-medium">🟡 Medium</span>
                <span>Replace stock imagery with photos of your actual facility and team</span>
              </li>
            </ul>
          </div>
          </>
          ) : (
            <LockedFindings onUnlock={onUnlock} />
          )}
        </div>
      </section>

      {/* Message Sequence Analysis */}
      <section id="message-sequence" className="section section-alt">
        <div className="container">
          <h2 className="text-section mb-6">The order of your message</h2>

          <div className="methodology-box">
            <h3 className="text-subsection mb-2">Why sequence matters</h3>
            <p className="text-body">
              Most industrial websites lead with "Our Services" or "Our Products." Wrong order. Prospects
              need to feel understood before they'll listen to your solution. The winning sequence:
              <strong> Pain → Outcome → Proof → Features → Next Step</strong>. This analysis reveals
              where your messaging breaks that sequence - and exactly how to fix it.
            </p>
          </div>

          {(isPaid || showAllViews) ? (
          <>
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-subsection mb-4">What we found</h3>
              <p className="text-body mb-4">
                Your homepage leads with features: "CNC Machining, Wire EDM, Swiss Screw Machining..."
                This is the pattern across most of your pages.
              </p>
              <p className="text-body mb-4">
                <strong>Current sequence:</strong> Features → Features → Contact Us
              </p>
              <p className="text-body">
                <strong>Effective sequence:</strong> Pain point → Outcome → Proof → Features → Next step
              </p>
            </div>
            <div>
              <h3 className="text-subsection mb-4">What this means for you</h3>
              <p className="text-body mb-4">
                Leading with features assumes visitors already know they need CNC machining and are
                comparison shopping. But many prospects are earlier in their journey - they have a
                problem and aren't sure how to solve it.
              </p>
              <p className="text-body">
                By leading with their problem ("parts that keep failing inspection"), you demonstrate
                understanding before proving capability. This builds connection and trust.
              </p>
            </div>
          </div>
          <div>
            <h3 className="text-subsection mb-4">What to do</h3>
            <ul className="action-list">
              <li>
                <span className="effort-tag effort-easy">🟢 Easy</span>
                <span>Add a problem-focused subheading before your service list</span>
              </li>
              <li>
                <span className="effort-tag effort-medium">🟡 Medium</span>
                <span>Restructure service pages: outcome headline, proof, then capability details</span>
              </li>
              <li>
                <span className="effort-tag effort-medium">🟡 Medium</span>
                <span>Create a "Problems we solve" section that speaks to customer pain points</span>
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
