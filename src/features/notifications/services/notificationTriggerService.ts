import { ROLES } from '@/constants/roles'
import { employeeService } from '@/features/employees/services/employeeService'
import type { AttendanceCorrection } from '@/features/attendance/types'
import type { LeaveRequest } from '@/features/leave/types'
import type { PayrollRun } from '@/features/payroll/types'
import type { Payslip } from '@/features/payslip/types'
import type { ProfileChangeRequest } from '@/features/ess/types'
import { DEV_AUTH_ACCOUNTS } from '@/services/auth/devAuthConfig'
import { NOTIFICATION_EVENTS } from '../events'
import type { NotificationCategory, NotificationPriority } from '../types'
import { notificationPreferenceService } from './notificationPreferenceService'
import { notificationService } from './notificationService'
import { notificationTemplateService } from './notificationTemplateService'

async function resolveEmployeeIdByEmail(email: string): Promise<string | null> {
  const employee = await employeeService.getEmployeeByEmail(email)
  return employee?.id ?? null
}

async function getEmployeeLabel(employeeId: string): Promise<string> {
  try {
    return (await employeeService.getEmployeeById(employeeId)).fullName
  } catch {
    return employeeId
  }
}

async function getHrRecipients(): Promise<string[]> {
  const ids = new Set<string>()
  for (const account of DEV_AUTH_ACCOUNTS) {
    if (account.role === ROLES.HR_ADMIN || account.role === ROLES.SUPER_ADMIN) {
      const employeeId = await resolveEmployeeIdByEmail(account.email)
      ids.add(employeeId ?? `usr_${account.role}`)
    }
  }
  return Array.from(ids)
}

async function notifyRecipients(input: {
  recipientIds: string[]
  eventCode: string
  referenceType: string
  referenceId: string
  href?: string
  actorId?: string
  vars: Record<string, unknown>
  fallbackCategory?: NotificationCategory
  fallbackPriority?: NotificationPriority
}) {
  const rendered = await notificationTemplateService.renderTemplate(input.eventCode, input.vars)
  if (!rendered.template.isActive) return []

  const notifications = []
  for (const recipientId of input.recipientIds) {
    const enabled = await notificationPreferenceService.isEnabled(recipientId, input.eventCode)
    if (!enabled) continue
    notifications.push(
      await notificationService.create({
        recipientId,
        actorId: input.actorId,
        title: rendered.title,
        message: rendered.message,
        category: rendered.template.category ?? input.fallbackCategory ?? 'system',
        priority: rendered.template.priority ?? input.fallbackPriority ?? 'normal',
        eventCode: input.eventCode,
        referenceType: input.referenceType,
        referenceId: input.referenceId,
        href: input.href,
        metadata: input.vars as Record<string, string | number | boolean | null | undefined>,
      }),
    )
  }
  return notifications
}

