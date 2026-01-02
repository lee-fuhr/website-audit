'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { VERSION } from '@/lib/version'

// Interactive ROI Calculator
function ROICalculator({ toolCost }: { toolCost: number }) {
  const [dealValue, setDealValue] = useState(250000)
  const [oppsPerYear, setOppsPerYear] = useState(20)
  const presets = [100000, 250000, 500000, 1000000, 2500000]
  const oppsOptions = [10, 20, 30, 50]

  // Calculate total opportunity and ROI from winning just 1 more
  const totalOpportunity = oppsPerYear * dealValue
  const additionalRevenue = dealValue // Win 1 more deal
  const roi = Math.round(additionalRevenue / toolCost)
  const formatK = (n: number) => n >= 1000000 ? `$${(n / 1000000).toFixed(1)}M` : `$${Math.round(n / 1000)}K`

  return (
    <section className="px-4 md:px-8 lg:px-12 py-16 bg-[var(--accent)]">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-white/80 text-sm font-bold mb-6 flex items-center justify-center gap-2">
          THE MATH
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16" className="w-4 h-4" stroke="currentColor" strokeWidth="1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.167 0.917c-0.017 4.187 2.019 6.563 6.667 6.666-4.31-0.017-6.448 2.294-6.667 6.667-0.042-4.125-1.885-6.673-6.667-6.667 4.277-0.06 6.65-2.125 6.667-6.666Z"/>
          </svg>
        </p>

        <p className="text-[var(--accent-foreground)] text-xl md:text-2xl leading-relaxed mb-4">
          You bid on{' '}
          <span className="inline-flex items-center gap-2">
            <select
              value={oppsPerYear}
              onChange={(e) => setOppsPerYear(Number(e.target.value))}
              className="bg-white text-[var(--accent)] px-3 py-1 font-bold text-xl md:text-2xl border-2 border-white cursor-pointer"
            >
              {oppsOptions.map((opps) => (
                <option key={opps} value={opps}>{opps}</option>
              ))}
            </select>
          </span>
          {' '}projects a year at{' '}
          <span className="inline-flex items-center gap-2">
            <select
              value={dealValue}
              onChange={(e) => setDealValue(Number(e.target.value))}
              className="bg-white text-[var(--accent)] px-3 py-1 font-bold text-xl md:text-2xl border-2 border-white cursor-pointer"
            >
              {presets.map((preset) => (
                <option key={preset} value={preset}>{formatK(preset)}</option>
              ))}
            </select>
          </span>
          {' '}each.{' '}
          <span className="text-white/80">({formatK(totalOpportunity)} in play)</span>
        </p>

        <p className="text-[var(--accent-foreground)] text-xl md:text-2xl leading-relaxed">
          Win just <span className="text-white font-bold">one more</span> because your website finally stands out?{' '}
          <span className="text-white font-bold">{formatK(additionalRevenue)}</span> →{' '}
          <span className="text-white font-bold">{roi.toLocaleString()}× ROI</span>.
        </p>
      </div>
    </section>
  )
}

