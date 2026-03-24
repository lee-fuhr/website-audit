'use client'

import { safeClipboardWrite } from '@/lib/utils'
import { AnalysisResponse, PreviewData } from './types'

interface PageHeaderProps {
  companyName: string
  hostname: string
  preview: PreviewData
  data: AnalysisResponse
}

export function PageHeader({ companyName, hostname, preview, data }: PageHeaderProps) {
  return (
    <header className="border-b-4 border-[var(--accent)] py-8 md:py-12">
      <div className="container">
        <p className="text-label mb-2">WEBSITE MESSAGING AUDIT</p>
        <h1 className="text-display mb-4 capitalize">{companyName}</h1>
        <div className="flex flex-wrap gap-4 text-[var(--muted-foreground)]">
          <span>
            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
          <span>·</span>
          <span>Prepared by Lee Fuhr</span>
          <span>·</span>
          <span className="font-mono">{hostname}</span>
          {preview.siteSnapshot.hasLinkedIn && (
            <>
              <span>·</span>
              <span className="text-[var(--success)]">LinkedIn found ✓</span>
            </>
          )}
          {data.socialUrls && data.socialUrls.length > 0 && (
            <>
              <span>·</span>
              <span className="text-[var(--success)]">
                {data.socialUrls.length} social{data.socialUrls.length !== 1 ? 's' : ''} added ✓
              </span>
            </>
          )}
        </div>

        {/* SPA Warning */}
        {preview.siteSnapshot.spaWarning?.isSPA && (
          <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-yellow-800">JavaScript-rendered site detected</p>
                <p className="text-sm text-yellow-700 mt-1">{preview.siteSnapshot.spaWarning.message}</p>
                <details className="mt-2">
                  <summary className="text-xs text-yellow-600 cursor-pointer hover:text-yellow-800">
                    Technical details
                  </summary>
                  <ul className="text-xs text-yellow-600 mt-1 ml-4 list-disc">
                    {preview.siteSnapshot.spaWarning.indicators.map((ind) => (
                      <li key={ind}>{ind}</li>
                    ))}
                  </ul>
                </details>
              </div>
            </div>
          </div>
        )}

        {/* Share buttons */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => {
              const url = window.location.href
              const text = `Check out this website messaging audit for ${companyName}`
              window.open(
                `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`,
                '_blank',
              )
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-[var(--border)] hover:bg-[var(--muted)] transition-colors rounded"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="22,6 12,13 2,6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Share via email
          </button>
          <button
            onClick={() => {
              const url = window.location.href
              window.open(
                `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
                '_blank',
                'width=600,height=400',
              )
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-[var(--border)] hover:bg-[var(--muted)] transition-colors rounded"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            Share on LinkedIn
          </button>
          <button
            onClick={async () => {
              const url = window.location.href
              const result = await safeClipboardWrite(url)
              if (result.success) {
                const btn = document.getElementById('copy-link-btn')
                if (btn) {
                  btn.textContent = '✓ Copied!'
                  setTimeout(() => {
                    btn.textContent = 'Copy share link'
                  }, 1500)
                }
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-[var(--border)] hover:bg-[var(--muted)] transition-colors rounded"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span id="copy-link-btn">Copy share link</span>
          </button>
        </div>
      </div>
    </header>
  )
}
