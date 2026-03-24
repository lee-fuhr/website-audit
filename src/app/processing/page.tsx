'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { processingStyles } from './processing-styles'
import { EnrichmentBar } from './components/EnrichmentBar'
import { ResultsReadySection } from './components/ResultsReadySection'
import { ProcessingSection } from './components/ProcessingSection'
import { ErrorState } from './components/ErrorState'
import { TimedOutState } from './components/TimedOutState'

function ProcessingContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const analysisId = searchParams.get('id')

  // Inject styles on mount
  useEffect(() => {
    const styleElement = document.createElement('style')
    styleElement.textContent = processingStyles
    document.head.appendChild(styleElement)
    return () => {
      document.head.removeChild(styleElement)
    }
  }, [])

  const [status, setStatus] = useState<{
    progress: number;
    message: string;
    pagesFound: number;
    pagesCrawled: number;
    currentUrl: string;
    status: string;
    crawledPages: string[];
    competitorProgress?: {
      total: number;
      completed: number;
      competitors: Array<{
        url: string;
        status: 'pending' | 'analyzing' | 'completed' | 'error';
        preliminaryScore?: number;
        earlyFindings?: string[];
      }>;
    };
  }>({
    progress: 0,
    message: 'Starting analysis...',
    pagesFound: 0,
    pagesCrawled: 0,
    currentUrl: '',
    status: 'pending',
    crawledPages: [],
  })
  const [error, setError] = useState('')

  // Optional enrichment fields
  const [linkedInUrl, setLinkedInUrl] = useState('')
  const [email, setEmail] = useState('')
  const [isComplete, setIsComplete] = useState(false)

  // Enrichment fields
  const [competitor, setCompetitor] = useState('')
  const [submittedCompetitors, setSubmittedCompetitors] = useState<string[]>([])
  const [submittedSocials, setSubmittedSocials] = useState<string[]>([])
  const [emailSubmitted, setEmailSubmitted] = useState(false)
  const [enrichmentStatus, setEnrichmentStatus] = useState<string | null>(null)
  const [enrichmentMessage, setEnrichmentMessage] = useState('')

  // Rotating status messages during AI analysis
  const [aiStatusIndex, setAiStatusIndex] = useState(0)
  const [stuckTime, setStuckTime] = useState(0)
  const [showEmailPrompt, setShowEmailPrompt] = useState(false)
  const [fakeProgress, setFakeProgress] = useState(55)

  // Phase transition animation state
  const [phaseTransition, setPhaseTransition] = useState<'none' | 'fading-out' | 'fading-in'>('none')
  const [displayedPhase, setDisplayedPhase] = useState<'scanning' | 'analyzing'>('scanning')
  const prevStatusRef = useRef<string>('pending')

  // Processing timeout (5 minutes max)
  const processingStartRef = useRef<number>(Date.now())
  const [isTimedOut, setIsTimedOut] = useState(false)
  const PROCESSING_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes

  const aiStatusMessages = [
    'Reading your homepage headline and hero section...',
    'Checking if visitors can understand what you do in 5 seconds...',
    'Evaluating your value proposition clarity...',
    'Looking for specific proof points and numbers...',
    'Analyzing your call-to-action buttons...',
    'Checking if your ideal customer is obvious...',
    'Reviewing how you differentiate from competitors...',
    'Examining your social proof and testimonials...',
    'Looking for trust signals and credibility markers...',
    'Analyzing feature vs benefit framing...',
    'Checking your story structure and narrative flow...',
    'Reviewing button copy and next-step clarity...',
    'Analyzing brand voice consistency across pages...',
    'Identifying commodity language patterns...',
    'Finding specific phrases to rewrite...',
    'Generating copy-paste replacement suggestions...',
    'Scoring each category against best practices...',
    'Preparing your personalized recommendations...',
  ]

  const MAX_COMPETITORS = 5

  const handleSubmitSocial = async () => {
    if (linkedInUrl.trim() && submittedSocials.length < 5) {
      const newSocial = linkedInUrl.trim()
      const newSocials = [...submittedSocials, newSocial]
      setSubmittedSocials(newSocials)
      setLinkedInUrl('')
      setEnrichmentStatus('analyzing')
      setEnrichmentMessage(`+ Adding ${newSocial}...`)

      try {
        const response = await fetch('/api/analyze', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: analysisId,
            socialUrls: [newSocial],
          }),
        })
        const result = await response.json()

        if (result.success) {
          pollEnrichmentStatus()
        } else {
          setEnrichmentStatus('failed')
          setEnrichmentMessage('Could not analyze social profile')
        }
      } catch (err) {
        console.error('Failed to analyze social URL:', err)
        setEnrichmentStatus('failed')
        setEnrichmentMessage('Could not analyze social profile')
      }
    }
  }

  const normalizeCompetitorUrl = (input: string): string | null => {
    const cleaned = input.trim().toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/.*$/, '')

    if (!cleaned || cleaned.includes(' ') || !cleaned.includes('.')) {
      return null
    }

    const domainPattern = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/
    if (!domainPattern.test(cleaned)) {
      return null
    }

    return cleaned
  }

  const [competitorError, setCompetitorError] = useState('')

  const handleSubmitCompetitor = async () => {
    if (competitor.trim() && submittedCompetitors.length < MAX_COMPETITORS) {
      const normalizedUrl = normalizeCompetitorUrl(competitor)

      if (!normalizedUrl) {
        setCompetitorError('Enter a website URL like competitor.com')
        return
      }

      if (submittedCompetitors.some(c => normalizeCompetitorUrl(c) === normalizedUrl)) {
        setCompetitorError('Already added')
        return
      }

      setCompetitorError('')
      const newCompetitors = [...submittedCompetitors, normalizedUrl]
      setSubmittedCompetitors(newCompetitors)
      setCompetitor('')
      setEnrichmentStatus('analyzing')
      setEnrichmentMessage(`+ Adding ${normalizedUrl}...`)

      try {
        const response = await fetch('/api/analyze', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: analysisId,
            competitors: [normalizedUrl],
          }),
        })
        const result = await response.json()

        if (result.success) {
          pollEnrichmentStatus()
        } else {
          setEnrichmentStatus('failed')
          setEnrichmentMessage('Could not analyze competitor')
        }
      } catch (err) {
        console.error('Failed to analyze competitor:', err)
        setEnrichmentStatus('failed')
        setEnrichmentMessage('Could not analyze competitor')
      }
    }
  }

  const pollEnrichmentStatus = async () => {
    let pollAttempts = 0
    const maxAttempts = 30

    const checkStatus = async () => {
      pollAttempts++
      try {
        const response = await fetch(`/api/analyze?id=${analysisId}`)
        const result = await response.json()

        if (result.success && result.analysis) {
          const analysis = result.analysis
          if (analysis.enrichmentStatus === 'complete') {
            setEnrichmentStatus('complete')
            setEnrichmentMessage(analysis.enrichmentMessage || 'Competitor analysis complete')
            return
          } else if (analysis.enrichmentStatus === 'failed') {
            setEnrichmentStatus('failed')
            setEnrichmentMessage(analysis.enrichmentMessage || 'Could not analyze competitor')
            return
          } else if (analysis.enrichmentStatus === 'analyzing_competitors' || !analysis.enrichmentStatus) {
            if (analysis.enrichmentMessage) {
              setEnrichmentMessage(analysis.enrichmentMessage)
            }
            if (pollAttempts < maxAttempts) {
              setTimeout(checkStatus, 2000)
            } else {
              setEnrichmentStatus('failed')
              setEnrichmentMessage('Competitor analysis timed out')
            }
          }
        }
      } catch {
        if (pollAttempts < maxAttempts) {
          setTimeout(checkStatus, 3000)
        } else {
          setEnrichmentStatus('failed')
          setEnrichmentMessage('Could not complete analysis')
        }
      }
    }
    checkStatus()
  }

  const handleSubmitEmail = async () => {
    if (email.trim()) {
      setEmailSubmitted(true)

      try {
        await fetch('/api/analyze', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: analysisId,
            email: email.trim(),
          }),
        })
      } catch (err) {
        console.error('Failed to save email:', err)
      }
    }
  }

  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!analysisId) {
      router.push('/')
      return
    }

    processingStartRef.current = Date.now()

    const pollWithBackoff = async (interval: number) => {
      const elapsed = Date.now() - processingStartRef.current
      if (elapsed > PROCESSING_TIMEOUT_MS) {
        setIsTimedOut(true)
        return
      }

      try {
        const response = await fetch(`/api/analyze?id=${analysisId}`)
        const result = await response.json()

        if (!result.success) {
          if (response.status === 404) {
            setError('Analysis not found. Please try again.')
          } else {
            setError(result.error || 'Something went wrong.')
          }
          return
        }

        const analysis = result.analysis

        setStatus(prev => ({
          progress: analysis.progress,
          message: analysis.message,
          pagesFound: analysis.pagesFound,
          pagesCrawled: analysis.pagesCrawled,
          currentUrl: analysis.currentUrl || prev.currentUrl,
          status: analysis.status,
          crawledPages: analysis.crawledPages || prev.crawledPages,
          competitorProgress: analysis.competitorProgress || prev.competitorProgress,
        }))

        if (analysis.status === 'complete') {
          setIsComplete(true)
        } else if (analysis.status === 'failed') {
          setError(analysis.message || 'Analysis failed. Please try again.')
        } else {
          timerRef.current = setTimeout(() => pollWithBackoff(Math.min(interval * 1.5, 30000)), interval)
        }
      } catch {
        timerRef.current = setTimeout(() => pollWithBackoff(Math.min(interval * 1.5, 30000)), interval)
      }
    }

    pollWithBackoff(2000)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [analysisId, router])

  // Detect phase transition from scanning to analyzing and trigger animation
  useEffect(() => {
    const prevStatus = prevStatusRef.current
    const currentStatus = status.status

    if (currentStatus === 'analyzing' && prevStatus !== 'analyzing' && phaseTransition === 'none') {
      setPhaseTransition('fading-out')

      setTimeout(() => {
        setDisplayedPhase('analyzing')
        setPhaseTransition('fading-in')

        setTimeout(() => {
          setPhaseTransition('none')
        }, 500)
      }, 1000)
    }

    prevStatusRef.current = currentStatus
  }, [status.status, phaseTransition])

  // Rotate AI status messages, increment fake progress, track stuck time
  useEffect(() => {
    if (status.status !== 'analyzing') {
      setStuckTime(0)
      setShowEmailPrompt(false)
      setFakeProgress(55)
      return
    }

    const scheduleNextMessage = () => {
      const delay = Math.random() * 4000 + 3000
      return setTimeout(() => {
        setAiStatusIndex(prev => (prev + 1) % aiStatusMessages.length)
        scheduleNextMessage()
      }, delay)
    }

    const messageTimeout = scheduleNextMessage()

    const progressInterval = setInterval(() => {
      setFakeProgress(prev => {
        const increment = Math.random() * 0.2 + 0.3
        return Math.min(prev + increment, 95)
      })
    }, 1000)

    const stuckInterval = setInterval(() => {
      setStuckTime(prev => {
        const newTime = prev + 1000
        if (newTime >= 30000 && !showEmailPrompt) {
          setShowEmailPrompt(true)
        }
        return newTime
      })
    }, 1000)

    return () => {
      clearTimeout(messageTimeout)
      clearInterval(progressInterval)
      clearInterval(stuckInterval)
    }
  }, [status.status, showEmailPrompt, aiStatusMessages.length])

  const handleRevealResults = () => {
    router.push(`/preview/${analysisId}`)
  }

  if (error) {
    return <ErrorState error={error} onBack={() => router.push('/')} />
  }

  if (isTimedOut) {
    return (
      <TimedOutState
        analysisId={analysisId}
        onKeepWaiting={() => {
          setIsTimedOut(false)
          processingStartRef.current = Date.now()
        }}
        onCheckAnyway={() => router.push(`/preview/${analysisId}`)}
      />
    )
  }

  const currentPath = status.currentUrl ? (() => {
    try {
      return new URL(status.currentUrl).pathname || '/'
    } catch {
      return status.currentUrl
    }
  })() : ''

  return (
    <main className="min-h-screen bg-[var(--background)] flex flex-col p-6">
      <EnrichmentBar
        linkedInUrl={linkedInUrl}
        onLinkedInChange={setLinkedInUrl}
        onSubmitSocial={handleSubmitSocial}
        submittedSocials={submittedSocials}
        enrichmentStatus={enrichmentStatus}
        enrichmentMessage={enrichmentMessage}
        competitor={competitor}
        onCompetitorChange={(val) => { setCompetitor(val); setCompetitorError('') }}
        onSubmitCompetitor={handleSubmitCompetitor}
        submittedCompetitors={submittedCompetitors}
        competitorError={competitorError}
        maxCompetitors={MAX_COMPETITORS}
        email={email}
        onEmailChange={(val) => { setEmail(val); setEmailSubmitted(false) }}
        onSubmitEmail={handleSubmitEmail}
        emailSubmitted={emailSubmitted}
      />

      {isComplete && enrichmentStatus !== 'analyzing' ? (
        <ResultsReadySection
          pagesCrawled={status.pagesCrawled}
          enrichmentStatus={enrichmentStatus}
          submittedCompetitors={submittedCompetitors}
          submittedSocials={submittedSocials}
          onReveal={handleRevealResults}
        />
      ) : (
        <ProcessingSection
          isComplete={isComplete}
          enrichmentStatus={enrichmentStatus}
          enrichmentMessage={enrichmentMessage}
          phaseTransition={phaseTransition}
          displayedPhase={displayedPhase}
          statusStatus={status.status}
          fakeProgress={fakeProgress}
          statusProgress={status.progress}
          statusPagesCrawled={status.pagesCrawled}
          showEmailPrompt={showEmailPrompt}
          emailSubmitted={emailSubmitted}
          email={email}
          onEmailChange={setEmail}
          onSubmitEmail={handleSubmitEmail}
          currentPath={currentPath}
          aiStatusIndex={aiStatusIndex}
          aiStatusMessages={aiStatusMessages}
          competitorProgress={status.competitorProgress}
          crawledPages={status.crawledPages}
        />
      )}
    </main>
  )
}

export default function ProcessingPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
      </main>
    }>
      <ProcessingContent />
    </Suspense>
  )
}
