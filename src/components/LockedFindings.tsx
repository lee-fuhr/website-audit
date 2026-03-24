'use client'

export function LockedFindings({ onUnlock }: { onUnlock: () => void }) {
  return (
    <div className="my-6 p-6 bg-[var(--muted)] border-2 border-dashed border-[var(--border)] text-center">
      <div className="max-w-md mx-auto">
        <p className="text-sm font-medium text-[var(--foreground)] mb-1">
          Detailed findings locked
        </p>
        <p className="text-sm text-[var(--muted-foreground)] mb-4">
          Includes what we found on your site, what it means, and specific copy you can use.
        </p>
        <button
          onClick={onUnlock}
          className="bg-[var(--accent)] text-white px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Unlock full audit for $400 →
        </button>
      </div>
    </div>
  )
}

export function LockedOverlay({ onUnlock }: { onUnlock: () => void }) {
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/80 to-white z-10 flex items-end justify-center pb-8">
        <div className="text-center max-w-md">
          <p className="text-lg font-semibold mb-2">Unlock the full audit</p>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">
            Get all fixes, deep-dive analysis, and a PDF you can share with your team.
          </p>
          <button
            onClick={onUnlock}
            className="bg-[var(--accent)] text-white px-6 py-3 font-semibold hover:opacity-90 transition-opacity"
          >
            Unlock for $400 →
          </button>
          <p className="text-xs text-[var(--muted-foreground)] mt-4">
            You've seen the preview. No refunds after purchase.
          </p>
        </div>
      </div>
      <div className="blur-sm pointer-events-none select-none" aria-hidden="true">
        <div className="h-48 bg-[var(--muted)] p-6">
          <div className="h-4 bg-[var(--border-subtle)] rounded w-3/4 mb-3" />
          <div className="h-4 bg-[var(--border-subtle)] rounded w-1/2 mb-3" />
          <div className="h-4 bg-[var(--border-subtle)] rounded w-2/3" />
        </div>
      </div>
    </div>
  )
}