export const notificationTriggerService = {
  async resolveLinkedEmployeeId(user?: { email?: string; employeeId?: string | null; id?: string }): Promise<string> {
    if (user?.email) {
      const employeeId = await resolveEmployeeIdByEmail(user.email)
      if (employeeId) return employeeId
    }
    if (user?.employeeId?.startsWith('EMP-')) {
      const page = await employeeService.getEmployees({ filters: { search: user.employeeId }, page: 1, pageSize: 10 })
      const match = page.data.find((item) => item.employeeCode === user.employeeId)
      if (match) return match.id
    }
    return user?.employeeId || user?.id || ''
  },

  async notifyLeaveSubmitted(input: {
    request: LeaveRequest
    leaveTypeName?: string
    approverIds?: string[]
    workflowId?: string
  }) {
    const employeeName = await getEmployeeLabel(input.request.employeeId)
    const recipientIds = input.approverIds?.length ? input.approverIds : await getHrRecipients()
    return notifyRecipients({
      recipientIds,
      eventCode: NOTIFICATION_EVENTS.LEAVE_SUBMITTED,
      referenceType: 'leave',
      referenceId: input.request.id,
      href: input.workflowId ? `/workflows/requests/${input.workflowId}` : `/leave/${input.request.id}`,
      vars: {
        employeeName,
        leaveType: input.leaveTypeName ?? 'leave',
        duration: input.request.duration,
        startDate: input.request.startDate,
        endDate: input.request.endDate,
      },
    })
  },

  async notifyLeaveApproved(input: { request: LeaveRequest; leaveTypeName?: string; actorName: string }) {
    return notifyRecipients({
      recipientIds: [input.request.employeeId],
      eventCode: NOTIFICATION_EVENTS.LEAVE_APPROVED,
      referenceType: 'leave',
      referenceId: input.request.id,
      href: `/employee/leave/${input.request.id}`,
      vars: {
        leaveType: input.leaveTypeName ?? 'leave',
        startDate: input.request.startDate,
        endDate: input.request.endDate,
        actorName: input.actorName,
      },
    })
  },

  async notifyLeaveRejected(input: { request: LeaveRequest; leaveTypeName?: string; actorName: string; reason?: string }) {
    return notifyRecipients({
      recipientIds: [input.request.employeeId],
      eventCode: NOTIFICATION_EVENTS.LEAVE_REJECTED,
      referenceType: 'leave',
      referenceId: input.request.id,
      href: `/employee/leave/${input.request.id}`,
      vars: {
        leaveType: input.leaveTypeName ?? 'leave',
        startDate: input.request.startDate,
        endDate: input.request.endDate,
        actorName: input.actorName,
        reason: input.reason ?? '',
      },
    })
  },

  async notifyAttendanceCorrectionSubmitted(input: { correction: AttendanceCorrection; approverIds?: string[]; workflowId?: string }) {
    const employeeName = await getEmployeeLabel(input.correction.employeeId)
    return notifyRecipients({
      recipientIds: input.approverIds?.length ? input.approverIds : await getHrRecipients(),
      eventCode: NOTIFICATION_EVENTS.ATTENDANCE_CORRECTION_SUBMITTED,
      referenceType: 'attendance_correction',
      referenceId: input.correction.id,
      href: input.workflowId ? `/workflows/requests/${input.workflowId}` : '/attendance/corrections',
      vars: {
        employeeName,
        requestedStatus: input.correction.requestedStatus.replaceAll('_', ' '),
        date: input.correction.date,
      },
    })
  },

  async notifyAttendanceCorrectionApproved(input: { correction: AttendanceCorrection; actorName: string }) {
    return notifyRecipients({
      recipientIds: [input.correction.employeeId],
      eventCode: NOTIFICATION_EVENTS.ATTENDANCE_CORRECTION_APPROVED,
      referenceType: 'attendance_correction',
      referenceId: input.correction.id,
      href: '/employee/requests',
      vars: { date: input.correction.date, actorName: input.actorName },
    })
  },

  async notifyAttendanceCorrectionRejected(input: { correction: AttendanceCorrection; actorName: string; reason?: string }) {
    return notifyRecipients({
      recipientIds: [input.correction.employeeId],
      eventCode: NOTIFICATION_EVENTS.ATTENDANCE_CORRECTION_REJECTED,
      referenceType: 'attendance_correction',
      referenceId: input.correction.id,
      href: '/employee/requests',
      vars: { date: input.correction.date, actorName: input.actorName, reason: input.reason ?? '' },
    })
  },

  async notifyProfileChangeSubmitted(input: { request: ProfileChangeRequest; approverIds?: string[]; workflowId?: string }) {
    const employeeName = await getEmployeeLabel(input.request.employeeId)
    return notifyRecipients({
      recipientIds: input.approverIds?.length ? input.approverIds : await getHrRecipients(),
      eventCode: NOTIFICATION_EVENTS.PROFILE_CHANGE_SUBMITTED,
      referenceType: 'profile_change',
      referenceId: input.request.id,
      href: input.workflowId ? `/workflows/requests/${input.workflowId}` : '/workflows',
      vars: { employeeName, field: input.request.field },
    })
  },

  async notifyProfileChangeApproved(input: { request: ProfileChangeRequest; actorName: string }) {
    return notifyRecipients({
      recipientIds: [input.request.employeeId],
      eventCode: NOTIFICATION_EVENTS.PROFILE_CHANGE_APPROVED,
      referenceType: 'profile_change',
      referenceId: input.request.id,
      href: '/employee/requests',
      vars: { field: input.request.field, actorName: input.actorName },
    })
  },

  async notifyProfileChangeRejected(input: { request: ProfileChangeRequest; actorName: string; reason?: string }) {
    return notifyRecipients({
      recipientIds: [input.request.employeeId],
      eventCode: NOTIFICATION_EVENTS.PROFILE_CHANGE_REJECTED,
      referenceType: 'profile_change',
      referenceId: input.request.id,
      href: '/employee/requests',
      vars: { field: input.request.field, actorName: input.actorName, reason: input.reason ?? '' },
    })
  },

  async notifyPayrollSubmitted(input: { run: PayrollRun; approverIds?: string[]; workflowId?: string }) {
    return notifyRecipients({
      recipientIds: input.approverIds?.length ? input.approverIds : await getHrRecipients(),
      eventCode: NOTIFICATION_EVENTS.PAYROLL_SUBMITTED,
      referenceType: 'payroll',
      referenceId: input.run.id,
      href: input.workflowId ? `/workflows/requests/${input.workflowId}` : `/payroll/runs/${input.run.id}`,
      vars: { payrollName: input.run.name, monthKey: input.run.monthKey },
    })
  },

  async notifyPayrollApproved(input: { run: PayrollRun; actorName: string }) {
    return notifyRecipients({
      recipientIds: await getHrRecipients(),
      eventCode: NOTIFICATION_EVENTS.PAYROLL_APPROVED,
      referenceType: 'payroll',
      referenceId: input.run.id,
      href: `/payroll/runs/${input.run.id}`,
      vars: { payrollName: input.run.name, monthKey: input.run.monthKey, actorName: input.actorName },
    })
  },

  async notifyPayrollRejected(input: { run: PayrollRun; actorName: string; reason?: string }) {
    return notifyRecipients({
      recipientIds: await getHrRecipients(),
      eventCode: NOTIFICATION_EVENTS.PAYROLL_REJECTED,
      referenceType: 'payroll',
      referenceId: input.run.id,
      href: `/payroll/runs/${input.run.id}`,
      vars: { payrollName: input.run.name, monthKey: input.run.monthKey, actorName: input.actorName, reason: input.reason ?? '' },
    })
  },

  async notifyPayrollFinalized(input: { run: PayrollRun; actorName: string }) {
    return notifyRecipients({
      recipientIds: await getHrRecipients(),
      eventCode: NOTIFICATION_EVENTS.PAYROLL_FINALIZED,
      referenceType: 'payroll',
      referenceId: input.run.id,
      href: `/payroll/runs/${input.run.id}`,
      vars: { payrollName: input.run.name, monthKey: input.run.monthKey, actorName: input.actorName },
    })
  },

  async notifyPayslipGenerated(input: { payslip: Payslip }) {
    return notifyRecipients({
      recipientIds: [input.payslip.employeeId],
      eventCode: NOTIFICATION_EVENTS.PAYSLIP_GENERATED,
      referenceType: 'payslip',
      referenceId: input.payslip.id,
      href: `/employee/payslips/${input.payslip.id}`,
      vars: { payslipNumber: input.payslip.payslipNumber, monthKey: input.payslip.monthKey },
    })
  },
}
