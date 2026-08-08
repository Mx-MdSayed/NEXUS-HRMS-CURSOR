import { format, parseISO } from 'date-fns'
import { employeeService } from '@/features/employees/services/employeeService'
import type { EmployeeListItem } from '@/features/employees/types'
import { ROLES } from '@/constants/roles'
import type { RoleName } from '@/types'
import {
  ATTENDANCE_STATUS_LABELS,
  STATUSES_REQUIRING_TIMES,
  STATUSES_WITHOUT_TIMES,
} from '../constants'
import {
  initialAttendance,
  initialAuditEvents,
  initialCorrections,
  todayKey,
} from '../data/mockAttendance'
import { initialHolidays } from '../data/mockHolidays'
import type {
  AttendanceAuditEvent,
  AttendanceCorrection,
  AttendanceFilters,
  AttendanceFormValues,
  AttendanceRecord,
  AttendanceStatus,
  AttendanceSummaryRow,
  CalendarDayAttendance,
  CorrectionFilters,
  EmployeeAttendanceStats,
  Holiday,
  TodayAttendanceRow,
  TodayAttendanceStats,
} from '../types'
import {
  buildEmployeeMonthStats,
  calculateWorkingDaysInMonth,
  deriveStatusFromCheckIn,
  enrichAttendanceMetrics,
  findHoliday,
  formatWorkDuration,
  getMonthDateKeys,
  isWeekOff,
  toDateKey,
  attendanceDayValue,
  calculateAttendancePercentage,
} from '../utils/calculations'
import { AttendanceServiceError } from './errors'

let attendanceDb: AttendanceRecord[] = structuredClone(initialAttendance)
let correctionsDb: AttendanceCorrection[] = structuredClone(initialCorrections)
let auditDb: AttendanceAuditEvent[] = structuredClone(initialAuditEvents)
const holidaysDb: Holiday[] = structuredClone(initialHolidays)

function delay(ms = 280): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function pushAudit(event: Omit<AttendanceAuditEvent, 'id' | 'changedAt'> & { changedAt?: string }) {
  auditDb = [
    {
      id: `aud-${crypto.randomUUID().slice(0, 8)}`,
      changedAt: event.changedAt ?? new Date().toISOString(),
      ...event,
    },
    ...auditDb,
  ]
}

async function getActiveEmployees(): Promise<EmployeeListItem[]> {
  const result = await employeeService.getEmployees({
    filters: { employmentStatus: 'active' },
    page: 1,
    pageSize: 200,
    sortBy: 'fullName',
  })
  return result.data
}

function findRecord(employeeId: string, date: string): AttendanceRecord | undefined {
  return attendanceDb.find((item) => item.employeeId === employeeId && item.date === date)
}

function upsertRecord(record: AttendanceRecord) {
  const index = attendanceDb.findIndex(
    (item) => item.employeeId === record.employeeId && item.date === record.date,
  )
  if (index >= 0) attendanceDb[index] = record
  else attendanceDb = [record, ...attendanceDb]
}

function validateFormTimes(values: AttendanceFormValues) {
  if (STATUSES_REQUIRING_TIMES.includes(values.status)) {
    if (!values.checkIn) {
      throw new AttendanceServiceError('VALIDATION', 'Check-in is required for this status.')
    }
  }
  if (STATUSES_WITHOUT_TIMES.includes(values.status)) {
    return
  }
  if (values.checkIn && values.checkOut) {
    if (parseISO(values.checkOut).getTime() < parseISO(values.checkIn).getTime()) {
      throw new AttendanceServiceError('VALIDATION', 'Check-out cannot be before check-in.')
    }
  }
}

function toIsoFromDateTimeLocal(dateKey: string, value?: string): string | undefined {
  if (!value) return undefined
  if (value.includes('T')) return value.length === 16 ? `${value}:00` : value
  return `${dateKey}T${value}:00`
}

