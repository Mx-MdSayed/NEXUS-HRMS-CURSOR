import type { WorkflowStatus } from './types'

export const WORKFLOW_STATUS_LABELS: Record<WorkflowStatus, string> = {
  draft: 'Draft',
  pending: 'Pending',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
  needs_information: 'Needs Information',
  cancelled: 'Cancelled',
  completed: 'Completed',
}

export const WORKFLOW_TRANSITIONS: Record<WorkflowStatus, WorkflowStatus[]> = {
  draft: ['pending', 'cancelled'],
  pending: ['under_review', 'approved', 'rejected', 'needs_information', 'cancelled'],
  under_review: ['approved', 'rejected', 'needs_information', 'cancelled'],
  needs_information: ['pending', 'cancelled'],
  approved: ['completed'],
  rejected: [],
  cancelled: [],
  completed: [],
}

export function isTerminalWorkflowStatus(status: WorkflowStatus): boolean {
  return status === 'rejected' || status === 'cancelled' || status === 'completed'
}
