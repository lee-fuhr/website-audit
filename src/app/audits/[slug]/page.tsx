'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { ScoreModal } from '@/components/ScoreModal'
import { AuditFooter } from '@/components/AuditFooter'
import { AuditOverviewView } from './components/AuditOverviewView'
import { AuditMessageView } from './components/AuditMessageView'
import { AuditAudienceView } from './components/AuditAudienceView'
import { AuditTrustView } from './components/AuditTrustView'
import { AuditCopyView } from './components/AuditCopyView'
import { auditData } from './auditData'

type ViewType = 'overview' | 'message' | 'audience' | 'trust' | 'copy'

// View icons (Streamline-style, 1px stroke, placed after labels)
const viewIcons: Record<ViewType, React.ReactNode> = {
  overview: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  message: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  ),
  audience: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  trust: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  copy: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
}

const views = [
  {
    id: 'overview' as ViewType,
    label: 'Overview',
    description: 'Your action plan and scores at a glance',
  },
  {
    id: 'message' as ViewType,
    label: 'Your message',
    description: 'How clearly you communicate what you do and why it matters',
  },
  {
    id: 'audience' as ViewType,
    label: 'Your audience',
    description: 'Who you\'re speaking to and how you compare to alternatives',
  },
  {
    id: 'trust' as ViewType,
    label: 'Building trust',
    description: 'Proof points and getting visitors to take action',
  },
  {
    id: 'copy' as ViewType,
    label: 'Copy to use',
    description: 'Ready-to-paste text you can implement today',
  },
]

// Constants
const FREE_ACTION_LIMIT = 5

