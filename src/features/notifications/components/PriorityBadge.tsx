import { Badge, type BadgeVariant } from '@/components/ui'
import type { NotificationPriority } from '../types'

const variantByPriority: Record<NotificationPriority, BadgeVariant> = {
  low: 'neutral',
  normal: 'info',
  high: 'warning',
  urgent: 'danger',
}

export function PriorityBadge({ priority }: { priority: NotificationPriority }) {
  return <Badge variant={variantByPriority[priority]}>{priority.replaceAll('_', ' ')}</Badge>
}
