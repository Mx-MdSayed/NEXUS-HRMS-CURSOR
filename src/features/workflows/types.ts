export type WorkflowStatus =
  | 'draft'
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'needs_information'
  | 'cancelled'
  | 'completed'

export type WorkflowRequestType =
  | 'leave'
  | 'attendance_correction'
  | 'profile_change'
  | 'payroll'
  | 'payslip_generate'
  | 'general'

export interface WorkflowHistory {
  id: string
  workflowId: string
  fromStatus?: WorkflowStatus
  toStatus: WorkflowStatus
  action:
    | 'created'
    | 'submitted'
    | 'assigned'
    | 'approved'
    | 'rejected'
    | 'needs_information'
    | 'cancelled'
    | 'completed'
  actorId: string
  actorName: string
  comment?: string
  createdAt: string
}

export interface WorkflowRequest {
  id: string
  type: WorkflowRequestType
  title: string
  description?: string
  status: WorkflowStatus
  requesterId: string
  requesterName: string
  assignedToId?: string
  assignedToName?: string
  referenceType?: string
  referenceId?: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  createdAt: string
  updatedAt: string
  submittedAt?: string
  dueAt?: string
  completedAt?: string
  metadata?: Record<string, string | number | boolean | null | undefined>
}

export interface WorkflowFilters {
  status?: WorkflowStatus | ''
  type?: WorkflowRequestType | ''
  requesterId?: string
  assignedToId?: string
  referenceType?: string
  referenceId?: string
  search?: string
  ownOrAssignedTo?: string
}

export interface PaginatedWorkflows {
  data: WorkflowRequest[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
