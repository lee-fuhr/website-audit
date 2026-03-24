'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Footer } from '@/components/Footer'
import { formatCompanyName } from '@/lib/utils'
import { AnalysisResponse, ViewType } from './components/types'
import {
  baseViews,
  competitorsView,
  resourcesView,
} from './components/preview-utils'
import { PageHeader } from './components/PageHeader'
import { SideNavigation } from './components/SideNavigation'
import { OverviewView } from './components/OverviewView'
import { MessageView } from './components/MessageView'
import { AudienceView } from './components/AudienceView'
import { TrustView } from './components/TrustView'
import { CopyView } from './components/CopyView'
import { CompetitorsView } from './components/CompetitorsView'
import { ResourcesView } from './components/ResourcesView'
import { ScorecardModal } from './components/ScorecardModal'
import { downloadFullAuditPDF, downloadBriefPDF, downloadSwipePDF } from './components/PDFGenerators'

export default function PreviewPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isTestUnlocked = process.env.NODE_ENV === 'development' && searchParams.get('unlock') === 'test'
  const sessionId = searchParams.get('session_id')
  const [isPaid, setIsPaid] = useState(false)
  const isUnlocked = isTestUnlocked || isPaid
  const [data, setData] = useState<AnalysisResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [currentView, setCurrentView] = useState<ViewType>('overview')
  const [expandedIssue, setExpandedIssue] = useState<number | null>(0)
  const [openScorecard, setOpenScorecard] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Editable input fields
  const [editableUrl, setEditableUrl] = useState('')
  const [editableCompanyName, setEditableCompanyName] = useState('')
  const [editableEmail, setEditableEmail] = useState('')
  const [isRerunning, setIsRerunning] = useState(false)

  // Lead capture
  const [leadEmail, setLeadEmail] = useState('')
  const [leadCaptured, setLeadCaptured] = useState(false)
  const [leadLoading, setLeadLoading] = useState(false)

  // Always show competitors tab - we'll find them or prompt user
  const hasCompetitorData = !!(data?.competitorComparison && data.competitorComparison.detailedScores && data.competitorComparison.detailedScores.length > 0)
  // Resources view always visible (tease value to free users)
  const views = [...baseViews, competitorsView, resourcesView]

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        const response = await fetch(`/api/analyze?id=${params.id}`)
        const result = await response.json()
        if (result.success) {
          setData(result.analysis)
          setEditableUrl(result.analysis.url || '')
          setEditableCompanyName(result.analysis.preview?.siteSnapshot?.title || '')
          setEditableEmail(result.analysis.contactEmail || '')
          if (result.analysis.paid) {
            setIsPaid(true)
          }
        } else {
          setError(result.error || 'Failed to load results')
        }
      } catch {
        setError('Something went wrong. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchPreview()
  }, [params.id])

  // Verify Stripe payment when session_id is present in URL
  useEffect(() => {
    if (!sessionId || isPaid) return
    const verifyPayment = async () => {
      try {
        const res = await fetch('/api/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ analysisId: params.id, sessionId }),
        })
        const result = await res.json()
        if (result.paid) {
          setIsPaid(true)
          const dataRes = await fetch(`/api/analyze?id=${params.id}`)
          const dataResult = await dataRes.json()
          if (dataResult.success) {
            setData(dataResult.analysis)
          }
        }
      } catch {
        // Verification failed — user will see paywall, can contact support
      }
    }
    verifyPayment()
  }, [sessionId, params.id, isPaid])

  const handleRerun = useCallback(async () => {
    if (!editableUrl.trim()) return
    setIsRerunning(true)
    setError('')
    try {
      let normalizedUrl = editableUrl.trim()
      if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
        normalizedUrl = 'https://' + normalizedUrl
      }
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: normalizedUrl,
          companyName: editableCompanyName.trim() || undefined,
          contactEmail: editableEmail.trim() || undefined,
        }),
      })
      const result = await response.json()
      if (result.success) {
        router.push(`/processing?id=${result.analysisId}`)
      } else {
        setError(result.error || 'Failed to start new analysis.')
        setIsRerunning(false)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setIsRerunning(false)
    }
  }, [editableUrl, editableCompanyName, editableEmail, router])

  const handleCaptureLead = async () => {
    if (!leadEmail || !leadEmail.includes('@')) return
    setLeadLoading(true)
    try {
      const res = await fetch('/api/capture-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: leadEmail, analysisId: params.id, url: editableUrl }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        console.error('[preview] Lead capture failed', { status: res.status, error: data?.error, analysisId: params.id, timestamp: new Date().toISOString() })
        setError('Failed to save your email. Please try again.')
        return
      }
      setLeadCaptured(true)
    } catch (err) {
      console.error('[preview] Lead capture network error', { message: err instanceof Error ? err.message : String(err), analysisId: params.id, timestamp: new Date().toISOString() })
      setError('Failed to save your email. Please try again.')
    } finally {
      setLeadLoading(false)
    }
  }

  const handleUnlock = async () => {
    setIsCheckingOut(true)
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisId: params.id }),
      })
      const result = await response.json()
      if (result.success && result.checkoutUrl) {
        window.location.href = result.checkoutUrl
      } else {
        setError('Failed to start checkout. Please try again.')
        setIsCheckingOut(false)
      }
    } catch {
      setError('Failed to start checkout. Please try again.')
      setIsCheckingOut(false)
    }
  }

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const currentViewIndex = views.findIndex(v => v.id === currentView)
  const prevView = currentViewIndex > 0 ? views[currentViewIndex - 1] : null
  const nextView = currentViewIndex < views.length - 1 ? views[currentViewIndex + 1] : null

  const handleDownloadPDF = async () => {
    try {
      await downloadFullAuditPDF(preview, data!, hostname, companyName, hasCompetitorData)
    } catch (err) {
      console.error('PDF generation failed:', err)
      window.print()
    }
  }

  const handleDownloadBriefPDF = async () => {
    try {
      await downloadBriefPDF(preview, data!, hostname, hasCompetitorData)
    } catch (err) {
      console.error('Brief PDF generation failed:', err)
    }
  }

  const handleDownloadSwipePDF = async () => {
    try {
      await downloadSwipePDF(preview, hostname)
    } catch (err) {
      console.error('Swipe PDF generation failed:', err)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-body text-lg">Loading your report...</p>
        </div>
      </main>
    )
  }

  if (error || !data || !data.preview) {
    return (
      <main className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-6xl mb-4">⚠️</p>
          <h1 className="text-section text-2xl mb-4">Something went wrong</h1>
          <p className="text-body mb-8">{error || 'Unable to load your results.'}</p>
          <Link href="/" className="bg-[var(--accent)] text-white px-6 py-3 font-semibold hover:opacity-90 transition-opacity inline-block">
            Try again
          </Link>
        </div>
      </main>
    )
  }

  const preview = data.preview
  const hostname = (() => {
    try { return new URL(data.url).hostname.replace('www.', '') }
    catch { return data.url }
  })()
  const rawTitle = preview.siteSnapshot.title || ''
  const companyName = rawTitle && rawTitle.length > 2 && !rawTitle.toLowerCase().includes('home')
    ? rawTitle.split('|')[0].split('-')[0].split('–')[0].trim()
    : formatCompanyName(hostname)

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <SideNavigation
        views={views}
        currentView={currentView}
        companyName={companyName}
        hostname={hostname}
        isUnlocked={isUnlocked}
        mobileMenuOpen={mobileMenuOpen}
        onViewChange={handleViewChange}
        onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        onDownloadPDF={handleDownloadPDF}
      />

      <div className="lg:ml-64 print:!ml-0 pt-[52px] lg:pt-0">
        <PageHeader
          companyName={companyName}
          hostname={hostname}
          preview={preview}
          data={data}
        />

        {currentView === 'overview' && (
          <OverviewView
            preview={preview}
            data={data}
            hostname={hostname}
            isUnlocked={isUnlocked}
            isCheckingOut={isCheckingOut}
            expandedIssue={expandedIssue}
            leadEmail={leadEmail}
            leadLoading={leadLoading}
            leadCaptured={leadCaptured}
            prevView={prevView}
            nextView={nextView}
            onNavigate={handleViewChange}
            onExpandIssue={setExpandedIssue}
            onOpenScorecard={setOpenScorecard}
            onUnlock={handleUnlock}
            onLeadEmailChange={setLeadEmail}
            onLeadSubmit={handleCaptureLead}
          />
        )}

        {currentView === 'message' && (
          <MessageView
            preview={preview}
            isUnlocked={isUnlocked}
            prevView={prevView}
            nextView={nextView}
            onNavigate={handleViewChange}
            onUnlock={handleUnlock}
          />
        )}

        {currentView === 'audience' && (
          <AudienceView
            preview={preview}
            isUnlocked={isUnlocked}
            prevView={prevView}
            nextView={nextView}
            onNavigate={handleViewChange}
            onUnlock={handleUnlock}
          />
        )}

        {currentView === 'trust' && (
          <TrustView
            preview={preview}
            isUnlocked={isUnlocked}
            prevView={prevView}
            nextView={nextView}
            onNavigate={handleViewChange}
            onUnlock={handleUnlock}
          />
        )}

        {currentView === 'copy' && (
          <CopyView
            preview={preview}
            isUnlocked={isUnlocked}
            prevView={prevView}
            nextView={nextView}
            onNavigate={handleViewChange}
            onUnlock={handleUnlock}
          />
        )}

        {currentView === 'competitors' && (
          <CompetitorsView
            preview={preview}
            data={data}
            hostname={hostname}
            hasCompetitorData={hasCompetitorData}
            isUnlocked={isUnlocked}
            isCheckingOut={isCheckingOut}
            prevView={prevView}
            nextView={nextView}
            onNavigate={handleViewChange}
            onUnlock={handleUnlock}
          />
        )}

        {currentView === 'resources' && (
          <ResourcesView
            preview={preview}
            data={data}
            companyName={companyName}
            hostname={hostname}
            hasCompetitorData={hasCompetitorData}
            isUnlocked={isUnlocked}
            isCheckingOut={isCheckingOut}
            prevView={prevView}
            nextView={nextView}
            onNavigate={handleViewChange}
            onUnlock={handleUnlock}
            onDownloadSwipePDF={handleDownloadSwipePDF}
            onDownloadBriefPDF={handleDownloadBriefPDF}
          />
        )}

        <Footer />
      </div>

      {openScorecard && (
        <ScorecardModal
          openScorecard={openScorecard}
          preview={preview}
          onClose={() => setOpenScorecard(null)}
          onNavigate={handleViewChange}
        />
      )}
    </main>
  )
}
