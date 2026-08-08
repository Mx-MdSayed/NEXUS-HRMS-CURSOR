import { format, subMonths } from 'date-fns'
import { PERMISSIONS } from '@/constants/permissions'
import type { SalaryCurrencyCode } from '@/constants/currencies'
import { attendanceService } from '@/features/attendance/services/attendanceService'
import { employeeService } from '@/features/employees/services/employeeService'
import type { EmployeeListItem } from '@/features/employees/types'
import { leaveService } from '@/features/leave/services/leaveService'
import { departmentService } from '@/features/organization/services/departmentService'
import { designationService } from '@/features/organization/services/designationService'
import { payrollService } from '@/features/payroll/services/payrollService'
import { payslipService } from '@/features/payslip/services/payslipService'
import { employeeSalaryService } from '@/features/salary/services/employeeSalaryService'
import type { EmployeeSalary } from '@/features/salary/types'
import type { PayrollRun } from '@/features/payroll/types'
import type { Payslip } from '@/features/payslip/types'
import type { PermissionName } from '@/types'
import {
  calculateHeadcount,
  countBy,
  groupByCurrency,
  salaryRangeBucketForCurrency,
  salaryRangeBucketsByCurrency,
  tenureBucket,
  tenureMonths,
} from '../utils/calculations'
import { rangeToMonthKey, resolveDateRange } from '../utils/datePresets'
import type {
  AttendanceEmployeeRow,
  AttendanceReport,
  DepartmentReport,
  DesignationReport,
  EmployeeReport,
  EmployeeReportRow,
  LeaveReport,
  OverviewReport,
  PayrollReport,
  PayslipReport,
  ReportAuthContext,
  ReportFilters,
  SalaryReport,
  SalaryReportRow,
  WorkforceReport,
} from '../types'
import { ReportServiceError } from './errors'

function hasReportPermission(auth: ReportAuthContext, permission: PermissionName): boolean {
  if (auth.hasPermission) {
    return auth.hasPermission(permission) || auth.hasPermission(PERMISSIONS.REPORT_ADMIN)
  }
  return auth.permissions.includes(permission) || auth.permissions.includes(PERMISSIONS.REPORT_ADMIN)
}

function authorize(auth: ReportAuthContext, permission: PermissionName): void {
  if (!hasReportPermission(auth, permission)) {
    throw new ReportServiceError('UNAUTHORIZED', 'You do not have permission to view this report.')
  }
}

async function getEmployees(filters: ReportFilters = {}): Promise<EmployeeListItem[]> {
  const result = await employeeService.getEmployees({
    filters: {
      search: filters.search,
      departmentId: filters.departmentId,
      designationId: filters.designationId,
      employmentStatus: filters.status as never,
    },
    page: 1,
    pageSize: 500,
    sortBy: 'fullName',
  })
  return result.data
}

function toEmployeeReportRow(employee: EmployeeListItem): EmployeeReportRow {
  return {
    employeeId: employee.id,
    employeeCode: employee.employeeCode,
    fullName: employee.fullName,
    email: employee.email,
    departmentId: employee.departmentId,
    departmentName: employee.departmentName,
    designationId: employee.designationId,
    designationName: employee.designationName,
    employmentType: employee.employmentType,
    employmentStatus: employee.employmentStatus,
    joiningDate: employee.joiningDate,
    tenureMonths: tenureMonths(employee.joiningDate),
  }
}

function filterByRange<T extends { joiningDate?: string; monthKey?: string; generatedAt?: string; startDate?: string }>(
  rows: T[],
  filters: ReportFilters,
): T[] {
  const range = resolveDateRange(filters)
  return rows.filter((row) => {
    const dateKey =
      row.joiningDate ??
      (row.monthKey ? `${row.monthKey}-01` : undefined) ??
      row.generatedAt?.slice(0, 10) ??
      row.startDate
    if (!dateKey) return true
    return dateKey >= range.startDate && dateKey <= range.endDate
  })
}

function salaryTotals(rows: SalaryReportRow[]) {
  return groupByCurrency(rows, (row) => ({
    monthlyGross: row.monthlyGross,
    monthlyNet: row.monthlyNet,
    annualCTC: row.annualCTC,
  }))
}

