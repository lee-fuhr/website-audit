'use client'

function getScoreColor(score: number): string {
  if (score >= 7) return 'excellent'
  if (score >= 5) return 'moderate'
  return 'poor'
}

function getScoreLabel(score: number): string {
  if (score >= 7) return 'Strong'
  if (score >= 5) return 'Needs work'
  return 'Critical gap'
}

type ScoreData = {
  score: number
  label: string
  question: string
  factors: { factor: string; score: number; max: number; note: string }[]
  evidence: string[]
  howToImprove: string[]
  suggestedCopy: string
}

export function ScoreModal({
  scoreData,
  onClose,
}: {
  scoreData: ScoreData
  onClose: () => void
}) {
  const color = getScoreColor(scoreData.score)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 md:p-10" onClick={onClose}>
      <div className="fixed inset-0 bg-black/60" />
      <div
        className="relative bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto border-4 border-[var(--accent)] rounded"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b-2 border-[var(--border)] p-8 md:p-10 z-20">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-[var(--muted-foreground)] hover:text-[var(--foreground)] text-3xl leading-none"
          >
            ×
          </button>
          <p className="text-label mb-3">{scoreData.label}</p>
          <div className="flex items-baseline gap-3">
            <span className={`text-5xl font-bold score-${color}`}>{scoreData.score}</span>
            <span className="text-xl text-[var(--muted-foreground)]">/10</span>
            <span className={`text-lg font-semibold score-${color}`}>{getScoreLabel(scoreData.score)}</span>
          </div>
          <p className="text-body mt-3 text-[var(--muted-foreground)]">{scoreData.question}</p>
        </div>

        <div className="p-8 md:p-10 space-y-8">
          {/* Scoring factors */}
          <div>
            <h3 className="text-subsection mb-4">How this score was calculated</h3>
            <div className="space-y-3">
              {scoreData.factors.map((f, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`font-mono font-bold ${f.score === f.max ? 'text-[var(--success)]' : f.score === 0 ? 'text-[var(--error)]' : 'text-[var(--warning)]'}`}>
                      {f.score}/{f.max}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold">{f.factor}</span>
                    <p className="text-sm text-[var(--muted-foreground)]">{f.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Evidence from their site */}
          <div>
            <h3 className="text-subsection mb-4">What we found on your site</h3>
            <ul className="space-y-2">
              {scoreData.evidence.map((e, i) => (
                <li key={i} className="flex items-start gap-2 text-body">
                  <span className="text-[var(--accent)]">→</span>
                  <span>{e}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* How to improve */}
          <div>
            <h3 className="text-subsection mb-4">How to improve this score</h3>
            <ol className="space-y-2 list-decimal list-inside">
              {scoreData.howToImprove.map((item, i) => (
                <li key={i} className="text-body">{item}</li>
              ))}
            </ol>
          </div>

          {/* Suggested copy */}
          <div className="bg-[var(--muted)] p-4 border-l-4 border-[var(--accent)]">
            <h3 className="text-subsection mb-2">Copy you can use</h3>
            <p className="text-body">{scoreData.suggestedCopy}</p>
          </div>
        </div>
        {/* Bottom fade indicator for scroll */}
        <div className="pointer-events-none sticky bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white via-white/80 to-transparent z-10" />
      </div>
    </div>
  )
}
