'use client'

import { TrustView } from '@/components/TrustView'

type ViewType = 'overview' | 'message' | 'audience' | 'trust' | 'copy'
type ViewNavItem = { id: ViewType; label: string; description: string } | null

type TrustItem = {
  signal: string
  present: boolean
  visible: string
  quality: string
  action: string
}

type AuditTrustViewProps = {
  isPaid: boolean
  showAllViews: boolean
  onUnlock: () => void
  prevView: ViewNavItem
  nextView: ViewNavItem
  onNavigate: (view: ViewType) => void
  trustInventory: TrustItem[]
}

export function AuditTrustView(props: AuditTrustViewProps) {
  return (
    <div role="tabpanel" id="tabpanel-trust" aria-labelledby="tab-trust">
      <TrustView {...props} />
    </div>
  )
}
