import type { PayrollSettings } from './types'

/**
 * Configurable payroll settings — demo defaults only.
 * Not a claim of legal statutory compliance.
 */
export const payrollSettings: PayrollSettings = {
  lopBasis: 'basic',
  halfDayValue: 0.5,
  lateDeductionEnabled: false,
  overtimeEnabled: true,
  standardWorkingHoursPerDay: 8,
  overtimeMultiplier: 1.5,
  pfEmployeePercent: 12,
  pfEmployerPercent: 12,
  pfWageCap: 15000,
  esiEmployeePercent: 0.75,
  esiEmployerPercent: 3.25,
  esiWageThreshold: 21000,
  professionalTaxFixed: 200,
  allowMixedCurrencies: false,
}

export let runtimePayrollSettings: PayrollSettings = { ...payrollSettings }

export function getPayrollSettings(): PayrollSettings {
  return { ...runtimePayrollSettings }
}

export function updatePayrollSettings(patch: Partial<PayrollSettings>): PayrollSettings {
  runtimePayrollSettings = { ...runtimePayrollSettings, ...patch }
  return getPayrollSettings()
}

export function resetPayrollSettings(): PayrollSettings {
  runtimePayrollSettings = { ...payrollSettings }
  return getPayrollSettings()
}
