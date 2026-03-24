'use client'

interface EnrichmentBarProps {
  linkedInUrl: string
  onLinkedInChange: (val: string) => void
  onSubmitSocial: () => void
  submittedSocials: string[]
  enrichmentStatus: string | null
  enrichmentMessage: string
  competitor: string
  onCompetitorChange: (val: string) => void
  onSubmitCompetitor: () => void
  submittedCompetitors: string[]
  competitorError: string
  maxCompetitors: number
  email: string
  onEmailChange: (val: string) => void
  onSubmitEmail: () => void
  emailSubmitted: boolean
}

export function EnrichmentBar({
  linkedInUrl,
  onLinkedInChange,
  onSubmitSocial,
  submittedSocials,
  enrichmentStatus,
  enrichmentMessage,
  competitor,
  onCompetitorChange,
  onSubmitCompetitor,
  submittedCompetitors,
  competitorError,
  maxCompetitors,
  email,
  onEmailChange,
  onSubmitEmail,
  emailSubmitted,
}: EnrichmentBarProps) {
  return (
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
                onChange={(e) => onLinkedInChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSubmitSocial()}
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
                <span className="font-normal text-white/60 ml-2">({submittedCompetitors.length}/{maxCompetitors})</span>
              )}
            </label>
            <div className="relative">
              <input
                id="competitor"
                type="text"
                value={competitor}
                onChange={(e) => onCompetitorChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSubmitCompetitor()}
                placeholder={submittedCompetitors.length >= maxCompetitors ? 'Max 5 competitors' : 'Enter URL like acme.com or https://acme.com'}
                disabled={submittedCompetitors.length >= maxCompetitors}
                className={`w-full px-3 py-2.5 text-sm bg-white/10 border text-white placeholder-white/50 focus:outline-none focus:border-white pr-20 disabled:opacity-50 ${competitorError ? 'border-red-400' : 'border-white/30'}`}
              />
              {competitor.trim() && submittedCompetitors.length < maxCompetitors && (
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
            <label htmlFor="contact-email" className="block text-sm font-semibold text-white mb-1">Get notified about your messaging</label>
            <div className="relative">
              <input
                id="contact-email"
                type="email"
                value={email}
                onChange={(e) => { onEmailChange(e.target.value) }}
                onKeyDown={(e) => e.key === 'Enter' && onSubmitEmail()}
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
              {emailSubmitted ? 'Bookmark this page - your results will be ready shortly' : 'Optional: get tips on fixing common messaging issues'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
