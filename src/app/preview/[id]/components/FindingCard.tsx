'use client'

import { safeClipboardWrite } from '@/lib/utils'
import { createTextFragmentUrl } from './preview-utils'
import { Finding } from './types'

interface FindingCardProps {
  finding: Finding
  showCopyButton?: boolean
}

export function FindingCard({ finding, showCopyButton = true }: FindingCardProps) {
  return (
    <div className="border-2 border-[var(--border)] rounded-lg overflow-hidden">
      <div className="grid md:grid-cols-2 gap-0">
        <div className="p-4 bg-red-50 border-r border-[var(--border)]">
          <p className="text-xs font-bold text-[var(--score-poor)] mb-2">❌ CURRENT</p>
          <p className="text-sm text-[var(--foreground)]">{finding.phrase}</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-2">
            Found: {finding.location}
            {finding.pageUrl && (
              <a
                href={createTextFragmentUrl(finding.pageUrl, finding.phrase)}
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
        <div className="p-4 bg-green-50">
          <div className="flex justify-between items-start gap-2 mb-2">
            <p className="text-xs font-bold text-[var(--score-excellent)]">✓ REWRITE</p>
            {showCopyButton && (
              <button
                onClick={async (e) => {
                  e.stopPropagation()
                  const btn = e.currentTarget
                  await safeClipboardWrite(finding.rewrite)
                  btn.textContent = '✓ Copied'
                  setTimeout(() => { btn.textContent = 'Copy' }, 1500)
                }}
                className="text-xs px-2 py-0.5 bg-white border border-green-300 rounded hover:bg-green-100 transition-colors text-green-700 font-medium"
              >
                Copy
              </button>
            )}
          </div>
          <p className="text-sm text-[var(--foreground)]">{finding.rewrite}</p>
        </div>
      </div>
      <div className="p-3 bg-[var(--muted)] border-t border-[var(--border)]">
        <p className="text-sm text-[var(--foreground)]">
          <strong>Why this matters:</strong> {finding.problem}
        </p>
      </div>
    </div>
  )
}
