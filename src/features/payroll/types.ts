import type { SalaryCurrencyCode } from '@/constants/currencies'

export type PayrollPeriodStatus =
  | 'draft'
  | 'processing'
  | 'calculated'
  | 'pending_approval'
  | 'approved'
  | 'finalized'
  | 'cancelled'

export type PayrollRunStatus = PayrollPeriodStatus

export type PayrollEmployeeStatus =
  | 'pending'
  | 'ready'
  | 'calculated'
  | 'error'
  | 'excluded'

export type LopBasis = 'basic' | 'gross' | 'ctc'

export interface PayrollSettings {
  lopBasis: LopBasis
  halfDayValue: number
  lateDeductionEnabled: boolean
  overtimeEnabled: boolean
  /** Standard working hours per day for hourly rate. */
  standardWorkingHoursPerDay: number
  overtimeMultiplier: number
  /** Demo PF rate on basic (not legal compliance). */
  pfEmployeePercent: number
  pfEmployerPercent: number
  pfWageCap: number
  esiEmployeePercent: number
  esiEmployerPercent: number
  esiWageThreshold: number
  professionalTaxFixed: number
  allowMixedCurrencies: boolean
}

export interface PayrollPeriod {
  id: string
  month: number
  year: number
  /** yyyy-MM */
  monthKey: string
  startDate: string
  endDate: string
  status: PayrollPeriodStatus
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
}

export interface PayrollComponent {
  id: string
  payrollEmployeeId: string
  componentId: string
  componentCode: string
  componentName: string
  category: 'earning' | 'deduction' | 'employer_contribution'
  calculationMethod: string
  baseAmount: number
  rate?: number
  amount: number
  taxable: boolean
  statutory: boolean
  employeeContribution: boolean
  employerContribution: boolean
}

export interface PayrollEmployee {
  id: string
  payrollRunId: string
  employeeId: string
  employeeCode: string
  employeeName: string
  departmentId: string
  departmentName: string
  designationName: string
  salarySnapshotId: string
  /** Additional snapshots when mid-month revision applies. */
  salarySnapshotIds: string[]
  currency: SalaryCurrencyCode
  workingDays: number
  payableDays: number
  presentDays: number
  absentDays: number
  paidLeaveDays: number
  unpaidLeaveDays: number
  halfDays: number
  overtimeHours: number
  lateMinutes: number
  grossEarnings: number
  totalDeductions: number
  employerContribution: number
  netSalary: number
  employerCost: number
  lopAmount: number
  overtimeAmount: number
  status: PayrollEmployeeStatus
  validationErrors: string[]
  validationWarnings: string[]
  components: PayrollComponent[]
  createdAt: string
  updatedAt: string
}

export interface PayrollRun {
  id: string
  periodId: string
  monthKey: string
  name: string
  currency: SalaryCurrencyCode
  employeeCount: number
  grossPayroll: number
  totalDeductions: number
  totalEmployerContribution: number
  totalNetPayroll: number
  totalEmployerCost: number
  averageNetSalary: number
  status: PayrollRunStatus
  selectionMode: 'all' | 'department' | 'selected'
  departmentId?: string
  selectedEmployeeIds?: string[]
  calculatedAt?: string
  approvedAt?: string
  approvedBy?: string
  rejectedAt?: string
  rejectedBy?: string
  rejectionReason?: string
  finalizedAt?: string
  finalizedBy?: string
  cancelledAt?: string
  cancelledBy?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  updatedBy: string
}

export interface PayrollAuditEvent {
  id: string
  action:
    | 'created'
    | 'calculated'
    | 'recalculated'
    | 'submitted'
    | 'approved'
    | 'rejected'
    | 'finalized'
    | 'cancelled'
    | 'updated'
  payrollRunId: string
  user: string
  timestamp: string
  previousStatus?: PayrollRunStatus
  newStatus?: PayrollRunStatus
  reason?: string
}

export interface PayrollRunFormValues {
  month: number
  year: number
  name: string
  currency: SalaryCurrencyCode
  selectionMode: 'all' | 'department' | 'selected'
  departmentId?: string
  selectedEmployeeIds?: string[]
}

export interface PayrollRunFilters {
  search?: string
  month?: number | ''
  year?: number | ''
  status?: PayrollRunStatus | ''
  departmentId?: string
}

export interface PayrollValidationIssue {
  employeeId: string
  employeeName: string
  code:
    | 'MISSING_SALARY'
    | 'INVALID_SALARY_PERIOD'
    | 'INVALID_COMPONENT'
    | 'INVALID_CURRENCY'
    | 'DUPLICATE_PAYROLL'
    | 'INVALID_ATTENDANCE'
    | 'INVALID_LEAVE'
  severity: 'error' | 'warning'
  message: string
}

export interface PayrollOverviewStats {
  currentMonthLabel: string
  totalEmployees: number
  grossPayroll: number
  totalDeductions: number
  employerContributions: number
  netPayroll: number
  pendingApproval: number
  finalized: number
  currency: SalaryCurrencyCode
}

export interface DepartmentPayrollSummary {
  departmentId: string
  departmentName: string
  employees: number
  grossPayroll: number
  deductions: number
  netPayroll: number
  employerCost: number
}

export interface EmployeePayrollInput {
  employeeId: string
  employeeCode: string
  employeeName: string
  departmentId: string
  departmentName: string
  designationName: string
  currency: SalaryCurrencyCode
}
