'use client'

interface PositioningMapProps {
  yourScore: number
  competitors: Array<{ url: string; score: number }>
}

export function PositioningMap({ yourScore, competitors }: PositioningMapProps) {
  const competitorAvg =
    competitors.length > 0
      ? Math.round(competitors.reduce((sum, c) => sum + c.score, 0) / competitors.length)
      : null

  const getInitials = (url: string) => {
    const domain = url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('.')[0]
    return domain.slice(0, 2).toUpperCase()
  }

  const getZoneName = (score: number) =>
    score < 40 ? 'Commodity' : score < 70 ? 'Average' : 'Differentiated'

  const getZoneColor = (score: number) =>
    score < 40 ? '#be123c' : score < 70 ? '#b45309' : '#059669'

  return (
    <div className="mb-8">
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="font-mono text-xs tracking-widest text-gray-400 uppercase mb-1">
            Your position
          </p>
          <div className="flex items-baseline gap-3">
            <span
              className="text-5xl font-black tracking-tight"
              style={{ fontFamily: 'var(--font-display)', color: '#1e3a5f' }}
            >
              {yourScore}
            </span>
            <span className="text-lg text-gray-400">/100</span>
          </div>
          <p
            className="text-sm mt-1"
            style={{ fontFamily: 'var(--font-body)', color: getZoneColor(yourScore) }}
          >
            {getZoneName(yourScore)} zone
          </p>
        </div>
        {competitorAvg !== null && (
          <div className="text-right">
            <p className="font-mono text-xs tracking-widest text-gray-400 uppercase mb-1">
              Competitor avg
            </p>
            <span
              className="text-3xl font-bold text-gray-400"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {competitorAvg}
            </span>
          </div>
        )}
      </div>

      <div className="relative">
        <div className="flex h-20 rounded-sm overflow-hidden border border-gray-200">
          <div className="relative bg-rose-50 border-r border-rose-200" style={{ width: '40%' }}>
            <span className="absolute top-2 left-3 font-mono text-[10px] tracking-widest uppercase text-rose-400">
              Commodity
            </span>
            <span className="absolute bottom-2 left-3 font-mono text-[10px] text-gray-300">0</span>
          </div>
          <div
            className="relative bg-amber-50/50 border-r border-amber-200"
            style={{ width: '30%' }}
          >
            <span className="absolute top-2 left-3 font-mono text-[10px] tracking-widest uppercase text-amber-400">
              Average
            </span>
            <span className="absolute bottom-2 left-3 font-mono text-[10px] text-gray-300">40</span>
          </div>
          <div className="relative bg-emerald-50" style={{ width: '30%' }}>
            <span className="absolute top-2 left-3 font-mono text-[10px] tracking-widest uppercase text-emerald-400">
              Differentiated
            </span>
            <span className="absolute bottom-2 left-3 font-mono text-[10px] text-gray-300">70</span>
            <span className="absolute bottom-2 right-3 font-mono text-[10px] text-gray-300">100</span>
          </div>
        </div>

        {/* Competitor markers */}
        {competitors.map((competitor, index) => (
          <div
            key={competitor.url}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group"
            style={{ left: `${competitor.score}%`, zIndex: 10 + index }}
          >
            <div className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white shadow-sm flex items-center justify-center cursor-default transition-transform hover:scale-110">
              <span className="font-mono text-[10px] font-medium text-gray-600">
                {getInitials(competitor.url)}
              </span>
            </div>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
              {competitor.url.replace(/^https?:\/\//, '').replace(/^www\./, '')} · {competitor.score}
            </div>
          </div>
        ))}

        {/* Average dashed line */}
        {competitorAvg !== null && (
          <div
            className="absolute top-0 bottom-0 w-px"
            style={{
              left: `${competitorAvg}%`,
              background:
                'repeating-linear-gradient(to bottom, #9ca3af 0, #9ca3af 4px, transparent 4px, transparent 8px)',
              zIndex: 5,
            }}
          >
            <span className="absolute top-full mt-1 left-1/2 -translate-x-1/2 font-mono text-[9px] text-gray-400 whitespace-nowrap">
              avg
            </span>
          </div>
        )}

        {/* Your score marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
          style={{ left: `${yourScore}%`, zIndex: 50 }}
        >
          <div
            className="absolute left-1/2 -translate-x-1/2 w-px bg-[#1e3a5f]"
            style={{ bottom: '100%', height: '20px' }}
          />
          <div
            className="absolute left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-widest font-bold px-2 py-0.5 rounded-sm"
            style={{ bottom: 'calc(100% + 24px)', backgroundColor: '#1e3a5f', color: 'white' }}
          >
            YOU
          </div>
          <div
            className="w-11 h-11 rounded-full border-4 border-white shadow-lg flex items-center justify-center"
            style={{ backgroundColor: '#1e3a5f' }}
          >
            <span
              className="text-base font-bold text-white"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {yourScore}
            </span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-8 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#1e3a5f' }} />
          <span className="font-mono text-xs text-gray-500">Your site</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gray-300 border border-gray-200" />
          <span className="font-mono text-xs text-gray-500">
            Competitors ({competitors.length})
          </span>
        </div>
        {competitorAvg !== null && (
          <div className="flex items-center gap-2">
            <div className="w-4 border-t-2 border-dashed border-gray-400" />
            <span className="font-mono text-xs text-gray-500">Avg: {competitorAvg}</span>
          </div>
        )}
      </div>
    </div>
  )
}
