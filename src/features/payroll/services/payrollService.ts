import { format } from 'date-fns'
import { employeeService } from '@/features/employees/services/employeeService'
import type { EmployeeListItem } from '@/features/employees/types'
import { DEFAULT_SALARY_CURRENCY, type SalaryCurrencyCode } from '@/constants/currencies'
import { getPayrollSettings } from '../settings'
import { EDITABLE_PAYROLL_STATUSES, FINAL_LOCKED_STATUSES } from '../constants'
import type {
  DepartmentPayrollSummary,
  PayrollAuditEvent,
  PayrollEmployee,
  PayrollOverviewStats,
  PayrollRun,
  PayrollRunFilters,
  PayrollRunFormValues,
  PayrollValidationIssue,
} from '../types'
import { getPeriodBounds } from '../utils/calculations'
import { PayrollServiceError } from './errors'
import { payrollCalculationService } from './payrollCalculationService'
import { payrollPeriodService } from './payrollPeriodService'

let runsDb: PayrollRun[] = []
let employeesDb: PayrollEmployee[] = []
let auditDb: PayrollAuditEvent[] = []
let seeded = false

function delay(ms = 180): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function nowIso() {
  return new Date().toISOString()
}

function actorName(actor?: string) {
  return actor?.trim() || 'System'
}

function pushAudit(
  action: PayrollAuditEvent['action'],
  payrollRunId: string,
  user: string,
  previousStatus?: PayrollRun['status'],
  newStatus?: PayrollRun['status'],
  reason?: string,
) {
  auditDb.unshift({
    id: `pa-${crypto.randomUUID().slice(0, 8)}`,
    action,
    payrollRunId,
    user,
    timestamp: nowIso(),
    previousStatus,
    newStatus,
    reason,
  })
}

async function listActiveEmployees(): Promise<EmployeeListItem[]> {
  const page = await employeeService.getEmployees({
    filters: { employmentStatus: 'active' },
    page: 1,
    pageSize: 200,
  })
  return page.data
}

function monthLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number)
  return format(new Date(y, m - 1, 1), 'MMMM yyyy')
}

async function resolveEmployeeSelection(
  values: PayrollRunFormValues,
): Promise<EmployeeListItem[]> {
  const all = await listActiveEmployees()
  if (values.selectionMode === 'all') return all
  if (values.selectionMode === 'department') {
    if (!values.departmentId) {
      throw new PayrollServiceError('VALIDATION', 'Department is required for department selection.')
    }
    return all.filter((e) => e.departmentId === values.departmentId)
  }
  const ids = new Set(values.selectedEmployeeIds ?? [])
  if (ids.size === 0) {
    throw new PayrollServiceError('VALIDATION', 'Select at least one employee.')
  }
  // Explicit selection may include inactive if present in directory
  const full = await employeeService.getEmployees({
    filters: {},
    page: 1,
    pageSize: 500,
  })
  return full.data.filter((e) => ids.has(e.id))
}

function findActiveDuplicate(periodId: string, currency: string): PayrollRun | undefined {
  return runsDb.find(
    (r) =>
      r.periodId === periodId &&
      r.currency === currency &&
      r.status !== 'cancelled' &&
      r.status !== 'finalized',
  )
}

