'use client'

import { ReactNode } from 'react'

interface ViewNavBarProps<T extends string> {
  prevView: { id: T; label: string; description?: string } | null
  nextView: { id: T; label: string; description?: string } | null
  onNavigate: (view: T) => void
  hideTopNav?: boolean
  children?: ReactNode
}

export function ViewNavBar<T extends string>({ prevView, nextView, onNavigate, children }: ViewNavBarProps<T>) {
  return (
    <>
      {/* Main Content */}
      {children}

      {/* Bottom Navigation - Big CTAs for prev/next */}
      {(prevView || nextView) && (
        <nav className="bg-gray-50 border-t border-gray-200 print:hidden">
          <div className="container py-8 md:py-12">
            <div className="max-w-3xl mx-auto flex gap-4">
              {/* Previous button */}
              {prevView ? (
                <button
                  onClick={() => onNavigate(prevView.id)}
                  className="flex-1 text-left p-6 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                >
                  <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">← Previous</p>
                  <h3 className="text-lg font-semibold mb-1">{prevView.label}</h3>
                  <p className="text-sm text-gray-600">{prevView.description || 'Previous section'}</p>
                </button>
              ) : <div className="flex-1" />}

              {/* Next button */}
              {nextView ? (
                <button
                  onClick={() => onNavigate(nextView.id)}
                  className="flex-1 text-left p-6 bg-[var(--accent)] text-white rounded hover:bg-[var(--accent)]/90 transition-colors"
                >
                  <p className="text-xs uppercase tracking-wider text-white/70 mb-2">Continue reading →</p>
                  <h3 className="text-lg font-semibold text-white mb-1">{nextView.label}</h3>
                  <p className="text-sm text-white/80">{nextView.description || 'Next section'}</p>
                </button>
              ) : <div className="flex-1" />}
            </div>
          </div>
        </nav>
      )}
    </>
  )
}
