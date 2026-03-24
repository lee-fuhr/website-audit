'use client'

import { CopyView } from '@/components/CopyView'

type ViewType = 'overview' | 'message' | 'audience' | 'trust' | 'copy'
type ViewNavItem = { id: ViewType; label: string; description: string } | null

type BeforeAfterExample = {
  source: string
  before: string
  after: string
  rationale: string
}

type EasyWin = {
  title: string
  description: string
  effort: string
}

type AuditCopyViewProps = {
  isPaid: boolean
  showAllViews: boolean
  onUnlock: () => void
  prevView: ViewNavItem
  nextView: ViewNavItem
  onNavigate: (view: ViewType) => void
  beforeAfter: BeforeAfterExample[]
  easyWins: EasyWin[]
}

export function AuditCopyView(props: AuditCopyViewProps) {
  return (
    <div role="tabpanel" id="tabpanel-copy" aria-labelledby="tab-copy">
      <CopyView {...props} />
    </div>
  )
}
