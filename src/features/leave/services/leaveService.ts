import { DEFAULT_PAGE_SIZE } from '@/constants/app'
import { attendanceService } from '@/features/attendance/services/attendanceService'
import { employeeService } from '@/features/employees/services/employeeService'
import type { Employee } from '@/features/employees/types'
import { getDepartmentNameById } from '@/features/organization/data/orgDb'
import { eachDayOfInterval, endOfMonth, format, parseISO, startOfMonth } from 'date-fns'
import {
  LEAVE_ATTACHMENT_MAX_BYTES,
  LEAVE_ATTACHMENT_TYPES,
  LEAVE_DEMO_TODAY,
  LEAVE_DEMO_YEAR,
  LEAVE_REQUEST_STATUSES,
} from '../constants'
import { initialLeaveBalances } from '../data/mockLeaveBalances'
import { initialLeaveAudit, initialLeaveRequests } from '../data/mockLeaveRequests'
import { initialLeaveTypes } from '../data/mockLeaveTypes'
import { leavePolicy } from '../policy'
import type {
  LeaveAuditEvent,
  LeaveBalance,
  LeaveBalanceAdjustment,
  LeaveBalanceFilters,
  LeaveBalanceListItem,
  LeaveCalendarDay,
  LeaveCalendarFilters,
  LeaveOverviewStats,
  LeaveRequest,
  LeaveRequestDetail,
  LeaveRequestFilters,
  LeaveRequestFormValues,
  LeaveRequestListItem,
  LeaveType,
  LeaveTypeFormValues,
  OnLeaveTodayItem,
  PaginatedLeaveBalances,
  PaginatedLeaveRequests,
  PayrollLeaveSummary,
  UpcomingLeaveItem,
} from '../types'
import {
  calculateCarryForward,
  calculateLeaveDuration,
  computeAvailableBalance,
  refreshBalanceAvailable,
  validateLeaveOverlap,
  validateLeavePolicy,
} from '../utils/calculations'
import { LeaveServiceError } from './errors'

let leaveTypesDb: LeaveType[] = structuredClone(initialLeaveTypes)
let balancesDb: LeaveBalance[] = structuredClone(initialLeaveBalances)
let requestsDb: LeaveRequest[] = structuredClone(initialLeaveRequests)
let auditDb: LeaveAuditEvent[] = structuredClone(initialLeaveAudit)
let adjustmentsDb: LeaveBalanceAdjustment[] = []

function delay(ms = 280): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function todayKey(): string {
  return attendanceService.getSettingsToday() || LEAVE_DEMO_TODAY
}

function pushAudit(event: Omit<LeaveAuditEvent, 'id' | 'dateTime'> & { dateTime?: string }) {
  auditDb.unshift({
    id: `laud-${crypto.randomUUID().slice(0, 8)}`,
    dateTime: event.dateTime ?? new Date().toISOString(),
    ...event,
  })
}

function getLeaveTypeOrThrow(id: string): LeaveType {
  const type = leaveTypesDb.find((item) => item.id === id && !item.isDeleted)
  if (!type) throw new LeaveServiceError('NOT_FOUND', 'Leave type not found.')
  return type
}

async function getEmployeeOrThrow(id: string): Promise<Employee> {
  try {
    return await employeeService.getEmployeeById(id)
  } catch {
    throw new LeaveServiceError('NOT_FOUND', 'Employee not found.')
  }
}

function findBalance(
  employeeId: string,
  leaveTypeId: string,
  year: number,
): LeaveBalance | undefined {
  return balancesDb.find(
    (item) =>
      item.employeeId === employeeId && item.leaveTypeId === leaveTypeId && item.year === year,
  )
}

function ensureBalance(
  employeeId: string,
  leaveTypeId: string,
  year: number,
  actor = 'System',
): LeaveBalance {
  const existing = findBalance(employeeId, leaveTypeId, year)
  if (existing) return existing
  const leaveType = getLeaveTypeOrThrow(leaveTypeId)
  const created: LeaveBalance = refreshBalanceAvailable({
    id: `lb-${employeeId}-${leaveTypeId}-${year}`,
    employeeId,
    leaveTypeId,
    year,
    openingBalance: 0,
    allocated: leaveType.paid ? leaveType.annualAllocation : 0,
    carryForward: 0,
    used: 0,
    pending: 0,
    adjustment: 0,
    available: 0,
    updatedAt: new Date().toISOString(),
    updatedBy: actor,
  })
  balancesDb.push(created)
  return created
}

function updateBalanceInDb(balance: LeaveBalance) {
  const index = balancesDb.findIndex((item) => item.id === balance.id)
  const next = refreshBalanceAvailable(balance)
  if (index >= 0) balancesDb[index] = next
  else balancesDb.push(next)
  return next
}

async function toListItem(request: LeaveRequest): Promise<LeaveRequestListItem> {
  const [employee, leaveType] = await Promise.all([
    getEmployeeOrThrow(request.employeeId),
    Promise.resolve(getLeaveTypeOrThrow(request.leaveTypeId)),
  ])
  return {
    id: request.id,
    employeeId: employee.id,
    employeeCode: employee.employeeCode,
    employeeName: employee.fullName,
    departmentId: employee.departmentId,
    departmentName: getDepartmentNameById(employee.departmentId),
    leaveTypeId: leaveType.id,
    leaveTypeName: leaveType.name,
    leaveTypeCode: leaveType.code,
    paid: leaveType.paid,
    startDate: request.startDate,
    endDate: request.endDate,
    duration: request.duration,
    isHalfDay: request.isHalfDay,
    halfDayType: request.halfDayType,
    status: request.status,
    appliedAt: request.appliedAt,
    reason: request.reason,
  }
}

