import type { PayrollEmployee } from '../types'
import { payrollService } from './payrollService'
import { payrollCalculationService } from './payrollCalculationService'
import { PayrollServiceError } from './errors'
import { employeeService } from '@/features/employees/services/employeeService'

/**
 * Employee-scoped payroll access.
 * Employees must not see company-wide totals via this service.
 */
export const payrollEmployeeService = {
  async getEmployeePayroll(
    employeeId: string,
    periodIdOrMonthKey?: string,
  ): Promise<PayrollEmployee[]> {
    const history = await payrollService.getEmployeePayrollHistory(employeeId)
    if (!periodIdOrMonthKey) return history

    const runs = await payrollService.getPayrollRuns({})
    const matchingRunIds = new Set(
      runs
        .filter(
          (r) =>
            r.periodId === periodIdOrMonthKey ||
            r.monthKey === periodIdOrMonthKey ||
            r.id === periodIdOrMonthKey,
        )
        .map((r) => r.id),
    )
    return history.filter((h) => matchingRunIds.has(h.payrollRunId))
  },

  async getEmployeePayrollByRun(
    runId: string,
    employeeId: string,
  ): Promise<PayrollEmployee> {
    return payrollService.getPayrollEmployee(runId, employeeId)
  },

  async calculateEmployeePayroll(employeeId: string, runId: string) {
    const run = await payrollService.getPayrollRunById(runId)
    const page = await employeeService.getEmployees({
      filters: { search: employeeId },
      page: 1,
      pageSize: 50,
    })
    let emp = page.data.find((e) => e.id === employeeId)
    if (!emp) {
      const full = await employeeService.getEmployeeById(employeeId)
      const again = await employeeService.getEmployees({
        filters: { search: full.employeeCode },
        page: 1,
        pageSize: 10,
      })
      emp = again.data.find((e) => e.id === employeeId)
    }
    if (!emp) throw new PayrollServiceError('NOT_FOUND', 'Employee not found.')
    return payrollCalculationService.calculateEmployeePayroll(run, emp)
  },
}
