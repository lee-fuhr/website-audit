'use client'

interface LeadCaptureSectionProps {
  leadEmail: string
  onEmailChange: (email: string) => void
  onSubmit: () => void
  leadLoading: boolean
  leadCaptured: boolean
}

export function LeadCaptureSection({
  leadEmail,
  onEmailChange,
  onSubmit,
  leadLoading,
  leadCaptured,
}: LeadCaptureSectionProps) {
  return (
    <section className="py-12 bg-[var(--muted)]">
      <div className="container">
        <div className="max-w-2xl mx-auto">
          {!leadCaptured ? (
            <>
              <p className="text-xs uppercase tracking-widest text-[var(--muted-foreground)] mb-2">Not ready to unlock yet?</p>
              <p className="text-xl font-bold mb-4">Save your audit link</p>
              <p className="text-[var(--muted-foreground)] mb-6">
                We&apos;ll email you a link to come back. No sales emails — just your link.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={leadEmail}
                  onChange={(e) => onEmailChange(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 bg-[var(--background)] border border-[var(--border)] px-4 py-3 text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
                />
                <button
                  onClick={onSubmit}
                  disabled={leadLoading || !leadEmail.includes('@')}
                  className="bg-[var(--foreground)] text-[var(--background)] px-6 py-3 font-bold text-sm uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  {leadLoading ? '...' : 'Send link'}
                </button>
              </div>
            </>
          ) : (
            <div className="border-l-4 border-[var(--accent)] pl-6">
              <p className="text-xl font-bold mb-2">Got it.</p>
              <p className="text-[var(--muted-foreground)]">Check your inbox — your audit link is on its way.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
