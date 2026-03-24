'use client'

import { MessageView } from '@/components/MessageView'

type ViewType = 'overview' | 'message' | 'audience' | 'trust' | 'copy'
type ViewNavItem = { id: ViewType; label: string; description: string } | null

type AuditMessageViewProps = {
  isPaid: boolean
  showAllViews: boolean
  onUnlock: () => void
  prevView: ViewNavItem
  nextView: ViewNavItem
  onNavigate: (view: ViewType) => void
}

export function AuditMessageView(props: AuditMessageViewProps) {
  return (
    <div role="tabpanel" id="tabpanel-message" aria-labelledby="tab-message">
      <MessageView {...props} />
    </div>
  )
}
