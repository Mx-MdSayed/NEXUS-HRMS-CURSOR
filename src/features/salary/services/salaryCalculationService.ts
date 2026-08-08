import type { SalaryCurrencyCode } from '@/constants/currencies'
import type { SalaryComponent, StructureComponentLineInput } from '../types'
import {
  calculateCTC,
  calculateDeductions,
  calculateEmployerContributions,
  calculateGross,
  calculateNetSalary,
  calculateSalaryStructure,
} from '../utils/calculations'
import { annualToMonthly, monthlyToAnnual, roundSalaryAmount } from '../utils/money'
import { salaryComponentService } from './salaryComponentService'

/**
 * Facade for salary calculation utilities — keeps UI free of formula logic.
 */
export const salaryCalculationService = {
  calculateSalaryStructure(
    inputs: StructureComponentLineInput[],
    currency: SalaryCurrencyCode = 'INR',
    masters?: SalaryComponent[],
  ) {
    return calculateSalaryStructure(
      masters ?? salaryComponentService.listAllSync(),
      inputs,
      currency,
    )
  },

  calculateComponent: calculateSalaryStructure,
  calculateGross,
  calculateDeductions,
  calculateEmployerContributions,
  calculateNetSalary,
  calculateCTC,
  monthlyToAnnual,
  annualToMonthly,
  roundSalaryAmount,
}
