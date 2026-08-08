import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { attendanceService } from '@/features/attendance'
import { leaveService } from '@/features/leave'
import { notificationTriggerService } from '@/features/notifications'
import { payrollService } from '@/features/payroll'
import { profileChangeRequestService } from '@/features/ess/services/profileChangeRequestService'
import { formatDateTime } from '@/utils/date'
import { showError, showSuccess } from '@/utils/toast'
import { WORKFLOW_STATUS_LABELS } from '../constants'
import { ApprovalActions } from '../components/ApprovalActions'
import { WorkflowTimeline } from '../components/WorkflowTimeline'
import { workflowService } from '../services/workflowService'
import type { WorkflowHistory, WorkflowRequest } from '../types'

export function WorkflowRequestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user, hasPermission } = useAuth()
  const [workflow, setWorkflow] = useState<WorkflowRequest | null>(null)
  const [history, setHistory] = useState<WorkflowHistory[]>([])
  const [employeeId, setEmployeeId] = useState('')

  const load = useCallback(async () => {
    if (!id || !user) return
    const linked = await notificationTriggerService.resolveLinkedEmployeeId(user)
    setEmployeeId(linked)
    const canManage = hasPermission('workflow.manage')
    const row = await workflowService.get(id, { employeeId: linked, canManage })
    setWorkflow(row)
    setHistory(await workflowService.getHistory(row.id))
  }, [hasPermission, id, user])

  useEffect(() => {
    void load().catch((error) => showError(error instanceof Error ? error.message : 'Unable to load workflow.'))
  }, [load])

  const actor = { id: employeeId || user?.id || 'system', name: user?.name ?? 'System' }

  const approve = async () => {
    if (!workflow) return
    try {
      if (workflow.type === 'leave' && workflow.referenceId) {
        await leaveService.approveLeaveRequest(workflow.referenceId, actor.name)
      } else if (workflow.type === 'attendance_correction' && workflow.referenceId) {
        await attendanceService.approveCorrection(workflow.referenceId, actor.name)
      } else if (workflow.type === 'profile_change' && workflow.referenceId) {
        await profileChangeRequestService.approveRequest(workflow.referenceId, actor.name)
      } else if (workflow.type === 'payroll' && workflow.referenceId) {
        await payrollService.approvePayrollRun(workflow.referenceId, actor.name)
      } else {
        await workflowService.complete(workflow.id, actor)
      }
      showSuccess('Workflow approved.')
      await load()
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Unable to approve workflow.')
    }
  }

  const reject = async (comment: string) => {
    if (!workflow) return
    try {
      if (workflow.type === 'leave' && workflow.referenceId) {
        await leaveService.rejectLeaveRequest(workflow.referenceId, comment, actor.name)
      } else if (workflow.type === 'attendance_correction' && workflow.referenceId) {
        await attendanceService.rejectCorrection(workflow.referenceId, actor.name, comment)
      } else if (workflow.type === 'profile_change' && workflow.referenceId) {
        await profileChangeRequestService.rejectRequest(workflow.referenceId, comment, actor.name)
      } else if (workflow.type === 'payroll' && workflow.referenceId) {
        await payrollService.rejectPayrollRun(workflow.referenceId, comment, actor.name)
      } else {
        await workflowService.reject(workflow.id, actor, comment)
      }
      showSuccess('Workflow rejected.')
      await load()
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Unable to reject workflow.')
    }
  }

  const clarify = async (comment: string) => {
    if (!workflow) return
    try {
      await workflowService.requestInformation(workflow.id, actor, comment)
      showSuccess('Information requested.')
      await load()
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Unable to request information.')
    }
  }

  if (!workflow) return <Card><CardContent>Loading workflow...</CardContent></Card>

  const canAct =
    hasPermission('workflow.approve') &&
    workflow.assignedToId === employeeId &&
    workflow.requesterId !== employeeId &&
    (workflow.status === 'pending' || workflow.status === 'under_review')

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>{workflow.title}</CardTitle>
            <p className="mt-1 text-sm text-surface-500">{workflow.description}</p>
          </div>
          {canAct ? <ApprovalActions onApprove={approve} onReject={reject} onClarify={clarify} /> : null}
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <p><span className="font-medium">Status:</span> {WORKFLOW_STATUS_LABELS[workflow.status]}</p>
          <p><span className="font-medium">Type:</span> {workflow.type.replaceAll('_', ' ')}</p>
          <p><span className="font-medium">Priority:</span> {workflow.priority}</p>
          <p><span className="font-medium">Requester:</span> {workflow.requesterName}</p>
          <p><span className="font-medium">Assigned:</span> {workflow.assignedToName ?? 'Unassigned'}</p>
          <p><span className="font-medium">Created:</span> {formatDateTime(workflow.createdAt)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
        <CardContent><WorkflowTimeline history={history} /></CardContent>
      </Card>
    </div>
  )
}