function validateAttachment(attachment?: LeaveRequestFormValues['attachment']) {
  if (!attachment) return
  if (attachment.size > LEAVE_ATTACHMENT_MAX_BYTES) {
    throw new LeaveServiceError('VALIDATION', 'Attachment must be 5 MB or smaller.')
  }
  if (attachment.fileType && !LEAVE_ATTACHMENT_TYPES.includes(attachment.fileType)) {
    throw new LeaveServiceError('VALIDATION', 'Attachment must be PDF, JPG, JPEG, or PNG.')
  }
}

function assertLeaveTypeApplicable(leaveType: LeaveType, employee: Employee) {
  if (leaveType.applicableGender !== 'all' && employee.gender) {
    if (leaveType.applicableGender !== employee.gender) {
      throw new LeaveServiceError(
        'VALIDATION',
        `Leave type ${leaveType.code} is not applicable for this employee.`,
      )
    }
  }
  if (
    leaveType.applicableEmploymentTypes.length > 0 &&
    !leaveType.applicableEmploymentTypes.includes('all')
  ) {
    if (!leaveType.applicableEmploymentTypes.includes(employee.employmentType)) {
      throw new LeaveServiceError(
        'VALIDATION',
        `Leave type ${leaveType.code} is not applicable for this employment type.`,
      )
    }
  }
}

async function buildRequestFromForm(
  values: LeaveRequestFormValues,
  employeeId: string,
  actorName: string,
  existingId?: string,
): Promise<LeaveRequest> {
  const employee = await getEmployeeOrThrow(employeeId)
  if (employee.employmentStatus !== 'active' && employee.employmentStatus !== 'probation') {
    throw new LeaveServiceError('VALIDATION', 'Only active employees can apply for leave.')
  }

  const leaveType = getLeaveTypeOrThrow(values.leaveTypeId)
  assertLeaveTypeApplicable(leaveType, employee)

  if (!values.startDate || !values.endDate) {
    throw new LeaveServiceError('VALIDATION', 'Start date and end date are required.')
  }
  if (values.dayPortion === 'half_day' && values.startDate !== values.endDate) {
    throw new LeaveServiceError('VALIDATION', 'Half-day leave must be for a single date.')
  }
  if (values.dayPortion === 'half_day' && !values.halfDayType) {
    throw new LeaveServiceError('VALIDATION', 'Select first half or second half.')
  }
  if (!leavePolicy.allowHalfDay && values.dayPortion === 'half_day') {
    throw new LeaveServiceError('VALIDATION', 'Half-day leave is not enabled by policy.')
  }
  if (!values.reason?.trim()) {
    throw new LeaveServiceError('VALIDATION', 'Reason is required.')
  }

  validateAttachment(values.attachment)

  const holidays = await attendanceService.getHolidays()
  const { duration, workingDates } = calculateLeaveDuration(
    values.startDate,
    values.endDate,
    values.dayPortion,
    holidays,
    leavePolicy,
  )

  const year = Number(values.startDate.slice(0, 4))
  const balance = leaveType.paid
    ? ensureBalance(employeeId, leaveType.id, year, actorName)
    : undefined

  const overlap = validateLeaveOverlap(
    values.startDate,
    values.endDate,
    requestsDb.filter((item) => item.employeeId === employeeId),
    existingId,
  )
  if (!overlap.valid) {
    throw new LeaveServiceError('CONFLICT', overlap.message ?? 'Overlapping leave request.')
  }

  const policyCheck = validateLeavePolicy({
    leaveType,
    startDate: values.startDate,
    endDate: values.endDate,
    duration,
    today: todayKey(),
    hasAttachment: Boolean(values.attachment),
    availableBalance: balance?.available ?? 0,
  })
  if (!policyCheck.valid) {
    throw new LeaveServiceError('VALIDATION', policyCheck.messages[0] ?? 'Leave validation failed.')
  }

  // Incompatible attendance: already present/late on a requested working day for future self-apply safety
  for (const date of workingDates) {
    const page = await attendanceService.getEmployeeAttendancePage(employeeId, date.slice(0, 7))
    const record = page.records.find((item) => item.date === date)
    if (record && (record.status === 'present' || record.status === 'late') && date < todayKey()) {
      throw new LeaveServiceError(
        'VALIDATION',
        `Attendance already marked as ${record.status} on ${date}.`,
      )
    }
  }

  const nowIso = new Date().toISOString()
  return {
    id: existingId ?? `lr-${crypto.randomUUID().slice(0, 8)}`,
    employeeId,
    leaveTypeId: leaveType.id,
    startDate: values.startDate,
    endDate: values.endDate,
    duration,
    isHalfDay: values.dayPortion === 'half_day',
    halfDayType: values.dayPortion === 'half_day' ? values.halfDayType : undefined,
    reason: values.reason.trim(),
    attachment: values.attachment ?? undefined,
    status: LEAVE_REQUEST_STATUSES.PENDING,
    appliedAt: nowIso,
    workingDates,
    createdAt: nowIso,
    updatedAt: nowIso,
    createdBy: actorName,
    updatedBy: actorName,
  }
}

function movePendingToUsed(balance: LeaveBalance, duration: number, actor: string) {
  return updateBalanceInDb({
    ...balance,
    pending: Math.max(0, balance.pending - duration),
    used: balance.used + duration,
    updatedBy: actor,
  })
}

function releasePending(balance: LeaveBalance, duration: number, actor: string) {
  return updateBalanceInDb({
    ...balance,
    pending: Math.max(0, balance.pending - duration),
    updatedBy: actor,
  })
}

function addPending(balance: LeaveBalance, duration: number, actor: string) {
  return updateBalanceInDb({
    ...balance,
    pending: balance.pending + duration,
    updatedBy: actor,
  })
}

function restoreUsed(balance: LeaveBalance, duration: number, actor: string) {
  return updateBalanceInDb({
    ...balance,
    used: Math.max(0, balance.used - duration),
    updatedBy: actor,
  })
}