export default function AuditPage() {
  const [activeModal, setActiveModal] = useState<keyof typeof auditData.scores | null>(null)
  const [expandedAction, setExpandedAction] = useState<number | null>(1) // First action expanded by default
  const [currentView, setCurrentView] = useState<ViewType>('overview')
  const [isPrintMode, setIsPrintMode] = useState(false)
  const [isPaid, setIsPaid] = useState(false) // Access control - will check URL/session in production

  // Check for paid access via URL param (e.g., ?access=paid-xxx)
  // In production, this would verify against a backend/Stripe
  const checkAccess = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      return params.get('access')?.startsWith('paid-') || false
    }
    return false
  }

  // Initialize paid status
  useState(() => {
    setIsPaid(checkAccess())
  })

  // Handle unlock click - redirect to checkout
  const handleUnlock = () => {
    window.plausible?.('Unlock Clicked', { props: { company: auditData.company } })
    // In production: redirect to Stripe checkout with audit ID
    window.location.href = `/checkout?audit=${auditData.slug}`
  }

  const easyWins = auditData.actions.filter(a => a.effort === 'easy')

  // Tab keyboard navigation refs
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  // Handle view changes with scroll to top
  const handleViewChange = (view: ViewType) => {
    setCurrentView(view)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    window.plausible?.('View Changed', { props: { view } })
  }

  // Roving tabindex keyboard handler for sidebar tab navigation
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

  // Handle PDF download - renders all content then prints
  const handlePrintPDF = () => {
    window.plausible?.('PDF Downloaded', { props: { company: auditData.company } })
    setIsPrintMode(true)
    // Wait for render, then print
    setTimeout(() => {
      window.print()
      setIsPrintMode(false)
    }, 100)
  }

  // Handle score card click with tracking
  const handleScoreCardClick = (key: string) => {
    const scoreKey = key as keyof typeof auditData.scores
    setActiveModal(scoreKey)
    window.plausible?.('Score Card Clicked', { props: { category: auditData.scores[scoreKey].label } })
  }

  // Handle action expansion with tracking
  const handleActionExpand = (priority: number) => {
    const newState = expandedAction === priority ? null : priority
    setExpandedAction(newState)
    if (newState !== null) {
      const action = auditData.actions.find(a => a.priority === priority)
      window.plausible?.('Action Expanded', { props: { action: action?.title || `Priority ${priority}` } })
    }
  }

  // Get current view index for prev/next navigation
  const currentViewIndex = views.findIndex(v => v.id === currentView)
  const prevView = currentViewIndex > 0 ? views[currentViewIndex - 1] : null
  const nextView = currentViewIndex < views.length - 1 ? views[currentViewIndex + 1] : null

  // In print mode, show all views
  const showAllViews = isPrintMode

  return (
    <main className="min-h-screen bg-[var(--background)]">
      {/* Sticky TOC */}
      <nav aria-label="Audit sections" className="hidden lg:block print:!hidden fixed top-0 left-0 w-64 h-screen bg-[var(--accent)] text-white p-8 overflow-y-auto z-40 flex flex-col">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-wider opacity-60 mb-1">Audit for</p>
          <button
            onClick={() => handleViewChange('overview')}
            className="font-semibold text-lg text-left hover:underline w-full"
          >
            {auditData.company}
          </button>
        </div>
        <ul role="tablist" aria-orientation="vertical" className="space-y-1 flex-1">
          {views.map((view, index) => {
            const isLocked = view.id !== 'overview' && !isPaid
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
                  {isLocked ? <span className="text-xs opacity-60">🔒</span> : viewIcons[view.id]}
                  {view.label}
                </button>
              </li>
            )
          })}
        </ul>
        <div className="mt-auto pt-8 border-t border-white/20 print:hidden">
          {isPaid ? (
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
          ) : (
            <div className="relative group">
              <button
                className="w-full py-3 px-4 text-sm bg-white/10 transition-all flex items-center justify-center gap-2 opacity-60 cursor-default"
              >
                🔒 Download PDF
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Included with full purchase
              </div>
            </div>
          )}
          <Link
            href="/"
            className="block mt-4 text-center text-xs opacity-50 hover:opacity-80 transition-opacity"
          >
            Analyze another site →
          </Link>
        </div>
      </nav>

      {/* Main content - offset for TOC */}
      <div className="lg:ml-64 print:!ml-0">
        {/* Header */}
        <header className="border-b-4 border-[var(--accent)] py-8 md:py-12">
          <div className="container">
            <p className="text-label mb-2">WEBSITE MESSAGING AUDIT</p>
            <h1 className="text-display mb-4">{auditData.company}</h1>
            <div className="flex flex-wrap gap-4 text-[var(--muted-foreground)]">
              <span>{auditData.date}</span>
              <span>·</span>
              <span>Prepared by Lee Fuhr</span>
              <span>·</span>
              <span className="font-mono">{auditData.url}</span>
            </div>
          </div>
        </header>

        {/* OVERVIEW VIEW */}
        {(showAllViews || currentView === 'overview') && (
          <AuditOverviewView
            isPaid={isPaid}
            showAllViews={showAllViews}
            onUnlock={handleUnlock}
            onViewChange={handleViewChange}
            expandedAction={expandedAction}
            onActionExpand={handleActionExpand}
            onScoreCardClick={handleScoreCardClick}
            views={views}
            viewIcons={viewIcons}
            actions={auditData.actions}
            scores={auditData.scores}
            suggestedHeadlines={auditData.suggestedHeadlines}
            trustBarCopy={auditData.trustBarCopy}
            customerDefinition={auditData.customerDefinition}
            whyUsCopy={auditData.whyUsCopy}
            caseStudyTemplate={auditData.caseStudyTemplate}
            buttonAlternatives={auditData.buttonAlternatives}
            freeActionLimit={FREE_ACTION_LIMIT}
          />
        )}

        {/* Score Modal - always available */}
        {activeModal && (
          <ScoreModal
            scoreData={auditData.scores[activeModal]}
            onClose={() => setActiveModal(null)}
          />
        )}

        {/* MESSAGE VIEW */}
        {(showAllViews || currentView === 'message') && (
          <AuditMessageView
            isPaid={isPaid}
            showAllViews={showAllViews}
            onUnlock={handleUnlock}
            prevView={prevView}
            nextView={nextView}
            onNavigate={handleViewChange}
          />
        )}

        {/* AUDIENCE VIEW */}
        {(showAllViews || currentView === 'audience') && (
          <AuditAudienceView
            isPaid={isPaid}
            showAllViews={showAllViews}
            onUnlock={handleUnlock}
            prevView={prevView}
            nextView={nextView}
            onNavigate={handleViewChange}
            competitors={auditData.competitors}
          />
        )}

        {/* TRUST VIEW */}
        {(showAllViews || currentView === 'trust') && (
          <AuditTrustView
            isPaid={isPaid}
            showAllViews={showAllViews}
            onUnlock={handleUnlock}
            prevView={prevView}
            nextView={nextView}
            onNavigate={handleViewChange}
            trustInventory={auditData.trustInventory}
          />
        )}

        {/* COPY VIEW */}
        {(showAllViews || currentView === 'copy') && (
          <AuditCopyView
            isPaid={isPaid}
            showAllViews={showAllViews}
            onUnlock={handleUnlock}
            prevView={prevView}
            nextView={nextView}
            onNavigate={handleViewChange}
            beforeAfter={auditData.beforeAfter}
            easyWins={easyWins}
          />
        )}

        <AuditFooter />
      </div>
    </main>
  )
}
