import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns'
import type { AttendanceStatus } from '@/features/attendance/types'
import type { EmployeeSalary } from '@/features/salary/types'
import { roundSalaryAmount } from '@/features/salary/utils/money'
import { calculateWorkingDaysInMonth } from '@/features/attendance/utils/calculations'
import { initialHolidays } from '@/features/attendance/data/mockHolidays'
import type { PayrollComponent, PayrollSettings } from '../types'
import { getPayrollSettings } from '../settings'

export interface PeriodBounds {
  startDate: string
  endDate: string
  month: number
  year: number
  monthKey: string
}

export function getPeriodBounds(month: number, year: number): PeriodBounds {
  const start = startOfMonth(new Date(year, month - 1, 1))
  const end = endOfMonth(start)
  return {
    month,
    year,
    startDate: format(start, 'yyyy-MM-dd'),
    endDate: format(end, 'yyyy-MM-dd'),
    monthKey: format(start, 'yyyy-MM'),
  }
}

export function daysInclusive(from: string, to: string): number {
  const a = parseISO(from)
  const b = parseISO(to)
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86_400_000) + 1)
}

export function overlapDays(
  rangeStart: string,
  rangeEnd: string,
  periodStart: string,
  periodEnd: string,
): number {
  const start = rangeStart > periodStart ? rangeStart : periodStart
  const end = rangeEnd < periodEnd ? rangeEnd : periodEnd
  if (start > end) return 0
  return daysInclusive(start, end)
}

export function calculateWorkingDays(month: number, year: number): number {
  return calculateWorkingDaysInMonth(
    getPeriodBounds(month, year).monthKey,
    initialHolidays,
  ).applicableWorkingDays
}

export interface AttendanceLeaveInput {
  presentDays: number
  absentDays: number
  halfDays: number
  paidLeaveDays: number
  unpaidLeaveDays: number
  overtimeHours: number
  lateMinutes: number
}

export function calculatePayableDays(
  input: AttendanceLeaveInput,
  settings: PayrollSettings = getPayrollSettings(),
): number {
  const half = input.halfDays * settings.halfDayValue
  const present = input.presentDays
  const paidLeave = input.paidLeaveDays
  const unpaid = input.unpaidLeaveDays
  const absent = input.absentDays
  return roundSalaryAmount(present + half + paidLeave - unpaid - absent)
}

export function unpaidDaysFromAttendance(input: AttendanceLeaveInput): number {
  return roundSalaryAmount(input.absentDays + input.unpaidLeaveDays)
}

export interface SalarySegment {
  salary: EmployeeSalary
  daysInPeriod: number
  weight: number
}

export function buildSalarySegments(
  salaries: EmployeeSalary[],
  periodStart: string,
  periodEnd: string,
): SalarySegment[] {
  const segments = salaries
    .map((salary) => {
      const salEnd = salary.effectiveTo ?? '9999-12-31'
      const days = overlapDays(salary.effectiveFrom, salEnd, periodStart, periodEnd)
      return { salary, daysInPeriod: days, weight: 0 }
    })
    .filter((s) => s.daysInPeriod > 0)

  const totalDays = segments.reduce((sum, s) => sum + s.daysInPeriod, 0)
  return segments.map((s) => ({
    ...s,
    weight: totalDays > 0 ? s.daysInPeriod / totalDays : 0,
  }))
}

export function extractBasicSalary(salary: EmployeeSalary): number {
  const basic = salary.components.find(
    (c) =>
      c.category === 'earning' &&
      (c.componentCode.toUpperCase() === 'BASIC' || c.componentCode.toUpperCase() === 'BASIC_SALARY'),
  )
  return basic?.amount ?? 0
}

export function calculateProratedField(
  segments: SalarySegment[],
  field: 'basic' | 'gross' | 'ctc',
): number {
  return roundSalaryAmount(
    segments.reduce((sum, s) => {
      const value =
        field === 'basic'
          ? extractBasicSalary(s.salary)
          : field === 'gross'
            ? s.salary.monthlyGross
            : s.salary.monthlyCTC
      return sum + value * s.weight
    }, 0),
  )
}

