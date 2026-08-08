import { Badge, type BadgeVariant } from './Badge'

export type StatusTone =
  | 'active'
  | 'inactive'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'paid'
  | 'draft'
  | 'processing'
  | 'present'
  | 'absent'
  | 'late'
  | 'half_day'
  | 'probation'
  | 'on_leave'
  | 'terminated'

const statusConfig: Record<StatusTone, { label: string; variant: BadgeVariant }> = {
  active: { label: 'Active', variant: 'success' },
  inactive: { label: 'Inactive', variant: 'neutral' },
  pending: { label: 'Pending', variant: 'warning' },
  approved: { label: 'Approved', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'danger' },
  paid: { label: 'Paid', variant: 'success' },
  draft: { label: 'Draft', variant: 'neutral' },
  processing: { label: 'Processing', variant: 'info' },
  present: { label: 'Present', variant: 'success' },
  absent: { label: 'Absent', variant: 'danger' },
  late: { label: 'Late', variant: 'warning' },
  half_day: { label: 'Half Day', variant: 'info' },
  probation: { label: 'Probation', variant: 'warning' },
  on_leave: { label: 'On Leave', variant: 'info' },
  terminated: { label: 'Terminated', variant: 'danger' },
}

export interface StatusBadgeProps {
  status: StatusTone
  label?: string
  className?: string
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <Badge variant={config.variant} className={className}>
      {label ?? config.label}
    </Badge>
  )
}
