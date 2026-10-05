import type { ActivityStatus } from '@/lib/types'

import { Badge, type IconName } from './ui'

const statuses: Record<ActivityStatus, { label: string; icon: IconName; tone: 'success' | 'warning' | 'danger' | 'outline' }> = {
  active: { label: 'Active', icon: 'checkmark-circle', tone: 'success' },
  slipping: { label: 'Slipping', icon: 'alert-circle', tone: 'warning' },
  inactive: { label: 'Inactive', icon: 'remove-circle', tone: 'danger' },
  new: { label: 'Not started', icon: 'ellipse-outline', tone: 'outline' },
}

/** Status always pairs an icon and a word with its colour. */
export const StatusBadge = ({ status }: { status: ActivityStatus }) => {
  const s = statuses[status]
  return <Badge label={s.label} icon={s.icon} tone={s.tone} />
}
