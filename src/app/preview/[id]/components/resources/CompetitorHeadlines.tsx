'use client'

import { PreviewData } from '../types'

interface CompetitorHeadlinesProps {
  preview: PreviewData
  hostname: string
  detailedScores: Array<{
    url: string
    score: number
    categoryScores?: {
      firstImpression: number
      differentiation: number
      customerClarity: number
      storyStructure: number
      trustSignals: number
      buttonClarity: number
    }
    headline?: string
  }>
}

export function CompetitorHeadlines({ preview, hostname, detailedScores }: CompetitorHeadlinesProps) {
  const formatCategoryName = (key: string) => {
    const name = key.replace(/([A-Z])/g, ' $1').trim()
    return name.charAt(0).toUpperCase() + name.slice(1)
  }

  const getBestWorst = (scores: Record<string, number>) => {
    const entries = Object.entries(scores) as [string, number][]
    const best = entries.sort((a, b) => b[1] - a[1])[0]
    const worst = entries.sort((a, b) => a[1] - b[1])[0]
    return { best, worst }
  }

  return (
    <div className="mb-12">
      <h3 className="text-subsection mb-4">Competitor headline comparison</h3>
      <p className="text-body text-[var(--muted-foreground)] mb-4">
        Side-by-side positioning. What are they saying vs. what are you saying?
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-2 border-gray-200 rounded-lg text-sm">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-300">
              <th className="text-left p-4 font-bold">Site</th>
              <th className="text-left p-4 font-bold">Headline</th>
              <th className="text-left p-4 font-bold">Score</th>
              <th className="text-left p-4 font-bold">Strongest area</th>
              <th className="text-left p-4 font-bold">Weakest area</th>
            </tr>
          </thead>
          <tbody>
            {/* Your row */}
            <tr className="bg-blue-50 border-b-2 border-blue-300">
              <td className="p-4 font-bold">
                {hostname}{' '}
                <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded ml-2">YOU</span>
              </td>
              <td
                className="p-4 italic text-gray-700 max-w-xs truncate"
                title={preview.siteSnapshot?.h1 || 'No H1 found'}
              >
                {preview.siteSnapshot?.h1
                  ? `"${preview.siteSnapshot.h1.length > 60 ? preview.siteSnapshot.h1.substring(0, 60) + '...' : preview.siteSnapshot.h1}"`
                  : '-'}
              </td>
              <td className="p-4 font-bold">{preview.commodityScore}</td>
              <td className="p-4">
                {preview.categoryScores &&
                  (() => {
                    const { best } = getBestWorst(preview.categoryScores)
                    return best ? `${formatCategoryName(best[0])} (${best[1]}/10)` : '-'
                  })()}
              </td>
              <td className="p-4">
                {preview.categoryScores &&
                  (() => {
                    const { worst } = getBestWorst(preview.categoryScores)
                    return worst ? `${formatCategoryName(worst[0])} (${worst[1]}/10)` : '-'
                  })()}
              </td>
            </tr>
            {/* Competitor rows */}
            {detailedScores.map((comp) => (
              <tr key={comp.url} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="p-4 font-mono">{comp.url.replace(/^https?:\/\//, '').split('/')[0]}</td>
                <td
                  className="p-4 italic text-gray-600 max-w-xs truncate"
                  title={comp.headline || 'No H1 found'}
                >
                  {comp.headline
                    ? `"${comp.headline.length > 60 ? comp.headline.substring(0, 60) + '...' : comp.headline}"`
                    : '-'}
                </td>
                <td className="p-4">{comp.score}</td>
                <td className="p-4">
                  {comp.categoryScores &&
                    (() => {
                      const { best } = getBestWorst(comp.categoryScores)
                      return best ? `${formatCategoryName(best[0])} (${best[1]}/10)` : '-'
                    })()}
                </td>
                <td className="p-4">
                  {comp.categoryScores &&
                    (() => {
                      const { worst } = getBestWorst(comp.categoryScores)
                      return worst ? `${formatCategoryName(worst[0])} (${worst[1]}/10)` : '-'
                    })()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
