'use client'

import Link from 'next/link'
import { ViewType } from './types'
import { viewIcons } from './ViewIcons'

interface View {
  id: ViewType
  label: string
}

interface SideNavigationProps {
  views: View[]
  currentView: ViewType
  companyName: string
  hostname: string
  isUnlocked: boolean
  mobileMenuOpen: boolean
  onViewChange: (view: ViewType) => void
  onMobileMenuToggle: () => void
  onDownloadPDF: () => void
}

export function SideNavigation({
  views,
  currentView,
  companyName,
  hostname,
  isUnlocked,
  mobileMenuOpen,
  onViewChange,
  onMobileMenuToggle,
  onDownloadPDF,
}: SideNavigationProps) {
  return (
    <>
      {/* Desktop sticky sidebar */}
      <nav className="hidden lg:block print:!hidden fixed top-0 left-0 w-64 h-screen bg-[var(--accent)] text-white p-8 overflow-y-auto z-40 flex flex-col">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-wider opacity-60 mb-1">Audit for</p>
          <button
            onClick={() => onViewChange('overview')}
            className="font-semibold text-lg text-left hover:underline w-full capitalize"
          >
            {companyName}
          </button>
          <p className="text-xs opacity-60 font-mono mt-1">{hostname}</p>
        </div>
        <ul className="space-y-1 flex-1">
          {views.map((view) => (
            <li key={view.id}>
              <button
                onClick={() => onViewChange(view.id)}
                className={`w-full text-left py-3 px-4 text-sm transition-all flex items-center gap-3 ${
                  currentView === view.id
                    ? 'bg-white/20 font-semibold'
                    : 'opacity-70 hover:opacity-100 hover:bg-white/10'
                }`}
              >
                {viewIcons[view.id]}
                {view.label}
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-auto pt-8 border-t border-white/20 print:hidden space-y-2">
          <div className="relative group">
            {isUnlocked ? (
              <button
                onClick={onDownloadPDF}
                className="w-full py-3 px-4 text-sm bg-white text-[var(--accent)] font-semibold transition-all flex items-center justify-center gap-2 opacity-100 cursor-pointer hover:bg-white/90"
              >
                📄 Download PDF
              </button>
            ) : (
              <>
                <button className="w-full py-3 px-4 text-sm bg-white/10 transition-all flex items-center justify-center gap-2 opacity-60 cursor-default">
                  🔒 Download PDF
                </button>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Included with full purchase
                </div>
              </>
            )}
          </div>
          <Link
            href="/"
            className="block w-full py-3 px-4 text-sm text-white/70 hover:text-white transition-all text-center"
          >
            Analyze another site →
          </Link>
        </div>
      </nav>

      {/* Mobile navigation header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[var(--accent)] text-white px-4 py-3 flex items-center justify-between print:hidden">
        <div>
          <p className="text-xs opacity-60">Audit for</p>
          <p className="font-semibold capitalize">{companyName}</p>
        </div>
        <button
          onClick={onMobileMenuToggle}
          className="p-2 hover:bg-white/10 rounded transition-colors"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 print:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => onViewChange(currentView)}
          />
          <nav className="absolute top-[52px] left-0 right-0 bg-[var(--accent)] text-white max-h-[calc(100vh-52px)] overflow-y-auto">
            <ul className="py-2">
              {views.map((view) => (
                <li key={view.id}>
                  <button
                    onClick={() => onViewChange(view.id)}
                    className={`w-full text-left py-4 px-6 text-base transition-all flex items-center gap-3 ${
                      currentView === view.id ? 'bg-white/20 font-semibold' : 'hover:bg-white/10'
                    }`}
                  >
                    {viewIcons[view.id]}
                    {view.label}
                    {currentView === view.id && (
                      <span className="ml-auto text-xs opacity-70">Current</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
            <div className="border-t border-white/20 p-4 space-y-3">
              {isUnlocked && (
                <button
                  onClick={() => {
                    onDownloadPDF()
                    onMobileMenuToggle()
                  }}
                  className="w-full py-3 px-4 text-sm bg-white text-[var(--accent)] font-semibold rounded transition-all"
                >
                  📄 Download PDF
                </button>
              )}
              <Link
                href="/"
                className="block w-full py-3 px-4 text-sm text-white/70 hover:text-white transition-all text-center"
                onClick={onMobileMenuToggle}
              >
                Analyze another site →
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  )
}