async function seedDemoPayroll() {
  if (seeded) return
  seeded = true

  const employees = await listActiveEmployees()
  const inrEmployees = employees.filter((e) => e.employmentStatus === 'active').slice(0, 12)

  // July finalized run
  const julPeriod = await payrollPeriodService.getOrCreatePeriod(7, 2026, 'Harper HR')
  const julRun: PayrollRun = {
    id: 'pr-2026-07',
    periodId: julPeriod.id,
    monthKey: '2026-07',
    name: 'July 2026 Payroll',
    currency: 'INR',
    employeeCount: 0,
    grossPayroll: 0,
    totalDeductions: 0,
    totalEmployerContribution: 0,
    totalNetPayroll: 0,
    totalEmployerCost: 0,
    averageNetSalary: 0,
    status: 'draft',
    selectionMode: 'all',
    createdBy: 'Harper HR',
    createdAt: '2026-07-25T09:00:00.000Z',
    updatedAt: '2026-07-25T09:00:00.000Z',
    updatedBy: 'Harper HR',
  }
  runsDb.push(julRun)

  const julResults: PayrollEmployee[] = []
  for (const emp of inrEmployees) {
    const result = await payrollCalculationService.calculateEmployeePayroll(julRun, emp)
    if (result.employee.status === 'calculated') {
      julResults.push({
        ...result.employee,
        createdAt: '2026-07-25T10:00:00.000Z',
        updatedAt: '2026-07-28T12:00:00.000Z',
      })
    }
  }
  const julTotals = payrollCalculationService.calculatePayrollTotals(julResults)
  const julIdx = runsDb.findIndex((r) => r.id === julRun.id)
  runsDb[julIdx] = {
    ...julRun,
    ...julTotals,
    status: 'finalized',
    calculatedAt: '2026-07-25T11:00:00.000Z',
    approvedAt: '2026-07-27T15:00:00.000Z',
    approvedBy: 'Ava Admin',
    finalizedAt: '2026-07-28T16:00:00.000Z',
    finalizedBy: 'Ava Admin',
    updatedAt: '2026-07-28T16:00:00.000Z',
    updatedBy: 'Ava Admin',
  }
  employeesDb.push(...julResults)
  await payrollPeriodService.setStatus(julPeriod.id, 'finalized', 'Ava Admin')
  pushAudit('created', julRun.id, 'Harper HR', undefined, 'draft')
  pushAudit('calculated', julRun.id, 'Harper HR', 'draft', 'calculated')
  pushAudit('submitted', julRun.id, 'Harper HR', 'calculated', 'pending_approval')
  pushAudit('approved', julRun.id, 'Ava Admin', 'pending_approval', 'approved')
  pushAudit('finalized', julRun.id, 'Ava Admin', 'approved', 'finalized')

  // August draft run (current) — not yet calculated
  const augPeriod = await payrollPeriodService.getOrCreatePeriod(8, 2026, 'Harper HR')
  const augRun: PayrollRun = {
    id: 'pr-2026-08',
    periodId: augPeriod.id,
    monthKey: '2026-08',
    name: 'August 2026 Payroll',
    currency: 'INR',
    employeeCount: inrEmployees.length,
    grossPayroll: 0,
    totalDeductions: 0,
    totalEmployerContribution: 0,
    totalNetPayroll: 0,
    totalEmployerCost: 0,
    averageNetSalary: 0,
    status: 'draft',
    selectionMode: 'all',
    createdBy: 'Harper HR',
    createdAt: '2026-08-05T09:00:00.000Z',
    updatedAt: '2026-08-05T09:00:00.000Z',
    updatedBy: 'Harper HR',
  }
  runsDb.push(augRun)
  for (const emp of inrEmployees) {
    employeesDb.push({
      id: `pe-${augRun.id}-${emp.id}`,
      payrollRunId: augRun.id,
      employeeId: emp.id,
      employeeCode: emp.employeeCode,
      employeeName: emp.fullName,
      departmentId: emp.departmentId,
      departmentName: emp.departmentName,
      designationName: emp.designationName,
      salarySnapshotId: '',
      salarySnapshotIds: [],
      currency: 'INR',
      workingDays: 0,
      payableDays: 0,
      presentDays: 0,
      absentDays: 0,
      paidLeaveDays: 0,
      unpaidLeaveDays: 0,
      halfDays: 0,
      overtimeHours: 0,
      lateMinutes: 0,
      grossEarnings: 0,
      totalDeductions: 0,
      employerContribution: 0,
      netSalary: 0,
      employerCost: 0,
      lopAmount: 0,
      overtimeAmount: 0,
      status: 'pending',
      validationErrors: [],
      validationWarnings: [],
      components: [],
      createdAt: augRun.createdAt,
      updatedAt: augRun.updatedAt,
    })
  }
  pushAudit('created', augRun.id, 'Harper HR', undefined, 'draft')
}

const seedPromise = seedDemoPayroll()

async function ensureSeeded() {
  await seedPromise
}

function getRunOrThrow(id: string): PayrollRun {
  const run = runsDb.find((r) => r.id === id)
  if (!run) throw new PayrollServiceError('NOT_FOUND', 'Payroll run not found.')
  return run
}

function assertEditable(run: PayrollRun) {
  if (FINAL_LOCKED_STATUSES.includes(run.status)) {
    throw new PayrollServiceError('LOCKED', 'Finalized or cancelled payroll cannot be modified.')
  }
}

