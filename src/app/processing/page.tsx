'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

// CSS animations for fade transitions and shimmer
const styles = `
  @keyframes fadeInOut {
    0% { opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { opacity: 0; }
  }

  @keyframes shimmer {
    0% {
      background-position: -200px 0;
    }
    100% {
      background-position: 200px 0;
    }
  }

  @keyframes dotFade {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 1; }
  }

  .fade-message {
    animation: fadeInOut 0.6s ease-in-out;
  }

  .shimmer-bar {
    position: relative;
    overflow: hidden;
  }

  .shimmer-bar::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.4),
      transparent
    );
    background-size: 200px 100%;
    animation: shimmer 1.5s infinite;
  }

  .dot-1 { animation: dotFade 1.2s infinite 0s; }
  .dot-2 { animation: dotFade 1.2s infinite 0.4s; }
  .dot-3 { animation: dotFade 1.2s infinite 0.8s; }
`

// Animated counter component
function AnimatedCounter({ value, className }: { value: number; className?: string }) {
  const [displayValue, setDisplayValue] = useState(0)
  const prevValue = useRef(0)

  useEffect(() => {
    const start = prevValue.current
    const end = value
    const duration = 500
    const startTime = Date.now()

    const animate = () => {
      const now = Date.now()
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(start + (end - start) * eased)

      setDisplayValue(current)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        prevValue.current = end
      }
    }

    requestAnimationFrame(animate)
  }, [value])

  return <span className={className}>{displayValue}</span>
}

function ProcessingContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const analysisId = searchParams.get('id')

  // Inject styles on mount
  useEffect(() => {
    const styleElement = document.createElement('style')
    styleElement.textContent = styles
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
  const [fakeProgress, setFakeProgress] = useState(70)

  const aiStatusMessages = [
    'Analyzing hero headlines and positioning...',
    'Evaluating value propositions...',
    'Checking proof points and social proof...',
    'Reviewing call-to-action clarity...',
    'Assessing target audience specificity...',
    'Detecting your target audience clarity...',
    'Reviewing your competitive differentiation...',
    'Checking social proof elements...',
    'Examining trust signals...',
    'Analyzing feature vs benefit framing...',
    'Reviewing navigation and user flow...',
    'Checking testimonial placement...',
    'Analyzing brand voice consistency...',
    'Examining technical messaging...',
    'Finalizing comprehensive analysis...',
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

      // Send only the NEW social URL to analyze
      try {
        const response = await fetch('/api/analyze', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: analysisId,
            socialUrls: [newSocial], // Only the new one
          }),
        })
        const result = await response.json()

        if (result.success) {
          // Poll for enrichment completion
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

  // Validate and normalize competitor URL
  const normalizeCompetitorUrl = (input: string): string | null => {
    const cleaned = input.trim().toLowerCase()
      .replace(/^https?:\/\//, '') // Remove protocol
      .replace(/^www\./, '') // Remove www
      .replace(/\/.*$/, '') // Remove path

    // Must look like a domain (has at least one dot, no spaces)
    if (!cleaned || cleaned.includes(' ') || !cleaned.includes('.')) {
      return null
    }

    // Check for valid-ish domain pattern
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

      // Check for duplicates
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

      // Send only the NEW competitor to analyze
      try {
        const response = await fetch('/api/analyze', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: analysisId,
            competitors: [normalizedUrl], // Only the new one
          }),
        })
        const result = await response.json()

        if (result.success) {
          // Poll for enrichment completion
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
    const maxAttempts = 30 // Max 60 seconds of polling (30 * 2s)

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
            return // Stop polling
          } else if (analysis.enrichmentStatus === 'failed') {
            setEnrichmentStatus('failed')
            setEnrichmentMessage(analysis.enrichmentMessage || 'Could not analyze competitor')
            return // Stop polling
          } else if (analysis.enrichmentStatus === 'analyzing_competitors' || !analysis.enrichmentStatus) {
            // Continue polling if still analyzing OR if status not set yet
            if (analysis.enrichmentMessage) {
              setEnrichmentMessage(analysis.enrichmentMessage)
            }
            if (pollAttempts < maxAttempts) {
              setTimeout(checkStatus, 2000) // Continue polling
            } else {
              // Timeout - assume failed
              setEnrichmentStatus('failed')
              setEnrichmentMessage('Competitor analysis timed out')
            }
          }
        }
      } catch {
        // Retry on error (up to max attempts)
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

      // Send to API
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

  useEffect(() => {
    if (!analysisId) {
      router.push('/')
      return
    }

    let pollTimeout: NodeJS.Timeout

    const pollStatus = async () => {
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
        }))

        if (analysis.status === 'complete') {
          // Don't auto-redirect - show "Results ready!" state
          setIsComplete(true)
        } else if (analysis.status === 'failed') {
          setError(analysis.message || 'Analysis failed. Please try again.')
        } else {
          pollTimeout = setTimeout(pollStatus, 800)
        }
      } catch {
        pollTimeout = setTimeout(pollStatus, 2000)
      }
    }

    pollStatus()

    return () => {
      if (pollTimeout) {
        clearTimeout(pollTimeout)
      }
    }
  }, [analysisId, router])

  // Rotate AI status messages with variable delay, increment fake progress, track stuck time
  useEffect(() => {
    if (status.status !== 'analyzing') {
      setStuckTime(0)
      setShowEmailPrompt(false)
      setFakeProgress(70)
      return
    }

    // Message rotation with random 3000-7000ms delay
    const scheduleNextMessage = () => {
      const delay = Math.random() * 4000 + 3000
      return setTimeout(() => {
        setAiStatusIndex(prev => (prev + 1) % aiStatusMessages.length)
        scheduleNextMessage()
      }, delay)
    }

    let messageTimeout = scheduleNextMessage()

    // Increment fake progress from 70% to 95% during analyzing
    const progressInterval = setInterval(() => {
      setFakeProgress(prev => {
        const increment = Math.random() * 0.2 + 0.3 // 0.3-0.5%
        const newProgress = Math.min(prev + increment, 95)
        return newProgress
      })
    }, 1000)

    // Track stuck time for email prompt
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
    return (
      <main className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 bg-red-500/20 flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">⚠️</span>
          </div>
          <h1 className="text-section text-2xl text-[var(--foreground)] mb-4">
            Something went wrong
          </h1>
          <p className="text-body mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-[var(--accent)] text-white px-6 py-3 font-semibold hover:opacity-90 transition-opacity"
          >
            Try again
          </button>
        </div>
      </main>
    )
  }

  // Extract the current page path for display
  const currentPath = status.currentUrl ? (() => {
    try {
      return new URL(status.currentUrl).pathname || '/'
    } catch {
      return status.currentUrl
    }
  })() : ''

  // Single render with persistent input bar - only content below changes
  return (
    <main className="min-h-screen bg-[var(--background)] flex flex-col p-6">
      {/* Persistent enrichment bar - add context while you wait */}
      <div className="bg-[var(--accent)] text-white py-6 px-6 -mx-6 -mt-6 mb-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm text-white/80 mb-4">Add context to improve your analysis (optional)</p>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="social-url" className="block text-sm font-semibold text-white mb-1">LinkedIn or social URL</label>
              <div className="relative">
                <input
                  id="social-url"
                  type="url"
                  value={linkedInUrl}
                  onChange={(e) => setLinkedInUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmitSocial()}
                  placeholder="linkedin.com/company/yourco"
                  className="w-full px-3 py-2.5 text-sm bg-white/10 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-white pr-20"
                />
                {linkedInUrl.trim() && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono bg-white/20 px-1.5 py-0.5 rounded text-white/70">
                    ENTER ↵
                  </span>
                )}
              </div>
              {submittedSocials.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {submittedSocials.map((url, i) => (
                    <span key={i} className={`text-xs px-2 py-0.5 rounded ${enrichmentStatus === 'complete' ? 'bg-green-500/30 text-green-200' : 'bg-white/20 text-white/90'}`}>
                      {enrichmentStatus === 'complete' ? '✓' : '○'} {url}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-white/60 mt-1">We&apos;ll try to find it, but adding it helps</p>
              )}
              {enrichmentStatus === 'analyzing' && submittedSocials.length > 0 && enrichmentMessage.includes(submittedSocials[submittedSocials.length - 1]) && (
                <p className="text-xs text-yellow-200 mt-1 animate-pulse">{enrichmentMessage}</p>
              )}
            </div>
            <div>
              <label htmlFor="competitor" className="block text-sm font-semibold text-white mb-1">
                Competitors to compare
                {submittedCompetitors.length > 0 && (
                  <span className="font-normal text-white/60 ml-2">({submittedCompetitors.length}/{MAX_COMPETITORS})</span>
                )}
              </label>
              <div className="relative">
                <input
                  id="competitor"
                  type="text"
                  value={competitor}
                  onChange={(e) => { setCompetitor(e.target.value); setCompetitorError('') }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmitCompetitor()}
                  placeholder={submittedCompetitors.length >= MAX_COMPETITORS ? 'Max 5 competitors' : 'Enter URL like acme.com or https://acme.com'}
                  disabled={submittedCompetitors.length >= MAX_COMPETITORS}
                  className={`w-full px-3 py-2.5 text-sm bg-white/10 border text-white placeholder-white/50 focus:outline-none focus:border-white pr-20 disabled:opacity-50 ${competitorError ? 'border-red-400' : 'border-white/30'}`}
                />
                {competitor.trim() && submittedCompetitors.length < MAX_COMPETITORS && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono bg-white/20 px-1.5 py-0.5 rounded text-white/70">
                    ENTER ↵
                  </span>
                )}
              </div>
              {competitorError && (
                <p className="text-xs text-red-300 mt-1">{competitorError}</p>
              )}
              {submittedCompetitors.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {submittedCompetitors.map((c, i) => (
                    <span key={i} className={`text-xs px-2 py-0.5 rounded ${enrichmentStatus === 'complete' ? 'bg-green-500/30 text-green-200' : 'bg-white/20 text-white/90'}`}>
                      {enrichmentStatus === 'complete' ? '✓' : '○'} {c}
                    </span>
                  ))}
                </div>
              ) : !competitorError && (
                <p className="text-xs text-white/60 mt-1">We&apos;ll try to find them, but adding helps</p>
              )}
              {enrichmentStatus === 'analyzing' && (
                <div className="mt-1">
                  <p className="text-xs text-yellow-200 animate-pulse flex items-center gap-2">
                    <span className="inline-block w-3 h-3 border-2 border-yellow-300 border-t-transparent rounded-full animate-spin"></span>
                    {enrichmentMessage}
                  </p>
                  <p className="text-[10px] text-white/50 mt-0.5">This can take 30-60 seconds per competitor...</p>
                </div>
              )}
              {enrichmentStatus === 'complete' && (
                <p className="text-xs text-green-200 mt-1">✓ {enrichmentMessage}</p>
              )}
              {enrichmentStatus === 'failed' && (
                <p className="text-xs text-red-200 mt-1">⚠ {enrichmentMessage}</p>
              )}
            </div>
            <div>
              <label htmlFor="contact-email" className="block text-sm font-semibold text-white mb-1">Email me my results</label>
              <div className="relative">
                <input
                  id="contact-email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailSubmitted(false) }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmitEmail()}
                  placeholder="you@company.com"
                  disabled={emailSubmitted}
                  className="w-full px-3 py-2.5 text-sm bg-white/10 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-white pr-20 disabled:opacity-70"
                />
                {email.trim() && !emailSubmitted && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono bg-white/20 px-1.5 py-0.5 rounded text-white/70">
                    ENTER ↵
                  </span>
                )}
                {emailSubmitted && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono bg-green-500/30 px-1.5 py-0.5 rounded text-green-200">
                    ✓ Saved
                  </span>
                )}
              </div>
              <p className="text-xs text-white/60 mt-1">
                {emailSubmitted ? 'We\'ll email you a link to your results' : 'Get a link so you can come back'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* RESULTS READY STATE - only show when main analysis AND any enrichment are complete */}
      {isComplete && enrichmentStatus !== 'analyzing' ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-xl w-full text-center">
            <div className="mb-8">
              <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-5xl">✓</span>
              </div>
              <h1 className="text-section text-4xl text-[var(--foreground)] mb-4">
                Results ready!
              </h1>
              <p className="text-body-lg text-[var(--muted-foreground)]">
                We scanned <strong>{status.pagesCrawled} pages</strong>
                {enrichmentStatus === 'complete' && submittedCompetitors.length > 0 && (
                  <> + <strong>{submittedCompetitors.length} competitor{submittedCompetitors.length !== 1 ? 's' : ''}</strong></>
                )}
                {enrichmentStatus === 'complete' && submittedSocials.length > 0 && (
                  <> + <strong>{submittedSocials.length} social profile{submittedSocials.length !== 1 ? 's' : ''}</strong></>
                )}
                {' '}and found messaging issues you can fix.
              </p>
              {enrichmentStatus === 'failed' && submittedCompetitors.length > 0 && (
                <p className="text-sm text-amber-600 mt-2">
                  (Couldn&apos;t analyze {submittedCompetitors.join(', ')} - some sites block external access)
                </p>
              )}
            </div>

            <button
              onClick={handleRevealResults}
              className="bg-[var(--accent)] text-white px-10 py-5 text-xl font-bold hover:opacity-90 transition-opacity mb-8"
            >
              Show me my results →
            </button>

            <p className="text-sm text-[var(--muted-foreground)]">
              Your free preview includes your commodity score, top priorities, and a sample of what we found.
            </p>
          </div>
        </div>
      ) : (
      /* PROCESSING STATE */
      <div className="max-w-4xl mx-auto w-full">
        {/* Header - different when enrichment is running after main analysis */}
        <div className="text-center mb-8">
          {isComplete && enrichmentStatus === 'analyzing' ? (
            <>
              <h1 className="text-section text-3xl text-[var(--foreground)] mb-2">
                Adding to your analysis
              </h1>
              <p className="text-body text-[var(--muted-foreground)]">
                {enrichmentMessage || 'Analyzing additional context...'}
              </p>
            </>
          ) : status.status === 'analyzing' ? (
            <>
              <h1 className="text-section text-3xl text-[var(--foreground)] mb-2">
                Analyzing<span className="dot-1">.</span><span className="dot-2">.</span><span className="dot-3">.</span>
              </h1>
              <p className="text-body text-[var(--muted-foreground)]">
                AI is evaluating your messaging against proven frameworks.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-section text-3xl text-[var(--foreground)] mb-2">
                Scanning your website
              </h1>
              <p className="text-body text-[var(--muted-foreground)]">
                Takes up to 2 minutes depending on how fast their server responds.
              </p>
            </>
          )}
        </div>

        {/* Main Progress Area */}
        <div className="max-w-lg mx-auto">
          {/* Spinner */}
          <div className="text-center mb-8">
            <img
              src="/spinner.gif"
              alt="Loading"
              className="w-12 h-12 mx-auto"
            />
          </div>

          {/* Progress bar - show enrichment vs main progress */}
          {isComplete && enrichmentStatus === 'analyzing' ? (
            <>
              <div className="h-3 bg-[var(--border)] mb-4 overflow-hidden rounded-full">
                <div
                  className="h-full bg-yellow-500 transition-all duration-500 rounded-full animate-pulse"
                  style={{ width: '60%' }}
                />
              </div>
              <p className="text-center text-[var(--muted-foreground)] mb-6">
                Your {status.pagesCrawled} pages are scanned - now enriching with additional context
              </p>
            </>
          ) : (
            <>
              <div className="h-3 bg-[var(--border)] mb-4 overflow-hidden rounded-full">
                <div
                  className="h-full transition-all duration-500 rounded-full shimmer-bar bg-[var(--accent)]"
                  style={{ width: `${status.status === 'analyzing' ? fakeProgress : status.progress}%` }}
                />
              </div>
              <p className="text-center text-[var(--muted-foreground)] mb-6">
                {status.status === 'analyzing' ? Math.round(fakeProgress) : status.progress}% complete
              </p>
            </>
          )}

          {/* "Taking a while?" prompt after 30 seconds at 70%+ progress */}
          {showEmailPrompt && !emailSubmitted && status.status === 'analyzing' && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded text-center mb-6">
              <p className="text-sm font-medium text-yellow-800 mb-2">
                Taking longer than expected?
              </p>
              <p className="text-xs text-yellow-700 mb-3">
                Enter your email and we&apos;ll send the results when ready.
                Feel free to close this tab - we&apos;ll keep analyzing.
              </p>
              <div className="flex items-center justify-center gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmitEmail()}
                  placeholder="you@company.com"
                  className="px-3 py-2 text-sm border border-yellow-300 rounded focus:outline-none focus:border-yellow-500"
                />
                <button
                  onClick={handleSubmitEmail}
                  className="px-4 py-2 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
                >
                  Notify me
                </button>
              </div>
            </div>
          )}

          {/* Current page being scanned - only during main crawl */}
          {!isComplete && currentPath && status.status === 'crawling' && (
            <div className="bg-[var(--muted)] px-4 py-3 mb-6 font-mono text-sm text-center rounded">
              <span className="text-[var(--muted-foreground)]">Scanning:</span>{' '}
              <span className="text-[var(--foreground)]">{currentPath}</span>
            </div>
          )}

          {/* Status message when analyzing - main analysis */}
          {status.status === 'analyzing' && (
            <div className="text-center mb-6">
              <div key={aiStatusIndex} className="fade-message">
                <p className="text-body text-lg mb-2">
                  {aiStatusMessages[aiStatusIndex]}
                </p>
              </div>
              <p className="text-xs text-[var(--muted-foreground)]">
                AI analysis can take 30-60 seconds for thorough results
              </p>
            </div>
          )}

          {/* Pages scanned counter */}
          {status.pagesCrawled > 0 && (
            <div className="text-center mb-8">
              <AnimatedCounter
                value={status.pagesCrawled}
                className="text-5xl font-bold text-[var(--foreground)]"
              />
              <p className="text-sm text-[var(--muted-foreground)] mt-2">
                pages scanned
              </p>
            </div>
          )}

          {/* Scanned pages list */}
          {status.crawledPages.length > 0 && (
            <div className="bg-[var(--muted)] p-4 text-left mb-8 max-h-40 overflow-y-auto rounded">
              <p className="text-label mb-3">PAGES FOUND</p>
              <ul className="space-y-1 text-sm font-mono">
                {status.crawledPages.slice(-6).map((page, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-[var(--success)]">✓</span>
                    <span className="text-[var(--muted-foreground)] truncate">{page}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Scan Progress checklist */}
          <div className="bg-[var(--muted)] p-6 text-left rounded">
            <p className="text-label mb-4">WHAT WE&apos;RE DOING</p>
            <ul className="space-y-2 text-body text-sm">
              <li className="flex items-center gap-2">
                <span className={status.progress > 10 ? 'text-[var(--success)]' : 'text-[var(--muted-foreground)]'}>
                  {status.progress > 10 ? '✓' : '○'}
                </span>
                Reading homepage and navigation
              </li>
              <li className="flex items-center gap-2">
                <span className={status.progress > 30 ? 'text-[var(--success)]' : 'text-[var(--muted-foreground)]'}>
                  {status.progress > 30 ? '✓' : '○'}
                </span>
                Scanning about, services, capability pages
              </li>
              <li className="flex items-center gap-2">
                <span className={status.progress > 50 ? 'text-[var(--success)]' : 'text-[var(--muted-foreground)]'}>
                  {status.progress > 50 ? '✓' : '○'}
                </span>
                Finding case studies and project pages
              </li>
              <li className="flex items-center gap-2">
                <span className={status.progress > 65 ? 'text-[var(--success)]' : 'text-[var(--muted-foreground)]'}>
                  {status.progress > 65 ? '✓' : '○'}
                </span>
                Detecting LinkedIn company page
              </li>
              <li className="flex items-center gap-2">
                <span className={status.progress > 85 ? 'text-[var(--success)]' : 'text-[var(--muted-foreground)]'}>
                  {status.progress > 85 ? '✓' : '○'}
                </span>
                Running messaging analysis
              </li>
            </ul>
            <p className="text-xs text-[var(--muted-foreground)] mt-4 pt-4 border-t border-[var(--border)]">
              A thorough analysis takes time. We&apos;re reading actual page content, not just crawling URLs.
            </p>
          </div>
        </div>
      </div>
      )}
    </main>
  )
}

export default function ProcessingPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent animate-spin" />
      </main>
    }>
      <ProcessingContent />
    </Suspense>
  )
}
