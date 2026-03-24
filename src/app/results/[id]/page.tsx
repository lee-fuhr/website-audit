'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { FullResults, ViewType, views } from './components/types'
import { OverviewView } from './components/OverviewView'
import { PageAnalysisView } from './components/PageAnalysisView'
import { VoiceAnalysisView } from './components/VoiceAnalysisView'
import { ProofPointsView } from './components/ProofPointsView'
import { ResultsSkeleton } from '@/components/PageSkeleton'

export default function ResultsPage() {
  const params = useParams()
  const id = params?.id as string
  const router = useRouter()
  const [data, setData] = useState<FullResults | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentView, setCurrentView] = useState<ViewType>('overview')
  const [isPrintMode, setIsPrintMode] = useState(false)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    if (!id) return
    fetch(`/api/analyze?id=${id}`)
      .then(r => r.json())
      .then(res => {
        if (!res.success) {
          setError(res.error || 'Analysis not found')
          return
        }
        const state = res.analysis
        // PAYMENT_GATE_ENABLED: set to 'false' in env to bypass payment check (emergency debugging)
        const paymentGateEnabled = process.env.NEXT_PUBLIC_PAYMENT_GATE_ENABLED !== 'false'
        if (paymentGateEnabled && (!state.paid || !state.fullResults)) {
          router.replace(`/preview/${id}`)
          return
        }
        if (!paymentGateEnabled && !state.fullResults) {
          router.replace(`/preview/${id}`)
          return
        }
        setData(state.fullResults)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id, router])

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault()
      const nextIndex = (index + 1) % views.length
      tabRefs.current[nextIndex]?.focus()
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault()
      const prevIndex = (index - 1 + views.length) % views.length
      tabRefs.current[prevIndex]?.focus()
    } else if (e.key === 'Home') {
      e.preventDefault()
      tabRefs.current[0]?.focus()
    } else if (e.key === 'End') {
      e.preventDefault()
      tabRefs.current[views.length - 1]?.focus()
    }
  }

  const handlePrintPDF = () => {
    setIsPrintMode(true)
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.print()
      setIsPrintMode(false)
    }))
  }

  if (loading) {
    return (
      <main>
        <ResultsSkeleton />
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <p className="text-section mb-4">Error</p>
          <p className="text-body mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-[var(--accent)] text-white px-6 py-3 font-semibold hover:opacity-90 transition-opacity"
          >
            Start over
          </button>
        </div>
      </main>
    )
  }

  if (!data) return null

  const showAllViews = isPrintMode
  const currentViewIndex = views.findIndex(v => v.id === currentView)
  const prevView = currentViewIndex > 0 ? views[currentViewIndex - 1] : null
  const nextView = currentViewIndex < views.length - 1 ? views[currentViewIndex + 1] : null
  const currentYear = new Date().getFullYear()

  return (
    <main className="min-h-screen bg-[var(--background)]">
      {/* Sticky sidebar TOC */}
      <nav aria-label="Audit sections" className="hidden lg:block print:!hidden fixed top-0 left-0 w-64 h-screen bg-[var(--accent)] text-white p-8 overflow-y-auto z-40 flex flex-col">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-wider opacity-60 mb-1">Full audit</p>
          <button
            onClick={() => handleViewChange('overview')}
            className="font-semibold text-lg text-left hover:underline w-full"
          >
            Website Messaging Audit
          </button>
        </div>
        <ul role="tablist" aria-orientation="vertical" className="space-y-1 flex-1">
          {views.map((view, index) => {
            const isActive = currentView === view.id
            return (
              <li key={view.id} role="presentation">
                <button
                  ref={(el) => { tabRefs.current[index] = el }}
                  role="tab"
                  id={`tab-${view.id}`}
                  aria-selected={isActive}
                  aria-controls={`tabpanel-${view.id}`}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => handleViewChange(view.id)}
                  onKeyDown={(e) => handleTabKeyDown(e, index)}
                  className={`w-full text-left py-3 px-4 text-sm transition-all flex items-center gap-3 ${
                    isActive
                      ? 'bg-white/20 font-semibold'
                      : 'opacity-70 hover:opacity-100 hover:bg-white/10'
                  }`}
                >
                  {view.label}
                </button>
              </li>
            )
          })}
        </ul>
        <div className="mt-auto pt-8 border-t border-white/20 print:hidden">
          <button
            onClick={handlePrintPDF}
            className="w-full py-3 px-4 text-sm bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center gap-2"
          >
            Download PDF
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Main content */}
      <div className="lg:ml-64 print:!ml-0">
        {/* Header */}
        <header className="border-b-4 border-[var(--accent)] py-8 md:py-12">
          <div className="container">
            <p className="text-label mb-2">WEBSITE MESSAGING AUDIT — FULL REPORT</p>
            <h1 className="text-display mb-4">Full Audit Results</h1>
            <div className="flex flex-wrap gap-4 text-[var(--muted-foreground)]">
              <span>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              <span>&middot;</span>
              <span>Prepared by Lee Fuhr</span>
            </div>
          </div>
        </header>

        <OverviewView
          data={data}
          showAllViews={showAllViews}
          currentView={currentView}
          views={views}
          onViewChange={handleViewChange}
        />

        <PageAnalysisView
          data={data}
          showAllViews={showAllViews}
          currentView={currentView}
          prevView={prevView}
          nextView={nextView}
          onViewChange={handleViewChange}
        />

        <VoiceAnalysisView
          data={data}
          showAllViews={showAllViews}
          currentView={currentView}
          prevView={prevView}
          nextView={nextView}
          onViewChange={handleViewChange}
        />

        <ProofPointsView
          data={data}
          showAllViews={showAllViews}
          currentView={currentView}
          prevView={prevView}
          nextView={nextView}
          onViewChange={handleViewChange}
        />

        {/* Footer */}
        <footer className="bg-black text-white py-12 md:py-16">
          <div className="container">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4">About this audit</h3>
                <p className="opacity-90 mb-4">
                  This audit uses Lee Fuhr&apos;s proprietary messaging evaluation methodology, refined across
                  50+ B2B websites. It draws from proven frameworks including Emma Stratton&apos;s
                  story methodology and value-benefit-feature sequencing, adapted specifically
                  for mid-market manufacturers.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4">Questions?</h3>
                <p className="opacity-90 mb-4">
                  If something in this audit is unclear or you want to discuss a specific recommendation, I&apos;m happy to chat.
                </p>
                <p className="opacity-90">
                  <a href="mailto:hi@leefuhr.com" className="hover:underline">hi@leefuhr.com</a>
                </p>
                <p className="opacity-70 text-sm mt-4">
                  Lee Fuhr · <a href="https://leefuhr.com" className="hover:underline">leefuhr.com</a>
                </p>
              </div>
            </div>
            <div className="border-t border-white/20 mt-8 pt-8 text-sm">
              <p className="text-center opacity-70">
                &copy; {currentYear} Lee Fuhr Inc &middot; Website Messaging Audit
              </p>
            </div>
          </div>
        </footer>
      </div>
    </main>
  )
}