function payrollTotals(runs: PayrollRun[]) {
  return groupByCurrency(runs, (row) => ({
    grossPayroll: row.grossPayroll,
    totalDeductions: row.totalDeductions,
    netPayroll: row.totalNetPayroll,
    employerCost: row.totalEmployerCost,
  }))
}

function payslipTotals(rows: Payslip[]) {
  return groupByCurrency(rows, (row) => ({
    payslipNet: row.netSalary,
    grossPayroll: row.grossEarnings,
    totalDeductions: row.totalDeductions,
    employerCost: row.employerCost,
  }))
}

export const reportService = {
  async getOverviewReport(filters: ReportFilters, auth: ReportAuthContext): Promise<OverviewReport> {
    authorize(auth, PERMISSIONS.REPORTS_VIEW)
    const range = resolveDateRange(filters)
    const month = rangeToMonthKey(range)
    const [
      employees,
      departments,
      designations,
      attendance,
      leaveStats,
      payrollRuns,
      payslips,
    ] = await Promise.all([
      getEmployees(filters),
      departmentService.getDepartments({}, 1, 500),
      designationService.getDesignations({}, 1, 500),
      attendanceService.getAttendanceSummary({ month, departmentId: filters.departmentId }),
      leaveService.getOverviewStats(),
      payrollService.getPayrollRuns({ year: filters.year }),
      payslipService.getPayslips({}),
    ])

    const attendanceAverage = attendance.rows.length
      ? attendance.rows.reduce((sum, row) => sum + row.attendancePercentage, 0) / attendance.rows.length
      : 0
    const payrollFiltered = filterByRange(payrollRuns, filters)
    const payslipsFiltered = filterByRange(payslips, filters)

    return {
      generatedAt: new Date().toISOString(),
      filters,
      headcount: calculateHeadcount(employees),
      activeEmployees: employees.filter((employee) => employee.employmentStatus === 'active').length,
      departments: departments.total,
      designations: designations.total,
      attendancePercentage: Math.round(attendanceAverage * 100) / 100,
      pendingLeaveRequests: leaveStats.pending,
      payrollRuns: payrollFiltered.length,
      payslipsGenerated: payslipsFiltered.length,
      currencyTotals: payrollTotals(payrollFiltered),
      workforceByDepartment: countBy(employees, (employee) => employee.departmentName),
      attendanceSummary: [
        { name: 'Present', value: attendance.rows.reduce((sum, row) => sum + row.present, 0) },
        { name: 'Absent', value: attendance.rows.reduce((sum, row) => sum + row.absent, 0) },
        { name: 'Late', value: attendance.rows.reduce((sum, row) => sum + row.late, 0) },
        { name: 'On Leave', value: attendance.rows.reduce((sum, row) => sum + row.onLeave, 0) },
      ],
      leaveSummary: [
        { name: 'Pending', value: leaveStats.pending },
        { name: 'Approved', value: leaveStats.approved },
        { name: 'Rejected', value: leaveStats.rejected },
        { name: 'Cancelled', value: leaveStats.cancelled },
      ],
      payrollByCurrency: payrollTotals(payrollFiltered).map((total) => ({
        name: total.currency,
        value: total.netPayroll ?? 0,
      })),
    }
  },

  async getEmployeeReport(filters: ReportFilters, auth: ReportAuthContext): Promise<EmployeeReport> {
    authorize(auth, PERMISSIONS.REPORT_EMPLOYEE)
    const range = resolveDateRange(filters)
    const employees = await getEmployees(filters)
    const rows = employees.map(toEmployeeReportRow)
    const newJoiners = rows
      .filter((employee) => employee.joiningDate >= range.startDate && employee.joiningDate <= range.endDate)
      .sort((a, b) => b.joiningDate.localeCompare(a.joiningDate))
    return {
      rows,
      total: rows.length,
      active: rows.filter((employee) => employee.employmentStatus === 'active').length,
      inactive: rows.filter((employee) => employee.employmentStatus !== 'active').length,
      newJoiners,
      statusDistribution: countBy(rows, (employee) => employee.employmentStatus),
      departmentDistribution: countBy(rows, (employee) => employee.departmentName),
    }
  },

  async getAttendanceReport(filters: ReportFilters, auth: ReportAuthContext): Promise<AttendanceReport> {
    authorize(auth, PERMISSIONS.REPORT_ATTENDANCE)
    const range = resolveDateRange(filters)
    const month = filters.month || rangeToMonthKey(range)
    const previousMonth = format(subMonths(new Date(`${month}-01T00:00:00`), 1), 'yyyy-MM')
    const [current, previous] = await Promise.all([
      attendanceService.getAttendanceSummary({ month, departmentId: filters.departmentId, search: filters.search }),
      attendanceService.getAttendanceSummary({ month: previousMonth, departmentId: filters.departmentId }),
    ])
    const rows: AttendanceEmployeeRow[] = current.rows.map((row) => ({
      employeeId: row.employeeId,
      employeeCode: row.employeeCode,
      fullName: row.fullName,
      departmentName: row.departmentName,
      workingDays: row.workingDays,
      present: row.present,
      absent: row.absent,
      late: row.late,
      halfDay: row.halfDay,
      onLeave: row.onLeave,
      totalWorkHours: Math.round((row.totalWorkMinutes / 60) * 100) / 100,
      attendancePercentage: row.attendancePercentage,
    }))
    const average = rows.length
      ? rows.reduce((sum, row) => sum + row.attendancePercentage, 0) / rows.length
      : 0
    const previousAverage = previous.rows.length
      ? previous.rows.reduce((sum, row) => sum + row.attendancePercentage, 0) / previous.rows.length
      : 0
    return {
      month,
      totalEmployees: rows.length,
      averageAttendancePercentage: Math.round(average * 100) / 100,
      present: rows.reduce((sum, row) => sum + row.present, 0),
      absent: rows.reduce((sum, row) => sum + row.absent, 0),
      late: rows.reduce((sum, row) => sum + row.late, 0),
      onLeave: rows.reduce((sum, row) => sum + row.onLeave, 0),
      rows,
      trend: [
        { name: previousMonth, value: Math.round(previousAverage * 100) / 100 },
        { name: month, value: Math.round(average * 100) / 100 },
      ],
      lateEmployees: rows.filter((row) => row.late > 0).sort((a, b) => b.late - a.late).slice(0, 8),
      absentEmployees: rows.filter((row) => row.absent > 0).sort((a, b) => b.absent - a.absent).slice(0, 8),
    }
  },

  async getLeaveReport(filters: ReportFilters, auth: ReportAuthContext): Promise<LeaveReport> {
    authorize(auth, PERMISSIONS.REPORT_LEAVE)
    const range = resolveDateRange(filters)
    const [overview, requests, balances] = await Promise.all([
      leaveService.getOverviewStats(),
      leaveService.getLeaveRequests({
        search: filters.search,
        departmentId: filters.departmentId,
        startDate: range.startDate,
        endDate: range.endDate,
        status: filters.status as never,
      }, 1, 500),
      leaveService.getLeaveBalances({ departmentId: filters.departmentId, year: filters.year }, 1, 500),
    ])
    return {
      totalRequests: requests.total,
      pending: overview.pending,
      approved: overview.approved,
      rejected: overview.rejected,
      cancelled: overview.cancelled,
      onLeaveToday: overview.onLeaveToday,
      requests: requests.data.map((request) => ({
        id: request.id,
        employeeName: request.employeeName,
        employeeCode: request.employeeCode,
        departmentName: request.departmentName,
        leaveTypeName: request.leaveTypeName,
        startDate: request.startDate,
        endDate: request.endDate,
        duration: request.duration,
        status: request.status,
      })),
      balances: balances.data.map((balance) => ({
        employeeName: balance.employeeName,
        employeeCode: balance.employeeCode,
        departmentName: balance.departmentName,
        leaveTypeName: balance.leaveTypeName,
        allocated: balance.allocated,
        used: balance.used,
        pending: balance.pending,
        available: balance.available,
      })),
      typeDistribution: countBy(requests.data, (request) => request.leaveTypeName),
      statusDistribution: countBy(requests.data, (request) => request.status),
    }
  },

  async getSalaryReport(filters: ReportFilters, auth: ReportAuthContext): Promise<SalaryReport> {
    authorize(auth, PERMISSIONS.REPORT_SALARY)
    const assignments = await employeeSalaryService.getAssignments({
      search: filters.search,
      departmentId: filters.departmentId,
    })
    const rows: SalaryReportRow[] = assignments
      .filter((assignment) => !filters.currency || assignment.currency === filters.currency)
      .map((assignment) => ({
        employeeId: assignment.employeeId,
        employeeName: assignment.employeeName,
        employeeCode: assignment.employeeCode,
        departmentId: assignment.departmentId,
        departmentName: assignment.departmentId,
        structureName: assignment.structureName,
        currency: assignment.currency,
        monthlyGross: assignment.monthlyGross,
        monthlyNet: assignment.monthlyNet,
        annualCTC: assignment.annualCTC,
        effectiveFrom: assignment.effectiveFrom,
      }))
    const employeeRows = await getEmployees({})
    const departmentNames = new Map(employeeRows.map((employee) => [employee.departmentId, employee.departmentName]))
    const enrichedRows = rows.map((row) => ({
      ...row,
      departmentName: departmentNames.get(row.departmentId) ?? row.departmentName,
    }))
    const departmentTotalsMap = enrichedRows.reduce((map, row) => {
        const key = `${row.departmentId}-${row.currency}`
        const current = map.get(key) ?? {
          departmentId: row.departmentId,
          departmentName: row.departmentName,
          currency: row.currency,
          count: 0,
          monthlyGross: 0,
          monthlyNet: 0,
          annualCTC: 0,
        }
        current.count += 1
        current.monthlyGross += row.monthlyGross
        current.monthlyNet += row.monthlyNet
        current.annualCTC += row.annualCTC
        map.set(key, current)
        return map
      }, new Map<string, {
        departmentId: string
        departmentName: string
        currency: SalaryCurrencyCode
        count: number
        monthlyGross: number
        monthlyNet: number
        annualCTC: number
      }>())
    const departmentTotals = Array.from(departmentTotalsMap.values())
    const distributionByCurrency = Array.from(
      enrichedRows.reduce((map, row) => {
        const list = map.get(row.currency) ?? []
        list.push(row)
        map.set(row.currency, list)
        return map
      }, new Map<SalaryCurrencyCode, SalaryReportRow[]>()),
    ).map(([currency, currencyRows]) => ({
      currency,
      buckets: countBy(currencyRows, (row) => salaryRangeBucketForCurrency(row.monthlyGross, currency)),
    }))
    return {
      rows: enrichedRows,
      totalsByCurrency: salaryTotals(enrichedRows),
      departmentTotals,
      distribution: distributionByCurrency.find((item) => item.currency === 'INR')?.buckets ?? [],
      distributionByCurrency,
    }
  },

  async getPayrollReport(filters: ReportFilters, auth: ReportAuthContext): Promise<PayrollReport> {
    authorize(auth, PERMISSIONS.REPORT_PAYROLL)
    const runs = filterByRange(await payrollService.getPayrollRuns({
      search: filters.search,
      departmentId: filters.departmentId,
      year: filters.year,
      status: filters.status as never,
    }), filters).filter((run) => !filters.currency || run.currency === filters.currency)
    const selectedRun = runs.find((run) => run.status === 'finalized') ?? runs[0]
    const departmentSummary = selectedRun ? await payrollService.getDepartmentSummary(selectedRun.id) : []
    return {
      runs: runs.map((run) => ({
        id: run.id,
        name: run.name,
        monthKey: run.monthKey,
        status: run.status,
        currency: run.currency,
        employeeCount: run.employeeCount,
        grossPayroll: run.grossPayroll,
        totalDeductions: run.totalDeductions,
        netPayroll: run.totalNetPayroll,
        employerCost: run.totalEmployerCost,
      })),
      totalsByCurrency: payrollTotals(runs),
      trend: runs
        .map((run) => ({ name: `${run.monthKey} ${run.currency}`, value: run.totalNetPayroll }))
        .reverse(),
      departmentSummary,
    }
  },

  async getPayslipReport(filters: ReportFilters, auth: ReportAuthContext): Promise<PayslipReport> {
    authorize(auth, PERMISSIONS.REPORT_PAYSLIP)
    const range = resolveDateRange(filters)
    const rows = (await payslipService.getPayslips({
      search: filters.search,
      year: filters.year,
      status: filters.status as never,
      currency: filters.currency,
    })).filter((payslip) => payslip.generatedAt.slice(0, 10) >= range.startDate && payslip.generatedAt.slice(0, 10) <= range.endDate)
    return {
      rows: rows.map((payslip) => ({
        id: payslip.id,
        payslipNumber: payslip.payslipNumber,
        employeeName: payslip.employeeNameSnapshot,
        employeeCode: payslip.employeeCodeSnapshot,
        departmentName: payslip.departmentSnapshot,
        monthKey: payslip.monthKey,
        currency: payslip.currency,
        grossEarnings: payslip.grossEarnings,
        totalDeductions: payslip.totalDeductions,
        netSalary: payslip.netSalary,
        status: payslip.status,
        generatedAt: payslip.generatedAt,
      })),
      generated: rows.filter((row) => row.status === 'generated').length,
      published: rows.filter((row) => row.status === 'published').length,
      archived: rows.filter((row) => row.status === 'archived').length,
      totalsByCurrency: payslipTotals(rows),
      statusDistribution: countBy(rows, (row) => row.status),
    }
  },

  async getDepartmentReport(filters: ReportFilters, auth: ReportAuthContext): Promise<DepartmentReport> {
    authorize(auth, PERMISSIONS.REPORT_DEPARTMENT)
    const departments = await departmentService.getDepartments({
      search: filters.search,
      status: filters.status as never,
    }, 1, 500)
    return {
      rows: departments.data.map((department) => ({
        id: department.id,
        code: department.code,
        name: department.name,
        headEmployeeName: department.headEmployeeName,
        location: department.location,
        status: department.status,
        employeeCount: department.employeeCount,
      })),
      distribution: departments.data.map((department) => ({
        name: department.name,
        value: department.employeeCount,
      })),
    }
  },

  async getDesignationReport(filters: ReportFilters, auth: ReportAuthContext): Promise<DesignationReport> {
    authorize(auth, PERMISSIONS.REPORT_DEPARTMENT)
    const designations = await designationService.getDesignations({
      search: filters.search,
      departmentId: filters.departmentId,
      status: filters.status as never,
    }, 1, 500)
    return {
      rows: designations.data.map((designation) => ({
        id: designation.id,
        code: designation.code,
        name: designation.name,
        departmentName: designation.departmentName,
        level: designation.level,
        status: designation.status,
        employeeCount: designation.employeeCount,
      })),
      distribution: countBy(designations.data, (designation) => designation.level),
    }
  },

  async getWorkforceReport(filters: ReportFilters, auth: ReportAuthContext): Promise<WorkforceReport> {
    authorize(auth, PERMISSIONS.REPORT_WORKFORCE)
    const [employees, assignments] = await Promise.all([
      getEmployees(filters),
      employeeSalaryService.getAssignments({ departmentId: filters.departmentId }),
    ])
    const typedAssignments = assignments as EmployeeSalary[]
    return {
      headcount: calculateHeadcount(employees),
      active: employees.filter((employee) => employee.employmentStatus === 'active').length,
      probation: employees.filter((employee) => employee.employmentStatus === 'probation').length,
      byEmploymentType: countBy(employees, (employee) => employee.employmentType),
      byTenure: countBy(employees, (employee) => tenureBucket(tenureMonths(employee.joiningDate))),
      byDepartment: countBy(employees, (employee) => employee.departmentName),
      salaryRangeByCurrency: salaryRangeBucketsByCurrency(typedAssignments),
    }
  },
}
