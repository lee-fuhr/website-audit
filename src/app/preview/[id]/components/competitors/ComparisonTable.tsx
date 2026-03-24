'use client'

import { PreviewData } from '../types'

interface CategoryScores {
  firstImpression: number
  differentiation: number
  customerClarity: number
  storyStructure: number
  trustSignals: number
  buttonClarity: number
}

interface ComparisonTableProps {
  preview: PreviewData
  hostname: string
  detailedScores: Array<{
    url: string
    score: number
    categoryScores?: CategoryScores
  }>
}

export function ComparisonTable({ preview, hostname, detailedScores }: ComparisonTableProps) {
  const categoryKeys: (keyof CategoryScores)[] = [
    'firstImpression',
    'differentiation',
    'customerClarity',
    'storyStructure',
    'trustSignals',
    'buttonClarity',
  ]

  const cellClass = (val: number) =>
    `text-center p-4 font-bold text-lg ${
      val >= 7 ? 'bg-green-100 text-green-700' : val >= 4 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
    }`

  const compCellClass = (val: number) =>
    `text-center p-4 font-semibold ${
      val >= 7 ? 'bg-green-100 text-green-700' : val >= 4 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
    }`

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full border-2 border-[var(--border)] rounded-lg">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-300">
              <th className="text-left p-4 font-bold sticky left-0 bg-gray-100 z-10 min-w-[140px]">
                Site
              </th>
              <th className="text-center p-4 font-bold min-w-[80px]">Overall</th>
              <th className="text-center p-4 font-bold text-sm min-w-[70px]">
                First
                <br />
                Impr.
              </th>
              <th className="text-center p-4 font-bold text-sm min-w-[70px]">
                Differ-
                <br />
                ent.
              </th>
              <th className="text-center p-4 font-bold text-sm min-w-[70px]">
                Customer
                <br />
                Clarity
              </th>
              <th className="text-center p-4 font-bold text-sm min-w-[70px]">Story</th>
              <th className="text-center p-4 font-bold text-sm min-w-[70px]">Trust</th>
              <th className="text-center p-4 font-bold text-sm min-w-[70px]">Buttons</th>
            </tr>
          </thead>
          <tbody>
            {/* Your row */}
            <tr className="bg-blue-50 border-b-4 border-blue-600">
              <td className="p-4 font-bold sticky left-0 bg-blue-50 z-10">
                {hostname}
                <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded ml-2">YOU</span>
              </td>
              <td className="text-center p-4">
                <span
                  className={`text-2xl font-bold ${
                    (preview?.commodityScore || 50) >= 70
                      ? 'text-[var(--score-excellent)]'
                      : (preview?.commodityScore || 50) >= 40
                      ? 'text-[var(--score-good)]'
                      : 'text-[var(--score-poor)]'
                  }`}
                >
                  {preview?.commodityScore || 50}
                </span>
              </td>
              {preview?.categoryScores ? (
                <>
                  {categoryKeys.map((key, idx) => (
                    <td key={idx} className={cellClass(preview.categoryScores![key])}>
                      {preview.categoryScores![key]}
                    </td>
                  ))}
                </>
              ) : (
                <td colSpan={6} className="text-center text-gray-500 p-4">
                  N/A
                </td>
              )}
            </tr>

            {/* Competitor rows */}
            {detailedScores.map((comp) => {
              const compDomain = comp.url
                .replace(/^https?:\/\//, '')
                .replace(/\/$/, '')
                .split('/')[0]
              return (
                <tr key={comp.url} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-4 font-mono text-sm sticky left-0 bg-white hover:bg-gray-50 z-10">
                    {compDomain}
                  </td>
                  <td className="text-center p-4">
                    <span
                      className={`text-xl font-bold ${
                        comp.score >= 70
                          ? 'text-[var(--score-excellent)]'
                          : comp.score >= 40
                          ? 'text-[var(--score-good)]'
                          : 'text-[var(--score-poor)]'
                      }`}
                    >
                      {comp.score}
                    </span>
                  </td>
                  {comp.categoryScores ? (
                    <>
                      {categoryKeys.map((key, idx) => (
                        <td key={idx} className={compCellClass(comp.categoryScores![key])}>
                          {comp.categoryScores![key]}
                        </td>
                      ))}
                    </>
                  ) : (
                    <td colSpan={6} className="text-center text-xs text-gray-400 p-4">
                      Basic scoring only
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="flex gap-4 mt-3 text-xs">
        <span>
          <span className="inline-block w-3 h-3 bg-green-100 border border-green-600 rounded mr-1" />
          7-10 = Strong
        </span>
        <span>
          <span className="inline-block w-3 h-3 bg-yellow-100 border border-yellow-600 rounded mr-1" />
          4-6 = Needs work
        </span>
        <span>
          <span className="inline-block w-3 h-3 bg-red-100 border border-red-600 rounded mr-1" />
          0-3 = Critical
        </span>
      </div>
    </>
  )
}
