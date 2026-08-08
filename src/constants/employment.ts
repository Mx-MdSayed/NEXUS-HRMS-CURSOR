import type { EmploymentStatus } from '@/types'

export const EMPLOYMENT_STATUS_LABELS: Record<EmploymentStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  on_leave: 'On Leave',
  terminated: 'Terminated',
  probation: 'Probation',
}

export const EMPLOYMENT_STATUSES: EmploymentStatus[] = [
  'active',
  'inactive',
  'on_leave',
  'terminated',
  'probation',
]
