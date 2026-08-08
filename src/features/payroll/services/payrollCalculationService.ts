import type { EmployeeListItem } from '@/features/employees/types'
import type { EmployeeSalary } from '@/features/salary/types'
import { employeeSalaryService } from '@/features/salary/services/employeeSalaryService'
import { attendanceService } from '@/features/attendance/services/attendanceService'
import { leaveService } from '@/features/leave/services/leaveService'
import { roundSalaryAmount } from '@/features/salary/utils/money'
import { getPayrollSettings } from '../settings'
import type {
  PayrollComponent,
  PayrollEmployee,
  PayrollRun,
  PayrollValidationIssue,
} from '../types'
import {
  buildSalarySegments,
  calculateEarningsFromSegments,
  calculateEmployerCost,
  calculateLateDeduction,
  calculateLOP,
  calculateNetSalary,
  calculateOvertime,
  calculatePayableDays,
  calculateProratedField,
  calculateWorkingDays,
  getPeriodBounds,
  snapshotDeductionsFromSalary,
  summarizeAttendanceFromRecords,
  sumComponentAmounts,
  unpaidDaysFromAttendance,
  type AttendanceLeaveInput,
} from '../utils/calculations'

export interface EmployeePayrollCalcResult {
  employee: PayrollEmployee
  issues: PayrollValidationIssue[]
}

function nowIso() {
  return new Date().toISOString()
}

/**
 * Central payroll calculation engine.
 * Always uses historical EmployeeSalary snapshots for the period — never live structure alone.
 */