export default function HomePage() {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const router = useRouter()

  const validateUrl = (input: string): string | null => {
    if (!input.trim()) {
      return 'Enter your website URL to get started.'
    }

    // Add protocol if missing
    let testUrl = input.trim()
    if (!testUrl.startsWith('http://') && !testUrl.startsWith('https://')) {
      testUrl = 'https://' + testUrl
    }

    try {
      new URL(testUrl)
      return null
    } catch {
      return 'That doesn\'t look like a valid URL. Try something like "yourcompany.com"'
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationError = validateUrl(url)
    if (validationError) {
      setError(validationError)
      return
    }

    setIsAnalyzing(true)
    setError('')

    try {
      // Normalize URL
      let normalizedUrl = url.trim()
      if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
        normalizedUrl = 'https://' + normalizedUrl
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: normalizedUrl,
        }),
      })

      const result = await response.json()

      if (result.success) {
        if (typeof window !== 'undefined' && window.plausible) {
          window.plausible('Analysis Started')
        }
        router.push(`/processing?id=${result.analysisId}`)
      } else {
        setError(result.error || 'Something went wrong. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <main className="min-h-screen bg-[var(--background)]">
      {/* Hero */}
      <section className="min-h-[85vh] flex flex-col justify-center px-4 md:px-8 lg:px-12 py-12">
        <div className="max-w-6xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left: Headline */}
            <div>
              <p className="text-label mb-4">THE FIX-IT LIST YOUR AGENCY WON'T GIVE YOU</p>
              <h1 className="text-display text-[clamp(2.25rem,6vw,5rem)] mb-6">
                Your website
                <br />
                <span className="text-[var(--accent)]">is costing you</span>
                <br />
                deals
              </h1>
              <p className="text-body text-xl md:text-2xl max-w-xl mb-6">
                We crawl every page, find every generic phrase, and show you the <strong>exact fixes</strong> - built from proof points already on your site (buried where buyers never see them). Your top issues, free. Make improvements. Come back for more.
              </p>
              <div className="flex flex-wrap gap-4 text-sm text-[var(--muted-foreground)]">
                <span>Critical issues free</span>
                <span>·</span>
                <span>No credit card</span>
                <span>·</span>
                <span>Copy-paste rewrites</span>
              </div>
            </div>

            {/* Right: URL input box */}
            <div>
              <form onSubmit={handleSubmit} className="bg-[var(--accent)] p-8 md:p-10">
                <div className="space-y-6">
                  <div>
                    <label htmlFor="url" className="block text-white/80 text-sm font-semibold mb-2">
                      Your website URL
                    </label>
                    <input
                      id="url"
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="yourcompany.com"
                      className="w-full px-4 py-3 text-lg bg-white text-[var(--foreground)] border-2 border-white focus:outline-none focus:ring-2 focus:ring-white/50"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isAnalyzing}
                    className="w-full bg-white text-[var(--accent)] px-6 py-4 text-lg font-bold hover:bg-white/90 transition-colors disabled:opacity-70"
                  >
                    {isAnalyzing ? 'Starting scan...' : 'Scan my website →'}
                  </button>

                  <p className="text-white/80 text-xs text-center">
                    We&apos;ll crawl your website and LinkedIn to find messaging gaps.
                  </p>
                  <p className="text-white/40 text-[10px] text-center font-mono mt-2">v{VERSION}</p>
                </div>

                {error && (
                  <p className="text-red-200 text-sm mt-4 p-3 bg-red-500/20 border border-red-400/30">
                    {error}
                  </p>
                )}
              </form>

              {/* Sample CTA */}
              <div className="mt-4 text-center">
                <Link href="/sample" className="inline-flex items-center justify-center gap-2 w-full border-2 border-[var(--accent)] text-[var(--accent)] px-6 py-3 font-semibold hover:bg-[var(--accent)] hover:text-white transition-colors">
                  Or see a sample audit first →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stakes strip */}
      <section className="bg-[var(--accent)] py-6">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
            <span className="text-base md:text-lg text-[var(--accent-foreground)] font-semibold">Generic messaging</span>
            <span className="text-[var(--accent-foreground)]">→</span>
            <span className="text-base md:text-lg text-[var(--accent-foreground)] font-semibold">Looks like everyone</span>
            <span className="text-[var(--accent-foreground)]">→</span>
            <span className="text-base md:text-lg text-[var(--accent-foreground)] font-semibold">Price comparison</span>
            <span className="text-[var(--accent-foreground)]">→</span>
            <span className="text-base md:text-lg text-[var(--accent-foreground)] font-semibold">Margins erode</span>
          </div>
        </div>
      </section>

      {/* What we scan */}
      <section className="px-4 md:px-8 lg:px-12 py-20 md:py-28">
        <div className="max-w-6xl mx-auto">
          <p className="text-label mb-4 text-center">WHAT THE REPORT COVERS</p>
          <h2 className="text-section text-4xl md:text-5xl lg:text-6xl mb-6 text-center">
            Every page. Every phrase. Every fix.
          </h2>
          <p className="text-body text-lg text-[var(--muted-foreground)] text-center mb-16 max-w-2xl mx-auto">
            Your proof points exist - they&apos;re just buried. We find them and show you exactly where to use them.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="border-2 border-[var(--border)] p-6">
              <svg className="w-8 h-8 mb-4 text-[var(--foreground)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 9.5L12 4l9 5.5M3 9.5v9l9 5.5m-9-14.5l9 5.5m0 0l9-5.5m-9 5.5v9m9-14.5v9l-9 5.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p className="text-section text-lg mb-2">Homepage</p>
              <p className="text-body text-sm text-[var(--muted-foreground)]">First impressions, hero messaging, value prop clarity</p>
            </div>
            <div className="border-2 border-[var(--border)] p-6">
              <svg className="w-8 h-8 mb-4 text-[var(--foreground)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p className="text-section text-lg mb-2">All pages</p>
              <p className="text-body text-sm text-[var(--muted-foreground)]">About, services, capabilities, process, contact - the whole site</p>
            </div>
            <div className="border-2 border-[var(--border)] p-6">
              <svg className="w-8 h-8 mb-4 text-[var(--foreground)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p className="text-section text-lg mb-2">LinkedIn</p>
              <p className="text-body text-sm text-[var(--muted-foreground)]">Company page, posts, employee voices, engagement signals</p>
            </div>
            <div className="border-2 border-[var(--border)] p-6">
              <svg className="w-8 h-8 mb-4 text-[var(--foreground)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p className="text-section text-lg mb-2">Hidden gems</p>
              <p className="text-body text-sm text-[var(--muted-foreground)]">Case studies, testimonials, project details, buried proof points</p>
            </div>
          </div>
        </div>
      </section>

      {/* Free vs Paid comparison */}
      <section className="px-4 md:px-8 lg:px-12 py-20 md:py-28 bg-[var(--muted)]">
        <div className="max-w-6xl mx-auto">
          <p className="text-label mb-4 text-center">HOW IT WORKS</p>
          <h2 className="text-section text-4xl md:text-5xl lg:text-6xl mb-6 text-center">
            Critical issues free. <span className="text-[var(--muted-foreground)]">Full fix-it list $400.</span>
          </h2>
          <p className="text-body text-lg text-[var(--muted-foreground)] text-center mb-16 max-w-2xl mx-auto">
            See your worst problems instantly. The full report is what messaging consultants charge $5,000+ for, minus the 6-week timeline.
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free: Critical Issues */}
            <div className="border-2 border-[var(--success)] p-8 bg-[var(--background)] relative">
              <div className="absolute -top-3 right-8 bg-[var(--success)] text-[var(--background)] px-3 py-1 text-xs font-bold">
                NO CREDIT CARD
              </div>
              <div className="mb-4">
                <span className="bg-[var(--success)] text-white px-3 py-1 text-sm font-bold">FREE</span>
                <p className="text-section text-xl mt-2">Critical issues</p>
              </div>
              <p className="text-body text-sm text-[var(--muted-foreground)] mb-6">Real findings. Not a teaser.</p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-[var(--success)] text-lg shrink-0">✓</span>
                  <span className="text-body"><strong>Commodity score:</strong> how generic you sound vs. competitors</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[var(--success)] text-lg shrink-0">✓</span>
                  <span className="text-body"><strong>Top 5 deal-killers:</strong> the lines hurting you most</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[var(--success)] text-lg shrink-0">✓</span>
                  <span className="text-body"><strong>Full report structure:</strong> see what we found on every page</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[var(--muted-foreground)] text-lg shrink-0">○</span>
                  <span className="text-[var(--muted-foreground)]">Specific rewrites locked until purchase</span>
                </li>
              </ul>
            </div>

            {/* Full: Complete Fix-It List */}
            <div className="border-2 border-[var(--accent)] p-8 bg-[var(--background)] relative">
              <div className="absolute -top-3 right-8 bg-[var(--accent)] text-[var(--accent-foreground)] px-3 py-1 text-xs font-bold">
                COMPLETE
              </div>
              <div className="mb-4">
                <span className="bg-[var(--accent)] text-[var(--accent-foreground)] px-3 py-1 text-sm font-bold">$400</span>
                <p className="text-section text-xl mt-2">Full fix-it list</p>
              </div>
              <p className="text-body text-sm text-[var(--muted-foreground)] mb-6">20+ page report. Closes one extra deal = pays for itself 250×</p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-[var(--accent)] text-lg shrink-0">✓</span>
                  <span className="text-body">Everything in critical issues</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[var(--accent)] text-lg shrink-0">✓</span>
                  <span className="text-body"><strong>Every page scored,</strong> prioritized by impact</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[var(--accent)] text-lg shrink-0">✓</span>
                  <span className="text-body"><strong>Copy-paste rewrites:</strong> exact sentences to use</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[var(--accent)] text-lg shrink-0">✓</span>
                  <span className="text-body"><strong>Buried proof points:</strong> the gold we found on your site</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[var(--accent)] text-lg shrink-0">✓</span>
                  <span className="text-body"><strong>Voice consistency:</strong> where you sound corporate vs. human</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* The problem */}
      <section className="px-4 md:px-8 lg:px-12 py-20 md:py-28">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <p className="text-label mb-4">THE REAL PROBLEM</p>
              <h2 className="text-section text-4xl md:text-5xl lg:text-6xl mb-8">
                Your work is excellent. Your website says &ldquo;we do quality work.&rdquo; <span className="text-[var(--muted-foreground)]">Yawn.</span>
              </h2>
              <p className="text-body text-xl md:text-2xl">
                You&apos;ve built something genuinely better. But your website sounds exactly like the other three contractors they&apos;re considering. So they put you in a spreadsheet and pick the cheapest one.
              </p>
            </div>

            <div className="flex items-center justify-center">
              <div className="text-center">
                <span className="text-display text-[7rem] md:text-[10rem] text-[var(--border)] block leading-none">
                  78
                </span>
                <span className="text-body text-lg text-[var(--muted-foreground)]">
                  Average website commodity score
                </span>
                <span className="text-body text-sm text-[var(--muted-foreground)] block mt-2">
                  (That&apos;s &ldquo;indistinguishable from competitors&rdquo;)
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ROI calculation */}
      <ROICalculator toolCost={400} />

      {/* Before/After Examples */}
      <section className="px-4 md:px-8 lg:px-12 py-20 md:py-28 border-t-2 border-[var(--border)]">
        <div className="max-w-6xl mx-auto">
          <p className="text-label mb-4 text-center">SEE THE DIFFERENCE</p>
          <h2 className="text-section text-4xl md:text-5xl mb-16 text-center">
            Generic → <span className="text-[var(--foreground)]">Differentiated</span>
          </h2>

          <div className="space-y-12 max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-red-500/10 border border-red-500/30 p-6">
                <p className="text-red-700 text-xs font-bold mb-3">❌ BEFORE</p>
                <p className="text-body italic">&ldquo;We are dedicated to providing quality craftsmanship and exceptional customer service.&rdquo;</p>
              </div>
              <div className="bg-green-500/10 border border-green-500/30 p-6">
                <p className="text-green-700 text-xs font-bold mb-3">✓ AFTER</p>
                <p className="text-body italic">&ldquo;Last year we completed 23 projects. Zero callbacks. The Riverside job came in $47K under budget because our crews caught the structural issue before it hit the schedule.&rdquo;</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-red-500/10 border border-red-500/30 p-6">
                <p className="text-red-700 text-xs font-bold mb-3">❌ BEFORE</p>
                <p className="text-body italic">&ldquo;Our experienced team delivers innovative solutions tailored to your needs.&rdquo;</p>
              </div>
              <div className="bg-green-500/10 border border-green-500/30 p-6">
                <p className="text-green-700 text-xs font-bold mb-3">✓ AFTER</p>
                <p className="text-body italic">&ldquo;Your project manager, Sarah Chen, has delivered 14 pharmaceutical cleanrooms - including the Pfizer facility 3 miles from your site.&rdquo;</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-red-500/10 border border-red-500/30 p-6">
                <p className="text-red-700 text-xs font-bold mb-3">❌ BEFORE</p>
                <p className="text-body italic">&ldquo;We have been serving the [region] area for over 25 years.&rdquo;</p>
              </div>
              <div className="bg-green-500/10 border border-green-500/30 p-6">
                <p className="text-green-700 text-xs font-bold mb-3">✓ AFTER</p>
                <p className="text-body italic">&ldquo;147 projects in [region]. 12 repeat clients who&apos;ve hired us 3+ times. The Murphy plant expansion - the one off Highway 9 - that was us.&rdquo;</p>
              </div>
            </div>
          </div>

          <p className="text-center text-[var(--muted-foreground)] mt-12">
            These aren&apos;t templates. We find YOUR buried proof points and show you exactly where to use them.
          </p>
        </div>
      </section>

      {/* What we find */}
      <section className="px-4 md:px-8 lg:px-12 py-20 md:py-28 bg-[var(--muted)]">
        <div className="max-w-6xl mx-auto">
          <p className="text-label mb-4">WHAT WE DIG UP</p>
          <h2 className="text-section text-4xl md:text-5xl lg:text-6xl mb-12">
            Your best stories are already there.
            <br />
            <span className="text-[var(--foreground)]">Buried where no buyer will find them.</span>
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-[var(--background)] p-6 border-l-4 border-[var(--accent)]">
              <p className="text-[var(--accent)] text-sm font-bold mb-2">TESTIMONIALS</p>
              <p className="text-section text-xl mb-3">Hidden on page 47</p>
              <p className="text-body">That glowing quote from your biggest client? Buried in a case study nobody reads. We find it and show you where to surface it.</p>
            </div>

            <div className="bg-[var(--background)] p-6 border-l-4 border-[var(--accent)]">
              <p className="text-[var(--accent)] text-sm font-bold mb-2">SPECIFICS</p>
              <p className="text-section text-xl mb-3">The numbers that prove it</p>
              <p className="text-body">Project counts, completion rates, dollar figures - the proof is in your project descriptions. We extract it for headlines.</p>
            </div>

            <div className="bg-[var(--background)] p-6 border-l-4 border-[var(--accent)]">
              <p className="text-[var(--accent)] text-sm font-bold mb-2">DIFFERENTIATORS</p>
              <p className="text-section text-xl mb-3">What makes you actually different</p>
              <p className="text-body">Your process, your people, your track record. We find the real differences hiding in your LinkedIn posts and project pages.</p>
            </div>

            <div className="bg-[var(--background)] p-6 border-l-4 border-[var(--accent)]">
              <p className="text-[var(--accent)] text-sm font-bold mb-2">CLAIMS</p>
              <p className="text-section text-xl mb-3">Provable statements</p>
              <p className="text-body">&ldquo;Quality work&rdquo; is a claim. &ldquo;Zero callbacks on 23 projects&rdquo; is proof. We turn your vague claims into specific proof.</p>
            </div>

            <div className="bg-[var(--background)] p-6 border-l-4 border-[var(--accent)]">
              <p className="text-[var(--accent)] text-sm font-bold mb-2">VOICE</p>
              <p className="text-section text-xl mb-3">How you actually talk</p>
              <p className="text-body">Your LinkedIn posts sound like you. Your website sounds like a brochure. We find your real voice and show you how to use it.</p>
            </div>

            <div className="bg-[var(--background)] p-6 border-l-4 border-[var(--accent)]">
              <p className="text-[var(--accent)] text-sm font-bold mb-2">GAPS</p>
              <p className="text-section text-xl mb-3">What&apos;s missing entirely</p>
              <p className="text-body">No pricing guidance? No process explanation? No credentials? We flag what buyers need that you&apos;re not providing.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 md:px-8 lg:px-12 py-20 md:py-28">
        <div className="max-w-3xl mx-auto">
          <p className="text-label mb-4 text-center">FREQUENTLY ASKED</p>
          <h2 className="text-section text-3xl md:text-4xl mb-12 text-center">Common questions</h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-base mb-1">How long does the scan take?</h3>
              <p className="text-body text-sm text-[var(--muted-foreground)]">
                Usually 2-5 minutes depending on site size. We crawl multiple pages, check your LinkedIn, and analyze everything before showing results. You&apos;ll see a progress indicator.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-1">What kind of companies is this for?</h3>
              <p className="text-body text-sm text-[var(--muted-foreground)]">
                Manufacturers, contractors, and service companies that sell to other businesses. If you&apos;re competing on bids and losing to lesser competitors with better marketing, this is for you.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-1">What&apos;s a &ldquo;commodity phrase&rdquo;?</h3>
              <p className="text-body text-sm text-[var(--muted-foreground)]">
                Phrases like &ldquo;quality craftsmanship,&rdquo; &ldquo;customer-focused,&rdquo; &ldquo;innovative solutions.&rdquo; They feel safe. They&apos;re also invisible - buyers have read them 50 times this week. When everyone says the same thing, nobody says anything.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-1">How specific are the copy recommendations?</h3>
              <p className="text-body text-sm text-[var(--muted-foreground)]">
                Specific enough to use. If we find a testimonial buried on page 12, we&apos;ll tell you exactly which headline to replace with it. If your about page says &ldquo;experienced team,&rdquo; we&apos;ll hand you: &ldquo;147 projects. 12 repeat clients. Zero callbacks.&rdquo;
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-1">Do you scan competitor sites too?</h3>
              <p className="text-body text-sm text-[var(--muted-foreground)]">
                The full audit includes competitor comparison - we&apos;ll show you how your messaging stacks up against 2-3 competitors you name. See exactly where they&apos;re outpositioning you.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-1">What if we don&apos;t have a LinkedIn page?</h3>
              <p className="text-body text-sm text-[var(--muted-foreground)]">
                We&apos;ll still scan your website thoroughly. LinkedIn just gives us more material to work with - employee posts, company updates, engagement patterns. The more content you have, the more proof points we can extract.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-1">Is my data secure?</h3>
              <p className="text-body text-sm text-[var(--muted-foreground)]">
                We only scan publicly visible pages. We don&apos;t store your website content after analysis. The audit results are stored temporarily so you can access them, then deleted after 30 days.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Who this is for */}
      <section className="px-4 md:px-8 lg:px-12 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mx-auto">
            <p className="text-label mb-6 text-center">THIS IS FOR YOU IF</p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-[var(--success)] text-xl">✓</span>
                <p className="text-body text-lg">You make it to final 3 but rarely win without being cheapest</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-[var(--success)] text-xl">✓</span>
                <p className="text-body text-lg">Your website was last updated when flip phones were still cool</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-[var(--success)] text-xl">✓</span>
                <p className="text-body text-lg">You know you&apos;re better but can&apos;t prove it online</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-[var(--success)] text-xl">✓</span>
                <p className="text-body text-lg">You want specific fixes, not a 6-month branding project</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-6 bg-[var(--muted)]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-display text-4xl mb-4">
            Stop sounding like everyone else
          </h2>
          <p className="text-body text-xl mb-8">
            Get your critical issues free. Make improvements. Come back when you&apos;re ready for more.
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="bg-[var(--accent)] text-white px-8 py-4 text-lg font-bold hover:opacity-90 transition-opacity"
          >
            Scan my website →
          </button>
          <p className="text-[var(--muted-foreground)] text-sm mt-4">
            No credit card required
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 md:px-8 lg:px-12 py-16 bg-[var(--foreground)] text-[var(--background)]">
        <div className="max-w-6xl mx-auto">
          {/* Credibility */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
            <div className="max-w-2xl">
              <p className="text-lg md:text-xl text-[var(--background)]/90">
                Built by <a href="https://leefuhr.com" className="text-white underline hover:no-underline">Lee Fuhr</a>. I&apos;ve helped manufacturers differentiate for years. The pattern is always the same: their work is excellent, their website says &ldquo;quality craftsmanship.&rdquo; This tool finds the proof that&apos;s already there and shows you where to use it.
              </p>
            </div>
            <Link href="/sample" className="inline-flex items-center gap-2 border-2 border-white text-white px-6 py-3 font-semibold hover:bg-white hover:text-[var(--foreground)] transition-colors min-h-[44px] shrink-0">
              See sample audit
            </Link>
          </div>

          {/* More tools */}
          <p className="text-xs font-bold tracking-wider text-[var(--background)]/60 mb-6 text-center">MORE TOOLS FOR MANUFACTURERS</p>
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <a href="https://proposal-analyzer.vercel.app" className="p-6 border border-[var(--background)]/20 hover:border-[var(--background)]/50 transition-colors">
              <p className="text-lg font-semibold text-white mb-2">Proposal analyzer</p>
              <p className="text-sm text-[var(--background)]/70">Stop losing winnable bids. Find where your proposal sounds like everyone else.</p>
            </a>
            <a href="https://case-study-extractor.vercel.app" className="p-6 border border-[var(--background)]/20 hover:border-[var(--background)]/50 transition-colors">
              <p className="text-lg font-semibold text-white mb-2">Case study extractor</p>
              <p className="text-sm text-[var(--background)]/70">Turn project photos and invoices into sales-ready case studies in 5 minutes.</p>
            </a>
            <a href="https://risk-translator.vercel.app" className="p-6 border border-[var(--background)]/20 hover:border-[var(--background)]/50 transition-colors">
              <p className="text-lg font-semibold text-white mb-2">Risk translator</p>
              <p className="text-sm text-[var(--background)]/70">Translate your specs into risk language that gets purchasing to approve the budget.</p>
            </a>
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-8 border-t border-[var(--background)]/20 relative">
            <p className="text-sm text-[var(--background)]/60">
              Lee Fuhr Inc © 2025
            </p>
            <nav className="flex gap-8">
              <Link href="/sample" className="text-sm text-[var(--background)]/60 hover:text-white transition-colors">
                See sample
              </Link>
              <Link href="/privacy" className="text-sm text-[var(--background)]/60 hover:text-white transition-colors">
                Privacy
              </Link>
            </nav>
            <span className="absolute bottom-0 right-0 text-[10px] text-[var(--background)]/30 font-mono">v{VERSION}</span>
          </div>
        </div>
      </footer>
    </main>
  )
}
