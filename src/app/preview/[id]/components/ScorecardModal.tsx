'use client'

import { ViewType, PreviewData } from './types'
import { scoreCategories } from './preview-utils'

interface ScorecardModalProps {
  openScorecard: string | null
  preview: PreviewData
  onClose: () => void
  onNavigate: (view: ViewType) => void
}

const breakdowns: Record<string, { factors: string[]; insight: string }> = {
  firstImpression: {
    factors: [
      'Headline clarity and specificity',
      'Value proposition visibility',
      'Industry/customer identification speed',
      'Visual hierarchy guiding attention',
    ],
    insight:
      'Your homepage headline and opening section need to immediately answer "what do you do?" and "is this for me?" Most visitors decide in under 5 seconds.',
  },
  differentiation: {
    factors: [
      'Unique claims vs. competitor language',
      'Specific proof points used',
      'Commodity phrase frequency',
      'Competitive positioning statements',
    ],
    insight:
      "When you sound like everyone else, buyers compare on price. Your differentiators likely exist - they're just buried or unstated.",
  },
  customerClarity: {
    factors: [
      'Ideal customer description specificity',
      'Industry/vertical mentions',
      'Problem/pain point articulation',
      'Customer language vs. company language',
    ],
    insight:
      "Speaking to \"everyone\" means connecting with no one. Your best customers should feel like you're speaking directly to them.",
  },
  storyStructure: {
    factors: [
      'Problem → Solution narrative arc',
      'Customer journey acknowledgment',
      'Emotional vs. logical appeal balance',
      'Story coherence across pages',
    ],
    insight:
      "Most sites lead with features. Winning sites lead with the customer's problem, then position themselves as the guide to solving it.",
  },
  trustSignals: {
    factors: [
      'Social proof visibility and placement',
      'Quantified results and metrics',
      'Third-party validation (certifications, awards)',
      'Case study and testimonial depth',
    ],
    insight:
      "Trust signals exist on most sites - they're just buried. Moving proof to visible locations dramatically increases conversion.",
  },
  buttonClarity: {
    factors: [
      'CTA specificity and value proposition',
      'Commitment level appropriateness',
      'Next step clarity for visitor',
      'Multiple commitment-level options',
    ],
    insight:
      '"Contact Us" assumes visitors are ready to talk. Many aren\'t. Offering lower-commitment options captures leads who need more time.',
  },
}

const viewMap: Record<string, ViewType> = {
  firstImpression: 'message',
  differentiation: 'audience',
  customerClarity: 'audience',
  storyStructure: 'message',
  trustSignals: 'trust',
  buttonClarity: 'trust',
}

const categoryVariance: Record<string, number> = {
  firstImpression: 0,
  differentiation: -1,
  customerClarity: 1,
  storyStructure: -1,
  trustSignals: 1,
  buttonClarity: 0,
}

export function ScorecardModal({ openScorecard, preview, onClose, onNavigate }: ScorecardModalProps) {
  if (!openScorecard) return null

  const cat = scoreCategories.find((c) => c.key === openScorecard)
  if (!cat) return null

  const aiScore = preview?.categoryScores?.[cat.key as keyof typeof preview.categoryScores]
  const baseScore = Math.round((preview?.commodityScore || 50) / 12.5)
  const variance = categoryVariance[cat.key] || 0
  const score =
    aiScore !== undefined
      ? Math.max(1, Math.min(10, aiScore))
      : Math.max(1, Math.min(10, baseScore + variance))
  const color = score >= 7 ? 'excellent' : score >= 5 ? 'moderate' : 'poor'
  const label = score >= 7 ? 'Strong' : score >= 5 ? 'Needs work' : 'Critical'
  const targetView = viewMap[cat.key] || 'message'
  const breakdown = breakdowns[cat.key] || { factors: [], insight: '' }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`p-6 ${
            color === 'excellent'
              ? 'bg-green-600'
              : color === 'moderate'
              ? 'bg-amber-500'
              : 'bg-red-600'
          }`}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/70 mb-1">
                {cat.label}
              </p>
              <p className="text-sm text-white/80">{cat.question}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white text-2xl leading-none"
            >
              ×
            </button>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-5xl font-bold text-white">{score}</span>
            <span className="text-xl text-white/60">/10</span>
            <span className="text-sm font-semibold text-white ml-auto">{label}</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full mt-4">
            <div className="h-full bg-white rounded-full" style={{ width: `${score * 10}%` }} />
          </div>
        </div>

        <div className="p-6">
          <h4 className="font-bold text-[var(--foreground)] mb-3">How we calculated this</h4>
          <ul className="space-y-2 mb-6">
            {breakdown.factors.map((factor) => (
              <li key={factor} className="flex items-start gap-2 text-sm text-[var(--muted-foreground)]">
                <span className="text-[var(--accent)]">→</span>
                {factor}
              </li>
            ))}
          </ul>

          <div className="p-4 bg-[var(--muted)] rounded mb-6">
            <p className="text-sm text-[var(--foreground)]">
              <strong>What this means:</strong> {breakdown.insight}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                onClose()
                onNavigate(targetView)
              }}
              className="flex-1 bg-[var(--accent)] text-white px-4 py-3 font-semibold hover:opacity-90 transition-opacity text-sm"
            >
              See detailed findings →
            </button>
            <button
              onClick={onClose}
              className="px-4 py-3 border-2 border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--accent)] transition-colors text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