export const attendanceService = {
  getSettingsToday(): string {
    return todayKey()
  },

  async resolveLinkedEmployeeId(user?: {
    email?: string
    employeeId?: string | null
  }): Promise<string | null> {
    if (!user) return null
    if (user.email) {
      const byEmail = await employeeService.getEmployeeByEmail(user.email)
      if (byEmail) return byEmail.id
    }
    if (user.employeeId) {
      const result = await employeeService.getEmployees({
        filters: { search: user.employeeId },
        page: 1,
        pageSize: 20,
      })
      const match = result.data.find(
        (item) => item.employeeCode.toLowerCase() === user.employeeId!.toLowerCase(),
      )
      return match?.id ?? null
    }
    return null
  },

  async getHolidays(): Promise<Holiday[]> {
    await delay(80)
    return structuredClone(holidaysDb)
  },

  async getTodayAttendance(filters: AttendanceFilters = {}): Promise<{
    date: string
    stats: TodayAttendanceStats
    rows: TodayAttendanceRow[]
  }> {
    await delay()
    const date = filters.date || todayKey()
    const employees = await getActiveEmployees()
    const holiday = findHoliday(date, holidaysDb)
    const weekOff = isWeekOff(date)

    let rows: TodayAttendanceRow[] = employees.map((employee) => {
      let attendance = findRecord(employee.id, date)
      if (!attendance && (weekOff || holiday)) {
        attendance = {
          id: `virtual-${employee.id}-${date}`,
          employeeId: employee.id,
          date,
          status: weekOff ? 'week_off' : 'holiday',
          workMinutes: 0,
          overtimeMinutes: 0,
          lateMinutes: 0,
          earlyLeaveMinutes: 0,
          source: 'admin_entry',
          remarks: holiday?.name,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'System',
          updatedBy: 'System',
        }
      }

      return {
        employeeId: employee.id,
        employeeCode: employee.employeeCode,
        fullName: employee.fullName,
        email: employee.email,
        profilePhoto: employee.profilePhoto,
        departmentId: employee.departmentId,
        departmentName: employee.departmentName,
        designationId: employee.designationId,
        designationName: employee.designationName,
        attendance,
        status: attendance?.status ?? 'not_marked',
      }
    })

    rows = rows.filter((row) => {
      if (filters.departmentId && row.departmentId !== filters.departmentId) return false
      if (filters.designationId && row.designationId !== filters.designationId) return false
      if (filters.employeeId && row.employeeId !== filters.employeeId) return false
      if (filters.status) {
        if (filters.status === 'not_marked') {
          if (row.status !== 'not_marked') return false
        } else if (row.status !== filters.status) return false
      }
      if (filters.search?.trim()) {
        const q = filters.search.trim().toLowerCase()
        const haystack = `${row.fullName} ${row.employeeCode} ${row.departmentName}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })

    const stats: TodayAttendanceStats = {
      totalEmployees: employees.length,
      present: 0,
      absent: 0,
      late: 0,
      halfDay: 0,
      onLeave: 0,
      notMarked: 0,
      holiday: 0,
      weekOff: 0,
    }

    // Stats from full employee set for the date (not filtered rows)
    employees.forEach((employee) => {
      const attendance = findRecord(employee.id, date)
      const status = attendance?.status ?? (weekOff ? 'week_off' : holiday ? 'holiday' : 'not_marked')
      if (status === 'present') stats.present += 1
      else if (status === 'absent') stats.absent += 1
      else if (status === 'late') stats.late += 1
      else if (status === 'half_day') stats.halfDay += 1
      else if (status === 'on_leave') stats.onLeave += 1
      else if (status === 'holiday') stats.holiday += 1
      else if (status === 'week_off') stats.weekOff += 1
      else stats.notMarked += 1
    })

    return { date, stats, rows }
  },

  async getAttendanceByDate(date: string): Promise<AttendanceRecord[]> {
    await delay()
    return structuredClone(attendanceDb.filter((item) => item.date === date))
  },

  async getAttendanceByEmployee(
    employeeId: string,
    monthKey?: string,
  ): Promise<AttendanceRecord[]> {
    await delay()
    let rows = attendanceDb.filter((item) => item.employeeId === employeeId)
    if (monthKey) rows = rows.filter((item) => item.date.startsWith(monthKey))
    return structuredClone(rows.sort((a, b) => b.date.localeCompare(a.date)))
  },

  async getEmployeeAttendancePage(
    employeeId: string,
    monthKey: string,
    actor?: { employeeId?: string; role?: RoleName },
  ): Promise<{
    employee: EmployeeListItem
    records: AttendanceRecord[]
    stats: EmployeeAttendanceStats
  }> {
    await delay()
    if (actor?.role === ROLES.EMPLOYEE) {
      if (!actor.employeeId || actor.employeeId !== employeeId) {
        throw new AttendanceServiceError('UNAUTHORIZED', 'You can only view your own attendance.')
      }
    }

    const employees = await getActiveEmployees()
    const employee = employees.find((item) => item.id === employeeId)
    if (!employee) {
      // also try any employee including inactive by id lookup
      try {
        const full = await employeeService.getEmployeeById(employeeId)
        const listItem: EmployeeListItem = {
          id: full.id,
          employeeCode: full.employeeCode,
          fullName: full.fullName,
          email: full.email,
          phone: full.phone,
          profilePhoto: full.profilePhoto,
          departmentId: full.departmentId,
          departmentName: full.departmentId,
          designationId: full.designationId,
          designationName: full.designationId,
          employmentType: full.employmentType,
          employmentStatus: full.employmentStatus,
          joiningDate: full.joiningDate,
        }
        const records = await this.getAttendanceByEmployee(employeeId, monthKey)
        return {
          employee: listItem,
          records,
          stats: buildEmployeeMonthStats(records, monthKey, holidaysDb),
        }
      } catch {
        throw new AttendanceServiceError('NOT_FOUND', 'Employee not found.')
      }
    }

    const records = await this.getAttendanceByEmployee(employeeId, monthKey)
    // enrich names via list item
    return {
      employee,
      records,
      stats: buildEmployeeMonthStats(records, monthKey, holidaysDb),
    }
  },

  async getCalendarAttendance(
    employeeId: string,
    monthKey: string,
    actor?: { employeeId?: string; role?: RoleName },
  ): Promise<CalendarDayAttendance[]> {
    await delay()
    if (actor?.role === ROLES.EMPLOYEE) {
      if (!actor.employeeId || actor.employeeId !== employeeId) {
        throw new AttendanceServiceError('UNAUTHORIZED', 'You can only view your own attendance.')
      }
    }

    const records = await this.getAttendanceByEmployee(employeeId, monthKey)
    const byDate = new Map(records.map((item) => [item.date, item]))
    return getMonthDateKeys(monthKey).map((date) => {
      const holiday = findHoliday(date, holidaysDb)
      const weekOff = isWeekOff(date)
      const record = byDate.get(date)
      return {
        date,
        record,
        status: record?.status ?? (weekOff ? 'week_off' : holiday ? 'holiday' : 'not_marked'),
        isHoliday: Boolean(holiday),
        holidayName: holiday?.name,
        isWeekOff: weekOff,
      }
    })
  },

  async getAttendanceSummary(
    filters: AttendanceFilters,
  ): Promise<{ month: string; rows: AttendanceSummaryRow[] }> {
    await delay()
    const month = filters.month || format(parseISO(todayKey()), 'yyyy-MM')
    const employees = await getActiveEmployees()
    const working = calculateWorkingDaysInMonth(month, holidaysDb)

    let filtered = employees
    if (filters.departmentId) {
      filtered = filtered.filter((item) => item.departmentId === filters.departmentId)
    }
    if (filters.employeeId) {
      filtered = filtered.filter((item) => item.id === filters.employeeId)
    }
    if (filters.search?.trim()) {
      const q = filters.search.trim().toLowerCase()
      filtered = filtered.filter((item) =>
        `${item.fullName} ${item.employeeCode} ${item.departmentName}`.toLowerCase().includes(q),
      )
    }

    const rows: AttendanceSummaryRow[] = filtered.map((employee) => {
      const records = attendanceDb.filter(
        (item) => item.employeeId === employee.id && item.date.startsWith(month),
      )
      const stats = buildEmployeeMonthStats(records, month, holidaysDb)
      const presentEquivalent = records.reduce(
        (sum, item) => sum + attendanceDayValue(item.status),
        0,
      )
      return {
        employeeId: employee.id,
        employeeCode: employee.employeeCode,
        fullName: employee.fullName,
        departmentName: employee.departmentName,
        workingDays: working.applicableWorkingDays,
        present: stats.presentDays,
        absent: stats.absentDays,
        late: stats.lateDays,
        halfDay: stats.halfDays,
        onLeave: stats.leaveDays,
        holiday: stats.holidayDays,
        weekOff: stats.weekOffDays,
        totalWorkMinutes: records.reduce((sum, item) => sum + item.workMinutes, 0),
        attendancePercentage: calculateAttendancePercentage(
          presentEquivalent,
          working.applicableWorkingDays,
        ),
      }
    })

    return { month, rows }
  },

  async createAttendance(
    values: AttendanceFormValues,
    actorName = 'System',
    source: AttendanceRecord['source'] = 'admin_entry',
  ): Promise<AttendanceRecord> {
    await delay()
    validateFormTimes(values)
    const existing = findRecord(values.employeeId, values.date)
    if (existing) {
      throw new AttendanceServiceError(
        'CONFLICT',
        'Attendance already exists for this employee and date.',
      )
    }

    const employees = await getActiveEmployees()
    if (!employees.some((item) => item.id === values.employeeId)) {
      throw new AttendanceServiceError('VALIDATION', 'Select a valid active employee.')
    }

    const checkIn = toIsoFromDateTimeLocal(values.date, values.checkIn)
    const checkOut = toIsoFromDateTimeLocal(values.date, values.checkOut)
    const metrics = enrichAttendanceMetrics({
      date: values.date,
      checkIn,
      checkOut,
      status: values.status,
    })

    const record: AttendanceRecord = {
      id: `att-${crypto.randomUUID().slice(0, 8)}`,
      employeeId: values.employeeId,
      date: values.date,
      checkIn,
      checkOut,
      remarks: values.remarks?.trim() || undefined,
      source,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: actorName,
      updatedBy: actorName,
      ...metrics,
      status: STATUSES_WITHOUT_TIMES.includes(values.status) ? values.status : metrics.status,
    }

    upsertRecord(record)
    pushAudit({
      attendanceId: record.id,
      employeeId: record.employeeId,
      date: record.date,
      action: 'created',
      newValue: record.status,
      changedBy: actorName,
    })
    return structuredClone(record)
  },

  async updateAttendance(
    id: string,
    values: AttendanceFormValues,
    actorName = 'System',
    reason?: string,
  ): Promise<AttendanceRecord> {
    await delay()
    const index = attendanceDb.findIndex((item) => item.id === id)
    if (index < 0) throw new AttendanceServiceError('NOT_FOUND', 'Attendance record not found.')
    validateFormTimes(values)

    const existing = attendanceDb[index]
    const checkIn = toIsoFromDateTimeLocal(values.date, values.checkIn)
    const checkOut = toIsoFromDateTimeLocal(values.date, values.checkOut)
    const metrics = enrichAttendanceMetrics({
      date: values.date,
      checkIn,
      checkOut,
      status: values.status,
    })

    const updated: AttendanceRecord = {
      ...existing,
      checkIn,
      checkOut,
      remarks: values.remarks?.trim() || undefined,
      source: existing.source === 'self_check_in' ? 'manual' : existing.source,
      updatedAt: new Date().toISOString(),
      updatedBy: actorName,
      ...metrics,
      status: STATUSES_WITHOUT_TIMES.includes(values.status) ? values.status : metrics.status,
    }

    attendanceDb[index] = updated
    pushAudit({
      attendanceId: updated.id,
      employeeId: updated.employeeId,
      date: updated.date,
      action: 'updated',
      oldValue: existing.status,
      newValue: updated.status,
      changedBy: actorName,
      reason,
    })
    return structuredClone(updated)
  },

  async checkIn(employeeId: string, actorName = 'System'): Promise<AttendanceRecord> {
    await delay()
    const date = todayKey()
    const existing = findRecord(employeeId, date)
    if (existing?.checkIn) {
      throw new AttendanceServiceError('CONFLICT', 'You have already checked in today.')
    }
    if (existing && STATUSES_WITHOUT_TIMES.includes(existing.status)) {
      throw new AttendanceServiceError(
        'VALIDATION',
        `Cannot check in when status is ${ATTENDANCE_STATUS_LABELS[existing.status]}.`,
      )
    }

    const now = new Date()
    const checkIn = now.toISOString()
    const status = deriveStatusFromCheckIn(checkIn, date)
    const metrics = enrichAttendanceMetrics({ date, checkIn, status })

    const record: AttendanceRecord = existing
      ? {
          ...existing,
          checkIn,
          status: metrics.status,
          lateMinutes: metrics.lateMinutes,
          workMinutes: metrics.workMinutes,
          overtimeMinutes: metrics.overtimeMinutes,
          earlyLeaveMinutes: metrics.earlyLeaveMinutes,
          source: 'self_check_in',
          updatedAt: now.toISOString(),
          updatedBy: actorName,
        }
      : {
          id: `att-${crypto.randomUUID().slice(0, 8)}`,
          employeeId,
          date,
          checkIn,
          status: metrics.status,
          workMinutes: 0,
          overtimeMinutes: 0,
          lateMinutes: metrics.lateMinutes,
          earlyLeaveMinutes: 0,
          source: 'self_check_in',
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          createdBy: actorName,
          updatedBy: actorName,
        }

    upsertRecord(record)
    pushAudit({
      attendanceId: record.id,
      employeeId,
      date,
      action: 'check_in',
      newValue: record.checkIn,
      changedBy: actorName,
    })
    return structuredClone(record)
  },

  async checkOut(employeeId: string, actorName = 'System'): Promise<AttendanceRecord> {
    await delay()
    const date = todayKey()
    const existing = findRecord(employeeId, date)
    if (!existing?.checkIn) {
      throw new AttendanceServiceError('VALIDATION', 'Check-in is required before check-out.')
    }
    if (existing.checkOut) {
      throw new AttendanceServiceError('CONFLICT', 'You have already checked out today.')
    }

    const now = new Date()
    const checkOut = now.toISOString()
    if (parseISO(checkOut).getTime() < parseISO(existing.checkIn).getTime()) {
      throw new AttendanceServiceError('VALIDATION', 'Check-out cannot be before check-in.')
    }

    const metrics = enrichAttendanceMetrics({
      date,
      checkIn: existing.checkIn,
      checkOut,
      status: existing.status === 'late' ? 'late' : 'present',
    })

    const updated: AttendanceRecord = {
      ...existing,
      checkOut,
      ...metrics,
      updatedAt: now.toISOString(),
      updatedBy: actorName,
    }
    upsertRecord(updated)
    pushAudit({
      attendanceId: updated.id,
      employeeId,
      date,
      action: 'check_out',
      newValue: updated.checkOut,
      changedBy: actorName,
    })
    return structuredClone(updated)
  },

  async getCorrectionRequests(filters: CorrectionFilters = {}): Promise<AttendanceCorrection[]> {
    await delay()
    let rows = [...correctionsDb]
    if (filters.status) rows = rows.filter((item) => item.status === filters.status)
    if (filters.employeeId) rows = rows.filter((item) => item.employeeId === filters.employeeId)
    if (filters.search?.trim()) {
      const q = filters.search.trim().toLowerCase()
      rows = rows.filter(
        (item) =>
          item.reason.toLowerCase().includes(q) ||
          item.employeeId.toLowerCase().includes(q) ||
          item.date.includes(q),
      )
    }
    return structuredClone(rows.sort((a, b) => b.requestedAt.localeCompare(a.requestedAt)))
  },

  async createCorrectionRequest(
    input: {
      employeeId: string
      date: string
      requestedStatus: AttendanceStatus
      requestedCheckIn?: string
      requestedCheckOut?: string
      reason: string
    },
    actorName = 'System',
  ): Promise<AttendanceCorrection> {
    await delay()
    if (!input.reason.trim()) {
      throw new AttendanceServiceError('VALIDATION', 'Correction reason is required.')
    }

    const current = findRecord(input.employeeId, input.date)
    const pending = correctionsDb.find(
      (item) =>
        item.employeeId === input.employeeId &&
        item.date === input.date &&
        item.status === 'pending',
    )
    if (pending) {
      throw new AttendanceServiceError(
        'CONFLICT',
        'A pending correction request already exists for this date.',
      )
    }

    const correction: AttendanceCorrection = {
      id: `corr-${crypto.randomUUID().slice(0, 8)}`,
      attendanceId: current?.id,
      employeeId: input.employeeId,
      date: input.date,
      currentStatus: current?.status,
      currentCheckIn: current?.checkIn,
      currentCheckOut: current?.checkOut,
      requestedStatus: input.requestedStatus,
      requestedCheckIn: toIsoFromDateTimeLocal(input.date, input.requestedCheckIn),
      requestedCheckOut: toIsoFromDateTimeLocal(input.date, input.requestedCheckOut),
      reason: input.reason.trim(),
      status: 'pending',
      requestedAt: new Date().toISOString(),
      requestedBy: actorName,
    }
    correctionsDb = [correction, ...correctionsDb]
    void import('@/features/workflows').then(async ({ workflowRoutingService, workflowService }) => {
      const approver = await workflowRoutingService.getApproverForAttendance(correction.employeeId)
      const workflow = await workflowService.create({
        type: 'attendance_correction',
        title: `Attendance correction for ${correction.date}`,
        description: correction.reason,
        requesterId: correction.employeeId,
        requesterName: actorName,
        assignedToId: approver.id,
        assignedToName: approver.name,
        referenceType: 'attendance_correction',
        referenceId: correction.id,
        priority: 'normal',
        metadata: { date: correction.date, requestedStatus: correction.requestedStatus },
      })
      const { notificationTriggerService } = await import('@/features/notifications')
      await notificationTriggerService.notifyAttendanceCorrectionSubmitted({
        correction,
        approverIds: [approver.id],
        workflowId: workflow.id,
      })
    }).catch((error) => console.warn('Attendance workflow notification failed', error))
    return structuredClone(correction)
  },

  async approveCorrection(
    id: string,
    actorName = 'System',
    reviewComment?: string,
  ): Promise<AttendanceCorrection> {
    await delay()
    const index = correctionsDb.findIndex((item) => item.id === id)
    if (index < 0) throw new AttendanceServiceError('NOT_FOUND', 'Correction request not found.')
    const correction = correctionsDb[index]
    if (correction.status !== 'pending') {
      throw new AttendanceServiceError('VALIDATION', 'Only pending corrections can be approved.')
    }

    const values: AttendanceFormValues = {
      employeeId: correction.employeeId,
      date: correction.date,
      status: correction.requestedStatus,
      checkIn: correction.requestedCheckIn,
      checkOut: correction.requestedCheckOut,
      remarks: correction.reason,
    }

    const existing = findRecord(correction.employeeId, correction.date)
    let record: AttendanceRecord
    if (existing) {
      record = await this.updateAttendance(existing.id, values, actorName, correction.reason)
    } else {
      record = await this.createAttendance(values, actorName, 'correction')
    }
    record.correctionStatus = 'approved'
    record.correctedBy = actorName
    record.correctedAt = new Date().toISOString()
    record.source = 'correction'
    upsertRecord(record)

    const updated: AttendanceCorrection = {
      ...correction,
      attendanceId: record.id,
      status: 'approved',
      reviewedBy: actorName,
      reviewedAt: new Date().toISOString(),
      reviewComment: reviewComment?.trim() || undefined,
    }
    correctionsDb[index] = updated
    pushAudit({
      attendanceId: record.id,
      employeeId: record.employeeId,
      date: record.date,
      action: 'correction_approved',
      oldValue: correction.currentStatus,
      newValue: correction.requestedStatus,
      changedBy: actorName,
      reason: correction.reason,
    })
    void import('@/features/workflows').then(({ workflowService }) =>
      workflowService.completeByReference('attendance_correction', updated.id, actorName),
    ).catch((error) => console.warn('Attendance workflow completion failed', error))
    void import('@/features/notifications').then(({ notificationTriggerService }) =>
      notificationTriggerService.notifyAttendanceCorrectionApproved({ correction: updated, actorName }),
    ).catch((error) => console.warn('Attendance approval notification failed', error))
    return structuredClone(updated)
  },

  async rejectCorrection(
    id: string,
    actorName = 'System',
    reviewComment?: string,
  ): Promise<AttendanceCorrection> {
    await delay()
    const index = correctionsDb.findIndex((item) => item.id === id)
    if (index < 0) throw new AttendanceServiceError('NOT_FOUND', 'Correction request not found.')
    const correction = correctionsDb[index]
    if (correction.status !== 'pending') {
      throw new AttendanceServiceError('VALIDATION', 'Only pending corrections can be rejected.')
    }
    const updated: AttendanceCorrection = {
      ...correction,
      status: 'rejected',
      reviewedBy: actorName,
      reviewedAt: new Date().toISOString(),
      reviewComment: reviewComment?.trim() || undefined,
    }
    correctionsDb[index] = updated
    pushAudit({
      attendanceId: correction.attendanceId ?? 'n/a',
      employeeId: correction.employeeId,
      date: correction.date,
      action: 'correction_rejected',
      oldValue: correction.currentStatus,
      newValue: correction.requestedStatus,
      changedBy: actorName,
      reason: reviewComment || correction.reason,
    })
    void import('@/features/workflows').then(({ workflowService }) =>
      workflowService.rejectByReference(
        'attendance_correction',
        updated.id,
        actorName,
        reviewComment || correction.reason,
      ),
    ).catch((error) => console.warn('Attendance workflow rejection failed', error))
    void import('@/features/notifications').then(({ notificationTriggerService }) =>
      notificationTriggerService.notifyAttendanceCorrectionRejected({
        correction: updated,
        actorName,
        reason: reviewComment || correction.reason,
      }),
    ).catch((error) => console.warn('Attendance rejection notification failed', error))
    return structuredClone(updated)
  },

  async getAuditEvents(employeeId?: string): Promise<AttendanceAuditEvent[]> {
    await delay(100)
    const rows = employeeId
      ? auditDb.filter((item) => item.employeeId === employeeId)
      : auditDb
    return structuredClone(rows)
  },

  /**
   * Mark working days as On Leave for an approved leave request.
   * Does not overwrite holiday / week_off records.
   * Simulates transactional behavior for mock data consistency.
   */
  async applyApprovedLeave(
    employeeId: string,
    workingDates: string[],
    leaveRequestId: string,
    actorName = 'System',
  ): Promise<void> {
    await delay(80)
    const nowIso = new Date().toISOString()
    for (const date of workingDates) {
      const holiday = findHoliday(date, holidaysDb)
      const weekOff = isWeekOff(date)
      if (holiday || weekOff) continue

      const existing = findRecord(employeeId, date)
      const remarks = `On leave (request ${leaveRequestId})`

      if (existing) {
        if (existing.status === 'holiday' || existing.status === 'week_off') continue
        const previous = existing.status
        const updated: AttendanceRecord = {
          ...existing,
          status: 'on_leave',
          checkIn: undefined,
          checkOut: undefined,
          workMinutes: 0,
          overtimeMinutes: 0,
          lateMinutes: 0,
          earlyLeaveMinutes: 0,
          remarks,
          source: 'leave',
          updatedAt: nowIso,
          updatedBy: actorName,
        }
        upsertRecord(updated)
        pushAudit({
          attendanceId: updated.id,
          employeeId,
          date,
          action: 'leave_approved',
          oldValue: previous,
          newValue: 'on_leave',
          changedBy: actorName,
          reason: leaveRequestId,
        })
      } else {
        const created: AttendanceRecord = {
          id: `att-${crypto.randomUUID().slice(0, 8)}`,
          employeeId,
          date,
          status: 'on_leave',
          workMinutes: 0,
          overtimeMinutes: 0,
          lateMinutes: 0,
          earlyLeaveMinutes: 0,
          remarks,
          source: 'leave',
          createdAt: nowIso,
          updatedAt: nowIso,
          createdBy: actorName,
          updatedBy: actorName,
        }
        upsertRecord(created)
        pushAudit({
          attendanceId: created.id,
          employeeId,
          date,
          action: 'leave_approved',
          newValue: 'on_leave',
          changedBy: actorName,
          reason: leaveRequestId,
        })
      }
    }
  },

  /**
   * Restore attendance after approved leave cancellation.
   * Clears On Leave records created/updated by leave; does not touch holiday/week_off.
   */
  async clearApprovedLeave(
    employeeId: string,
    workingDates: string[],
    leaveRequestId: string,
    actorName = 'System',
  ): Promise<void> {
    await delay(80)
    const nowIso = new Date().toISOString()
    for (const date of workingDates) {
      const existing = findRecord(employeeId, date)
      if (!existing) continue
      if (existing.status !== 'on_leave') continue
      if (existing.source !== 'leave' && !existing.remarks?.includes(leaveRequestId)) continue

      const previous = existing.status
      const updated: AttendanceRecord = {
        ...existing,
        status: 'absent',
        checkIn: undefined,
        checkOut: undefined,
        workMinutes: 0,
        overtimeMinutes: 0,
        lateMinutes: 0,
        earlyLeaveMinutes: 0,
        remarks: `Leave cancelled (${leaveRequestId})`,
        source: 'leave',
        updatedAt: nowIso,
        updatedBy: actorName,
      }
      upsertRecord(updated)
      pushAudit({
        attendanceId: updated.id,
        employeeId,
        date,
        action: 'leave_cancelled',
        oldValue: previous,
        newValue: 'absent',
        changedBy: actorName,
        reason: leaveRequestId,
      })
    }
  },

  formatWorkHours(minutes: number): string {
    return formatWorkDuration(minutes)
  },

  toDateKey,
}