export function calculateEarningsFromSegments(
  segments: SalarySegment[],
  payrollEmployeeId: string,
): PayrollComponent[] {
  if (segments.length === 0) return []

  const byCode = new Map<
    string,
    {
      componentId: string
      componentCode: string
      componentName: string
      calculationMethod: string
      baseAmount: number
      rate: number | undefined
      amount: number
      taxable: boolean
      statutory: boolean
      employeeContribution: boolean
      employerContribution: boolean
    }
  >()

  for (const segment of segments) {
    for (const line of segment.salary.components) {
      if (line.category !== 'earning') continue
      const amount = line.amount * segment.weight
      const existing = byCode.get(line.componentCode)
      if (existing) {
        existing.amount += amount
        existing.baseAmount += (line.fixedAmount ?? line.amount) * segment.weight
      } else {
        byCode.set(line.componentCode, {
          componentId: line.componentId,
          componentCode: line.componentCode,
          componentName: line.componentName,
          calculationMethod: line.calculationMethod,
          baseAmount: line.fixedAmount ?? line.amount,
          rate: line.percentage,
          amount,
          taxable: line.taxable,
          statutory: line.statutory,
          employeeContribution: line.employeeContribution,
          employerContribution: line.employerContribution,
        })
      }
    }
  }

  return Array.from(byCode.values()).map((c, index) => ({
    id: `pc-${payrollEmployeeId}-earn-${c.componentCode}-${index}`,
    payrollEmployeeId,
    componentId: c.componentId,
    componentCode: c.componentCode,
    componentName: c.componentName,
    category: 'earning' as const,
    calculationMethod: c.calculationMethod,
    baseAmount: roundSalaryAmount(c.baseAmount),
    rate: c.rate,
    amount: roundSalaryAmount(c.amount),
    taxable: c.taxable,
    statutory: c.statutory,
    employeeContribution: false,
    employerContribution: false,
  }))
}

export function calculateOvertime(
  overtimeHours: number,
  basicSalary: number,
  settings: PayrollSettings = getPayrollSettings(),
): number {
  if (!settings.overtimeEnabled || overtimeHours <= 0 || basicSalary <= 0) return 0
  const workingHoursPerMonth = settings.standardWorkingHoursPerDay * 22
  const hourly = basicSalary / workingHoursPerMonth
  return roundSalaryAmount(overtimeHours * hourly * settings.overtimeMultiplier)
}

export function calculateLOP(
  unpaidDays: number,
  workingDays: number,
  segments: SalarySegment[],
  settings: PayrollSettings = getPayrollSettings(),
): number {
  if (unpaidDays <= 0 || workingDays <= 0) return 0
  const base = calculateProratedField(segments, settings.lopBasis)
  return roundSalaryAmount((base / workingDays) * unpaidDays)
}

export function calculateLateDeduction(
  lateMinutes: number,
  basicSalary: number,
  settings: PayrollSettings = getPayrollSettings(),
): number {
  if (!settings.lateDeductionEnabled || lateMinutes <= 0 || basicSalary <= 0) return 0
  const workingHoursPerMonth = settings.standardWorkingHoursPerDay * 22
  const perMinute = basicSalary / (workingHoursPerMonth * 60)
  return roundSalaryAmount(lateMinutes * perMinute)
}

/**
 * Build statutory deduction / employer contribution snapshots from demo configuration.
 * Not a claim of legal PF/ESI/PT compliance.
 */
export function calculateStatutoryDeductions(
  payrollEmployeeId: string,
  basicSalary: number,
  grossEarnings: number,
  settings: PayrollSettings = getPayrollSettings(),
  existingCodes: Set<string> = new Set(),
): { employee: PayrollComponent[]; employer: PayrollComponent[] } {
  const employee: PayrollComponent[] = []
  const employer: PayrollComponent[] = []
  let idx = 0
  const nextId = (code: string) => `pc-${payrollEmployeeId}-stat-${code}-${idx++}`

  if (!existingCodes.has('EPF') && !existingCodes.has('PF')) {
    const wageBase = Math.min(basicSalary, settings.pfWageCap)
    const empAmt = roundSalaryAmount((wageBase * settings.pfEmployeePercent) / 100)
    const erAmt = roundSalaryAmount((wageBase * settings.pfEmployerPercent) / 100)
    if (empAmt > 0) {
      employee.push({
        id: nextId('EPF'),
        payrollEmployeeId,
        componentId: 'sc-epf',
        componentCode: 'EPF',
        componentName: 'Employee Provident Fund',
        category: 'deduction',
        calculationMethod: 'percentage',
        baseAmount: wageBase,
        rate: settings.pfEmployeePercent,
        amount: empAmt,
        taxable: false,
        statutory: true,
        employeeContribution: true,
        employerContribution: false,
      })
    }
    if (erAmt > 0) {
      employer.push({
        id: nextId('ERPF'),
        payrollEmployeeId,
        componentId: 'sc-erpf',
        componentCode: 'ERPF',
        componentName: 'Employer Provident Fund',
        category: 'employer_contribution',
        calculationMethod: 'percentage',
        baseAmount: wageBase,
        rate: settings.pfEmployerPercent,
        amount: erAmt,
        taxable: false,
        statutory: true,
        employeeContribution: false,
        employerContribution: true,
      })
    }
  }

  if (
    grossEarnings > 0 &&
    grossEarnings <= settings.esiWageThreshold &&
    !existingCodes.has('EESI') &&
    !existingCodes.has('ESI')
  ) {
    const empAmt = roundSalaryAmount((grossEarnings * settings.esiEmployeePercent) / 100)
    const erAmt = roundSalaryAmount((grossEarnings * settings.esiEmployerPercent) / 100)
    if (empAmt > 0) {
      employee.push({
        id: nextId('EESI'),
        payrollEmployeeId,
        componentId: 'sc-eesi',
        componentCode: 'EESI',
        componentName: 'Employee ESI',
        category: 'deduction',
        calculationMethod: 'percentage',
        baseAmount: grossEarnings,
        rate: settings.esiEmployeePercent,
        amount: empAmt,
        taxable: false,
        statutory: true,
        employeeContribution: true,
        employerContribution: false,
      })
    }
    if (erAmt > 0) {
      employer.push({
        id: nextId('ERESI'),
        payrollEmployeeId,
        componentId: 'sc-eresi',
        componentCode: 'ERESI',
        componentName: 'Employer ESI',
        category: 'employer_contribution',
        calculationMethod: 'percentage',
        baseAmount: grossEarnings,
        rate: settings.esiEmployerPercent,
        amount: erAmt,
        taxable: false,
        statutory: true,
        employeeContribution: false,
        employerContribution: true,
      })
    }
  }

  if (settings.professionalTaxFixed > 0 && !existingCodes.has('PT')) {
    employee.push({
      id: nextId('PT'),
      payrollEmployeeId,
      componentId: 'sc-pt',
      componentCode: 'PT',
      componentName: 'Professional Tax',
      category: 'deduction',
      calculationMethod: 'fixed',
      baseAmount: grossEarnings,
      rate: undefined,
      amount: settings.professionalTaxFixed,
      taxable: false,
      statutory: true,
      employeeContribution: true,
      employerContribution: false,
    })
  }

  return { employee, employer }
}

