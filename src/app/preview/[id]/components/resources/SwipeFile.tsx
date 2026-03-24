'use client'

import { safeClipboardWrite } from '@/lib/utils'
import { createTextFragmentUrl } from '../preview-utils'
import { PreviewData } from '../types'

interface SwipeFileProps {
  preview: PreviewData
  totalRewrites: number
  onDownloadPDF: () => void
}

export function SwipeFile({ preview, totalRewrites, onDownloadPDF }: SwipeFileProps) {
  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-subsection">Swipe file</h3>
        <div className="flex gap-2">
          <button
            onClick={onDownloadPDF}
            className="text-sm bg-[var(--accent)] text-white px-4 py-2 font-semibold hover:opacity-90 transition-opacity"
          >
            Download PDF
          </button>
          <button
            onClick={async () => {
              const allRewrites = preview.topIssues
                .flatMap((issue) => issue.findings || [])
                .map((f) => `BEFORE: ${f.phrase}\nAFTER: ${f.rewrite}\nWHY: ${f.problem}\n`)
                .join('\n---\n\n')
              const result = await safeClipboardWrite(allRewrites)
              const btn = document.getElementById('copy-swipe-btn')
              if (btn) {
                btn.textContent = result.success ? 'Copied!' : 'Failed'
                setTimeout(() => {
                  btn.textContent = 'Copy all'
                }, 2000)
              }
            }}
            id="copy-swipe-btn"
            className="text-sm bg-gray-200 text-gray-700 px-4 py-2 font-semibold hover:bg-gray-300 transition-opacity"
          >
            Copy all
          </button>
        </div>
      </div>
      <p className="text-body text-[var(--muted-foreground)] mb-4">
        {totalRewrites} rewrites ready to paste. Click any to copy individually, or copy all above.
      </p>
      <div className="space-y-4 max-h-[500px] overflow-y-auto border-2 border-gray-200 rounded-lg p-4">
        {preview.topIssues.flatMap((issue, issueIdx) =>
          (issue.findings || []).map((finding, findingIdx) => {
            const itemId = `swipe-${issueIdx}-${findingIdx}`
            return (
              <div
                key={itemId}
                className="group border-l-4 border-[var(--accent)] bg-gray-50 p-4 rounded-r cursor-pointer hover:bg-green-50 hover:border-green-500 transition-all relative"
                onClick={async () => {
                  await safeClipboardWrite(finding.rewrite)
                  const afterEl = document.getElementById(`${itemId}-after`)
                  if (afterEl) {
                    afterEl.classList.add('bg-green-200', 'scale-[1.02]')
                    afterEl.textContent = '✓ Copied!'
                    setTimeout(() => {
                      afterEl.classList.remove('bg-green-200', 'scale-[1.02]')
                      afterEl.textContent = finding.rewrite
                    }, 500)
                  }
                }}
              >
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs bg-[var(--score-excellent)] text-white px-2 py-1 rounded font-semibold">
                    Click to copy
                  </span>
                </div>
                <p className="text-xs text-[var(--score-poor)] font-medium mb-1">BEFORE</p>
                <p className="text-sm text-gray-500 line-through mb-3">{finding.phrase}</p>
                <p className="text-xs text-[var(--score-excellent)] font-medium mb-1">AFTER</p>
                <p
                  id={`${itemId}-after`}
                  className="text-sm text-[var(--foreground)] font-semibold mb-2 p-2 -m-2 rounded transition-all group-hover:bg-green-100"
                >
                  {finding.rewrite}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {finding.location}
                  {finding.pageUrl && (
                    <a
                      href={createTextFragmentUrl(finding.pageUrl, finding.phrase)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="ml-1 inline-flex items-center text-[var(--accent)] hover:text-[var(--accent-hover)]"
                      title="View source page"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-3 h-3"
                      >
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </a>
                  )}
                </p>
              </div>
            )
          }),
        )}
      </div>
    </div>
  )
}
