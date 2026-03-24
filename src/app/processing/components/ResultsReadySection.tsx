interface ResultsReadySectionProps {
  pagesCrawled: number
  enrichmentStatus: string | null
  submittedCompetitors: string[]
  submittedSocials: string[]
  onReveal: () => void
}

export function ResultsReadySection({
  pagesCrawled,
  enrichmentStatus,
  submittedCompetitors,
  submittedSocials,
  onReveal,
}: ResultsReadySectionProps) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="max-w-xl w-full text-center">
        <div className="mb-8">
          <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-5xl">✓</span>
          </div>
          <h1 className="text-section text-4xl text-[var(--foreground)] mb-4">
            Results ready!
          </h1>
          <p className="text-body-lg text-[var(--muted-foreground)]">
            We scanned <strong>{pagesCrawled} pages</strong>
            {enrichmentStatus === 'complete' && submittedCompetitors.length > 0 && (
              <> + <strong>{submittedCompetitors.length} competitor{submittedCompetitors.length !== 1 ? 's' : ''}</strong></>
            )}
            {enrichmentStatus === 'complete' && submittedSocials.length > 0 && (
              <> + <strong>{submittedSocials.length} social profile{submittedSocials.length !== 1 ? 's' : ''}</strong></>
            )}
            {' '}and found messaging issues you can fix.
          </p>
          {enrichmentStatus === 'failed' && submittedCompetitors.length > 0 && (
            <p className="text-sm text-amber-600 mt-2">
              (Couldn&apos;t analyze {submittedCompetitors.join(', ')} - some sites block external access)
            </p>
          )}
        </div>

        <button
          onClick={onReveal}
          className="bg-[var(--accent)] text-white px-10 py-5 text-xl font-bold hover:opacity-90 transition-opacity mb-8"
        >
          Show me my results →
        </button>

        <p className="text-sm text-[var(--muted-foreground)]">
          Your free preview includes your commodity score, top priorities, and a sample of what we found.
        </p>
      </div>
    </div>
  )
}
