import type { SalaryCurrencyCode } from '@/constants/currencies'
import type { PayrollComponent } from '@/features/payroll'

export type PayslipStatus = 'generated' | 'published' | 'archived'

export interface PayslipCompanySnapshot {
  name: string
  legalName?: string
  address?: string
  phone?: string
  email?: string
  website?: string
  taxId?: string
  registrationNumber?: string
  logoUrl?: string
}

export interface PayslipComponentLine {
  id: string
  componentCode: string
  componentName: string
  category: PayrollComponent['category']
  amount: number
  taxable: boolean
  statutory: boolean
}

export interface Payslip {
  id: string
  payslipNumber: string
  payrollRunId: string
  payrollEmployeeId: string
  employeeId: string
  employeeNameSnapshot: string
  employeeCodeSnapshot: string
  departmentSnapshot: string
  designationSnapshot: string
  joiningDateSnapshot?: string
  companySnapshot: PayslipCompanySnapshot
  payrollMonth: number
  payrollYear: number
  monthKey: string
  periodStart: string
  periodEnd: string
  currency: SalaryCurrencyCode
  grossEarnings: number
  totalDeductions: number
  netSalary: number
  employerContribution: number
  employerCost: number
  workingDays: number
  payableDays: number
  presentDays: number
  absentDays: number
  halfDays: number
  paidLeaveDays: number
  unpaidLeaveDays: number
  overtimeHours: number
  earnings: PayslipComponentLine[]
  deductions: PayslipComponentLine[]
  employerContributions: PayslipComponentLine[]
  paymentMethod?: string
  bankName?: string
  accountNumberMasked?: string
  ifsc?: string
  paymentDate?: string
  transactionReference?: string
  status: PayslipStatus
  generatedAt: string
  generatedBy: string
  createdAt: string
  updatedAt: string
  archivedAt?: string
  archivedBy?: string
}

export interface PayslipFilters {
  search?: string
  month?: number | ''
  year?: number | ''
  departmentId?: string
  employeeId?: string
  status?: PayslipStatus | ''
  currency?: SalaryCurrencyCode | ''
}

export interface PayslipSettings {
  numberPrefix: string
  showCompanyHeader: boolean
  showEmployerContribution: boolean
  showEmployerCostToEmployee: boolean
  showBankDetails: boolean
  footerText: string
  dateFormat: string
  currencyDisplay: 'symbol' | 'code'
  showZeroAmountComponents: boolean
}

export interface BulkGenerationPreview {
  total: number
  alreadyGenerated: number
  remaining: number
  payrollRunId: string
}
