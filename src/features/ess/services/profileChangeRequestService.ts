import type { ProfileChangeRequest } from '../types'
import { EssServiceError } from './errors'

let requestsDb: ProfileChangeRequest[] = []

function delay(ms = 120): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

export const profileChangeRequestService = {
  async createRequest(
    input: {
      employeeId: string
      field: string
      currentValue?: string
      requestedValue: string
      reason: string
    },
    actorName = 'System',
  ): Promise<ProfileChangeRequest> {
    await delay()
    if (!input.field.trim()) throw new EssServiceError('VALIDATION', 'Field is required.')
    if (!input.requestedValue.trim()) {
      throw new EssServiceError('VALIDATION', 'Requested value is required.')
    }
    if (!input.reason.trim()) throw new EssServiceError('VALIDATION', 'Reason is required.')

    const existing = requestsDb.find(
      (item) =>
        item.employeeId === input.employeeId &&
        item.field.toLowerCase() === input.field.toLowerCase() &&
        item.status === 'pending',
    )
    if (existing) {
      throw new EssServiceError('CONFLICT', 'A pending change request already exists for this field.')
    }

    const request: ProfileChangeRequest = {
      id: `pcr-${crypto.randomUUID().slice(0, 8)}`,
      employeeId: input.employeeId,
      field: input.field.trim(),
      currentValue: input.currentValue?.trim() || undefined,
      requestedValue: input.requestedValue.trim(),
      reason: input.reason.trim(),
      status: 'pending',
      requestedAt: new Date().toISOString(),
      requestedBy: actorName,
    }
    requestsDb = [request, ...requestsDb]
    void import('@/features/workflows').then(async ({ workflowRoutingService, workflowService }) => {
      const approver = await workflowRoutingService.getApproverForProfile(request.employeeId)
      const workflow = await workflowService.create({
        type: 'profile_change',
        title: `Profile change: ${request.field}`,
        description: request.reason,
        requesterId: request.employeeId,
        requesterName: request.requestedBy,
        assignedToId: approver.id,
        assignedToName: approver.name,
        referenceType: 'profile_change',
        referenceId: request.id,
        priority: 'normal',
      })
      const { notificationTriggerService } = await import('@/features/notifications')
      await notificationTriggerService.notifyProfileChangeSubmitted({
        request,
        approverIds: [approver.id],
        workflowId: workflow.id,
      })
    }).catch((error) => console.warn('Profile workflow notification failed', error))
    return clone(request)
  },

  async getMyRequests(employeeId: string): Promise<ProfileChangeRequest[]> {
    await delay()
    return clone(
      requestsDb
        .filter((item) => item.employeeId === employeeId)
        .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt)),
    )
  },

  async getRequestById(employeeId: string, id: string): Promise<ProfileChangeRequest> {
    await delay()
    const request = requestsDb.find((item) => item.id === id && item.employeeId === employeeId)
    if (!request) throw new EssServiceError('NOT_FOUND', 'Profile change request not found.')
    return clone(request)
  },

  async cancelRequest(employeeId: string, id: string): Promise<ProfileChangeRequest> {
    await delay()
    const index = requestsDb.findIndex((item) => item.id === id && item.employeeId === employeeId)
    if (index < 0) throw new EssServiceError('NOT_FOUND', 'Profile change request not found.')
    const request = requestsDb[index]
    if (request.status !== 'pending') {
      throw new EssServiceError('VALIDATION', 'Only pending profile change requests can be cancelled.')
    }
    const updated = { ...request, status: 'cancelled' as const }
    requestsDb[index] = updated
    return clone(updated)
  },

  async getRequestForReview(id: string): Promise<ProfileChangeRequest> {
    await delay()
    const request = requestsDb.find((item) => item.id === id)
    if (!request) throw new EssServiceError('NOT_FOUND', 'Profile change request not found.')
    return clone(request)
  },

  async approveRequest(id: string, actorName = 'System', reviewComment?: string): Promise<ProfileChangeRequest> {
    await delay()
    const index = requestsDb.findIndex((item) => item.id === id)
    if (index < 0) throw new EssServiceError('NOT_FOUND', 'Profile change request not found.')
    const request = requestsDb[index]
    if (request.status !== 'pending') {
      throw new EssServiceError('VALIDATION', 'Only pending profile change requests can be approved.')
    }
    const updated: ProfileChangeRequest = {
      ...request,
      status: 'approved',
      reviewedAt: new Date().toISOString(),
      reviewedBy: actorName,
      reviewComment: reviewComment?.trim() || undefined,
    }
    requestsDb[index] = updated
    void import('@/features/workflows').then(({ workflowService }) =>
      workflowService.completeByReference('profile_change', updated.id, actorName),
    ).catch((error) => console.warn('Profile workflow completion failed', error))
    void import('@/features/notifications').then(({ notificationTriggerService }) =>
      notificationTriggerService.notifyProfileChangeApproved({ request: updated, actorName }),
    ).catch((error) => console.warn('Profile approval notification failed', error))
    return clone(updated)
  },

  async rejectRequest(id: string, reason: string, actorName = 'System'): Promise<ProfileChangeRequest> {
    await delay()
    if (!reason.trim()) throw new EssServiceError('VALIDATION', 'Rejection reason is required.')
    const index = requestsDb.findIndex((item) => item.id === id)
    if (index < 0) throw new EssServiceError('NOT_FOUND', 'Profile change request not found.')
    const request = requestsDb[index]
    if (request.status !== 'pending') {
      throw new EssServiceError('VALIDATION', 'Only pending profile change requests can be rejected.')
    }
    const updated: ProfileChangeRequest = {
      ...request,
      status: 'rejected',
      reviewedAt: new Date().toISOString(),
      reviewedBy: actorName,
      reviewComment: reason.trim(),
    }
    requestsDb[index] = updated
    void import('@/features/workflows').then(({ workflowService }) =>
      workflowService.rejectByReference('profile_change', updated.id, actorName, reason),
    ).catch((error) => console.warn('Profile workflow rejection failed', error))
    void import('@/features/notifications').then(({ notificationTriggerService }) =>
      notificationTriggerService.notifyProfileChangeRejected({ request: updated, actorName, reason }),
    ).catch((error) => console.warn('Profile rejection notification failed', error))
    return clone(updated)
  },
}
