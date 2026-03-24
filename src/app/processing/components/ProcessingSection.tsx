import { AnimatedCounter } from './AnimatedCounter'

interface CompetitorProgress {
  total: number
  completed: number
  competitors: Array<{
    url: string
    status: 'pending' | 'analyzing' | 'completed' | 'error'
    preliminaryScore?: number
    earlyFindings?: string[]
  }>
}

interface ProcessingSectionProps {
  isComplete: boolean
  enrichmentStatus: string | null
  enrichmentMessage: string
  phaseTransition: 'none' | 'fading-out' | 'fading-in'
  displayedPhase: 'scanning' | 'analyzing'
  statusStatus: string
  fakeProgress: number
  statusProgress: number
  statusPagesCrawled: number
  showEmailPrompt: boolean
  emailSubmitted: boolean
  email: string
  onEmailChange: (val: string) => void
  onSubmitEmail: () => void
  currentPath: string
  aiStatusIndex: number
  aiStatusMessages: string[]
  competitorProgress?: CompetitorProgress
  crawledPages: string[]
}

export function ProcessingSection({
  isComplete,
  enrichmentStatus,
  enrichmentMessage,
  phaseTransition,
  displayedPhase,
  statusStatus,
  fakeProgress,
  statusProgress,
  statusPagesCrawled,
  showEmailPrompt,
  emailSubmitted,
  email,
  onEmailChange,
  onSubmitEmail,
  currentPath,
  aiStatusIndex,
  aiStatusMessages,
  competitorProgress,
  crawledPages,
}: ProcessingSectionProps) {
  return (
    <div className="max-w-4xl mx-auto w-full">
      {/* Header - with fade transition between phases */}
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
        ) : (
          <div className={
            phaseTransition === 'fading-out' ? 'phase-out' :
            phaseTransition === 'fading-in' ? 'phase-in' : ''
          }>
            {displayedPhase === 'analyzing' ? (
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
        )}
      </div>

      {/* Main Progress Area */}
      <div className="max-w-lg mx-auto">
        {/* Spinner */}
        <div className="text-center mb-8">
          <div className="w-8 h-8 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin mx-auto" />
        </div>

        {/* Progress bar - show enrichment vs main progress */}
        {isComplete && enrichmentStatus === 'analyzing' ? (
          <>
            <div className="h-3 bg-[var(--border-subtle)] mb-4 overflow-hidden rounded-full">
              <div
                className="h-full bg-yellow-500 transition-all duration-500 rounded-full animate-pulse"
                style={{ width: '60%' }}
              />
            </div>
            <p className="text-center text-[var(--muted-foreground)] mb-6">
              Your {statusPagesCrawled} pages are scanned - now enriching with additional context
            </p>
          </>
        ) : (
          <>
            <div className="h-3 bg-[var(--border-subtle)] mb-4 overflow-hidden rounded-full">
              <div
                className="h-full transition-all duration-500 rounded-full shimmer-bar bg-[var(--accent)]"
                style={{ width: `${statusStatus === 'analyzing' ? fakeProgress : statusProgress}%` }}
              />
            </div>
            <p className="text-center text-[var(--muted-foreground)] mb-6">
              {statusStatus === 'analyzing' ? Math.round(fakeProgress) : statusProgress}% complete
            </p>
          </>
        )}

        {/* "Taking a while?" prompt after 30 seconds at 70%+ progress */}
        {showEmailPrompt && !emailSubmitted && statusStatus === 'analyzing' && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded text-center mb-6">
            <p className="text-sm font-medium text-yellow-800 mb-2">
              Taking longer than expected?
            </p>
            <p className="text-xs text-yellow-700 mb-3">
              Bookmark this page - analysis continues in the background.
              You can close this tab and come back later.
            </p>
            <div className="flex items-center justify-center gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSubmitEmail()}
                placeholder="you@company.com (optional)"
                className="px-3 py-2 text-sm border border-yellow-300 rounded focus:outline-none focus:border-yellow-500"
              />
              <button
                onClick={onSubmitEmail}
                className="px-4 py-2 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
              >
                Get tips
              </button>
            </div>
          </div>
        )}

        {/* Current page being scanned - only during main crawl */}
        {!isComplete && currentPath && statusStatus === 'crawling' && (
          <div className="bg-[var(--muted)] px-4 py-3 mb-6 font-mono text-sm text-center rounded">
            <span className="text-[var(--muted-foreground)]">Scanning:</span>{' '}
            <span className="text-[var(--foreground)]">{currentPath}</span>
          </div>
        )}

        {/* Status message when analyzing - main analysis */}
        {statusStatus === 'analyzing' && (
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

        {/* Competitor Analysis Progress */}
        {competitorProgress && competitorProgress.competitors.length > 0 && (
          <div className="mb-8 p-5 bg-blue-50 border-2 border-blue-300 rounded-lg">
            <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
              <span className="inline-block w-3 h-3 bg-blue-600 rounded-full animate-pulse"></span>
              Analyzing competitors ({competitorProgress.completed}/{competitorProgress.total})
            </h3>
            <div className="space-y-3">
              {competitorProgress.competitors.map((comp, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg ${
                    comp.status === 'completed'
                      ? 'bg-green-100 border-l-4 border-green-600'
                      : comp.status === 'analyzing'
                      ? 'bg-blue-100 border-l-4 border-blue-600'
                      : comp.status === 'error'
                      ? 'bg-red-100 border-l-4 border-red-400'
                      : 'bg-gray-100 border-l-4 border-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm font-mono">{comp.url}</span>
                    {comp.status === 'completed' && comp.preliminaryScore !== undefined && (
                      <span
                        className={`text-xl font-bold ${
                          comp.preliminaryScore >= 70
                            ? 'text-green-600'
                            : comp.preliminaryScore >= 40
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}
                      >
                        {comp.preliminaryScore}
                      </span>
                    )}
                    {comp.status === 'analyzing' && (
                      <span className="text-sm text-blue-700 flex items-center gap-2">
                        <span className="inline-block w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                        Analyzing...
                      </span>
                    )}
                    {comp.status === 'error' && (
                      <span className="text-sm text-red-600">Failed</span>
                    )}
                    {comp.status === 'pending' && (
                      <span className="text-sm text-gray-500">Waiting...</span>
                    )}
                  </div>
                  {comp.earlyFindings && comp.earlyFindings.length > 0 && (
                    <div className="mt-2 text-xs text-gray-700">
                      <ul className="space-y-1">
                        {comp.earlyFindings.slice(0, 2).map((finding, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span className="text-blue-500">→</span>
                            <span>{finding}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-blue-700 mt-4 pt-3 border-t border-blue-200">
              Deep analysis includes category scoring, strengths, and weaknesses for each competitor
            </p>
          </div>
        )}

        {/* Pages scanned counter */}
        {statusPagesCrawled > 0 && (
          <div className="text-center mb-8">
            <AnimatedCounter
              value={statusPagesCrawled}
              className="text-5xl font-bold text-[var(--foreground)]"
            />
            <p className="text-sm text-[var(--muted-foreground)] mt-2">
              pages scanned
            </p>
          </div>
        )}

        {/* Scanned pages list */}
        {crawledPages.length > 0 && (
          <div className="bg-[var(--muted)] p-4 text-left mb-8 max-h-40 overflow-y-auto rounded">
            <p className="text-label mb-3">PAGES FOUND</p>
            <ul className="space-y-1 text-sm font-mono">
              {crawledPages.slice(-6).map((page, i) => (
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
              <span className={statusProgress > 10 ? 'text-[var(--success)]' : 'text-[var(--muted-foreground)]'}>
                {statusProgress > 10 ? '✓' : '○'}
              </span>
              Reading homepage and navigation
            </li>
            <li className="flex items-center gap-2">
              <span className={statusProgress > 30 ? 'text-[var(--success)]' : 'text-[var(--muted-foreground)]'}>
                {statusProgress > 30 ? '✓' : '○'}
              </span>
              Scanning about, services, capability pages
            </li>
            <li className="flex items-center gap-2">
              <span className={statusProgress > 50 ? 'text-[var(--success)]' : 'text-[var(--muted-foreground)]'}>
                {statusProgress > 50 ? '✓' : '○'}
              </span>
              Finding case studies and project pages
            </li>
            <li className="flex items-center gap-2">
              <span className={statusProgress > 65 ? 'text-[var(--success)]' : 'text-[var(--muted-foreground)]'}>
                {statusProgress > 65 ? '✓' : '○'}
              </span>
              Detecting LinkedIn company page
            </li>
            <li className="flex items-center gap-2">
              <span className={statusProgress > 85 ? 'text-[var(--success)]' : 'text-[var(--muted-foreground)]'}>
                {statusProgress > 85 ? '✓' : '○'}
              </span>
              Running messaging analysis
            </li>
          </ul>
          <p className="text-xs text-[var(--muted-foreground)] mt-4 pt-4 border-t border-[var(--border-subtle)]">
            A thorough analysis takes time. We&apos;re reading actual page content, not just crawling URLs.
          </p>
        </div>
      </div>
    </div>
  )
}