export const leaveService = {
  async getLeaveTypes(includeInactive = true): Promise<LeaveType[]> {
    await delay(150)
    return structuredClone(
      leaveTypesDb
        .filter((item) => !item.isDeleted)
        .filter((item) => includeInactive || item.status === 'active')
        .sort((a, b) => a.name.localeCompare(b.name)),
    )
  },

  async getLeaveTypeById(id: string): Promise<LeaveType> {
    await delay(100)
    return structuredClone(getLeaveTypeOrThrow(id))
  },

  async createLeaveType(data: LeaveTypeFormValues, actorName = 'System'): Promise<LeaveType> {
    await delay()
    const code = data.code.trim().toUpperCase()
    if (!data.name.trim()) throw new LeaveServiceError('VALIDATION', 'Name is required.')
    if (!code) throw new LeaveServiceError('VALIDATION', 'Code is required.')
    if (leaveTypesDb.some((item) => !item.isDeleted && item.code.toUpperCase() === code)) {
      throw new LeaveServiceError('CONFLICT', 'Leave type code must be unique.')
    }
    if (data.annualAllocation < 0) {
      throw new LeaveServiceError('VALIDATION', 'Annual allocation cannot be negative.')
    }
    if (data.carryForwardAllowed && data.maxCarryForwardDays > data.annualAllocation) {
      throw new LeaveServiceError(
        'VALIDATION',
        'Carry-forward days cannot exceed annual allocation.',
      )
    }
    if (data.maxCarryForwardDays < 0 || data.maxCarryForwardDays > 30) {
      throw new LeaveServiceError('VALIDATION', 'Maximum carry-forward must be between 0 and 30.')
    }

    const nowIso = new Date().toISOString()
    const created: LeaveType = {
      id: `lt-${crypto.randomUUID().slice(0, 8)}`,
      code,
      name: data.name.trim(),
      description: data.description?.trim() || undefined,
      category: data.category,
      paid: data.paid,
      annualAllocation: data.annualAllocation,
      carryForwardAllowed: data.carryForwardAllowed,
      maxCarryForwardDays: data.carryForwardAllowed ? data.maxCarryForwardDays : 0,
      requiresApproval: data.requiresApproval,
      requiresDocument: data.requiresDocument,
      documentRequiredAfterDays: data.documentRequiredAfterDays,
      minimumNoticeDays: Math.max(0, data.minimumNoticeDays),
      maximumConsecutiveDays: Math.max(0, data.maximumConsecutiveDays),
      applicableGender: data.applicableGender,
      applicableEmploymentTypes: data.applicableEmploymentTypes.length
        ? data.applicableEmploymentTypes
        : ['all'],
      status: data.status,
      createdAt: nowIso,
      updatedAt: nowIso,
      createdBy: actorName,
      updatedBy: actorName,
      isDeleted: false,
    }
    leaveTypesDb.push(created)
    pushAudit({
      action: 'type_created',
      leaveTypeId: created.id,
      user: actorName,
      newValue: created.code,
    })
    return structuredClone(created)
  },

  async updateLeaveType(
    id: string,
    data: LeaveTypeFormValues,
    actorName = 'System',
  ): Promise<LeaveType> {
    await delay()
    const index = leaveTypesDb.findIndex((item) => item.id === id && !item.isDeleted)
    if (index < 0) throw new LeaveServiceError('NOT_FOUND', 'Leave type not found.')
    const code = data.code.trim().toUpperCase()
    if (!data.name.trim()) throw new LeaveServiceError('VALIDATION', 'Name is required.')
    if (!code) throw new LeaveServiceError('VALIDATION', 'Code is required.')
    if (
      leaveTypesDb.some(
        (item) => !item.isDeleted && item.id !== id && item.code.toUpperCase() === code,
      )
    ) {
      throw new LeaveServiceError('CONFLICT', 'Leave type code must be unique.')
    }
    if (data.annualAllocation < 0) {
      throw new LeaveServiceError('VALIDATION', 'Annual allocation cannot be negative.')
    }
    if (data.carryForwardAllowed && data.maxCarryForwardDays > data.annualAllocation) {
      throw new LeaveServiceError(
        'VALIDATION',
        'Carry-forward days cannot exceed annual allocation.',
      )
    }

    const existing = leaveTypesDb[index]
    const updated: LeaveType = {
      ...existing,
      code,
      name: data.name.trim(),
      description: data.description?.trim() || undefined,
      category: data.category,
      paid: data.paid,
      annualAllocation: data.annualAllocation,
      carryForwardAllowed: data.carryForwardAllowed,
      maxCarryForwardDays: data.carryForwardAllowed ? data.maxCarryForwardDays : 0,
      requiresApproval: data.requiresApproval,
      requiresDocument: data.requiresDocument,
      documentRequiredAfterDays: data.documentRequiredAfterDays,
      minimumNoticeDays: Math.max(0, data.minimumNoticeDays),
      maximumConsecutiveDays: Math.max(0, data.maximumConsecutiveDays),
      applicableGender: data.applicableGender,
      applicableEmploymentTypes: data.applicableEmploymentTypes.length
        ? data.applicableEmploymentTypes
        : ['all'],
      status: data.status,
      updatedAt: new Date().toISOString(),
      updatedBy: actorName,
    }
    leaveTypesDb[index] = updated
    pushAudit({
      action: 'type_updated',
      leaveTypeId: id,
      user: actorName,
      previousValue: existing.code,
      newValue: updated.code,
    })
    return structuredClone(updated)
  },

  async deleteLeaveType(id: string, actorName = 'System'): Promise<void> {
    await delay()
    const index = leaveTypesDb.findIndex((item) => item.id === id && !item.isDeleted)
    if (index < 0) throw new LeaveServiceError('NOT_FOUND', 'Leave type not found.')
    const hasPending = requestsDb.some(
      (item) => item.leaveTypeId === id && item.status === LEAVE_REQUEST_STATUSES.PENDING,
    )
    if (hasPending) {
      throw new LeaveServiceError(
        'CONFLICT',
        'Cannot delete a leave type with pending requests. Deactivate it instead.',
      )
    }
    leaveTypesDb[index] = {
      ...leaveTypesDb[index],
      isDeleted: true,
      status: 'inactive',
      deletedAt: new Date().toISOString(),
      deletedBy: actorName,
      updatedAt: new Date().toISOString(),
      updatedBy: actorName,
    }
    pushAudit({ action: 'type_deleted', leaveTypeId: id, user: actorName })
  },

  async activateLeaveType(id: string, actorName = 'System'): Promise<LeaveType> {
    await delay()
    const index = leaveTypesDb.findIndex((item) => item.id === id && !item.isDeleted)
    if (index < 0) throw new LeaveServiceError('NOT_FOUND', 'Leave type not found.')
    leaveTypesDb[index] = {
      ...leaveTypesDb[index],
      status: 'active',
      updatedAt: new Date().toISOString(),
      updatedBy: actorName,
    }
    pushAudit({
      action: 'type_activated',
      leaveTypeId: id,
      user: actorName,
      newValue: 'active',
    })
    return structuredClone(leaveTypesDb[index])
  },

  async deactivateLeaveType(id: string, actorName = 'System'): Promise<LeaveType> {
    await delay()
    const index = leaveTypesDb.findIndex((item) => item.id === id && !item.isDeleted)
    if (index < 0) throw new LeaveServiceError('NOT_FOUND', 'Leave type not found.')
    leaveTypesDb[index] = {
      ...leaveTypesDb[index],
      status: 'inactive',
      updatedAt: new Date().toISOString(),
      updatedBy: actorName,
    }
    pushAudit({
      action: 'type_deactivated',
      leaveTypeId: id,
      user: actorName,
      newValue: 'inactive',
    })
    return structuredClone(leaveTypesDb[index])
  },

  async getLeaveRequests(
    filters: LeaveRequestFilters = {},
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
  ): Promise<PaginatedLeaveRequests> {
    await delay()
    let items = await Promise.all(requestsDb.map((item) => toListItem(item)))

    if (filters.employeeId) {
      items = items.filter((item) => item.employeeId === filters.employeeId)
    }
    if (filters.leaveTypeId) {
      items = items.filter((item) => item.leaveTypeId === filters.leaveTypeId)
    }
    if (filters.status) {
      items = items.filter((item) => item.status === filters.status)
    }
    if (filters.departmentId) {
      items = items.filter((item) => item.departmentId === filters.departmentId)
    }
    if (filters.startDate) {
      items = items.filter((item) => item.endDate >= filters.startDate!)
    }
    if (filters.endDate) {
      items = items.filter((item) => item.startDate <= filters.endDate!)
    }
    if (filters.year) {
      const year = String(filters.year)
      items = items.filter((item) => item.startDate.startsWith(year))
    }
    if (filters.search?.trim()) {
      const q = filters.search.trim().toLowerCase()
      items = items.filter(
        (item) =>
          item.employeeName.toLowerCase().includes(q) ||
          item.employeeCode.toLowerCase().includes(q) ||
          item.leaveTypeName.toLowerCase().includes(q) ||
          item.leaveTypeCode.toLowerCase().includes(q) ||
          item.reason.toLowerCase().includes(q),
      )
    }

    items.sort((a, b) => b.appliedAt.localeCompare(a.appliedAt))
    const total = items.length
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const safePage = Math.min(Math.max(1, page), totalPages)
    const start = (safePage - 1) * pageSize
    return {
      data: items.slice(start, start + pageSize),
      total,
      page: safePage,
      pageSize,
      totalPages,
    }
  },

  async getLeaveRequestById(id: string): Promise<LeaveRequestDetail> {
    await delay()
    const request = requestsDb.find((item) => item.id === id)
    if (!request) throw new LeaveServiceError('NOT_FOUND', 'Leave request not found.')
    const list = await toListItem(request)
    const year = Number(request.startDate.slice(0, 4))
    const balance = findBalance(request.employeeId, request.leaveTypeId, year)
    return {
      ...list,
      ...request,
      balance: balance ? structuredClone(balance) : undefined,
    }
  },

  async createLeaveRequest(
    values: LeaveRequestFormValues,
    actorName = 'System',
    actorEmployeeId?: string,
  ): Promise<LeaveRequest> {
    await delay()
    const employeeId = values.employeeId || actorEmployeeId
    if (!employeeId) throw new LeaveServiceError('VALIDATION', 'Employee is required.')

    const request = await buildRequestFromForm(values, employeeId, actorName)
    const leaveType = getLeaveTypeOrThrow(request.leaveTypeId)

    if (leaveType.paid) {
      const year = Number(request.startDate.slice(0, 4))
      const balance = ensureBalance(employeeId, leaveType.id, year, actorName)
      addPending(balance, request.duration, actorName)
    }

    requestsDb.unshift(request)
    pushAudit({
      action: 'submitted',
      employeeId,
      requestId: request.id,
      user: actorName,
      newValue: LEAVE_REQUEST_STATUSES.PENDING,
    })
    return structuredClone(request)
  },

  async updateLeaveRequest(
    id: string,
    values: LeaveRequestFormValues,
    actorName = 'System',
  ): Promise<LeaveRequest> {
    await delay()
    const index = requestsDb.findIndex((item) => item.id === id)
    if (index < 0) throw new LeaveServiceError('NOT_FOUND', 'Leave request not found.')
    const existing = requestsDb[index]
    if (existing.status !== LEAVE_REQUEST_STATUSES.PENDING) {
      throw new LeaveServiceError('VALIDATION', 'Only pending leave requests can be edited.')
    }

    const previousDuration = existing.duration
    const previousTypeId = existing.leaveTypeId
    const previousYear = Number(existing.startDate.slice(0, 4))
    const previousType = getLeaveTypeOrThrow(previousTypeId)

    if (previousType.paid) {
      const bal = ensureBalance(existing.employeeId, previousTypeId, previousYear, actorName)
      releasePending(bal, previousDuration, actorName)
    }

    try {
      const updated = await buildRequestFromForm(values, existing.employeeId, actorName, id)
      updated.appliedAt = existing.appliedAt
      updated.createdAt = existing.createdAt
      updated.createdBy = existing.createdBy

      const leaveType = getLeaveTypeOrThrow(updated.leaveTypeId)
      if (leaveType.paid) {
        const year = Number(updated.startDate.slice(0, 4))
        const bal = ensureBalance(updated.employeeId, leaveType.id, year, actorName)
        addPending(bal, updated.duration, actorName)
      }

      requestsDb[index] = updated
      pushAudit({
        action: 'edited',
        employeeId: updated.employeeId,
        requestId: id,
        user: actorName,
        previousValue: String(previousDuration),
        newValue: String(updated.duration),
      })
      return structuredClone(updated)
    } catch (error) {
      // Restore previous pending if rebuild failed
      if (previousType.paid) {
        const bal = ensureBalance(existing.employeeId, previousTypeId, previousYear, actorName)
        addPending(bal, previousDuration, actorName)
      }
      throw error
    }
  },

  async approveLeaveRequest(id: string, actorName = 'System'): Promise<LeaveRequest> {
    await delay()
    const index = requestsDb.findIndex((item) => item.id === id)
    if (index < 0) throw new LeaveServiceError('NOT_FOUND', 'Leave request not found.')
    const request = requestsDb[index]
    if (request.status !== LEAVE_REQUEST_STATUSES.PENDING) {
      throw new LeaveServiceError('VALIDATION', 'Only pending requests can be approved.')
    }

    const leaveType = getLeaveTypeOrThrow(request.leaveTypeId)
    const nowIso = new Date().toISOString()

    if (leaveType.paid) {
      const year = Number(request.startDate.slice(0, 4))
      const balance = ensureBalance(request.employeeId, leaveType.id, year, actorName)
      movePendingToUsed(balance, request.duration, actorName)
    }

    try {
      await attendanceService.applyApprovedLeave(
        request.employeeId,
        request.workingDates,
        request.id,
        actorName,
      )
    } catch {
      // Roll back balance if attendance sync fails
      if (leaveType.paid) {
        const year = Number(request.startDate.slice(0, 4))
        const balance = ensureBalance(request.employeeId, leaveType.id, year, actorName)
        updateBalanceInDb({
          ...balance,
          used: Math.max(0, balance.used - request.duration),
          pending: balance.pending + request.duration,
          updatedBy: actorName,
        })
      }
      throw new LeaveServiceError('UNEXPECTED', 'Failed to update attendance for approved leave.')
    }

    const updated: LeaveRequest = {
      ...request,
      status: LEAVE_REQUEST_STATUSES.APPROVED,
      approvedBy: actorName,
      approvedAt: nowIso,
      updatedAt: nowIso,
      updatedBy: actorName,
    }
    requestsDb[index] = updated
    pushAudit({
      action: 'approved',
      employeeId: request.employeeId,
      requestId: id,
      user: actorName,
      previousValue: LEAVE_REQUEST_STATUSES.PENDING,
      newValue: LEAVE_REQUEST_STATUSES.APPROVED,
    })
    return structuredClone(updated)
  },

  async rejectLeaveRequest(
    id: string,
    reason: string,
    actorName = 'System',
  ): Promise<LeaveRequest> {
    await delay()
    if (!reason?.trim()) {
      throw new LeaveServiceError('VALIDATION', 'Rejection reason is required.')
    }
    const index = requestsDb.findIndex((item) => item.id === id)
    if (index < 0) throw new LeaveServiceError('NOT_FOUND', 'Leave request not found.')
    const request = requestsDb[index]
    if (request.status !== LEAVE_REQUEST_STATUSES.PENDING) {
      throw new LeaveServiceError('VALIDATION', 'Only pending requests can be rejected.')
    }

    const leaveType = getLeaveTypeOrThrow(request.leaveTypeId)
    if (leaveType.paid) {
      const year = Number(request.startDate.slice(0, 4))
      const balance = ensureBalance(request.employeeId, leaveType.id, year, actorName)
      releasePending(balance, request.duration, actorName)
    }

    const nowIso = new Date().toISOString()
    const updated: LeaveRequest = {
      ...request,
      status: LEAVE_REQUEST_STATUSES.REJECTED,
      rejectedBy: actorName,
      rejectedAt: nowIso,
      rejectionReason: reason.trim(),
      updatedAt: nowIso,
      updatedBy: actorName,
    }
    requestsDb[index] = updated
    pushAudit({
      action: 'rejected',
      employeeId: request.employeeId,
      requestId: id,
      user: actorName,
      previousValue: LEAVE_REQUEST_STATUSES.PENDING,
      newValue: LEAVE_REQUEST_STATUSES.REJECTED,
      reason: reason.trim(),
    })
    return structuredClone(updated)
  },

  async withdrawLeaveRequest(id: string, actorName = 'System'): Promise<LeaveRequest> {
    await delay()
    const index = requestsDb.findIndex((item) => item.id === id)
    if (index < 0) throw new LeaveServiceError('NOT_FOUND', 'Leave request not found.')
    const request = requestsDb[index]
    if (request.status !== LEAVE_REQUEST_STATUSES.PENDING) {
      throw new LeaveServiceError('VALIDATION', 'Only pending requests can be withdrawn.')
    }

    const leaveType = getLeaveTypeOrThrow(request.leaveTypeId)
    if (leaveType.paid) {
      const year = Number(request.startDate.slice(0, 4))
      const balance = ensureBalance(request.employeeId, leaveType.id, year, actorName)
      releasePending(balance, request.duration, actorName)
    }

    const nowIso = new Date().toISOString()
    const updated: LeaveRequest = {
      ...request,
      status: LEAVE_REQUEST_STATUSES.WITHDRAWN,
      withdrawnAt: nowIso,
      updatedAt: nowIso,
      updatedBy: actorName,
    }
    requestsDb[index] = updated
    pushAudit({
      action: 'withdrawn',
      employeeId: request.employeeId,
      requestId: id,
      user: actorName,
      previousValue: LEAVE_REQUEST_STATUSES.PENDING,
      newValue: LEAVE_REQUEST_STATUSES.WITHDRAWN,
    })
    return structuredClone(updated)
  },

  async cancelLeaveRequest(
    id: string,
    reason: string,
    actorName = 'System',
  ): Promise<LeaveRequest> {
    await delay()
    if (!reason?.trim()) {
      throw new LeaveServiceError('VALIDATION', 'Cancellation reason is required.')
    }
    const index = requestsDb.findIndex((item) => item.id === id)
    if (index < 0) throw new LeaveServiceError('NOT_FOUND', 'Leave request not found.')
    const request = requestsDb[index]

    if (request.status === LEAVE_REQUEST_STATUSES.PENDING) {
      return this.withdrawLeaveRequest(id, actorName)
    }

    if (request.status !== LEAVE_REQUEST_STATUSES.APPROVED) {
      throw new LeaveServiceError('VALIDATION', 'Only approved leave can be cancelled.')
    }

    if (!leavePolicy.allowCancelApprovedFuture) {
      throw new LeaveServiceError('VALIDATION', 'Cancellation of approved leave is not allowed.')
    }

    const today = todayKey()
    if (request.endDate < today) {
      throw new LeaveServiceError('VALIDATION', 'Past leave cannot be cancelled.')
    }

    const leaveType = getLeaveTypeOrThrow(request.leaveTypeId)
    if (leaveType.paid) {
      const year = Number(request.startDate.slice(0, 4))
      const balance = ensureBalance(request.employeeId, leaveType.id, year, actorName)
      restoreUsed(balance, request.duration, actorName)
    }

    try {
      await attendanceService.clearApprovedLeave(
        request.employeeId,
        request.workingDates,
        request.id,
        actorName,
      )
    } catch {
      if (leaveType.paid) {
        const year = Number(request.startDate.slice(0, 4))
        const balance = ensureBalance(request.employeeId, leaveType.id, year, actorName)
        updateBalanceInDb({
          ...balance,
          used: balance.used + request.duration,
          updatedBy: actorName,
        })
      }
      throw new LeaveServiceError(
        'UNEXPECTED',
        'Failed to restore attendance after leave cancellation.',
      )
    }

    const nowIso = new Date().toISOString()
    const updated: LeaveRequest = {
      ...request,
      status: LEAVE_REQUEST_STATUSES.CANCELLED,
      cancelledAt: nowIso,
      cancelledBy: actorName,
      cancellationReason: reason.trim(),
      updatedAt: nowIso,
      updatedBy: actorName,
    }
    requestsDb[index] = updated
    pushAudit({
      action: 'cancelled',
      employeeId: request.employeeId,
      requestId: id,
      user: actorName,
      previousValue: LEAVE_REQUEST_STATUSES.APPROVED,
      newValue: LEAVE_REQUEST_STATUSES.CANCELLED,
      reason: reason.trim(),
    })
    return structuredClone(updated)
  },

  async getLeaveBalances(
    filters: LeaveBalanceFilters = {},
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
  ): Promise<PaginatedLeaveBalances> {
    await delay()
    const year = filters.year ?? LEAVE_DEMO_YEAR
    const employees = await employeeService.getEmployees({ page: 1, pageSize: 200 })
    const employeeMap = new Map(employees.data.map((item) => [item.id, item]))
    const types = leaveTypesDb.filter((item) => !item.isDeleted)

    let rows: LeaveBalanceListItem[] = balancesDb
      .filter((item) => item.year === year)
      .map((item) => {
        const emp = employeeMap.get(item.employeeId)
        const type = types.find((t) => t.id === item.leaveTypeId)
        const refreshed = refreshBalanceAvailable(item)
        return {
          id: item.id,
          employeeId: item.employeeId,
          employeeCode: emp?.employeeCode ?? '—',
          employeeName: emp?.fullName ?? 'Unknown',
          departmentId: emp?.departmentId ?? '',
          departmentName: emp ? getDepartmentNameById(emp.departmentId) : '—',
          leaveTypeId: item.leaveTypeId,
          leaveTypeName: type?.name ?? '—',
          leaveTypeCode: type?.code ?? '—',
          year: item.year,
          openingBalance: refreshed.openingBalance,
          allocated: refreshed.allocated,
          carryForward: refreshed.carryForward,
          used: refreshed.used,
          pending: refreshed.pending,
          adjustment: refreshed.adjustment,
          available: refreshed.available,
        }
      })

    if (filters.employeeId) rows = rows.filter((item) => item.employeeId === filters.employeeId)
    if (filters.leaveTypeId) rows = rows.filter((item) => item.leaveTypeId === filters.leaveTypeId)
    if (filters.departmentId) {
      rows = rows.filter((item) => item.departmentId === filters.departmentId)
    }
    if (filters.search?.trim()) {
      const q = filters.search.trim().toLowerCase()
      rows = rows.filter(
        (item) =>
          item.employeeName.toLowerCase().includes(q) ||
          item.employeeCode.toLowerCase().includes(q) ||
          item.leaveTypeName.toLowerCase().includes(q),
      )
    }

    rows.sort((a, b) =>
      a.employeeName.localeCompare(b.employeeName) || a.leaveTypeName.localeCompare(b.leaveTypeName),
    )
    const total = rows.length
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const safePage = Math.min(Math.max(1, page), totalPages)
    const start = (safePage - 1) * pageSize
    return {
      data: rows.slice(start, start + pageSize),
      total,
      page: safePage,
      pageSize,
      totalPages,
    }
  },

  async getEmployeeLeaveBalances(employeeId: string, year = LEAVE_DEMO_YEAR): Promise<LeaveBalance[]> {
    await delay(120)
    return structuredClone(
      balancesDb
        .filter((item) => item.employeeId === employeeId && item.year === year)
        .map((item) => refreshBalanceAvailable(item)),
    )
  },

  async calculateLeaveBalance(
    employeeId: string,
    leaveTypeId: string,
    year = LEAVE_DEMO_YEAR,
  ): Promise<number> {
    await delay(50)
    const balance = findBalance(employeeId, leaveTypeId, year)
    return balance ? computeAvailableBalance(balance) : 0
  },

  async adjustLeaveBalance(input: {
    employeeId: string
    leaveTypeId: string
    year?: number
    adjustment: number
    reason: string
    actorName?: string
  }): Promise<LeaveBalance> {
    await delay()
    if (!input.reason?.trim()) {
      throw new LeaveServiceError('VALIDATION', 'Adjustment reason is required.')
    }
    const year = input.year ?? LEAVE_DEMO_YEAR
    const actor = input.actorName ?? 'System'
    const balance = ensureBalance(input.employeeId, input.leaveTypeId, year, actor)
    const oldAvailable = balance.available
    const updated = updateBalanceInDb({
      ...balance,
      adjustment: balance.adjustment + input.adjustment,
      updatedBy: actor,
    })

    const record: LeaveBalanceAdjustment = {
      id: `lba-${crypto.randomUUID().slice(0, 8)}`,
      employeeId: input.employeeId,
      leaveTypeId: input.leaveTypeId,
      year,
      oldBalance: oldAvailable,
      adjustment: input.adjustment,
      newBalance: updated.available,
      reason: input.reason.trim(),
      adjustedBy: actor,
      adjustedAt: new Date().toISOString(),
    }
    adjustmentsDb.unshift(record)
    pushAudit({
      action: 'balance_adjusted',
      employeeId: input.employeeId,
      leaveTypeId: input.leaveTypeId,
      balanceId: updated.id,
      user: actor,
      previousValue: String(oldAvailable),
      newValue: String(updated.available),
      reason: input.reason.trim(),
    })
    return structuredClone(updated)
  },

  async initializeYearlyLeaveBalances(year: number, actorName = 'System'): Promise<number> {
    await delay()
    const previousYear = year - 1
    const employees = await employeeService.getEmployees({
      page: 1,
      pageSize: 200,
      filters: { employmentStatus: 'active' },
    })
    const paidTypes = leaveTypesDb.filter(
      (item) => !item.isDeleted && item.status === 'active' && item.paid,
    )
    let created = 0

    for (const emp of employees.data) {
      for (const type of paidTypes) {
        if (findBalance(emp.id, type.id, year)) continue
        const prev = findBalance(emp.id, type.id, previousYear)
        const unused = prev
          ? Math.max(0, computeAvailableBalance({ ...prev, pending: 0 }))
          : 0
        const carryForward = calculateCarryForward(
          unused,
          type.maxCarryForwardDays,
          type.carryForwardAllowed,
        )
        const balance = refreshBalanceAvailable({
          id: `lb-${emp.id}-${type.id}-${year}`,
          employeeId: emp.id,
          leaveTypeId: type.id,
          year,
          openingBalance: 0,
          allocated: type.annualAllocation,
          carryForward,
          used: 0,
          pending: 0,
          adjustment: 0,
          available: 0,
          updatedAt: new Date().toISOString(),
          updatedBy: actorName,
        })
        balancesDb.push(balance)
        created += 1
      }
    }
    return created
  },

  async getLeaveCalendar(filters: LeaveCalendarFilters): Promise<LeaveCalendarDay[]> {
    await delay()
    const monthStart = startOfMonth(parseISO(`${filters.month}-01`))
    const monthEnd = endOfMonth(monthStart)
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

    let requests = requestsDb.filter(
      (item) =>
        item.status === LEAVE_REQUEST_STATUSES.PENDING ||
        item.status === LEAVE_REQUEST_STATUSES.APPROVED,
    )
    if (filters.employeeId) {
      requests = requests.filter((item) => item.employeeId === filters.employeeId)
    }
    if (filters.status) {
      requests = requests.filter((item) => item.status === filters.status)
    }
    if (filters.selfOnly && filters.employeeId) {
      requests = requests.filter((item) => item.employeeId === filters.employeeId)
    }

    const employees = await employeeService.getEmployees({ page: 1, pageSize: 200 })
    const empMap = new Map(employees.data.map((item) => [item.id, item]))

    if (filters.departmentId) {
      requests = requests.filter((item) => {
        const emp = empMap.get(item.employeeId)
        return emp?.departmentId === filters.departmentId
      })
    }

    return days.map((day) => {
      const date = format(day, 'yyyy-MM-dd')
      const entries = requests
        .filter((item) => item.startDate <= date && item.endDate >= date)
        .map((item) => {
          const emp = empMap.get(item.employeeId)
          const type = leaveTypesDb.find((t) => t.id === item.leaveTypeId)
          return {
            requestId: item.id,
            employeeId: item.employeeId,
            employeeName: emp?.fullName ?? 'Unknown',
            leaveTypeCode: type?.code ?? '—',
            leaveTypeName: type?.name ?? '—',
            status: item.status,
            isHalfDay: item.isHalfDay,
          }
        })
      return { date, entries }
    })
  },

  async getOverviewStats(employeeId?: string): Promise<LeaveOverviewStats> {
    await delay(120)
    const today = todayKey()
    const monthPrefix = today.slice(0, 7)
    let requests = requestsDb
    if (employeeId) requests = requests.filter((item) => item.employeeId === employeeId)

    const pending = requests.filter((item) => item.status === LEAVE_REQUEST_STATUSES.PENDING).length
    const approved = requests.filter((item) => item.status === LEAVE_REQUEST_STATUSES.APPROVED)
      .length
    const rejected = requests.filter((item) => item.status === LEAVE_REQUEST_STATUSES.REJECTED)
      .length
    const cancelled = requests.filter((item) => item.status === LEAVE_REQUEST_STATUSES.CANCELLED)
      .length
    const onLeaveToday = requests.filter(
      (item) =>
        item.status === LEAVE_REQUEST_STATUSES.APPROVED &&
        item.startDate <= today &&
        item.endDate >= today,
    ).length

    const stats: LeaveOverviewStats = {
      totalRequests: requests.length,
      pending,
      approved,
      rejected,
      cancelled,
      onLeaveToday,
    }

    if (employeeId) {
      const balances = balancesDb.filter(
        (item) => item.employeeId === employeeId && item.year === LEAVE_DEMO_YEAR,
      )
      stats.availableLeave = balances.reduce((sum, item) => sum + item.available, 0)
      stats.approvedThisMonth = requests.filter(
        (item) =>
          item.status === LEAVE_REQUEST_STATUSES.APPROVED &&
          item.startDate.startsWith(monthPrefix),
      ).length
      stats.upcomingCount = requests.filter(
        (item) =>
          item.status === LEAVE_REQUEST_STATUSES.APPROVED && item.startDate > today,
      ).length
    }

    return stats
  },

  async getUpcomingLeave(limit = 8, employeeId?: string): Promise<UpcomingLeaveItem[]> {
    await delay(100)
    const today = todayKey()
    const employees = await employeeService.getEmployees({ page: 1, pageSize: 200 })
    const empMap = new Map(employees.data.map((item) => [item.id, item]))

    return requestsDb
      .filter(
        (item) =>
          item.status === LEAVE_REQUEST_STATUSES.APPROVED &&
          item.startDate >= today &&
          (!employeeId || item.employeeId === employeeId),
      )
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
      .slice(0, limit)
      .map((item) => {
        const emp = empMap.get(item.employeeId)
        const type = leaveTypesDb.find((t) => t.id === item.leaveTypeId)
        return {
          id: item.id,
          employeeId: item.employeeId,
          employeeName: emp?.fullName ?? 'Unknown',
          departmentName: emp ? getDepartmentNameById(emp.departmentId) : '—',
          leaveTypeName: type?.name ?? '—',
          startDate: item.startDate,
          endDate: item.endDate,
          duration: item.duration,
          status: item.status,
        }
      })
  },

  async getWhoIsOnLeave(date = todayKey()): Promise<OnLeaveTodayItem[]> {
    await delay(100)
    const employees = await employeeService.getEmployees({ page: 1, pageSize: 200 })
    const empMap = new Map(employees.data.map((item) => [item.id, item]))

    return requestsDb
      .filter(
        (item) =>
          item.status === LEAVE_REQUEST_STATUSES.APPROVED &&
          item.startDate <= date &&
          item.endDate >= date,
      )
      .map((item) => {
        const emp = empMap.get(item.employeeId)
        const type = leaveTypesDb.find((t) => t.id === item.leaveTypeId)
        return {
          id: item.id,
          employeeId: item.employeeId,
          employeeName: emp?.fullName ?? 'Unknown',
          departmentName: emp ? getDepartmentNameById(emp.departmentId) : '—',
          leaveTypeName: type?.name ?? '—',
          startDate: item.startDate,
          endDate: item.endDate,
          status: item.status,
        }
      })
  },

  async getAuditEvents(requestId?: string): Promise<LeaveAuditEvent[]> {
    await delay(80)
    const rows = requestId ? auditDb.filter((item) => item.requestId === requestId) : auditDb
    return structuredClone(rows)
  },

  async getPayrollLeaveSummary(
    employeeId: string,
    month: string,
  ): Promise<PayrollLeaveSummary> {
    await delay(80)
    const year = Number(month.slice(0, 4))
    const approved = requestsDb.filter(
      (item) =>
        item.employeeId === employeeId &&
        item.status === LEAVE_REQUEST_STATUSES.APPROVED &&
        item.workingDates.some((d) => d.startsWith(month)),
    )

    let paidLeaveDays = 0
    let unpaidLeaveDays = 0
    for (const item of approved) {
      const type = leaveTypesDb.find((t) => t.id === item.leaveTypeId)
      const daysInMonth = item.workingDates.filter((d) => d.startsWith(month)).length
      const portion =
        item.isHalfDay && daysInMonth > 0 ? item.duration : Math.min(item.duration, daysInMonth)
      if (type?.paid) paidLeaveDays += portion
      else unpaidLeaveDays += portion
    }

    return {
      employeeId,
      year,
      month,
      paidLeaveDays,
      unpaidLeaveDays,
      leaveWithoutPayDays: unpaidLeaveDays,
      approvedLeaveDays: paidLeaveDays + unpaidLeaveDays,
    }
  },

  async previewDuration(
    startDate: string,
    endDate: string,
    dayPortion: 'full_day' | 'half_day',
  ): Promise<{ duration: number; workingDates: string[] }> {
    const holidays = await attendanceService.getHolidays()
    return calculateLeaveDuration(startDate, endDate, dayPortion, holidays, leavePolicy)
  },

  async resolveLinkedEmployeeId(user?: {
    email?: string
    employeeId?: string | null
  }): Promise<string | null> {
    return attendanceService.resolveLinkedEmployeeId(user)
  },

  getDemoToday(): string {
    return todayKey()
  },

  getPolicy() {
    return { ...leavePolicy }
  },
}
