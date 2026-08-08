import type {
  CompanyHoliday,
  CompanyLocation,
  LeavePolicyDefinition,
  LocalizationSettings,
  PayslipModuleSettings,
  PayrollModuleSettings,
  SettingsCategory,
  SystemSettings,
  WorkSchedule,
} from '../types'
import { SettingsServiceError } from './errors'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const URL_RE = /^https?:\/\/.+/i
const COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

export const settingsValidationService = {
  validateCompany(company: SystemSettings['company']): void {
    if (!company.companyName.trim()) throw new SettingsServiceError('VALIDATION', 'Company name is required.')
    if (company.email && !EMAIL_RE.test(company.email)) {
      throw new SettingsServiceError('VALIDATION', 'Primary email format is invalid.')
    }
    if (company.hrEmail && !EMAIL_RE.test(company.hrEmail)) {
      throw new SettingsServiceError('VALIDATION', 'HR email format is invalid.')
    }
    if (company.website && !URL_RE.test(company.website)) {
      throw new SettingsServiceError('VALIDATION', 'Website must be a valid URL.')
    }
    if (company.status === 'inactive') {
      throw new SettingsServiceError(
        'VALIDATION',
        'Company cannot be set inactive while the HRMS depends on an active company profile.',
      )
    }
  },

  validateLocalization(values: LocalizationSettings): void {
    if (!values.timezone.trim()) throw new SettingsServiceError('VALIDATION', 'Timezone is required.')
    if (!values.currencyCode.trim()) throw new SettingsServiceError('VALIDATION', 'Currency is required.')
    if (!values.dateFormat.trim()) throw new SettingsServiceError('VALIDATION', 'Date format is required.')
  },

  validateBranding(primaryColor: string, secondaryColor: string): void {
    if (!COLOR_RE.test(primaryColor) || !COLOR_RE.test(secondaryColor)) {
      throw new SettingsServiceError('VALIDATION', 'Brand colors must be valid hex values.')
    }
  },

  validateLocation(
    location: Omit<CompanyLocation, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>,
    existing: CompanyLocation[],
    excludeId?: string,
  ): void {
    if (!location.name.trim() || !location.code.trim()) {
      throw new SettingsServiceError('VALIDATION', 'Location name and code are required.')
    }
    const duplicate = existing.some(
      (item) => item.id !== excludeId && item.code.toLowerCase() === location.code.trim().toLowerCase(),
    )
    if (duplicate) throw new SettingsServiceError('CONFLICT', 'Location code must be unique.')
  },

  validateSchedule(
    schedule: Omit<WorkSchedule, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>,
    existing: WorkSchedule[],
    excludeId?: string,
  ): void {
    if (!schedule.name.trim() || !schedule.code.trim()) {
      throw new SettingsServiceError('VALIDATION', 'Schedule name and code are required.')
    }
    if (schedule.workingDays.length === 0) {
      throw new SettingsServiceError('VALIDATION', 'Select at least one working day.')
    }
    if (schedule.gracePeriodMinutes < 0 || schedule.minimumWorkingHours <= 0) {
      throw new SettingsServiceError('VALIDATION', 'Invalid schedule hours or grace period.')
    }
    const duplicate = existing.some(
      (item) => item.id !== excludeId && item.code.toLowerCase() === schedule.code.trim().toLowerCase(),
    )
    if (duplicate) throw new SettingsServiceError('CONFLICT', 'Work schedule code must be unique.')
  },

  validateHoliday(
    holiday: Omit<CompanyHoliday, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>,
    existing: CompanyHoliday[],
    excludeId?: string,
  ): void {
    if (!holiday.name.trim() || !holiday.date) {
      throw new SettingsServiceError('VALIDATION', 'Holiday name and date are required.')
    }
    const duplicate = existing.some(
      (item) =>
        item.id !== excludeId &&
        item.date === holiday.date &&
        (item.locationId ?? '') === (holiday.locationId ?? ''),
    )
    if (duplicate) {
      throw new SettingsServiceError('CONFLICT', 'A holiday already exists for this date and location.')
    }
  },

  validateLeavePolicy(
    policy: Omit<LeavePolicyDefinition, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>,
  ): void {
    if (!policy.name.trim()) throw new SettingsServiceError('VALIDATION', 'Policy name is required.')
    if (policy.annualAllocation < 0 || policy.carryForwardLimit < 0) {
      throw new SettingsServiceError('VALIDATION', 'Allocation values cannot be negative.')
    }
    if (policy.carryForwardEnabled && policy.carryForwardLimit <= 0) {
      throw new SettingsServiceError('VALIDATION', 'Carry forward limit is required when enabled.')
    }
  },

  validatePayroll(payroll: PayrollModuleSettings): void {
    if (payroll.periodStartDay < 1 || payroll.periodStartDay > 28) {
      throw new SettingsServiceError('VALIDATION', 'Payroll start day must be between 1 and 28.')
    }
    if (payroll.periodEndDay < 1 || payroll.periodEndDay > 31) {
      throw new SettingsServiceError('VALIDATION', 'Payroll end day must be between 1 and 31.')
    }
  },

  validatePayslip(payslip: PayslipModuleSettings): void {
    if (!payslip.numberPrefix.trim()) {
      throw new SettingsServiceError('VALIDATION', 'Payslip number prefix is required.')
    }
  },

  categoryWarning(category: SettingsCategory): string | null {
    if (category === 'payroll' || category === 'localization') {
      return 'Changing currency or payroll settings affects future salary/payroll configuration. Existing historical payroll will not be changed.'
    }
    if (category === 'attendance') {
      return 'Changes apply to future attendance calculations unless existing records are explicitly recalculated.'
    }
    if (category === 'leave') {
      return 'Leave policy changes apply prospectively. Approved historical leave records are not modified.'
    }
    if (category === 'payslip') {
      return 'Payslip format changes apply to newly generated payslips only.'
    }
    return null
  },
}
