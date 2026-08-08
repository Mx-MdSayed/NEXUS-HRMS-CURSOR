import type {
  PercentageBase,
  SalaryCalculationMethod,
  SalaryComponentCategory,
  SalaryRecordStatus,
  SalaryRevisionStatus,
} from './types'

export const SALARY_COMPONENT_CATEGORY_LABELS: Record<SalaryComponentCategory, string> = {
  earning: 'Earnings',
  deduction: 'Deductions',
  employer_contribution: 'Employer Contributions',
}

export const SALARY_COMPONENT_CATEGORY_OPTIONS = (
  Object.entries(SALARY_COMPONENT_CATEGORY_LABELS) as Array<[SalaryComponentCategory, string]>
).map(([value, label]) => ({ value, label }))

export const CALCULATION_METHOD_LABELS: Record<SalaryCalculationMethod, string> = {
  fixed: 'Fixed Amount',
  percentage_of_basic: 'Percentage of Basic',
  percentage_of_gross: 'Percentage of Gross',
  percentage_of_ctc: 'Percentage of CTC',
  percentage_of_taxable: 'Percentage of Taxable',
}

export const CALCULATION_METHOD_OPTIONS = (
  Object.entries(CALCULATION_METHOD_LABELS) as Array<[SalaryCalculationMethod, string]>
).map(([value, label]) => ({ value, label }))

export const PERCENTAGE_BASE_LABELS: Record<PercentageBase, string> = {
  basic: 'Basic Salary',
  gross: 'Gross Salary',
  ctc: 'Annual CTC',
  taxable: 'Taxable Salary',
}

export const PERCENTAGE_BASE_OPTIONS = (
  Object.entries(PERCENTAGE_BASE_LABELS) as Array<[PercentageBase, string]>
).map(([value, label]) => ({ value, label }))

export const SALARY_STATUS_LABELS: Record<'active' | 'inactive' | 'draft', string> = {
  active: 'Active',
  inactive: 'Inactive',
  draft: 'Draft',
}

export const REVISION_STATUS_LABELS: Record<SalaryRevisionStatus, string> = {
  pending: 'Pending',
  applied: 'Applied',
  cancelled: 'Cancelled',
}

export const EMPLOYEE_SALARY_STATUS_LABELS: Record<SalaryRecordStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  draft: 'Draft',
  superseded: 'Superseded',
}

export function methodToPercentageBase(
  method: SalaryCalculationMethod,
): PercentageBase | undefined {
  switch (method) {
    case 'percentage_of_basic':
      return 'basic'
    case 'percentage_of_gross':
      return 'gross'
    case 'percentage_of_ctc':
      return 'ctc'
    case 'percentage_of_taxable':
      return 'taxable'
    default:
      return undefined
  }
}

export function isPercentageMethod(method: SalaryCalculationMethod): boolean {
  return method !== 'fixed'
}
