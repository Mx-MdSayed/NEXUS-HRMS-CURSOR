import { DEFAULT_PAGE_SIZE } from '@/constants/app'
import { employeeService } from '@/features/employees/services/employeeService'
import { WORKFLOW_TRANSITIONS } from '../constants'
import { initialWorkflowHistory, initialWorkflows } from '../data/mockWorkflows'
import type {
  PaginatedWorkflows,
  WorkflowFilters,
  WorkflowHistory,
  WorkflowRequest,
  WorkflowStatus,
} from '../types'

export class WorkflowServiceError extends Error {
  code: 'NOT_FOUND' | 'VALIDATION' | 'UNAUTHORIZED' | 'CONFLICT'

  constructor(code: WorkflowServiceError['code'], message: string) {
    super(message)
    this.name = 'WorkflowServiceError'
    this.code = code
  }
}

let workflowsDb: WorkflowRequest[] = structuredClone(initialWorkflows)
let historyDb: WorkflowHistory[] = structuredClone(initialWorkflowHistory)

function delay(ms = 90): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

async function employeeName(employeeId: string): Promise<string> {
  try {
    return (await employeeService.getEmployeeById(employeeId)).fullName
  } catch {
    return employeeId
  }
}

async function resolveActorId(actorName: string): Promise<string> {
  const page = await employeeService.getEmployees({ filters: { search: actorName }, page: 1, pageSize: 20 })
  const exact = page.data.find((item) => item.fullName.toLowerCase() === actorName.toLowerCase())
  return exact?.id ?? actorName
}

function pushHistory(input: Omit<WorkflowHistory, 'id' | 'createdAt'> & { createdAt?: string }) {
  historyDb.unshift({
    id: `wfh-${crypto.randomUUID().slice(0, 8)}`,
    createdAt: input.createdAt ?? new Date().toISOString(),
    ...input,
  })
}

function getWorkflowOrThrow(id: string): WorkflowRequest {
  const workflow = workflowsDb.find((item) => item.id === id)
  if (!workflow) throw new WorkflowServiceError('NOT_FOUND', 'Workflow request not found.')
  return workflow
}

function assertTransition(from: WorkflowStatus, to: WorkflowStatus) {
  if (!WORKFLOW_TRANSITIONS[from].includes(to)) {
    throw new WorkflowServiceError(
      'VALIDATION',
      `Workflow cannot transition from ${from.replaceAll('_', ' ')} to ${to.replaceAll('_', ' ')}.`,
    )
  }
}

function applyTransition(
  workflow: WorkflowRequest,
  toStatus: WorkflowStatus,
  action: WorkflowHistory['action'],
  actor: { id: string; name: string },
  comment?: string,
): WorkflowRequest {
  assertTransition(workflow.status, toStatus)
  if ((toStatus === 'approved' || toStatus === 'completed') && workflow.requesterId === actor.id) {
    throw new WorkflowServiceError('UNAUTHORIZED', 'Requester cannot approve their own workflow.')
  }
  const now = new Date().toISOString()
  const index = workflowsDb.findIndex((item) => item.id === workflow.id)
  const updated: WorkflowRequest = {
    ...workflow,
    status: toStatus,
    updatedAt: now,
    completedAt: toStatus === 'completed' || toStatus === 'rejected' || toStatus === 'cancelled' ? now : workflow.completedAt,
  }
  workflowsDb[index] = updated
  pushHistory({
    workflowId: workflow.id,
    fromStatus: workflow.status,
    toStatus,
    action,
    actorId: actor.id,
    actorName: actor.name,
    comment,
  })
  return updated
}

