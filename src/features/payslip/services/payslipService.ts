import type { SalaryCurrencyCode } from '@/constants/currencies'
import { employeeService } from '@/features/employees/services/employeeService'
import { payrollService, type PayrollEmployee, type PayrollRun } from '@/features/payroll'
import { getPeriodBounds } from '@/features/payroll/utils/calculations'
import { getCompanyProfile } from '../company'
import type {
  BulkGenerationPreview,
  Payslip,
  PayslipComponentLine,
  PayslipFilters,
} from '../types'
import { maskAccountNumber } from '../utils/maskAccount'
import { generatePayslipNumber as formatPayslipNumber } from '../utils/numbering'
import { PayslipServiceError } from './errors'

const FINALIZATION_ERROR = 'Payslip can only be generated after payroll is finalized.'

let payslipsDb: Payslip[] = []
let seeded = false
let seedPromise: Promise<void> | null = null

function delay(ms = 160): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function nowIso(): string {
  return new Date().toISOString()
}

function actorName(actor?: string): string {
  return actor?.trim() || 'System'
}

function parseMonthKey(monthKey: string): { year: number; month: number } {
  const [year, month] = monthKey.split('-').map(Number)
  return { year, month }
}

function getNextSequence(year: number, month: number): number {
  return (
    payslipsDb.filter((item) => item.payrollYear === year && item.payrollMonth === month).length + 1
  )
}

function toComponentLines(
  employee: PayrollEmployee,
  category: PayslipComponentLine['category'],
): PayslipComponentLine[] {
  return employee.components
    .filter((component) => component.category === category)
    .map((component) => ({
      id: component.id,
      componentCode: component.componentCode,
      componentName: component.componentName,
      category: component.category,
      amount: component.amount,
      taxable: component.taxable,
      statutory: component.statutory,
    }))
}

async function findPayrollEmployeeById(payrollEmployeeId: string): Promise<{
  run: PayrollRun
  employee: PayrollEmployee
}> {
  const runs = await payrollService.getPayrollRuns({})
  for (const run of runs) {
    const employees = await payrollService.getRunEmployees(run.id)
    const employee = employees.find((item) => item.id === payrollEmployeeId)
    if (employee) return { run, employee }
  }
  throw new PayslipServiceError('NOT_FOUND', 'Payroll employee not found.')
}

async function buildPayslipFromPayrollEmployee(
  run: PayrollRun,
  employee: PayrollEmployee,
  actor: string,
  generatedAt = nowIso(),
): Promise<Payslip> {
  if (run.status !== 'finalized') {
    throw new PayslipServiceError('NOT_FINALIZED', FINALIZATION_ERROR)
  }
  if (employee.status !== 'calculated') {
    throw new PayslipServiceError('VALIDATION', 'Payroll employee must be calculated before payslip generation.')
  }
  if (payslipsDb.some((item) => item.payrollEmployeeId === employee.id)) {
    throw new PayslipServiceError('CONFLICT', 'Payslip already exists.')
  }

  const { year, month } = parseMonthKey(run.monthKey)
  const bounds = getPeriodBounds(month, year)
  const sequence = getNextSequence(year, month)
  const companySnapshot = getCompanyProfile()
  let joiningDateSnapshot: string | undefined
  let bankName: string | undefined
  let accountNumberMasked: string | undefined
  let ifsc: string | undefined

  try {
    const employeeRecord = await employeeService.getEmployeeById(employee.employeeId)
    joiningDateSnapshot = employeeRecord.joiningDate
    bankName = employeeRecord.banking.bankName
    accountNumberMasked = employeeRecord.banking.accountNumber
      ? maskAccountNumber(employeeRecord.banking.accountNumber)
      : undefined
    ifsc = employeeRecord.banking.ifsc
  } catch {
    joiningDateSnapshot = undefined
  }

  return {
    id: `ps-${crypto.randomUUID().slice(0, 8)}`,
    payslipNumber: formatPayslipNumber(year, month, sequence),
    payrollRunId: run.id,
    payrollEmployeeId: employee.id,
    employeeId: employee.employeeId,
    employeeNameSnapshot: employee.employeeName,
    employeeCodeSnapshot: employee.employeeCode,
    departmentSnapshot: employee.departmentName,
    designationSnapshot: employee.designationName,
    joiningDateSnapshot,
    companySnapshot,
    payrollMonth: month,
    payrollYear: year,
    monthKey: run.monthKey,
    periodStart: bounds.startDate,
    periodEnd: bounds.endDate,
    currency: employee.currency as SalaryCurrencyCode,
    grossEarnings: employee.grossEarnings,
    totalDeductions: employee.totalDeductions,
    netSalary: employee.netSalary,
    employerContribution: employee.employerContribution,
    employerCost: employee.employerCost,
    workingDays: employee.workingDays,
    payableDays: employee.payableDays,
    presentDays: employee.presentDays,
    absentDays: employee.absentDays,
    halfDays: employee.halfDays,
    paidLeaveDays: employee.paidLeaveDays,
    unpaidLeaveDays: employee.unpaidLeaveDays,
    overtimeHours: employee.overtimeHours,
    earnings: toComponentLines(employee, 'earning'),
    deductions: toComponentLines(employee, 'deduction'),
    employerContributions: toComponentLines(employee, 'employer_contribution'),
    paymentMethod: bankName ? 'Bank transfer' : 'Manual payout',
    bankName,
    accountNumberMasked,
    ifsc,
    paymentDate: run.finalizedAt,
    transactionReference: undefined,
    status: 'generated',
    generatedAt,
    generatedBy: actorName(actor),
    createdAt: generatedAt,
    updatedAt: generatedAt,
  }
}

