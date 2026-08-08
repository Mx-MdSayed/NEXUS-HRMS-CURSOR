import { companyDefaults } from '@/config'
import type { PayslipSettings } from './types'

const defaultPayslipSettings: PayslipSettings = {
  numberPrefix: 'PS',
  showCompanyHeader: true,
  showEmployerContribution: true,
  showEmployerCostToEmployee: true,
  showBankDetails: true,
  footerText:
    'This is a system-generated payslip and does not require a physical signature.',
  dateFormat: companyDefaults.dateFormat,
  currencyDisplay: 'symbol',
  showZeroAmountComponents: false,
}

let payslipSettings: PayslipSettings = { ...defaultPayslipSettings }

export function getPayslipSettings(): PayslipSettings {
  return structuredClone(payslipSettings)
}

export function updatePayslipSettings(values: PayslipSettings): PayslipSettings {
  payslipSettings = {
    ...values,
    numberPrefix: values.numberPrefix.trim().toUpperCase() || defaultPayslipSettings.numberPrefix,
    footerText: values.footerText.trim() || defaultPayslipSettings.footerText,
    dateFormat: values.dateFormat.trim() || defaultPayslipSettings.dateFormat,
  }
  return getPayslipSettings()
}

export function resetPayslipSettings(): PayslipSettings {
  payslipSettings = { ...defaultPayslipSettings }
  return getPayslipSettings()
}

export { payslipSettings }
