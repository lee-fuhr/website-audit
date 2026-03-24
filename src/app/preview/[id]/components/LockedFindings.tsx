'use client'

import { safeClipboardWrite } from '@/lib/utils'
import { createTextFragmentUrl } from './preview-utils'
import { PRICING } from '@shared/config/pricing'
import { PreviewData } from './types'

const AUDIT_PRICE = `$${PRICING['website-audit'].base}`

interface LockedFindingsProps {
  onUnlock: () => void
  showTeaser?: boolean
  teaserFinding?: PreviewData['teaserFinding']
  isUnlocked?: boolean
}

export function LockedFindings({
  onUnlock,
  showTeaser = false,
  teaserFinding,
  isUnlocked = false,
}: LockedFindingsProps) {
  // If test-unlocked, return empty (findings shown elsewhere)
  if (isUnlocked) return null

  return (
    <div className="my-6">
      {showTeaser && teaserFinding && (
        <div className="mb-4 p-4 bg-white border-2 border-[var(--accent)] rounded">
          <p className="text-xs font-bold text-[var(--accent)] mb-3">REAL FINDING FROM YOUR SITE:</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-3 bg-red-50 border-l-4 border-red-400">
              <p className="text-xs font-bold text-[var(--score-poor)] mb-1">❌ CURRENT</p>
              <p className="text-sm italic text-[var(--foreground)]">&quot;{teaserFinding.phrase}&quot;</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-2">
                Found: {teaserFinding.location}
                {teaserFinding.pageUrl && (
                  <a
                    href={createTextFragmentUrl(teaserFinding.pageUrl, teaserFinding.phrase)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 inline-flex items-center text-[var(--accent)] hover:text-[var(--accent-hover)]"
                    title="View source page"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                )}
              </p>
            </div>
            <div className="p-3 bg-green-50 border-l-4 border-green-500">
              <div className="flex justify-between items-start gap-2 mb-1">
                <p className="text-xs font-bold text-[var(--score-excellent)]">✓ SUGGESTED REWRITE</p>
                <button
                  onClick={async () => {
                    const result = await safeClipboardWrite(teaserFinding.rewrite)
                    const el = document.getElementById('copy-rewrite-btn')
                    if (el) {
                      el.textContent = result.success ? '✓ Copied' : '✗ Failed'
                      setTimeout(() => { el.textContent = 'Copy' }, 1500)
                    }
                  }}
                  id="copy-rewrite-btn"
                  className="text-xs px-2 py-0.5 bg-white border border-green-300 rounded hover:bg-green-100 transition-colors text-green-700 font-medium"
                >
                  Copy
                </button>
              </div>
              <p className="text-sm text-[var(--foreground)]">&quot;{teaserFinding.rewrite}&quot;</p>
            </div>
          </div>
          <p className="text-xs text-[var(--muted-foreground)] mt-3 p-2 bg-[var(--muted)] rounded">
            <strong>Why this matters:</strong> {teaserFinding.problem}
          </p>
          <p className="text-xs text-[var(--accent)] font-medium mt-3">
            Your full audit includes 15-20 rewrites like this, all specific to YOUR site.
          </p>
        </div>
      )}

      {/* Blurred placeholder cards */}
      <div className="relative my-4">
        <div className="space-y-3 select-none pointer-events-none">
          {[0, 1, 2].map(i => (
            <div key={i} className="border border-[var(--border)] p-4 opacity-40">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-2 h-2 rounded-full bg-red-400 mt-1.5 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-[var(--muted-foreground)]/30 rounded w-3/4" />
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="p-2 bg-red-50 border-l-2 border-red-300">
                      <div className="h-2 bg-red-200 rounded w-full mb-1" />
                      <div className="h-2 bg-red-200 rounded w-2/3" />
                    </div>
                    <div className="p-2 bg-green-50 border-l-2 border-green-400">
                      <div className="h-2 bg-green-200 rounded w-full mb-1" />
                      <div className="h-2 bg-green-200 rounded w-3/4" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="absolute inset-0 backdrop-blur-sm bg-[var(--background)]/70 flex items-center justify-center">
          <div className="text-center p-6 max-w-sm">
            <p className="text-sm font-bold text-[var(--foreground)] mb-1">Phrases from your site — with rewrites</p>
            <p className="text-sm text-[var(--muted-foreground)] mb-4">
              Exact copy pulled from your pages. Why it&apos;s costing you. What to replace it with.
            </p>
            <button
              onClick={onUnlock}
              className="bg-[var(--accent)] text-white px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Unlock full audit — {AUDIT_PRICE}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
