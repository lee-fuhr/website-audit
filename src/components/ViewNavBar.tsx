'use client'

interface ViewNavBarProps<T extends string> {
  prevView: { id: T; label: string } | null
  nextView: { id: T; label: string } | null
  onNavigate: (view: T) => void
}

export function ViewNavBar<T extends string>({ prevView, nextView, onNavigate }: ViewNavBarProps<T>) {
  // Don't show Overview in center if it's already shown in prev/next
  const showCenterOverview = prevView?.id !== 'overview' && nextView?.id !== 'overview'

  return (
    <nav className="bg-[#0a0a0a] text-white print:hidden">
      <div className="container py-2 md:py-3 lg:py-3">
        <div className="flex items-center justify-between">
          {/* Previous */}
          <div className="flex-1">
            {prevView ? (
              <button
                onClick={() => onNavigate(prevView.id)}
                className="flex items-center gap-2 text-sm hover:text-white/80 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M7.72 12.53a.75.75 0 010-1.06l7.5-7.5a.75.75 0 111.06 1.06L9.31 12l6.97 6.97a.75.75 0 11-1.06 1.06l-7.5-7.5z" clipRule="evenodd" />
                </svg>
                {prevView.label}
              </button>
            ) : <div />}
          </div>

          {/* Overview (center) - only show if not already in prev/next */}
          {showCenterOverview ? (
            <button
              onClick={() => onNavigate('overview' as T)}
              className="flex items-center gap-2 text-sm font-medium hover:text-white/80 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M11.47 7.72a.75.75 0 011.06 0l7.5 7.5a.75.75 0 11-1.06 1.06L12 9.31l-6.97 6.97a.75.75 0 01-1.06-1.06l7.5-7.5z" clipRule="evenodd" />
              </svg>
              Overview
            </button>
          ) : <div />}

          {/* Next */}
          <div className="flex-1 flex justify-end">
            {nextView ? (
              <button
                onClick={() => onNavigate(nextView.id)}
                className="flex items-center gap-2 text-sm hover:text-white/80 transition-colors"
              >
                {nextView.label}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M16.28 11.47a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 01-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 011.06-1.06l7.5 7.5z" clipRule="evenodd" />
                </svg>
              </button>
            ) : <div />}
          </div>
        </div>
      </div>
    </nav>
  )
}
