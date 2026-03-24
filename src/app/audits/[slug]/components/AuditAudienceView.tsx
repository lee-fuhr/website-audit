'use client'

import { AudienceView } from '@/components/AudienceView'

type ViewType = 'overview' | 'message' | 'audience' | 'trust' | 'copy'
type ViewNavItem = { id: ViewType; label: string; description: string } | null

type Competitor = {
  name: string
  positioning: string
  strength: string
  weakness: string
}

type AuditAudienceViewProps = {
  isPaid: boolean
  showAllViews: boolean
  onUnlock: () => void
  prevView: ViewNavItem
  nextView: ViewNavItem
  onNavigate: (view: ViewType) => void
  competitors: Competitor[]
}

export function AuditAudienceView(props: AuditAudienceViewProps) {
  return (
    <div role="tabpanel" id="tabpanel-audience" aria-labelledby="tab-audience">
      <AudienceView {...props} />
    </div>
  )
}