async function seedDemoPayslips(): Promise<void> {
  if (seeded) return
  seeded = true
  try {
    const run = await payrollService.getPayrollRunById('pr-2026-07')
    const employees = (await payrollService.getRunEmployees(run.id)).filter(
      (employee) => employee.status === 'calculated',
    )
    const seedCount = Math.max(0, employees.length - 2)
    for (const employee of employees.slice(0, seedCount)) {
      const payslip = await buildPayslipFromPayrollEmployee(
        run,
        employee,
        'Ava Admin',
        '2026-07-29T09:30:00.000Z',
      )
      payslipsDb.push(payslip)
    }
  } catch {
    // Payroll demo data may be unavailable in isolated tests; normal calls will surface errors.
  }
}

async function ensureSeeded(): Promise<void> {
  if (!seedPromise) seedPromise = seedDemoPayslips()
  await seedPromise
}

function getPayslipOrThrow(id: string): Payslip {
  const row = payslipsDb.find((item) => item.id === id)
  if (!row) throw new PayslipServiceError('NOT_FOUND', 'Payslip not found.')
  return row
}

export const payslipService = {
  async getPayslips(filters: PayslipFilters = {}): Promise<Payslip[]> {
    await ensureSeeded()
    await delay()
    let rows = [...payslipsDb]
    if (filters.search?.trim()) {
      const q = filters.search.trim().toLowerCase()
      rows = rows.filter((item) =>
        [
          item.payslipNumber,
          item.employeeNameSnapshot,
          item.employeeCodeSnapshot,
          item.departmentSnapshot,
          item.designationSnapshot,
          item.monthKey,
        ]
          .join(' ')
          .toLowerCase()
          .includes(q),
      )
    }
    if (filters.month) rows = rows.filter((item) => item.payrollMonth === Number(filters.month))
    if (filters.year) rows = rows.filter((item) => item.payrollYear === Number(filters.year))
    if (filters.departmentId) {
      rows = rows.filter((item) => item.departmentSnapshot === filters.departmentId)
    }
    if (filters.employeeId) rows = rows.filter((item) => item.employeeId === filters.employeeId)
    if (filters.status) rows = rows.filter((item) => item.status === filters.status)
    if (filters.currency) rows = rows.filter((item) => item.currency === filters.currency)
    return structuredClone(
      rows.sort(
        (a, b) =>
          b.monthKey.localeCompare(a.monthKey) ||
          a.employeeNameSnapshot.localeCompare(b.employeeNameSnapshot),
      ),
    )
  },

  async getPayslipById(id: string): Promise<Payslip> {
    await ensureSeeded()
    await delay(100)
    return structuredClone(getPayslipOrThrow(id))
  },

  async getEmployeePayslips(employeeId: string): Promise<Payslip[]> {
    await ensureSeeded()
    await delay(100)
    return structuredClone(
      payslipsDb
        .filter((item) => item.employeeId === employeeId)
        .sort((a, b) => b.monthKey.localeCompare(a.monthKey)),
    )
  },

  async validatePayrollFinalized(payrollRunId: string): Promise<PayrollRun> {
    await ensureSeeded()
    await delay(80)
    const run = await payrollService.getPayrollRunById(payrollRunId)
    if (run.status !== 'finalized') {
      throw new PayslipServiceError('NOT_FINALIZED', FINALIZATION_ERROR)
    }
    return run
  },

  async generatePayslip(payrollEmployeeId: string, actor: string): Promise<Payslip> {
    await ensureSeeded()
    await delay(180)
    const { run, employee } = await findPayrollEmployeeById(payrollEmployeeId)
    const payslip = await buildPayslipFromPayrollEmployee(run, employee, actor)
    payslipsDb.push(payslip)
    void import('@/features/notifications').then(({ notificationTriggerService }) =>
      notificationTriggerService.notifyPayslipGenerated({ payslip }),
    ).catch((error) => console.warn('Payslip notification failed', error))
    return structuredClone(payslip)
  },

  async generateAllPayslips(payrollRunId: string, actor: string): Promise<Payslip[]> {
    await ensureSeeded()
    await delay(220)
    const run = await this.validatePayrollFinalized(payrollRunId)
    const employees = (await payrollService.getRunEmployees(payrollRunId)).filter(
      (employee) =>
        employee.status === 'calculated' &&
        !payslipsDb.some((item) => item.payrollEmployeeId === employee.id),
    )
    const generated: Payslip[] = []
    for (const employee of employees) {
      const payslip = await buildPayslipFromPayrollEmployee(run, employee, actor)
      payslipsDb.push(payslip)
      generated.push(payslip)
      void import('@/features/notifications').then(({ notificationTriggerService }) =>
        notificationTriggerService.notifyPayslipGenerated({ payslip }),
      ).catch((error) => console.warn('Payslip notification failed', error))
    }
    return structuredClone(generated)
  },

  async getBulkGenerationPreview(payrollRunId: string): Promise<BulkGenerationPreview> {
    await ensureSeeded()
    await delay(100)
    await this.validatePayrollFinalized(payrollRunId)
    const employees = (await payrollService.getRunEmployees(payrollRunId)).filter(
      (employee) => employee.status === 'calculated',
    )
    const alreadyGenerated = employees.filter((employee) =>
      payslipsDb.some((item) => item.payrollEmployeeId === employee.id),
    ).length
    return {
      total: employees.length,
      alreadyGenerated,
      remaining: Math.max(0, employees.length - alreadyGenerated),
      payrollRunId,
    }
  },

  async archivePayslip(id: string, actor: string): Promise<Payslip> {
    await ensureSeeded()
    await delay(140)
    const index = payslipsDb.findIndex((item) => item.id === id)
    if (index < 0) throw new PayslipServiceError('NOT_FOUND', 'Payslip not found.')
    if (payslipsDb[index].status === 'archived') {
      throw new PayslipServiceError('LOCKED', 'Payslip is already archived.')
    }
    const timestamp = nowIso()
    payslipsDb[index] = {
      ...payslipsDb[index],
      status: 'archived',
      archivedAt: timestamp,
      archivedBy: actorName(actor),
      updatedAt: timestamp,
    }
    return structuredClone(payslipsDb[index])
  },

  generatePayslipNumber(year: number, month: number, sequence: number): string {
    return formatPayslipNumber(year, month, sequence)
  },

  async downloadPayslip(id: string): Promise<{ mode: 'print-dialog'; message: string }> {
    await this.getPayslipById(id)
    return {
      mode: 'print-dialog',
      message: 'PDF download is not enabled in this demo. Use the print dialog to save as PDF.',
    }
  },

  async printPayslip(id: string): Promise<Payslip> {
    return this.getPayslipById(id)
  },
}

export { FINALIZATION_ERROR }
