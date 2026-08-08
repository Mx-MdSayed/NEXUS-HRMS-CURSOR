import type { SalaryCurrencyCode } from '@/constants/currencies'
import type { PermissionName } from '@/types'

export type ReportDatePreset =
  | 'today'
  | 'this_week'
  | 'this_month'
  | 'last_month'
  | 'this_quarter'
  | 'this_year'
  | 'custom'

export type ReportCategory = 'workforce' | 'attendance' | 'leave' | 'payroll'

export interface ReportFilters {
  search?: string
  departmentId?: string
  designationId?: string
  employeeId?: string
  status?: string
  currency?: SalaryCurrencyCode | ''
  preset?: ReportDatePreset
  startDate?: string
  endDate?: string
  month?: string
  year?: number
}

export interface ResolvedDateRange {
  startDate: string
  endDate: string
  label: string
}

export interface ReportDefinition {
  id:
    | 'overview'
    | 'employees'
    | 'attendance'
    | 'leave'
    | 'salary'
    | 'payroll'
    | 'payslips'
    | 'departments'
    | 'designations'
    | 'workforce'
  name: string
  description: string
  route: string
  permission: PermissionName
  category: ReportCategory
}

export interface KpiMetric {
  label: string
  value: string | number
  description?: string
  trend?: TrendResult
}

export interface ChartDatum {
  name: string
  value: number
  [key: string]: string | number
}

export interface TrendResult {
  current: number
  previous: number
  delta: number
  percentage: number
  direction: 'up' | 'down' | 'neutral'
}

export interface CurrencyTotal {
  currency: SalaryCurrencyCode
  monthlyGross?: number
  annualGross?: number
  monthlyNet?: number
  annualCTC?: number
  grossPayroll?: number
  totalDeductions?: number
  netPayroll?: number
  employerCost?: number
  payslipNet?: number
  count: number
}

export interface OverviewReport {
  generatedAt: string
  filters: ReportFilters
  headcount: number
  activeEmployees: number
  departments: number
  designations: number
  attendancePercentage: number
  pendingLeaveRequests: number
  payrollRuns: number
  payslipsGenerated: number
  currencyTotals: CurrencyTotal[]
  workforceByDepartment: ChartDatum[]
  attendanceSummary: ChartDatum[]
  leaveSummary: ChartDatum[]
  payrollByCurrency: ChartDatum[]
}

export interface EmployeeReportRow {
  employeeId: string
  employeeCode: string
  fullName: string
  email: string
  departmentId: string
  departmentName: string
  designationId: string
  designationName: string
  employmentType: string
  employmentStatus: string
  joiningDate: string
  tenureMonths: number
}

export interface EmployeeReport {
  rows: EmployeeReportRow[]
  total: number
  active: number
  inactive: number
  newJoiners: EmployeeReportRow[]
  statusDistribution: ChartDatum[]
  departmentDistribution: ChartDatum[]
}

export interface AttendanceEmployeeRow {
  employeeId: string
  employeeCode: string
  fullName: string
  departmentName: string
  workingDays: number
  present: number
  absent: number
  late: number
  halfDay: number
  onLeave: number
  totalWorkHours: number
  attendancePercentage: number
}

export interface AttendanceReport {
  month: string
  totalEmployees: number
  averageAttendancePercentage: number
  present: number
  absent: number
  late: number
  onLeave: number
  rows: AttendanceEmployeeRow[]
  trend: ChartDatum[]
  lateEmployees: AttendanceEmployeeRow[]
  absentEmployees: AttendanceEmployeeRow[]
}

export interface LeaveReport {
  totalRequests: number
  pending: number
  approved: number
  rejected: number
  cancelled: number
  onLeaveToday: number
  requests: Array<{
    id: string
    employeeName: string
    employeeCode: string
    departmentName: string
    leaveTypeName: string
    startDate: string
    endDate: string
    duration: number
    status: string
  }>
  balances: Array<{
    employeeName: string
    employeeCode: string
    departmentName: string
    leaveTypeName: string
    allocated: number
    used: number
    pending: number
    available: number
  }>
  typeDistribution: ChartDatum[]
  statusDistribution: ChartDatum[]
}

export interface SalaryReportRow {
  employeeId: string
  employeeName: string
  employeeCode: string
  departmentId: string
  departmentName: string
  structureName: string
  currency: SalaryCurrencyCode
  monthlyGross: number
  monthlyNet: number
  annualCTC: number
  effectiveFrom: string
}

export interface SalaryReport {
  rows: SalaryReportRow[]
  totalsByCurrency: CurrencyTotal[]
  departmentTotals: Array<CurrencyTotal & { departmentId: string; departmentName: string }>
  distribution: ChartDatum[]
}

export interface PayrollReport {
  runs: Array<{
    id: string
    name: string
    monthKey: string
    status: string
    currency: SalaryCurrencyCode
    employeeCount: number
    grossPayroll: number
    totalDeductions: number
    netPayroll: number
    employerCost: number
  }>
  totalsByCurrency: CurrencyTotal[]
  trend: ChartDatum[]
  departmentSummary: Array<{
    departmentName: string
    employees: number
    grossPayroll: number
    deductions: number
    netPayroll: number
    employerCost: number
  }>
}

export interface PayslipReport {
  rows: Array<{
    id: string
    payslipNumber: string
    employeeName: string
    employeeCode: string
    departmentName: string
    monthKey: string
    currency: SalaryCurrencyCode
    grossEarnings: number
    totalDeductions: number
    netSalary: number
    status: string
    generatedAt: string
  }>
  generated: number
  published: number
  archived: number
  totalsByCurrency: CurrencyTotal[]
  statusDistribution: ChartDatum[]
}

export interface DepartmentReport {
  rows: Array<{
    id: string
    code: string
    name: string
    headEmployeeName?: string
    location?: string
    status: string
    employeeCount: number
  }>
  distribution: ChartDatum[]
}

export interface DesignationReport {
  rows: Array<{
    id: string
    code: string
    name: string
    departmentName: string
    level: string
    status: string
    employeeCount: number
  }>
  distribution: ChartDatum[]
}

export interface WorkforceReport {
  headcount: number
  active: number
  probation: number
  byEmploymentType: ChartDatum[]
  byTenure: ChartDatum[]
  byDepartment: ChartDatum[]
  salaryRangeByCurrency: Array<{ currency: SalaryCurrencyCode; buckets: ChartDatum[] }>
}

export interface ReportAuthContext {
  permissions: PermissionName[]
  hasPermission?: (permission: PermissionName | PermissionName[]) => boolean
}