export function snapshotDeductionsFromSalary(
  segments: SalarySegment[],
  payrollEmployeeId: string,
): { employee: PayrollComponent[]; employer: PayrollComponent[] } {
  const employee: PayrollComponent[] = []
  const employer: PayrollComponent[] = []
  const byCodeEmp = new Map<string, PayrollComponent>()
  const byCodeEr = new Map<string, PayrollComponent>()

  for (const segment of segments) {
    for (const line of segment.salary.components) {
      if (line.category === 'deduction') {
        const amount = roundSalaryAmount(line.amount * segment.weight)
        const existing = byCodeEmp.get(line.componentCode)
        if (existing) {
          existing.amount = roundSalaryAmount(existing.amount + amount)
        } else {
          byCodeEmp.set(line.componentCode, {
            id: `pc-${payrollEmployeeId}-ded-${line.componentCode}`,
            payrollEmployeeId,
            componentId: line.componentId,
            componentCode: line.componentCode,
            componentName: line.componentName,
            category: 'deduction',
            calculationMethod: line.calculationMethod,
            baseAmount: line.fixedAmount ?? line.amount,
            rate: line.percentage,
            amount,
            taxable: line.taxable,
            statutory: line.statutory,
            employeeContribution: true,
            employerContribution: false,
          })
        }
      }
      if (line.category === 'employer_contribution') {
        const amount = roundSalaryAmount(line.amount * segment.weight)
        const existing = byCodeEr.get(line.componentCode)
        if (existing) {
          existing.amount = roundSalaryAmount(existing.amount + amount)
        } else {
          byCodeEr.set(line.componentCode, {
            id: `pc-${payrollEmployeeId}-er-${line.componentCode}`,
            payrollEmployeeId,
            componentId: line.componentId,
            componentCode: line.componentCode,
            componentName: line.componentName,
            category: 'employer_contribution',
            calculationMethod: line.calculationMethod,
            baseAmount: line.fixedAmount ?? line.amount,
            rate: line.percentage,
            amount,
            taxable: line.taxable,
            statutory: line.statutory,
            employeeContribution: false,
            employerContribution: true,
          })
        }
      }
    }
  }

  employee.push(...byCodeEmp.values())
  employer.push(...byCodeEr.values())
  return { employee, employer }
}

export function calculateNetSalary(grossEarnings: number, totalDeductions: number): number {
  return roundSalaryAmount(Math.max(0, grossEarnings - totalDeductions))
}

export function calculateEmployerCost(grossEarnings: number, employerContribution: number): number {
  return roundSalaryAmount(grossEarnings + employerContribution)
}

export function sumComponentAmounts(components: PayrollComponent[]): number {
  return roundSalaryAmount(components.reduce((sum, c) => sum + c.amount, 0))
}

export function summarizeAttendanceFromRecords(
  records: Array<{
    status: AttendanceStatus
    overtimeMinutes: number
    lateMinutes: number
  }>,
): Pick<
  AttendanceLeaveInput,
  'presentDays' | 'absentDays' | 'halfDays' | 'overtimeHours' | 'lateMinutes'
> {
  let presentDays = 0
  let absentDays = 0
  let halfDays = 0
  let overtimeMinutes = 0
  let lateMinutes = 0

  for (const r of records) {
    overtimeMinutes += r.overtimeMinutes
    lateMinutes += r.lateMinutes
    if (r.status === 'present' || r.status === 'late') {
      presentDays += 1
    } else if (r.status === 'half_day') {
      halfDays += 1
    } else if (r.status === 'absent') {
      absentDays += 1
    }
  }

  return {
    presentDays,
    absentDays,
    halfDays,
    overtimeHours: roundSalaryAmount(overtimeMinutes / 60),
    lateMinutes,
  }
}
