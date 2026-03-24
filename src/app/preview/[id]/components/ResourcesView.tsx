'use client'

import { ViewNavBar } from '@/components/ViewNavBar'
import { PRICING } from '@shared/config/pricing'
import { AnalysisResponse, PreviewData, ViewType } from './types'

const AUDIT_PRICE = `$${PRICING['website-audit'].base}`
import { SwipeFile } from './resources/SwipeFile'
import { CopywriterBrief } from './resources/CopywriterBrief'
import { TrustChecklist } from './resources/TrustChecklist'
import { CompetitorHeadlines } from './resources/CompetitorHeadlines'

interface View {
  id: ViewType
  label: string
  description?: string
}

interface ResourcesViewProps {
  preview: PreviewData
  data: AnalysisResponse
  companyName: string
  hostname: string
  hasCompetitorData: boolean
  isUnlocked: boolean
  isCheckingOut: boolean
  prevView: View | null
  nextView: View | null
  onNavigate: (view: ViewType) => void
  onUnlock: () => void
  onDownloadSwipePDF: () => void
  onDownloadBriefPDF: () => void
}

export function ResourcesView({
  preview,
  data,
  companyName,
  hostname,
  hasCompetitorData,
  isUnlocked,
  isCheckingOut,
  prevView,
  nextView,
  onNavigate,
  onUnlock,
  onDownloadSwipePDF,
  onDownloadBriefPDF,
}: ResourcesViewProps) {
  const totalRewrites = preview.topIssues.reduce(
    (acc, issue) => acc + (issue.findings?.length || 0),
    0,
  )

  return (
    <ViewNavBar prevView={prevView} nextView={nextView} onNavigate={onNavigate}>
      <section className="bg-white py-12 px-4 sm:px-6 lg:px-8 min-h-[60vh]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-section mb-2">Resources</h2>
          <p className="text-body-lg text-[var(--muted-foreground)] mb-8">
            Everything you need to implement changes or hand off to a copywriter.
          </p>

          {/* Gated teaser for free users */}
          {!isUnlocked && (
            <>
              {[
                {
                  title: 'Swipe file',
                  desc: `All ${totalRewrites} rewrites in one place, ready to copy and paste.`,
                  lock: 'Unlock to access your full swipe file',
                },
                {
                  title: 'Copywriter brief',
                  desc: 'A one-page summary you can hand to a copywriter or share with your team.',
                  lock: 'Unlock to download your copywriter brief',
                },
                {
                  title: 'Trust signal checklist',
                  desc: 'Specific proof points to add to your site, with copy suggestions and placement tips.',
                  lock: 'Unlock to access your personalized checklist',
                },
                {
                  title: 'Competitor comparison',
                  desc: 'Side-by-side analysis of your strongest and weakest areas vs. each competitor.',
                  lock: 'Unlock to see detailed competitor breakdowns',
                },
              ].map(({ title, desc, lock }) => (
                <div key={title} className="mb-8">
                  <h3 className="text-subsection mb-4">{title}</h3>
                  <p className="text-body text-[var(--muted-foreground)] mb-4">{desc}</p>
                  <div className="p-6 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg text-center">
                    <p className="text-[var(--muted-foreground)]">🔒 {lock}</p>
                  </div>
                </div>
              ))}

              <div className="mt-12 p-8 bg-gradient-to-br from-[var(--accent)] to-[#1e3a5f] rounded-lg text-center">
                <h3 className="text-xl font-bold text-white mb-2">Unlock your full resource kit</h3>
                <p className="text-sm text-white/80 mb-6">
                  Swipe file, copywriter brief, trust checklist, and competitor analysis - all
                  export-ready.
                </p>
                <button
                  onClick={onUnlock}
                  disabled={isCheckingOut}
                  className="bg-white text-[var(--accent)] px-8 py-3 text-lg font-bold hover:bg-white/90 transition-all shadow-lg disabled:opacity-50"
                >
                  {isCheckingOut ? 'Starting checkout...' : `Unlock resources — ${AUDIT_PRICE}`}
                </button>
              </div>
            </>
          )}

          {/* Unlocked content */}
          {isUnlocked && (
            <>
              <SwipeFile
                preview={preview}
                totalRewrites={totalRewrites}
                onDownloadPDF={onDownloadSwipePDF}
              />

              <CopywriterBrief
                preview={preview}
                data={data}
                companyName={companyName}
                hasCompetitorData={hasCompetitorData}
                onDownloadPDF={onDownloadBriefPDF}
              />

              <TrustChecklist preview={preview} />

              {hasCompetitorData && data?.competitorComparison?.detailedScores && (
                <CompetitorHeadlines
                  preview={preview}
                  hostname={hostname}
                  detailedScores={data.competitorComparison.detailedScores}
                />
              )}
            </>
          )}
        </div>
      </section>
    </ViewNavBar>
  )
}
