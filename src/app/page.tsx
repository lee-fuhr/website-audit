'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { VERSION } from '@/lib/version'
import { PRICING } from '@shared/config/pricing'

const AUDIT_PRICE = `$${PRICING['website-audit'].base}`
import { ROICalculator } from './components/ROICalculator'
import { HomeFooter } from './components/landing/HomeFooter'
import { WhatWeDigUp } from './components/landing/WhatWeDigUp'
import { HomeFAQ } from './components/landing/HomeFAQ'

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
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-[var(--accent)] text-5xl font-black leading-none">15–20</span>
                <span className="text-label">SPECIFIC REWRITES PER SITE</span>
              </div>
              <h1 className="text-display text-[clamp(2.25rem,6vw,5rem)] mb-6">
                Qualified isn&apos;t enough.
                <br />
                <span className="text-[var(--accent)]">Your website needs</span>
                <br />
                to say &lsquo;different.&rsquo;
              </h1>
              <p className="text-body text-xl md:text-2xl max-w-xl mb-4">
                We crawl every page, find every generic phrase, and give you the <strong>exact rewrites</strong>. 15–20 specific fixes per site. Critical issues free. Full list {AUDIT_PRICE}.
              </p>
              <p className="text-sm text-[var(--muted-foreground)] mb-6">27 years helping B2B companies win on value, not price.</p>
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
            <div className="border-2 border-[var(--border)] p-6 card-kinetic">
              <svg className="w-8 h-8 mb-4 text-[var(--foreground)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 9.5L12 4l9 5.5M3 9.5v9l9 5.5m-9-14.5l9 5.5m0 0l9-5.5m-9 5.5v9m9-14.5v9l-9 5.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p className="text-section text-lg mb-2">Homepage</p>
              <p className="text-body text-sm text-[var(--muted-foreground)]">First impressions, hero messaging, value prop clarity</p>
            </div>
            <div className="border-2 border-[var(--border)] p-6 card-kinetic">
              <svg className="w-8 h-8 mb-4 text-[var(--foreground)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p className="text-section text-lg mb-2">All pages</p>
              <p className="text-body text-sm text-[var(--muted-foreground)]">About, services, capabilities, process, contact - the whole site</p>
            </div>
            <div className="border-2 border-[var(--border)] p-6 card-kinetic">
              <svg className="w-8 h-8 mb-4 text-[var(--foreground)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p className="text-section text-lg mb-2">LinkedIn</p>
              <p className="text-body text-sm text-[var(--muted-foreground)]">Company page, posts, employee voices, engagement signals</p>
            </div>
            <div className="border-2 border-[var(--border)] p-6 card-kinetic">
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
            Critical issues free. <span className="text-[var(--muted-foreground)]">Full fix-it list {AUDIT_PRICE}.</span>
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
                <span className="bg-[var(--accent)] text-[var(--accent-foreground)] px-3 py-1 text-sm font-bold">{AUDIT_PRICE}</span>
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
                <span className="text-display text-[7rem] md:text-[10rem] text-[var(--border-subtle)] block leading-none">
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
      <ROICalculator toolCost={PRICING['website-audit'].base} />

      {/* Before/After Examples */}
      <section className="px-4 md:px-8 lg:px-12 py-20 md:py-28 border-t-2 border-[var(--border-subtle)]">
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

      <WhatWeDigUp />

      <HomeFAQ />

      {/* Who this is for */}
      <section className="px-4 md:px-8 lg:px-12 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mx-auto">
            <p className="text-label mb-6 text-center">THIS IS FOR YOU IF</p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-[var(--success)] text-xl">✓</span>
                <p className="text-body text-lg">You have a technical edge that purchasing departments consistently undervalue</p>
              </div>
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

      {/* Free entry points — cross-sells before the audit CTA */}
      <section className="px-4 md:px-8 lg:px-12 py-16 border-t-2 border-[var(--border-subtle)]">
        <div className="max-w-6xl mx-auto">
          <p className="text-label mb-4 text-center">NOT READY FOR {AUDIT_PRICE} YET?</p>
          <h2 className="text-section text-3xl md:text-4xl mb-4 text-center">
            Try free first
          </h2>
          <p className="text-body text-lg text-[var(--muted-foreground)] text-center mb-10 max-w-2xl mx-auto">
            Two free tools that find commodity language — in your proposals and on your site — before you invest in the full audit.
          </p>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* GAP 10: proposal-analyzer */}
            <div className="border-2 border-[var(--border)] p-6 flex flex-col">
              <p className="text-label text-xs mb-3">FREE · PROPOSALS</p>
              <h3 className="text-section text-xl mb-3">
                Your website isn&apos;t the only place commodity language is costing you.
              </h3>
              <p className="text-body text-sm text-[var(--muted-foreground)] mb-6 flex-1">
                Find the weak phrases in your next proposal before it goes out. Top 5 issues free.
              </p>
              <a
                href="https://proposal-analyzer.vercel.app"
                className="inline-flex items-center justify-center border-2 border-[var(--accent)] text-[var(--accent)] px-6 py-3 font-semibold hover:bg-[var(--accent)] hover:text-white transition-colors min-h-[44px]"
              >
                Analyze a proposal — free →
              </a>
            </div>

            {/* GAP 11: commodity-test */}
            <div className="border-2 border-[var(--border)] p-6 flex flex-col">
              <p className="text-label text-xs mb-3">FREE · WEBSITE SCORE</p>
              <h3 className="text-section text-xl mb-3">
                Not sure if your website is the problem? Find out in 30 seconds.
              </h3>
              <p className="text-body text-sm text-[var(--muted-foreground)] mb-6 flex-1">
                Score your site&apos;s commodity language before we write the fixes.
              </p>
              <a
                href="https://areyougeneric.com"
                className="inline-flex items-center justify-center border-2 border-[var(--accent)] text-[var(--accent)] px-6 py-3 font-semibold hover:bg-[var(--accent)] hover:text-white transition-colors min-h-[44px]"
              >
                Get my commodity score — free →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-6 bg-[var(--muted)]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-display text-4xl mb-4">
            Your proof points are in there. Let&apos;s find them.
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

      <HomeFooter />
    </main>
  )
}