function filterWorkflows(rows: WorkflowRequest[], filters: WorkflowFilters): WorkflowRequest[] {
  let filtered = rows
  if (filters.status) filtered = filtered.filter((item) => item.status === filters.status)
  if (filters.type) filtered = filtered.filter((item) => item.type === filters.type)
  if (filters.requesterId) filtered = filtered.filter((item) => item.requesterId === filters.requesterId)
  if (filters.assignedToId) filtered = filtered.filter((item) => item.assignedToId === filters.assignedToId)
  if (filters.referenceType) filtered = filtered.filter((item) => item.referenceType === filters.referenceType)
  if (filters.referenceId) filtered = filtered.filter((item) => item.referenceId === filters.referenceId)
  if (filters.ownOrAssignedTo) {
    filtered = filtered.filter(
      (item) => item.requesterId === filters.ownOrAssignedTo || item.assignedToId === filters.ownOrAssignedTo,
    )
  }
  if (filters.search?.trim()) {
    const q = filters.search.trim().toLowerCase()
    filtered = filtered.filter((item) =>
      `${item.title} ${item.description ?? ''} ${item.requesterName} ${item.assignedToName ?? ''}`
        .toLowerCase()
        .includes(q),
    )
  }
  return filtered
}

export const workflowService = {
  async create(input: {
    type: WorkflowRequest['type']
    title: string
    description?: string
    requesterId: string
    requesterName?: string
    assignedToId?: string
    assignedToName?: string
    referenceType?: string
    referenceId?: string
    priority?: WorkflowRequest['priority']
    metadata?: WorkflowRequest['metadata']
  }): Promise<WorkflowRequest> {
    await delay()
    if (!input.requesterId) throw new WorkflowServiceError('VALIDATION', 'Requester is required.')
    const existing = workflowsDb.find(
      (item) =>
        item.referenceType === input.referenceType &&
        item.referenceId === input.referenceId &&
        item.status !== 'rejected' &&
        item.status !== 'cancelled' &&
        item.status !== 'completed',
    )
    if (existing) return structuredClone(existing)

    const now = new Date().toISOString()
    const workflow: WorkflowRequest = {
      id: `wf-${crypto.randomUUID().slice(0, 8)}`,
      type: input.type,
      title: input.title,
      description: input.description,
      status: 'pending',
      requesterId: input.requesterId,
      requesterName: input.requesterName ?? (await employeeName(input.requesterId)),
      assignedToId: input.assignedToId,
      assignedToName: input.assignedToName,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      priority: input.priority ?? 'normal',
      createdAt: now,
      updatedAt: now,
      submittedAt: now,
      metadata: input.metadata,
    }
    workflowsDb.unshift(workflow)
    pushHistory({
      workflowId: workflow.id,
      toStatus: workflow.status,
      action: 'created',
      actorId: input.requesterId,
      actorName: workflow.requesterName,
      comment: 'Workflow created.',
      createdAt: now,
    })
    return structuredClone(workflow)
  },

  async get(id: string, actor?: { employeeId?: string; canManage?: boolean }): Promise<WorkflowRequest> {
    await delay()
    const workflow = getWorkflowOrThrow(id)
    if (
      actor?.employeeId &&
      !actor.canManage &&
      workflow.requesterId !== actor.employeeId &&
      workflow.assignedToId !== actor.employeeId
    ) {
      throw new WorkflowServiceError('UNAUTHORIZED', 'You can only view your own or assigned workflows.')
    }
    return structuredClone(workflow)
  },

  async list(filters: WorkflowFilters = {}, page = 1, pageSize = DEFAULT_PAGE_SIZE): Promise<PaginatedWorkflows> {
    await delay()
    const rows = filterWorkflows([...workflowsDb], filters).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    const total = rows.length
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const safePage = Math.min(Math.max(1, page), totalPages)
    const start = (safePage - 1) * pageSize
    return {
      data: structuredClone(rows.slice(start, start + pageSize)),
      total,
      page: safePage,
      pageSize,
      totalPages,
    }
  },

  async findByReference(referenceType: string, referenceId: string): Promise<WorkflowRequest | null> {
    await delay(40)
    const workflow = workflowsDb.find(
      (item) => item.referenceType === referenceType && item.referenceId === referenceId,
    )
    return workflow ? structuredClone(workflow) : null
  },

  async assignReviewer(
    id: string,
    reviewer: { id: string; name: string },
    actor: { id: string; name: string },
  ): Promise<WorkflowRequest> {
    await delay()
    const workflow = getWorkflowOrThrow(id)
    const index = workflowsDb.findIndex((item) => item.id === id)
    const updated = {
      ...workflow,
      assignedToId: reviewer.id,
      assignedToName: reviewer.name,
      updatedAt: new Date().toISOString(),
    }
    workflowsDb[index] = updated
    pushHistory({
      workflowId: id,
      fromStatus: workflow.status,
      toStatus: workflow.status,
      action: 'assigned',
      actorId: actor.id,
      actorName: actor.name,
      comment: `Assigned to ${reviewer.name}.`,
    })
    return structuredClone(updated)
  },

  async submitForReview(id: string, actor: { id: string; name: string }): Promise<WorkflowRequest> {
    await delay()
    return structuredClone(applyTransition(getWorkflowOrThrow(id), 'pending', 'submitted', actor))
  },

  async approve(id: string, actor: { id: string; name: string }, comment?: string): Promise<WorkflowRequest> {
    await delay()
    return structuredClone(applyTransition(getWorkflowOrThrow(id), 'approved', 'approved', actor, comment))
  },

  async reject(id: string, actor: { id: string; name: string }, comment: string): Promise<WorkflowRequest> {
    await delay()
    if (!comment.trim()) throw new WorkflowServiceError('VALIDATION', 'Rejection comment is required.')
    return structuredClone(applyTransition(getWorkflowOrThrow(id), 'rejected', 'rejected', actor, comment.trim()))
  },

  async requestInformation(id: string, actor: { id: string; name: string }, comment: string): Promise<WorkflowRequest> {
    await delay()
    if (!comment.trim()) throw new WorkflowServiceError('VALIDATION', 'Clarification comment is required.')
    return structuredClone(
      applyTransition(getWorkflowOrThrow(id), 'needs_information', 'needs_information', actor, comment.trim()),
    )
  },

  async cancel(id: string, actor: { id: string; name: string }, comment?: string): Promise<WorkflowRequest> {
    await delay()
    return structuredClone(applyTransition(getWorkflowOrThrow(id), 'cancelled', 'cancelled', actor, comment))
  },

  async complete(id: string, actor: { id: string; name: string }, comment?: string): Promise<WorkflowRequest> {
    await delay()
    const workflow = getWorkflowOrThrow(id)
    const approved = workflow.status === 'approved'
      ? workflow
      : applyTransition(workflow, 'approved', 'approved', actor, comment)
    return structuredClone(applyTransition(approved, 'completed', 'completed', actor, comment))
  },

  async completeByReference(referenceType: string, referenceId: string, actorName: string): Promise<WorkflowRequest | null> {
    const workflow = workflowsDb.find(
      (item) => item.referenceType === referenceType && item.referenceId === referenceId,
    )
    if (!workflow || workflow.status === 'completed') return workflow ? structuredClone(workflow) : null
    const actor = { id: await resolveActorId(actorName), name: actorName }
    return this.complete(workflow.id, actor)
  },

  async rejectByReference(referenceType: string, referenceId: string, actorName: string, comment: string): Promise<WorkflowRequest | null> {
    const workflow = workflowsDb.find(
      (item) => item.referenceType === referenceType && item.referenceId === referenceId,
    )
    if (!workflow || workflow.status === 'rejected') return workflow ? structuredClone(workflow) : null
    return this.reject(workflow.id, { id: await resolveActorId(actorName), name: actorName }, comment)
  },

  async getHistory(workflowId: string): Promise<WorkflowHistory[]> {
    await delay()
    return structuredClone(
      historyDb
        .filter((item) => item.workflowId === workflowId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    )
  },

  validateTransition(from: WorkflowStatus, to: WorkflowStatus): boolean {
    return WORKFLOW_TRANSITIONS[from].includes(to)
  },
}
