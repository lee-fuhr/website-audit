/**
 * Voice analysis tab panel for the results page.
 */

import { ViewNavBar } from '@/components/ViewNavBar'
import { FullResults, ViewType, ViewDef } from './types'

interface VoiceAnalysisViewProps {
  data: FullResults
  showAllViews: boolean
  currentView: ViewType
  prevView: ViewDef | null
  nextView: ViewDef | null
  onViewChange: (view: ViewType) => void
}

export function VoiceAnalysisView({ data, showAllViews, currentView, prevView, nextView, onViewChange }: VoiceAnalysisViewProps) {
  if (!showAllViews && currentView !== 'voice') return null

  return (
    <div role="tabpanel" id="tabpanel-voice" aria-labelledby="tab-voice">
      <ViewNavBar prevView={prevView} nextView={nextView} onNavigate={onViewChange} />
      <section className="section">
        <div className="container">
          <h2 className="text-section mb-6">Voice analysis</h2>
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-white border-2 border-[var(--border)] p-6 rounded">
              <h3 className="text-subsection mb-4">Current tone</h3>
              <p className="text-body">{data.voiceAnalysis.currentTone}</p>
            </div>
            <div className="bg-white border-2 border-[var(--accent)] p-6 rounded">
              <h3 className="text-subsection mb-4">Your authentic voice</h3>
              <p className="text-body">{data.voiceAnalysis.authenticVoice}</p>
            </div>
          </div>
          {data.voiceAnalysis.examples.length > 0 && (
            <div>
              <h3 className="text-subsection mb-4">Examples from your site</h3>
              <ul className="space-y-3">
                {data.voiceAnalysis.examples.map((example, i) => (
                  <li key={`voice-example-${i}`} className="flex items-start gap-3 text-body">
                    <span className="text-[var(--accent)] shrink-0">→</span>
                    <span>{example}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