export const payrollService = {
  async getPayrollRuns(filters: PayrollRunFilters = {}): Promise<PayrollRun[]> {
    await ensureSeeded()
    await delay()
    let rows = [...runsDb]
    if (filters.month) {
      const m = String(filters.month).padStart(2, '0')
      rows = rows.filter((r) => r.monthKey.endsWith(`-${m}`))
    }
    if (filters.year) {
      rows = rows.filter((r) => r.monthKey.startsWith(String(filters.year)))
    }
    if (filters.status) {
      rows = rows.filter((r) => r.status === filters.status)
    }
    if (filters.departmentId) {
      const runIds = new Set(
        employeesDb
          .filter((e) => e.departmentId === filters.departmentId)
          .map((e) => e.payrollRunId),
      )
      rows = rows.filter((r) => runIds.has(r.id))
    }
    if (filters.search?.trim()) {
      const q = filters.search.trim().toLowerCase()
      const matchingRunIds = new Set(
        employeesDb
          .filter(
            (e) =>
              e.employeeName.toLowerCase().includes(q) ||
              e.employeeCode.toLowerCase().includes(q),
          )
          .map((e) => e.payrollRunId),
      )
      rows = rows.filter(
        (r) => r.name.toLowerCase().includes(q) || matchingRunIds.has(r.id),
      )
    }
    return structuredClone(rows.sort((a, b) => b.monthKey.localeCompare(a.monthKey)))
  },

  async getPayrollRunById(id: string): Promise<PayrollRun> {
    await ensureSeeded()
    await delay(100)
    return structuredClone(getRunOrThrow(id))
  },

  async getRunEmployees(runId: string): Promise<PayrollEmployee[]> {
    await ensureSeeded()
    await delay(100)
    getRunOrThrow(runId)
    return structuredClone(
      employeesDb
        .filter((e) => e.payrollRunId === runId)
        .sort((a, b) => a.employeeName.localeCompare(b.employeeName)),
    )
  },

  async getPayrollEmployee(runId: string, employeeId: string): Promise<PayrollEmployee> {
    await ensureSeeded()
    await delay(80)
    const row = employeesDb.find((e) => e.payrollRunId === runId && e.employeeId === employeeId)
    if (!row) throw new PayrollServiceError('NOT_FOUND', 'Employee payroll record not found.')
    return structuredClone(row)
  },

  async validateCreate(values: PayrollRunFormValues): Promise<{
    ready: number
    warnings: PayrollValidationIssue[]
    errors: PayrollValidationIssue[]
    employees: EmployeeListItem[]
  }> {
    await ensureSeeded()
    await delay(120)
    const settings = getPayrollSettings()
    const period = await payrollPeriodService.getOrCreatePeriod(
      values.month,
      values.year,
      'System',
    )
    const duplicate = findActiveDuplicate(period.id, values.currency)
    if (duplicate) {
      throw new PayrollServiceError(
        'CONFLICT',
        `An active payroll run already exists for ${period.monthKey} (${values.currency}).`,
      )
    }

    const selected = await resolveEmployeeSelection(values)
    if (selected.length === 0) {
      throw new PayrollServiceError('VALIDATION', 'No employees available for payroll.')
    }

    const allIssues: PayrollValidationIssue[] = []
    for (const emp of selected) {
      const issues = await payrollCalculationService.validateEmployeeForPeriod(
        emp,
        values.month,
        values.year,
        values.currency,
        settings.allowMixedCurrencies,
      )
      allIssues.push(...issues)
    }

    const errors = allIssues.filter((i) => i.severity === 'error')
    const warnings = allIssues.filter((i) => i.severity === 'warning')
    const errorIds = new Set(errors.map((e) => e.employeeId))
    const ready = selected.filter((e) => !errorIds.has(e.id)).length

    return { ready, warnings, errors, employees: selected }
  },

  async createPayrollRun(
    values: PayrollRunFormValues,
    actor: string,
  ): Promise<PayrollRun> {
    await ensureSeeded()
    await delay(200)
    const name = actorName(actor)
    if (values.month < 1 || values.month > 12) {
      throw new PayrollServiceError('VALIDATION', 'Month must be between 1 and 12.')
    }
    if (!values.name.trim()) {
      throw new PayrollServiceError('VALIDATION', 'Payroll name is required.')
    }

    const validation = await this.validateCreate(values)
    if (validation.employees.length === 0) {
      throw new PayrollServiceError('VALIDATION', 'No employees available for payroll.')
    }

    const period = await payrollPeriodService.getOrCreatePeriod(values.month, values.year, name)
    const bounds = getPeriodBounds(values.month, values.year)
    const now = nowIso()
    const run: PayrollRun = {
      id: `pr-${crypto.randomUUID().slice(0, 8)}`,
      periodId: period.id,
      monthKey: bounds.monthKey,
      name: values.name.trim(),
      currency: values.currency,
      employeeCount: validation.employees.length,
      grossPayroll: 0,
      totalDeductions: 0,
      totalEmployerContribution: 0,
      totalNetPayroll: 0,
      totalEmployerCost: 0,
      averageNetSalary: 0,
      status: 'draft',
      selectionMode: values.selectionMode,
      departmentId: values.departmentId,
      selectedEmployeeIds: values.selectedEmployeeIds,
      createdBy: name,
      createdAt: now,
      updatedAt: now,
      updatedBy: name,
    }
    runsDb.unshift(run)

    for (const emp of validation.employees) {
      employeesDb.push({
        id: `pe-${run.id}-${emp.id}`,
        payrollRunId: run.id,
        employeeId: emp.id,
        employeeCode: emp.employeeCode,
        employeeName: emp.fullName,
        departmentId: emp.departmentId,
        departmentName: emp.departmentName,
        designationName: emp.designationName,
        salarySnapshotId: '',
        salarySnapshotIds: [],
        currency: values.currency,
        workingDays: 0,
        payableDays: 0,
        presentDays: 0,
        absentDays: 0,
        paidLeaveDays: 0,
        unpaidLeaveDays: 0,
        halfDays: 0,
        overtimeHours: 0,
        lateMinutes: 0,
        grossEarnings: 0,
        totalDeductions: 0,
        employerContribution: 0,
        netSalary: 0,
        employerCost: 0,
        lopAmount: 0,
        overtimeAmount: 0,
        status: 'pending',
        validationErrors: validation.errors
          .filter((e) => e.employeeId === emp.id)
          .map((e) => e.message),
        validationWarnings: validation.warnings
          .filter((w) => w.employeeId === emp.id)
          .map((w) => w.message),
        components: [],
        createdAt: now,
        updatedAt: now,
      })
    }

    pushAudit('created', run.id, name, undefined, 'draft')
    return structuredClone(run)
  },

  async updatePayrollRun(
    id: string,
    values: Partial<PayrollRunFormValues>,
    actor: string,
  ): Promise<PayrollRun> {
    await ensureSeeded()
    await delay(150)
    const run = getRunOrThrow(id)
    assertEditable(run)
    if (!EDITABLE_PAYROLL_STATUSES.includes(run.status) && run.status !== 'draft') {
      throw new PayrollServiceError('LOCKED', 'Only draft/calculated payroll can be edited.')
    }
    if (run.status === 'approved' || run.status === 'finalized') {
      throw new PayrollServiceError('LOCKED', 'Approved or finalized payroll cannot be edited.')
    }

    const name = actorName(actor)
    const idx = runsDb.findIndex((r) => r.id === id)
    if (values.name) runsDb[idx].name = values.name.trim()
    runsDb[idx].updatedAt = nowIso()
    runsDb[idx].updatedBy = name
    pushAudit('updated', id, name, run.status, run.status)
    return structuredClone(runsDb[idx])
  },

  async calculatePayrollRun(id: string, actor: string): Promise<PayrollRun> {
    await ensureSeeded()
    await delay(300)
    const run = getRunOrThrow(id)
    assertEditable(run)
    if (!EDITABLE_PAYROLL_STATUSES.includes(run.status)) {
      throw new PayrollServiceError(
        'LOCKED',
        'Payroll can only be calculated while Draft, Processing, or Calculated.',
      )
    }

    const name = actorName(actor)
    const previous = run.status
    const runIdx = runsDb.findIndex((r) => r.id === id)
    runsDb[runIdx] = { ...runsDb[runIdx], status: 'processing', updatedAt: nowIso(), updatedBy: name }

    const existing = employeesDb.filter((e) => e.payrollRunId === id)
    const results: PayrollEmployee[] = []
    const directory = await listActiveEmployees()
    const byId = new Map(directory.map((e) => [e.id, e]))

    // Also allow previously selected employees that may not be in active list
    for (const pe of existing) {
      let emp = byId.get(pe.employeeId)
      if (!emp) {
        try {
          const full = await employeeService.getEmployeeById(pe.employeeId)
          const page = await employeeService.getEmployees({
            filters: { search: full.employeeCode },
            page: 1,
            pageSize: 5,
          })
          emp = page.data.find((e) => e.id === pe.employeeId)
        } catch {
          emp = undefined
        }
      }
      if (!emp) {
        results.push({
          ...pe,
          status: 'error',
          validationErrors: ['Employee record not found.'],
          updatedAt: nowIso(),
        })
        continue
      }
      const result = await payrollCalculationService.calculateEmployeePayroll(run, emp, pe.id)
      results.push(result.employee)
    }

    // Replace employee rows
    employeesDb = employeesDb.filter((e) => e.payrollRunId !== id).concat(results)
    const totals = payrollCalculationService.calculatePayrollTotals(results)
    const hasErrors = results.some((r) => r.status === 'error')
    runsDb[runIdx] = {
      ...runsDb[runIdx],
      ...totals,
      status: 'calculated',
      calculatedAt: nowIso(),
      updatedAt: nowIso(),
      updatedBy: name,
    }
    pushAudit(
      previous === 'calculated' ? 'recalculated' : 'calculated',
      id,
      name,
      previous,
      'calculated',
      hasErrors ? 'Completed with some employee errors.' : undefined,
    )
    await payrollPeriodService.setStatus(run.periodId, 'calculated', name)
    return structuredClone(runsDb[runIdx])
  },

  async recalculatePayrollRun(id: string, actor: string): Promise<PayrollRun> {
    return this.calculatePayrollRun(id, actor)
  },

  async submitForApproval(id: string, actor: string): Promise<PayrollRun> {
    await ensureSeeded()
    await delay(120)
    const run = getRunOrThrow(id)
    if (run.status !== 'calculated') {
      throw new PayrollServiceError('VALIDATION', 'Only calculated payroll can be submitted.')
    }
    const name = actorName(actor)
    const idx = runsDb.findIndex((r) => r.id === id)
    runsDb[idx] = {
      ...runsDb[idx],
      status: 'pending_approval',
      updatedAt: nowIso(),
      updatedBy: name,
    }
    pushAudit('submitted', id, name, 'calculated', 'pending_approval')
    await payrollPeriodService.setStatus(run.periodId, 'pending_approval', name)
    return structuredClone(runsDb[idx])
  },

  async approvePayrollRun(id: string, actor: string): Promise<PayrollRun> {
    await ensureSeeded()
    await delay(150)
    const run = getRunOrThrow(id)
    if (run.status !== 'pending_approval' && run.status !== 'calculated') {
      throw new PayrollServiceError(
        'VALIDATION',
        'Payroll must be calculated or pending approval before approval.',
      )
    }
    const name = actorName(actor)
    const previous = run.status
    const idx = runsDb.findIndex((r) => r.id === id)
    const now = nowIso()
    runsDb[idx] = {
      ...runsDb[idx],
      status: 'approved',
      approvedAt: now,
      approvedBy: name,
      rejectionReason: undefined,
      updatedAt: now,
      updatedBy: name,
    }
    pushAudit('approved', id, name, previous, 'approved')
    await payrollPeriodService.setStatus(run.periodId, 'approved', name)
    return structuredClone(runsDb[idx])
  },

  async rejectPayrollRun(id: string, reason: string, actor: string): Promise<PayrollRun> {
    await ensureSeeded()
    await delay(150)
    const run = getRunOrThrow(id)
    if (run.status !== 'pending_approval' && run.status !== 'approved') {
      throw new PayrollServiceError(
        'VALIDATION',
        'Only pending or approved payroll can be rejected.',
      )
    }
    if (!reason.trim()) {
      throw new PayrollServiceError('VALIDATION', 'Rejection reason is required.')
    }
    const name = actorName(actor)
    const previous = run.status
    const idx = runsDb.findIndex((r) => r.id === id)
    const now = nowIso()
    runsDb[idx] = {
      ...runsDb[idx],
      status: 'calculated',
      rejectedAt: now,
      rejectedBy: name,
      rejectionReason: reason.trim(),
      updatedAt: now,
      updatedBy: name,
    }
    pushAudit('rejected', id, name, previous, 'calculated', reason.trim())
    await payrollPeriodService.setStatus(run.periodId, 'calculated', name)
    return structuredClone(runsDb[idx])
  },

  async finalizePayrollRun(id: string, actor: string): Promise<PayrollRun> {
    await ensureSeeded()
    await delay(180)
    const run = getRunOrThrow(id)
    if (run.status !== 'approved') {
      throw new PayrollServiceError('VALIDATION', 'Only approved payroll can be finalized.')
    }
    const name = actorName(actor)
    const idx = runsDb.findIndex((r) => r.id === id)
    const now = nowIso()
    runsDb[idx] = {
      ...runsDb[idx],
      status: 'finalized',
      finalizedAt: now,
      finalizedBy: name,
      updatedAt: now,
      updatedBy: name,
    }
    // Snapshots already stored on PayrollEmployee/PayrollComponent — lock by status only.
    pushAudit('finalized', id, name, 'approved', 'finalized')
    await payrollPeriodService.setStatus(run.periodId, 'finalized', name)
    return structuredClone(runsDb[idx])
  },

  async cancelPayrollRun(id: string, actor: string): Promise<PayrollRun> {
    await ensureSeeded()
    await delay(120)
    const run = getRunOrThrow(id)
    if (run.status === 'finalized') {
      throw new PayrollServiceError('LOCKED', 'Finalized payroll cannot be cancelled.')
    }
    if (run.status === 'cancelled') {
      throw new PayrollServiceError('VALIDATION', 'Payroll is already cancelled.')
    }
    const name = actorName(actor)
    const previous = run.status
    const idx = runsDb.findIndex((r) => r.id === id)
    const now = nowIso()
    runsDb[idx] = {
      ...runsDb[idx],
      status: 'cancelled',
      cancelledAt: now,
      cancelledBy: name,
      updatedAt: now,
      updatedBy: name,
    }
    pushAudit('cancelled', id, name, previous, 'cancelled')
    await payrollPeriodService.setStatus(run.periodId, 'cancelled', name)
    return structuredClone(runsDb[idx])
  },

  async getOverviewStats(): Promise<PayrollOverviewStats> {
    await ensureSeeded()
    await delay(100)
    const currentKey = '2026-08'
    const current = runsDb.find((r) => r.monthKey === currentKey && r.status !== 'cancelled')
    const pendingApproval = runsDb.filter((r) => r.status === 'pending_approval').length
    const finalized = runsDb.filter((r) => r.status === 'finalized').length
    return {
      currentMonthLabel: monthLabel(currentKey),
      totalEmployees: current?.employeeCount ?? 0,
      grossPayroll: current?.grossPayroll ?? 0,
      totalDeductions: current?.totalDeductions ?? 0,
      employerContributions: current?.totalEmployerContribution ?? 0,
      netPayroll: current?.totalNetPayroll ?? 0,
      pendingApproval,
      finalized,
      currency: (current?.currency ?? DEFAULT_SALARY_CURRENCY) as SalaryCurrencyCode,
    }
  },

  async getDepartmentSummary(runId: string): Promise<DepartmentPayrollSummary[]> {
    await ensureSeeded()
    await delay(80)
    const rows = employeesDb.filter(
      (e) => e.payrollRunId === runId && e.status === 'calculated',
    )
    const map = new Map<string, DepartmentPayrollSummary>()
    for (const row of rows) {
      const existing = map.get(row.departmentId)
      if (existing) {
        existing.employees += 1
        existing.grossPayroll += row.grossEarnings
        existing.deductions += row.totalDeductions
        existing.netPayroll += row.netSalary
        existing.employerCost += row.employerCost
      } else {
        map.set(row.departmentId, {
          departmentId: row.departmentId,
          departmentName: row.departmentName,
          employees: 1,
          grossPayroll: row.grossEarnings,
          deductions: row.totalDeductions,
          netPayroll: row.netSalary,
          employerCost: row.employerCost,
        })
      }
    }
    return structuredClone(
      Array.from(map.values()).sort((a, b) => a.departmentName.localeCompare(b.departmentName)),
    )
  },

  async getAuditEvents(payrollRunId?: string): Promise<PayrollAuditEvent[]> {
    await ensureSeeded()
    await delay(60)
    const rows = payrollRunId
      ? auditDb.filter((a) => a.payrollRunId === payrollRunId)
      : auditDb
    return structuredClone(rows)
  },

  async getEmployeePayrollHistory(employeeId: string): Promise<PayrollEmployee[]> {
    await ensureSeeded()
    await delay(100)
    return structuredClone(
      employeesDb
        .filter((e) => e.employeeId === employeeId)
        .filter((e) => {
          const run = runsDb.find((r) => r.id === e.payrollRunId)
          return run && (run.status === 'finalized' || run.status === 'approved' || e.status === 'calculated')
        })
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    )
  },
}
