interface TimedOutStateProps {
  analysisId: string | null
  onKeepWaiting: () => void
  onCheckAnyway: () => void
}

export function TimedOutState({ analysisId, onKeepWaiting, onCheckAnyway }: TimedOutStateProps) {
  return (
    <main className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="w-20 h-20 bg-yellow-500/20 flex items-center justify-center mx-auto mb-6 rounded-full">
          <span className="text-4xl">⏱️</span>
        </div>
        <h1 className="text-section text-2xl text-[var(--foreground)] mb-4">
          Taking longer than expected
        </h1>
        <p className="text-body mb-4">
          This analysis is taking longer than usual. The site may be large or have complex content.
        </p>
        <p className="text-body text-[var(--muted-foreground)] mb-6">
          Bookmark this page and check back in a few minutes - we&apos;ll keep working in the background.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={onKeepWaiting}
            className="bg-[var(--accent)] text-white px-6 py-3 font-semibold hover:opacity-90 transition-opacity"
          >
            Keep waiting
          </button>
          <button
            onClick={onCheckAnyway}
            className="text-[var(--accent)] px-6 py-2 font-medium hover:underline"
          >
            Check results anyway →
          </button>
        </div>
      </div>
    </main>
  )
}
