import Link from 'next/link'
import { VERSION } from '@/lib/version'
import { PRICING } from '@shared/config/pricing'

export function HomeFooter() {
  return (
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <a href="https://areyougeneric.com" className="p-5 border border-[var(--background)]/20 hover:border-[var(--background)]/50 transition-colors">
            <p className="text-xs font-bold tracking-wider text-[var(--background)]/50 mb-1">FREE</p>
            <p className="text-base font-semibold text-white mb-1">Commodity test</p>
            <p className="text-xs text-[var(--background)]/70">Score your website messaging in 2 minutes.</p>
          </a>
          <a href="https://proposal-analyzer.vercel.app" className="p-5 border border-[var(--background)]/20 hover:border-[var(--background)]/50 transition-colors">
            <p className="text-xs font-bold tracking-wider text-[var(--background)]/50 mb-1">${PRICING['proposal-analyzer'].base}</p>
            <p className="text-base font-semibold text-white mb-1">Proposal analyzer</p>
            <p className="text-xs text-[var(--background)]/70">Stop losing winnable bids to generic proposal language.</p>
          </a>
          <a href="https://case-study-extractor.vercel.app" className="p-5 border border-[var(--background)]/20 hover:border-[var(--background)]/50 transition-colors">
            <p className="text-xs font-bold tracking-wider text-[var(--background)]/50 mb-1">${PRICING['case-study-extractor'].base}</p>
            <p className="text-base font-semibold text-white mb-1">Case study extractor</p>
            <p className="text-xs text-[var(--background)]/70">Turn project photos and invoices into sales-ready case studies.</p>
          </a>
          <a href="https://risk-translator.vercel.app" className="p-5 border border-[var(--background)]/20 hover:border-[var(--background)]/50 transition-colors">
            <p className="text-xs font-bold tracking-wider text-[var(--background)]/50 mb-1">${PRICING['risk-translator'].base}</p>
            <p className="text-base font-semibold text-white mb-1">Risk translator</p>
            <p className="text-xs text-[var(--background)]/70">Translate your specs into cost-of-failure language.</p>
          </a>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-8 border-t border-[var(--background)]/20 relative">
          <p className="text-sm text-[var(--background)]/60">
            Lee Fuhr Inc © {new Date().getFullYear()}
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
  )
}