export const payrollCalculationService = {
  getPeriodBounds,
  calculateWorkingDays,
  calculatePayableDays,
  calculateOvertime,
  calculateLOP,
  calculateNetSalary,
  calculateEmployerCost,

  async validateEmployeeForPeriod(
    employee: EmployeeListItem,
    month: number,
    year: number,
    runCurrency: string,
    allowMixed: boolean,
  ): Promise<PayrollValidationIssue[]> {
    const issues: PayrollValidationIssue[] = []
    const bounds = getPeriodBounds(month, year)
    const salaries = await employeeSalaryService.getSalariesOverlappingPeriod(
      employee.id,
      bounds.startDate,
      bounds.endDate,
    )

    if (salaries.length === 0) {
      issues.push({
        employeeId: employee.id,
        employeeName: employee.fullName,
        code: 'MISSING_SALARY',
        severity: 'error',
        message: 'No salary snapshot applies to this payroll period.',
      })
      return issues
    }

    const currencies = new Set(salaries.map((s) => s.currency))
    if (currencies.size > 1) {
      issues.push({
        employeeId: employee.id,
        employeeName: employee.fullName,
        code: 'INVALID_CURRENCY',
        severity: 'error',
        message: 'Employee has mixed salary currencies within the period.',
      })
    }

    const primaryCurrency = salaries[0].currency
    if (!allowMixed && primaryCurrency !== runCurrency) {
      issues.push({
        employeeId: employee.id,
        employeeName: employee.fullName,
        code: 'INVALID_CURRENCY',
        severity: 'error',
        message: `Employee currency (${primaryCurrency}) does not match payroll run (${runCurrency}).`,
      })
    }

    for (const salary of salaries) {
      if (!salary.components.length) {
        issues.push({
          employeeId: employee.id,
          employeeName: employee.fullName,
          code: 'INVALID_COMPONENT',
          severity: 'error',
          message: `Salary snapshot ${salary.id} has no components.`,
        })
      }
      if (salary.monthlyGross <= 0) {
        issues.push({
          employeeId: employee.id,
          employeeName: employee.fullName,
          code: 'INVALID_SALARY_PERIOD',
          severity: 'error',
          message: `Salary snapshot ${salary.id} has invalid gross amount.`,
        })
      }
    }

    try {
      const page = await attendanceService.getEmployeeAttendancePage(employee.id, bounds.monthKey)
      if (page.records.length === 0) {
        issues.push({
          employeeId: employee.id,
          employeeName: employee.fullName,
          code: 'INVALID_ATTENDANCE',
          severity: 'warning',
          message: 'No attendance records found for this month.',
        })
      }
    } catch {
      issues.push({
        employeeId: employee.id,
        employeeName: employee.fullName,
        code: 'INVALID_ATTENDANCE',
        severity: 'warning',
        message: 'Unable to load attendance for this employee.',
      })
    }

    try {
      await leaveService.getPayrollLeaveSummary(employee.id, bounds.monthKey)
    } catch {
      issues.push({
        employeeId: employee.id,
        employeeName: employee.fullName,
        code: 'INVALID_LEAVE',
        severity: 'warning',
        message: 'Unable to load leave summary for this employee.',
      })
    }

    return issues
  },

  async calculateEmployeePayroll(
    run: PayrollRun,
    employee: EmployeeListItem,
    existingId?: string,
  ): Promise<EmployeePayrollCalcResult> {
    const settings = getPayrollSettings()
    const bounds = getPeriodBounds(
      Number(run.monthKey.slice(5, 7)),
      Number(run.monthKey.slice(0, 4)),
    )
    const payrollEmployeeId = existingId ?? `pe-${run.id}-${employee.id}`
    const issues = await this.validateEmployeeForPeriod(
      employee,
      bounds.month,
      bounds.year,
      run.currency,
      settings.allowMixedCurrencies,
    )
    const errors = issues.filter((i) => i.severity === 'error')
    const warnings = issues.filter((i) => i.severity === 'warning')

    const workingDays = calculateWorkingDays(bounds.month, bounds.year)
    const now = nowIso()

    if (errors.length > 0) {
      return {
        employee: {
          id: payrollEmployeeId,
          payrollRunId: run.id,
          employeeId: employee.id,
          employeeCode: employee.employeeCode,
          employeeName: employee.fullName,
          departmentId: employee.departmentId,
          departmentName: employee.departmentName,
          designationName: employee.designationName,
          salarySnapshotId: '',
          salarySnapshotIds: [],
          currency: run.currency,
          workingDays,
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
          status: 'error',
          validationErrors: errors.map((e) => e.message),
          validationWarnings: warnings.map((w) => w.message),
          components: [],
          createdAt: now,
          updatedAt: now,
        },
        issues,
      }
    }

    const salaries = await employeeSalaryService.getSalariesOverlappingPeriod(
      employee.id,
      bounds.startDate,
      bounds.endDate,
    )
    const segments = buildSalarySegments(salaries, bounds.startDate, bounds.endDate)
    const primarySnapshot = segments[0]?.salary
    const salarySnapshotIds = segments.map((s) => s.salary.id)

    const attendancePage = await attendanceService.getEmployeeAttendancePage(
      employee.id,
      bounds.monthKey,
    )
    const attendanceSummary = summarizeAttendanceFromRecords(attendancePage.records)
    const leaveSummary = await leaveService.getPayrollLeaveSummary(employee.id, bounds.monthKey)

    // Prefer leave-service unpaid/paid; attendance leave days are informational.
    // Absences from attendance that are covered by approved paid leave should not double-count.
    // Use attendance present/half/absent + leave paid/unpaid as payroll inputs.
    const attendanceInput: AttendanceLeaveInput = {
      presentDays: attendanceSummary.presentDays,
      absentDays: Math.max(0, attendanceSummary.absentDays),
      halfDays: attendanceSummary.halfDays,
      paidLeaveDays: leaveSummary.paidLeaveDays,
      unpaidLeaveDays: leaveSummary.unpaidLeaveDays,
      overtimeHours: attendanceSummary.overtimeHours,
      lateMinutes: attendanceSummary.lateMinutes,
    }

    const payableDays = calculatePayableDays(attendanceInput, settings)
    const unpaidDays = unpaidDaysFromAttendance(attendanceInput)
    const basic = calculateProratedField(segments, 'basic')

    let earnings = calculateEarningsFromSegments(segments, payrollEmployeeId)

    // Prorate earnings by payable/working days when attendance reduces pay
    const attendanceFactor =
      workingDays > 0 ? Math.min(1, Math.max(0, payableDays / workingDays)) : 0
    // When LOP is calculated separately on unpaid days, earnings stay at full prorated salary
    // for mid-month revision segments; LOP deducts unpaid portion. Keep earnings as segment-weighted
    // full monthly amounts (standard monthly payroll), then deduct LOP.
    void attendanceFactor

    const overtimeAmount = calculateOvertime(attendanceInput.overtimeHours, basic, settings)
    if (overtimeAmount > 0) {
      earnings = [
        ...earnings,
        {
          id: `pc-${payrollEmployeeId}-OT`,
          payrollEmployeeId,
          componentId: 'sc-ot',
          componentCode: 'OT',
          componentName: 'Overtime',
          category: 'earning',
          calculationMethod: 'formula',
          baseAmount: basic,
          rate: settings.overtimeMultiplier,
          amount: overtimeAmount,
          taxable: true,
          statutory: false,
          employeeContribution: false,
          employerContribution: false,
        },
      ]
    }

    const grossEarnings = sumComponentAmounts(earnings)
    const lopAmount = calculateLOP(unpaidDays, workingDays, segments, settings)
    const lateAmount = calculateLateDeduction(attendanceInput.lateMinutes, basic, settings)

    const fromSalary = snapshotDeductionsFromSalary(segments, payrollEmployeeId)
    const deductionComponents: PayrollComponent[] = [...fromSalary.employee]
    const employerComponents: PayrollComponent[] = [...fromSalary.employer]

    if (lopAmount > 0) {
      deductionComponents.push({
        id: `pc-${payrollEmployeeId}-LWP`,
        payrollEmployeeId,
        componentId: 'sc-lwp',
        componentCode: 'LWP',
        componentName: 'Loss of Pay / LWP',
        category: 'deduction',
        calculationMethod: 'formula',
        baseAmount: calculateProratedField(segments, settings.lopBasis),
        rate: undefined,
        amount: lopAmount,
        taxable: false,
        statutory: false,
        employeeContribution: true,
        employerContribution: false,
      })
    }

    if (lateAmount > 0) {
      deductionComponents.push({
        id: `pc-${payrollEmployeeId}-LATE`,
        payrollEmployeeId,
        componentId: 'sc-late',
        componentCode: 'LATE',
        componentName: 'Late Deduction',
        category: 'deduction',
        calculationMethod: 'formula',
        baseAmount: basic,
        rate: undefined,
        amount: lateAmount,
        taxable: false,
        statutory: false,
        employeeContribution: true,
        employerContribution: false,
      })
    }

    const totalDeductions = sumComponentAmounts(deductionComponents)
    const employerContribution = sumComponentAmounts(employerComponents)
    const netSalary = calculateNetSalary(grossEarnings, totalDeductions)
    const employerCost = calculateEmployerCost(grossEarnings, employerContribution)

    const components = [...earnings, ...deductionComponents, ...employerComponents]

    return {
      employee: {
        id: payrollEmployeeId,
        payrollRunId: run.id,
        employeeId: employee.id,
        employeeCode: employee.employeeCode,
        employeeName: employee.fullName,
        departmentId: employee.departmentId,
        departmentName: employee.departmentName,
        designationName: employee.designationName,
        salarySnapshotId: primarySnapshot?.id ?? '',
        salarySnapshotIds,
        currency: (primarySnapshot?.currency ?? run.currency) as PayrollEmployee['currency'],
        workingDays,
        payableDays,
        presentDays: attendanceInput.presentDays,
        absentDays: attendanceInput.absentDays,
        paidLeaveDays: attendanceInput.paidLeaveDays,
        unpaidLeaveDays: attendanceInput.unpaidLeaveDays,
        halfDays: attendanceInput.halfDays,
        overtimeHours: attendanceInput.overtimeHours,
        lateMinutes: attendanceInput.lateMinutes,
        grossEarnings,
        totalDeductions,
        employerContribution,
        netSalary,
        employerCost,
        lopAmount,
        overtimeAmount,
        status: 'calculated',
        validationErrors: [],
        validationWarnings: warnings.map((w) => w.message),
        components,
        createdAt: now,
        updatedAt: now,
      },
      issues,
    }
  },

  calculatePayrollTotals(employees: PayrollEmployee[]): {
    employeeCount: number
    grossPayroll: number
    totalDeductions: number
    totalEmployerContribution: number
    totalNetPayroll: number
    totalEmployerCost: number
    averageNetSalary: number
  } {
    const calculated = employees.filter((e) => e.status === 'calculated' || e.status === 'ready')
    const employeeCount = calculated.length
    const grossPayroll = roundSalaryAmount(calculated.reduce((s, e) => s + e.grossEarnings, 0))
    const totalDeductions = roundSalaryAmount(calculated.reduce((s, e) => s + e.totalDeductions, 0))
    const totalEmployerContribution = roundSalaryAmount(
      calculated.reduce((s, e) => s + e.employerContribution, 0),
    )
    const totalNetPayroll = roundSalaryAmount(calculated.reduce((s, e) => s + e.netSalary, 0))
    const totalEmployerCost = roundSalaryAmount(calculated.reduce((s, e) => s + e.employerCost, 0))
    const averageNetSalary =
      employeeCount > 0 ? roundSalaryAmount(totalNetPayroll / employeeCount) : 0
    return {
      employeeCount,
      grossPayroll,
      totalDeductions,
      totalEmployerContribution,
      totalNetPayroll,
      totalEmployerCost,
      averageNetSalary,
    }
  },

  /** Expose for tests / mid-month revision checks. */
  buildSalarySegments,
  calculateProratedField,
  calculateEarningsFromSegments,
}
