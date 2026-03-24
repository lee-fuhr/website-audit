'use client'

import { getScoreColorClass } from '../preview-utils'

interface CategoryScores {
  firstImpression: number
  differentiation: number
  customerClarity: number
  storyStructure: number
  trustSignals: number
  buttonClarity: number
}

interface CompetitorInsightCardProps {
  competitor: {
    url: string
    score: number
    strengths?: string[]
    weaknesses?: string[]
    categoryScores?: CategoryScores
  }
  yourScore: number
  yourCategoryScores?: CategoryScores
}

export function CompetitorInsightCard({
  competitor,
  yourScore,
  yourCategoryScores,
}: CompetitorInsightCardProps) {
  const gap = competitor.score - yourScore
  const isAhead = gap > 0
  const compDomain = competitor.url.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0]

  const categoryNames: Record<string, string> = {
    firstImpression: 'first impression',
    differentiation: 'differentiation',
    customerClarity: 'customer clarity',
    storyStructure: 'story structure',
    trustSignals: 'trust signals',
    buttonClarity: 'button clarity',
  }
  const categoryActions: Record<string, { steal: string; attack: string }> = {
    firstImpression: {
      steal: 'Study their above-fold headline structure and value proposition placement',
      attack: 'Your hero section already communicates value faster - keep refining clarity',
    },
    differentiation: {
      steal: 'Analyze how they position against alternatives and claim unique territory',
      attack: "Your unique positioning is landing - double down on what makes you different",
    },
    customerClarity: {
      steal: 'Note how they describe their ideal customer and speak to specific pain points',
      attack: "You already speak to your customer specifically - keep that focus sharp",
    },
    storyStructure: {
      steal: 'Map their narrative arc - problem → solution → transformation flow',
      attack:
        'Your story flow is stronger - consider adding more customer transformation moments',
    },
    trustSignals: {
      steal: 'Catalog their proof points: specifics numbers, names, logos, testimonials',
      attack: "You have stronger proof - make sure it's visible above the fold",
    },
    buttonClarity: {
      steal: 'Review their CTA language and button placement patterns',
      attack: 'Your CTAs are clearer - ensure consistency across all pages',
    },
  }

  const renderOpportunity = () => {
    if (!competitor.categoryScores || !yourCategoryScores) {
      return (
        <div
          className={`p-4 rounded border-l-4 ${
            isAhead ? 'bg-amber-50 border-amber-600' : 'bg-blue-50 border-blue-600'
          }`}
        >
          <p
            className={`font-bold text-xs uppercase tracking-wider mb-1 ${
              isAhead ? 'text-amber-900' : 'text-blue-900'
            }`}
          >
            YOUR OPPORTUNITY
          </p>
          <p className={`text-sm ${isAhead ? 'text-amber-800' : 'text-blue-800'}`}>
            {isAhead
              ? `Visit ${compDomain} directly and note what makes their messaging effective.`
              : "You're ahead - keep refining what's already working."}
          </p>
        </div>
      )
    }

    const categories = Object.keys(competitor.categoryScores) as (keyof CategoryScores)[]
    let theirBest = categories[0]
    let yourBest = categories[0]
    let biggestGapCategory = categories[0]
    let biggestGapVal = 0

    categories.forEach((cat) => {
      const theirVal = competitor.categoryScores![cat] || 0
      const yourVal = yourCategoryScores[cat] || 0
      if (theirVal > (competitor.categoryScores![theirBest] || 0)) theirBest = cat
      if (yourVal > (yourCategoryScores[yourBest] || 0)) yourBest = cat
      if (theirVal - yourVal > biggestGapVal) {
        biggestGapVal = theirVal - yourVal
        biggestGapCategory = cat
      }
    })

    const theirBestName = categoryNames[theirBest] || theirBest
    const yourBestName = categoryNames[yourBest] || yourBest
    const actions = categoryActions[biggestGapCategory] || {
      steal: 'Analyze their approach',
      attack: 'Keep refining',
    }

    return (
      <div
        className={`p-4 rounded border-l-4 ${
          isAhead ? 'bg-amber-50 border-amber-600' : 'bg-blue-50 border-blue-600'
        }`}
      >
        <p
          className={`font-bold text-xs uppercase tracking-wider mb-2 ${
            isAhead ? 'text-amber-900' : 'text-blue-900'
          }`}
        >
          YOUR OPPORTUNITY
        </p>
        <div className={`text-sm space-y-2 ${isAhead ? 'text-amber-800' : 'text-blue-800'}`}>
          {isAhead ? (
            <>
              <p>
                <strong>Learn from them:</strong> They score highest on {theirBestName} (
                {competitor.categoryScores[theirBest]}/10). {actions.steal}.
              </p>
              {biggestGapVal > 2 && (
                <p>
                  <strong>Biggest gap:</strong> You&apos;re {biggestGapVal} points behind on{' '}
                  {categoryNames[biggestGapCategory] || biggestGapCategory}. This is your
                  highest-ROI improvement area.
                </p>
              )}
              <p>
                <strong>Your edge:</strong> You lead on {yourBestName} (
                {yourCategoryScores[yourBest]}/10) - don&apos;t lose this while catching up elsewhere.
              </p>
            </>
          ) : (
            <>
              <p>
                <strong>Your advantage:</strong> You lead on {yourBestName} (
                {yourCategoryScores[yourBest]}/10). {actions.attack}.
              </p>
              <p>
                <strong>Widen the gap:</strong> Keep your lead while addressing any areas where
                they&apos;re competitive.
              </p>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="border-2 border-gray-300 rounded-lg p-6 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-xl font-bold font-mono flex items-center gap-2">
          {compDomain}
          <a
            href={competitor.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Open competitor site"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path
                fillRule="evenodd"
                d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z"
                clipRule="evenodd"
              />
              <path
                fillRule="evenodd"
                d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z"
                clipRule="evenodd"
              />
            </svg>
          </a>
        </h4>
        <div className="text-right">
          <div className={`text-3xl font-bold ${getScoreColorClass(competitor.score)}`}>
            {competitor.score}/100
          </div>
          <div
            className={`text-sm font-semibold ${
              isAhead ? 'text-[var(--score-poor)]' : 'text-[var(--score-excellent)]'
            }`}
          >
            {isAhead ? `They're ahead +${gap}` : `You're ahead +${Math.abs(gap)}`}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">✓</span>
            <h5 className="font-bold text-green-700 uppercase tracking-wide text-sm">
              What they do well
            </h5>
          </div>
          {competitor.strengths && competitor.strengths.length > 0 ? (
            <ul className="space-y-2">
              {competitor.strengths.map((strength) => (
                <li key={strength} className="text-sm bg-green-50 border-l-4 border-green-600 p-3 rounded">
                  {strength}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 italic">
              No standout strengths that apply to you
            </p>
          )}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">✗</span>
            <h5 className="font-bold text-red-700 uppercase tracking-wide text-sm">
              Where they&apos;re weak
            </h5>
          </div>
          {competitor.weaknesses && competitor.weaknesses.length > 0 ? (
            <ul className="space-y-2">
              {competitor.weaknesses.map((weakness) => (
                <li key={weakness} className="text-sm bg-red-50 border-l-4 border-red-600 p-3 rounded">
                  {weakness}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 italic">No notable weaknesses found</p>
          )}
        </div>
      </div>

      {renderOpportunity()}
    </div>
  )
}
