interface ErrorStateProps {
  error: string
  onBack: () => void
}

export function ErrorState({ error, onBack }: ErrorStateProps) {
  return (
    <main className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="w-20 h-20 bg-red-500/20 flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">⚠️</span>
        </div>
        <h1 className="text-section text-2xl text-[var(--foreground)] mb-4">
          Something went wrong
        </h1>
        <p className="text-body mb-6">{error}</p>
        <button
          onClick={onBack}
          className="bg-[var(--accent)] text-white px-6 py-3 font-semibold hover:opacity-90 transition-opacity"
        >
          Try again
        </button>
      </div>
    </main>
  )
}
