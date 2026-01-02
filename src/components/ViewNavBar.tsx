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
    <>
      {/* Top Navigation - hidden on desktop where sidebar is visible */}
      <nav className="bg-white border-b-2 border-gray-200 print:hidden lg:hidden shadow-sm">
        <div className="container py-3">
          <div className="flex items-center justify-between">
            {/* Previous */}
            <div className="flex-1">
              {prevView ? (
                <button
                  onClick={() => onNavigate(prevView.id)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-3 py-1.5 rounded hover:bg-gray-100"
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
                className="flex items-center gap-2 text-sm font-semibold text-[var(--accent)] hover:text-[var(--accent)]/80 transition-colors px-3 py-1.5 rounded hover:bg-gray-100"
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
                  className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-3 py-1.5 rounded hover:bg-gray-100"
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

      {/* Bottom Navigation */}
      {(prevView || nextView) && (
        <nav className="bg-gray-100 border-t-2 border-gray-300 print:hidden">
          <div className="container py-6 md:py-8">
            <div className="flex items-center justify-between gap-4">
              {/* Previous Button */}
              {prevView ? (
                <button
                  onClick={() => onNavigate(prevView.id)}
                  className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 rounded-lg text-sm font-semibold text-gray-700 transition-all flex-1 shadow-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M7.72 12.53a.75.75 0 010-1.06l7.5-7.5a.75.75 0 111.06 1.06L9.31 12l6.97 6.97a.75.75 0 11-1.06 1.06l-7.5-7.5z" clipRule="evenodd" />
                  </svg>
                  <span>{prevView.label}</span>
                </button>
              ) : <div className="flex-1" />}

              {/* Spacer */}
              <div className="flex-1" />

              {/* Next Button */}
              {nextView ? (
                <button
                  onClick={() => onNavigate(nextView.id)}
                  className="flex items-center gap-2 px-5 py-3 bg-[#0a0a0a] hover:bg-gray-800 rounded-lg text-sm font-semibold text-white transition-all flex-1 justify-end shadow-sm"
                >
                  <span>{nextView.label}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M16.28 11.47a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 01-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 011.06-1.06l7.5 7.5z" clipRule="evenodd" />
                  </svg>
                </button>
              ) : <div className="flex-1" />}
            </div>
          </div>
        </nav>
      )}
    </>
  )
}
