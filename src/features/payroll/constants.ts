import type { PayrollEmployeeStatus, PayrollRunStatus } from './types'

export const PAYROLL_STATUS_LABELS: Record<PayrollRunStatus, string> = {
  draft: 'Draft',
  processing: 'Processing',
  calculated: 'Calculated',
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  finalized: 'Finalized',
  cancelled: 'Cancelled',
}

export const PAYROLL_STATUS_OPTIONS = (
  Object.entries(PAYROLL_STATUS_LABELS) as Array<[PayrollRunStatus, string]>
).map(([value, label]) => ({ value, label }))

export const PAYROLL_EMPLOYEE_STATUS_LABELS: Record<PayrollEmployeeStatus, string> = {
  pending: 'Pending',
  ready: 'Ready',
  calculated: 'Calculated',
  error: 'Error',
  excluded: 'Excluded',
}

export const EDITABLE_PAYROLL_STATUSES: PayrollRunStatus[] = [
  'draft',
  'processing',
  'calculated',
]

export const FINAL_LOCKED_STATUSES: PayrollRunStatus[] = ['finalized', 'cancelled']

export const DEMO_PAYROLL_MONTH = 8
export const DEMO_PAYROLL_YEAR = 2026
