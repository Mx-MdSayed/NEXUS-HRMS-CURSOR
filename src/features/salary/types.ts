import type { SalaryCurrencyCode } from '@/constants/currencies'

export type SalaryComponentCategory = 'earning' | 'deduction' | 'employer_contribution'

export type SalaryCalculationMethod =
  | 'fixed'
  | 'percentage_of_basic'
  | 'percentage_of_gross'
  | 'percentage_of_ctc'
  | 'percentage_of_taxable'

export type PercentageBase = 'basic' | 'gross' | 'ctc' | 'taxable'

export type SalaryRecordStatus = 'active' | 'inactive' | 'draft' | 'superseded'

export type SalaryRevisionStatus = 'pending' | 'applied' | 'cancelled'

export interface SalaryComponent {
  id: string
  code: string
  name: string
  description?: string
  category: SalaryComponentCategory
  calculationMethod: SalaryCalculationMethod
  /** Percentage value when method is percentage_* (e.g. 40 for 40%). */
  percentage?: number
  percentageOf?: PercentageBase
  fixedAmount?: number
  taxable: boolean
  statutory: boolean
  recurring: boolean
  employerContribution: boolean
  employeeContribution: boolean
  currency: SalaryCurrencyCode
  status: 'active' | 'inactive'
  displayOrder: number
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy: string
  isDeleted: boolean
  deletedAt?: string
  deletedBy?: string
}

export interface SalaryComponentFormValues {
  name: string
  code: string
  description: string
  category: SalaryComponentCategory
  calculationMethod: SalaryCalculationMethod
  percentage?: number
  percentageOf?: PercentageBase
  fixedAmount?: number
  taxable: boolean
  statutory: boolean
  recurring: boolean
  employerContribution: boolean
  employeeContribution: boolean
  currency: SalaryCurrencyCode
  status: 'active' | 'inactive'
  displayOrder: number
}

export interface StructureComponentLine {
  id: string
  componentId: string
  /** Snapshot of master component code/name for payroll history safety. */
  componentCode: string
  componentName: string
  category: SalaryComponentCategory
  calculationMethod: SalaryCalculationMethod
  percentage?: number
  percentageOf?: PercentageBase
  fixedAmount?: number
  taxable: boolean
  statutory: boolean
  recurring: boolean
  employerContribution: boolean
  employeeContribution: boolean
  displayOrder: number
  /** Resolved amount for this structure (monthly). */
  amount: number
  override?: boolean
}

export interface SalaryStructure {
  id: string
  code: string
  name: string
  description?: string
  currency: SalaryCurrencyCode
  components: StructureComponentLine[]
  monthlyGross: number
  annualGross: number
  monthlyCTC: number
  annualCTC: number
  monthlyNet: number
  status: 'active' | 'inactive' | 'draft'
  effectiveFrom: string
  effectiveTo?: string
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy: string
  isDeleted: boolean
  deletedAt?: string
  deletedBy?: string
}

export interface SalaryStructureFormValues {
  name: string
  code: string
  description: string
  currency: SalaryCurrencyCode
  effectiveFrom: string
  status: 'active' | 'inactive' | 'draft'
  components: StructureComponentLineInput[]
}

export interface StructureComponentLineInput {
  componentId: string
  fixedAmount?: number
  percentage?: number
  displayOrder: number
  override?: boolean
}

export interface EmployeeSalaryComponentLine extends StructureComponentLine {
  override: boolean
}

export interface EmployeeSalary {
  id: string
  employeeId: string
  structureId: string
  structureCode: string
  structureName: string
  currency: SalaryCurrencyCode
  monthlyGross: number
  annualGross: number
  monthlyCTC: number
  annualCTC: number
  monthlyNet: number
  components: EmployeeSalaryComponentLine[]
  effectiveFrom: string
  effectiveTo?: string
  status: SalaryRecordStatus
  notes?: string
  revisionReason?: string
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy: string
}

export interface EmployeeSalaryAssignmentForm {
  employeeId: string
  structureId: string
  effectiveFrom: string
  currency?: SalaryCurrencyCode
  notes?: string
  /** Optional per-component overrides keyed by componentId. */
  overrides?: Record<
    string,
    {
      fixedAmount?: number
      percentage?: number
    }
  >
}

export interface SalaryRevision {
  id: string
  employeeId: string
  previousSalaryId?: string
  newSalaryId?: string
  previousMonthlyGross: number
  newMonthlyGross: number
  previousAnnualCTC: number
  newAnnualCTC: number
  currency: SalaryCurrencyCode
  structureId: string
  effectiveFrom: string
  reason: string
  notes?: string
  status: SalaryRevisionStatus
  createdAt: string
  createdBy: string
  appliedAt?: string
  appliedBy?: string
}

export interface SalaryRevisionFormValues {
  employeeId: string
  structureId: string
  effectiveFrom: string
  reason: string
  notes?: string
  overrides?: EmployeeSalaryAssignmentForm['overrides']
}

export interface SalaryCalculationResult {
  currency: SalaryCurrencyCode
  earnings: Array<{ componentId: string; code: string; name: string; amount: number; taxable: boolean }>
  deductions: Array<{ componentId: string; code: string; name: string; amount: number; statutory: boolean }>
  employerContributions: Array<{
    componentId: string
    code: string
    name: string
    amount: number
  }>
  totalEarnings: number
  monthlyGross: number
  annualGross: number
  totalDeductions: number
  monthlyNet: number
  totalEmployerContributions: number
  monthlyCTC: number
  annualCTC: number
  taxableEarnings: number
  lines: StructureComponentLine[]
}

export interface SalaryComponentFilters {
  search?: string
  category?: SalaryComponentCategory | ''
  status?: 'active' | 'inactive' | ''
}

export interface SalaryStructureFilters {
  search?: string
  status?: 'active' | 'inactive' | 'draft' | ''
  currency?: SalaryCurrencyCode | ''
}

export interface SalaryAssignmentFilters {
  search?: string
  departmentId?: string
  status?: SalaryRecordStatus | ''
}

export interface SalaryRevisionFilters {
  search?: string
  status?: SalaryRevisionStatus | ''
  employeeId?: string
}

export interface SalaryOverviewStats {
  structures: number
  components: number
  employeesWithSalary: number
  pendingRevisions: number
  totalMonthlyGross: number
  totalAnnualCTC: number
  currency: SalaryCurrencyCode
}
