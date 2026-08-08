import type { StatusTone } from '@/components/ui/StatusBadge'
import type { PayrollRunStatus } from '../types'
import { PAYROLL_STATUS_LABELS } from '../constants'

const STATUS_TONE: Record<PayrollRunStatus, StatusTone> = {
  draft: 'draft',
  processing: 'processing',
  calculated: 'pending',
  pending_approval: 'pending',
  approved: 'approved',
  finalized: 'paid',
  cancelled: 'cancelled',
}

export function payrollStatusTone(status: PayrollRunStatus): StatusTone {
  return STATUS_TONE[status]
}

export function payrollStatusLabel(status: PayrollRunStatus): string {
  return PAYROLL_STATUS_LABELS[status]
}
