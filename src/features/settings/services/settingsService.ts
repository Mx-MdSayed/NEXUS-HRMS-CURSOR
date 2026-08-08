import { companyDefaults } from '@/config'
import { auditService } from '@/features/access-control/services/auditService'
import {
  getAttendanceSettings,
  updateAttendanceSettings,
} from '@/features/attendance/settings'
import {
  getLeavePolicy,
  updateLeavePolicy,
} from '@/features/leave/policy'
import {
  getPayrollSettings,
  updatePayrollSettings,
} from '@/features/payroll/settings'
import { companyProfileService } from '@/features/payslip/company'
import {
  getPayslipSettings,
  updatePayslipSettings,
} from '@/features/payslip/settings'
import { hasPermission } from '@/lib/permissions'
import { getSession } from '@/services/auth'
import type { CompanySettings, PermissionName, User } from '@/types'
import { cloneDefaultSystemSettings } from '../data/defaultSettings'
import type {
  AttendanceModuleSettings,
  BrandingSettings,
  CompanyHoliday,
  CompanyLocation,
  LeaveGlobalSettings,
  LeavePolicyDefinition,
  LocalizationSettings,
  NotificationModuleSettings,
  PayslipModuleSettings,
  PayrollModuleSettings,
  SettingsCategory,
  SettingsHistoryEntry,
  SystemSettings,
  WorkSchedule,
  WorkflowModuleSettings,
} from '../types'
import { SettingsServiceError } from './errors'
import { settingsValidationService } from './settingsValidationService'

let store: SystemSettings = cloneDefaultSystemSettings()
const history: SettingsHistoryEntry[] = []
let histSeq = 1

function delay(ms = 80): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function nowIso(): string {
  return new Date().toISOString()
}

function requireAny(...names: PermissionName[]): User {
  const session = getSession()
  const user = session?.user
  if (!user || !hasPermission(user, names)) {
    throw new SettingsServiceError('UNAUTHORIZED', 'You do not have permission for this action.')
  }
  return user
}

function actorMeta(user: User): { userId: string; userName: string } {
  return { userId: user.id, userName: user.name }
}

function pushHistory(
  category: SettingsCategory,
  previousValue: unknown,
  newValue: unknown,
  user: User,
  summary: string,
): void {
  history.unshift({
    id: `sethist_${histSeq++}`,
    settingCategory: category,
    changedBy: user.id,
    changedByName: user.name,
    changedAt: nowIso(),
    previousValue: JSON.stringify(previousValue ?? null),
    newValue: JSON.stringify(newValue ?? null),
    summary,
  })
}

function syncCompanyDefaults(company: CompanySettings): void {
  Object.assign(companyDefaults, { ...company })
  companyProfileService.updateCompanyProfile({
    name: company.companyName,
    legalName: company.legalName,
    address: [
      company.addressLine1,
      company.addressLine2,
      company.city,
      company.state,
      company.postalCode,
      company.country,
    ]
      .filter(Boolean)
      .join(', '),
    phone: company.phone,
    email: company.hrEmail ?? company.email,
    website: company.website,
    taxId: company.taxId,
    registrationNumber: company.registrationNumber,
    logoUrl: company.logoUrl,
  })
}

function syncAttendance(config: AttendanceModuleSettings): void {
  updateAttendanceSettings({
    standardStartTime: config.standardStartTime,
    standardEndTime: config.standardEndTime,
    gracePeriodMinutes: config.gracePeriodMinutes,
    halfDayThresholdHours: config.halfDayThresholdHours,
    fullDayHours: config.fullDayHours,
    weeklyOffDays: [...config.weeklyOffDays],
    halfDayAttendanceValue: config.halfDayAttendanceValue,
  })
}

function syncLeave(config: LeaveGlobalSettings): void {
  updateLeavePolicy({ ...config })
}

function syncPayroll(config: PayrollModuleSettings): void {
  updatePayrollSettings({
    lopBasis: config.lopBasis,
    halfDayValue: config.halfDayValue,
    lateDeductionEnabled: config.lateDeductionEnabled,
    overtimeEnabled: config.overtimeEnabled,
    standardWorkingHoursPerDay: config.standardWorkingHoursPerDay,
    overtimeMultiplier: config.overtimeMultiplier,
    pfEmployeePercent: config.pfEmployeePercent,
    pfEmployerPercent: config.pfEmployerPercent,
    pfWageCap: config.pfWageCap,
    esiEmployeePercent: config.esiEmployeePercent,
    esiEmployerPercent: config.esiEmployerPercent,
    esiWageThreshold: config.esiWageThreshold,
    professionalTaxFixed: config.professionalTaxFixed,
    allowMixedCurrencies: config.allowMixedCurrencies,
  })
}

function syncPayslip(config: PayslipModuleSettings): void {
  const current = getPayslipSettings()
  updatePayslipSettings({
    ...current,
    numberPrefix: config.numberPrefix,
    showCompanyHeader: config.showCompanyHeader,
    showEmployerContribution: config.showEmployerContribution,
    showEmployerCostToEmployee: config.showEmployerCostToEmployee,
    showBankDetails: config.showBankDetails && config.showBankLastDigits,
    footerText: config.footerText,
    dateFormat: config.dateFormat,
    currencyDisplay: config.currencyDisplay,
    showZeroAmountComponents: config.showZeroAmountComponents,
  })
}

async function logSettingsChange(
  user: User,
  category: SettingsCategory,
  summary: string,
): Promise<void> {
  const warning = settingsValidationService.categoryWarning(category)
  await auditService.log({
    ...actorMeta(user),
    eventType: 'SETTINGS_CHANGED',
    description: summary,
    metadata: {
      category,
      historicalImmutable: 'true',
      ...(warning ? { warning } : {}),
    },
  })
}

export const settingsService = {
  async getSettings(): Promise<SystemSettings> {
    await delay()
    requireAny('settings.view', 'settings.manage', 'company.manage', 'organization.manage')
    return structuredClone(store)
  },

  async getCompanySettings(): Promise<CompanySettings> {
    await delay()
    requireAny('settings.view', 'company.manage', 'settings.manage')
    return structuredClone(store.company)
  },

  async getOrganizationSettings(): Promise<{
    companyId: string
    companyName: string
    locationCount: number
    scheduleCount: number
    holidayCount: number
    leavePolicyCount: number
  }> {
    await delay()
    requireAny('settings.view', 'organization.manage', 'settings.manage', 'department.view')
    return {
      companyId: store.company.companyId,
      companyName: store.company.companyName,
      locationCount: store.locations.filter((l) => l.status === 'active').length,
      scheduleCount: store.workSchedules.filter((s) => s.status === 'active').length,
      holidayCount: store.holidays.filter((h) => h.status === 'active').length,
      leavePolicyCount: store.leavePolicies.filter((p) => p.status === 'active').length,
    }
  },

  async getAttendanceSettings(): Promise<AttendanceModuleSettings> {
    await delay()
    requireAny('settings.view', 'attendance-settings.manage', 'settings.manage')
    return structuredClone(store.attendance)
  },

  async getLeaveSettings(): Promise<LeaveGlobalSettings> {
    await delay()
    requireAny('settings.view', 'leave-policy.manage', 'settings.manage')
    return structuredClone(store.leave)
  },

  async getLeavePolicies(): Promise<LeavePolicyDefinition[]> {
    await delay()
    requireAny('settings.view', 'leave-policy.manage', 'settings.manage')
    return structuredClone(store.leavePolicies)
  },

  async getPayrollSettings(): Promise<PayrollModuleSettings> {
    await delay()
    requireAny(
      'settings.view',
      'payroll-settings.manage',
      'payroll.settings.manage',
      'settings.manage',
    )
    return structuredClone(store.payroll)
  },

  async getPayslipSettings(): Promise<PayslipModuleSettings> {
    await delay()
    requireAny('settings.view', 'payslip-settings.manage', 'settings.manage')
    return structuredClone(store.payslip)
  },

  async getLocalizationSettings(): Promise<LocalizationSettings> {
    await delay()
    requireAny('settings.view', 'localization.manage', 'settings.manage')
    return structuredClone(store.localization)
  },

  async getNotificationSettings(): Promise<NotificationModuleSettings> {
    await delay()
    requireAny(
      'settings.view',
      'notification-settings.manage',
      'notification.settings.manage',
      'settings.manage',
    )
    return structuredClone(store.notifications)
  },

  async getWorkflowSettings(): Promise<WorkflowModuleSettings> {
    await delay()
    requireAny('settings.view', 'workflow-settings.manage', 'settings.manage')
    return structuredClone(store.workflow)
  },

  async getBrandingSettings(): Promise<BrandingSettings> {
    await delay()
    requireAny('settings.view', 'branding.manage', 'settings.manage')
    return structuredClone(store.branding)
  },

  async getLocations(): Promise<CompanyLocation[]> {
    await delay()
    requireAny('settings.view', 'location.manage', 'settings.manage')
    return structuredClone(store.locations)
  },

  async getWorkSchedules(): Promise<WorkSchedule[]> {
    await delay()
    requireAny('settings.view', 'schedule.manage', 'settings.manage')
    return structuredClone(store.workSchedules)
  },

  async getHolidays(): Promise<CompanyHoliday[]> {
    await delay()
    requireAny('settings.view', 'holiday.manage', 'settings.manage')
    return structuredClone(store.holidays)
  },

  async getHistory(category?: SettingsCategory): Promise<SettingsHistoryEntry[]> {
    await delay()
    requireAny('settings.view', 'settings.manage', 'security.view')
    const rows = category ? history.filter((h) => h.settingCategory === category) : history
    return structuredClone(rows)
  },

  getHistoricalWarning(category: SettingsCategory): string | null {
    return settingsValidationService.categoryWarning(category)
  },

  getSummary() {
    return {
      companyName: store.company.companyName,
      currency: store.company.currencyCode,
      timezone: store.company.timezone,
      locations: store.locations.filter((l) => l.status === 'active').length,
      schedules: store.workSchedules.filter((s) => s.status === 'active').length,
      holidays: store.holidays.filter((h) => h.status === 'active').length,
      leavePolicies: store.leavePolicies.filter((p) => p.status === 'active').length,
      payrollFrequency: store.payroll.frequency,
      brandingPrimary: store.branding.primaryColor,
      employeeIdPrefix: store.company.employeeIdPrefix,
      payslipPrefix: store.payslip.numberPrefix,
    }
  },

  async updateCompany(next: CompanySettings): Promise<CompanySettings> {
    await delay(120)
    const user = requireAny('company.manage', 'settings.manage')
    settingsValidationService.validateCompany(next)
    const previous = structuredClone(store.company)
    store.company = { ...next }
    store.localization = {
      ...store.localization,
      currencyCode: next.currencyCode,
      currencyLocale: next.currencyLocale,
      timezone: next.timezone,
      dateFormat: next.dateFormat,
      firstDayOfWeek: next.workWeekStart,
    }
    store.payroll = { ...store.payroll, currencyCode: next.currencyCode }
    store.payslip = { ...store.payslip, numberPrefix: next.payslipPrefix || store.payslip.numberPrefix }
    syncCompanyDefaults(store.company)
    pushHistory('company', previous, store.company, user, 'Updated company profile')
    await logSettingsChange(user, 'company', 'Company settings updated')
    return structuredClone(store.company)
  },

  async updateLocalization(next: LocalizationSettings): Promise<LocalizationSettings> {
    await delay(120)
    const user = requireAny('localization.manage', 'settings.manage')
    settingsValidationService.validateLocalization(next)
    const previous = structuredClone(store.localization)
    store.localization = { ...next }
    store.company = {
      ...store.company,
      currencyCode: next.currencyCode,
      currencyLocale: next.currencyLocale,
      timezone: next.timezone,
      dateFormat: next.dateFormat,
      workWeekStart: next.firstDayOfWeek,
    }
    syncCompanyDefaults(store.company)
    pushHistory('localization', previous, store.localization, user, 'Updated localization settings')
    await logSettingsChange(user, 'localization', 'Localization settings updated')
    return structuredClone(store.localization)
  },

  async updateBranding(next: BrandingSettings, applyLogo = false): Promise<BrandingSettings> {
    await delay(120)
    const user = requireAny('branding.manage', 'settings.manage')
    settingsValidationService.validateBranding(next.primaryColor, next.secondaryColor)
    const previous = structuredClone(store.branding)
    store.branding = { ...next }
    if (applyLogo && next.logoUrl) {
      store.company = { ...store.company, logoUrl: next.logoUrl }
      syncCompanyDefaults(store.company)
    }
    pushHistory('branding', previous, store.branding, user, 'Updated branding settings')
    await logSettingsChange(user, 'branding', 'Branding settings updated')
    return structuredClone(store.branding)
  },

  async updateAttendance(next: AttendanceModuleSettings): Promise<AttendanceModuleSettings> {
    await delay(120)
    const user = requireAny('attendance-settings.manage', 'settings.manage')
    const previous = structuredClone(store.attendance)
    store.attendance = { ...next }
    syncAttendance(store.attendance)
    pushHistory('attendance', previous, store.attendance, user, 'Updated attendance settings')
    await logSettingsChange(user, 'attendance', 'Attendance settings updated')
    return structuredClone(store.attendance)
  },

  async updateLeave(next: LeaveGlobalSettings): Promise<LeaveGlobalSettings> {
    await delay(120)
    const user = requireAny('leave-policy.manage', 'settings.manage')
    const previous = structuredClone(store.leave)
    store.leave = { ...next }
    syncLeave(store.leave)
    pushHistory('leave', previous, store.leave, user, 'Updated leave settings')
    await logSettingsChange(user, 'leave', 'Leave settings updated')
    return structuredClone(store.leave)
  },

  async updatePayroll(next: PayrollModuleSettings): Promise<PayrollModuleSettings> {
    await delay(120)
    const user = requireAny('payroll-settings.manage', 'payroll.settings.manage', 'settings.manage')
    settingsValidationService.validatePayroll(next)
    const previous = structuredClone(store.payroll)
    store.payroll = { ...next }
    syncPayroll(store.payroll)
    pushHistory('payroll', previous, store.payroll, user, 'Updated payroll settings')
    await logSettingsChange(user, 'payroll', 'Payroll settings updated')
    return structuredClone(store.payroll)
  },

  async updatePayslip(next: PayslipModuleSettings): Promise<PayslipModuleSettings> {
    await delay(120)
    const user = requireAny('payslip-settings.manage', 'settings.manage')
    settingsValidationService.validatePayslip(next)
    const previous = structuredClone(store.payslip)
    store.payslip = { ...next }
    store.company = { ...store.company, payslipPrefix: next.numberPrefix }
    syncPayslip(store.payslip)
    syncCompanyDefaults(store.company)
    pushHistory('payslip', previous, store.payslip, user, 'Updated payslip settings')
    await logSettingsChange(user, 'payslip', 'Payslip settings updated')
    return structuredClone(store.payslip)
  },

  async updateNotifications(next: NotificationModuleSettings): Promise<NotificationModuleSettings> {
    await delay(120)
    const user = requireAny(
      'notification-settings.manage',
      'notification.settings.manage',
      'settings.manage',
    )
    const previous = structuredClone(store.notifications)
    store.notifications = { ...next }
    pushHistory('notifications', previous, store.notifications, user, 'Updated notification defaults')
    await logSettingsChange(user, 'notifications', 'Notification settings updated')
    return structuredClone(store.notifications)
  },

  async updateWorkflows(next: WorkflowModuleSettings): Promise<WorkflowModuleSettings> {
    await delay(120)
    const user = requireAny('workflow-settings.manage', 'settings.manage')
    if (!next.fallbackToHr) {
      throw new SettingsServiceError(
        'VALIDATION',
        'Workflow fallback to HR/Admin must remain enabled to avoid stuck approvals.',
      )
    }
    const previous = structuredClone(store.workflow)
    store.workflow = { ...next }
    pushHistory('workflow', previous, store.workflow, user, 'Updated workflow defaults')
    await logSettingsChange(user, 'workflow', 'Workflow settings updated')
    return structuredClone(store.workflow)
  },

  async createLocation(
    input: Omit<CompanyLocation, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>,
  ): Promise<CompanyLocation> {
    await delay()
    const user = requireAny('location.manage', 'settings.manage')
    settingsValidationService.validateLocation(input, store.locations)
    const row: CompanyLocation = {
      ...input,
      id: `loc_${crypto.randomUUID().slice(0, 8)}`,
      companyId: store.company.companyId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }
    store.locations = [...store.locations, row]
    pushHistory('organization', null, row, user, `Created location ${row.name}`)
    await logSettingsChange(user, 'organization', `Location created: ${row.name}`)
    return structuredClone(row)
  },

  async updateLocation(id: string, patch: Partial<CompanyLocation>): Promise<CompanyLocation> {
    await delay()
    const user = requireAny('location.manage', 'settings.manage')
    const idx = store.locations.findIndex((l) => l.id === id)
    if (idx < 0) throw new SettingsServiceError('NOT_FOUND', 'Location not found.')
    const next: CompanyLocation = {
      ...store.locations[idx]!,
      ...patch,
      id,
      companyId: store.company.companyId,
      updatedAt: nowIso(),
    }
    settingsValidationService.validateLocation(next, store.locations, id)
    const previous = store.locations[idx]
    store.locations = store.locations.map((l) => (l.id === id ? next : l))
    pushHistory('organization', previous, next, user, `Updated location ${next.name}`)
    await logSettingsChange(user, 'organization', `Location updated: ${next.name}`)
    return structuredClone(next)
  },

  async createWorkSchedule(
    input: Omit<WorkSchedule, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>,
  ): Promise<WorkSchedule> {
    await delay()
    const user = requireAny('schedule.manage', 'settings.manage')
    settingsValidationService.validateSchedule(input, store.workSchedules)
    const row: WorkSchedule = {
      ...input,
      id: `sch_${crypto.randomUUID().slice(0, 8)}`,
      companyId: store.company.companyId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }
    store.workSchedules = [...store.workSchedules, row]
    pushHistory('attendance', null, row, user, `Created work schedule ${row.name}`)
    await logSettingsChange(user, 'attendance', `Work schedule saved: ${row.name}`)
    return structuredClone(row)
  },

  async updateWorkSchedule(id: string, patch: Partial<WorkSchedule>): Promise<WorkSchedule> {
    await delay()
    const user = requireAny('schedule.manage', 'settings.manage')
    const idx = store.workSchedules.findIndex((s) => s.id === id)
    if (idx < 0) throw new SettingsServiceError('NOT_FOUND', 'Work schedule not found.')
    const next: WorkSchedule = {
      ...store.workSchedules[idx]!,
      ...patch,
      id,
      companyId: store.company.companyId,
      updatedAt: nowIso(),
    }
    settingsValidationService.validateSchedule(next, store.workSchedules, id)
    const previous = store.workSchedules[idx]
    store.workSchedules = store.workSchedules.map((s) => (s.id === id ? next : s))
    pushHistory('attendance', previous, next, user, `Updated work schedule ${next.name}`)
    await logSettingsChange(user, 'attendance', `Work schedule updated: ${next.name}`)
    return structuredClone(next)
  },

  async createHoliday(
    input: Omit<CompanyHoliday, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>,
  ): Promise<CompanyHoliday> {
    await delay()
    const user = requireAny('holiday.manage', 'settings.manage')
    settingsValidationService.validateHoliday(input, store.holidays)
    const row: CompanyHoliday = {
      ...input,
      id: `hol_${crypto.randomUUID().slice(0, 8)}`,
      companyId: store.company.companyId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }
    store.holidays = [...store.holidays, row]
    pushHistory('leave', null, row, user, `Added holiday ${row.name}`)
    await logSettingsChange(user, 'leave', `Holiday added: ${row.name}`)
    return structuredClone(row)
  },

  async updateHoliday(id: string, patch: Partial<CompanyHoliday>): Promise<CompanyHoliday> {
    await delay()
    const user = requireAny('holiday.manage', 'settings.manage')
    const idx = store.holidays.findIndex((h) => h.id === id)
    if (idx < 0) throw new SettingsServiceError('NOT_FOUND', 'Holiday not found.')
    const next: CompanyHoliday = {
      ...store.holidays[idx]!,
      ...patch,
      id,
      companyId: store.company.companyId,
      updatedAt: nowIso(),
    }
    settingsValidationService.validateHoliday(next, store.holidays, id)
    const previous = store.holidays[idx]
    store.holidays = store.holidays.map((h) => (h.id === id ? next : h))
    pushHistory('leave', previous, next, user, `Updated holiday ${next.name}`)
    await logSettingsChange(user, 'leave', `Holiday updated: ${next.name}`)
    return structuredClone(next)
  },

  async createLeavePolicy(
    input: Omit<LeavePolicyDefinition, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>,
  ): Promise<LeavePolicyDefinition> {
    await delay()
    const user = requireAny('leave-policy.manage', 'settings.manage')
    settingsValidationService.validateLeavePolicy(input)
    const row: LeavePolicyDefinition = {
      ...input,
      id: `lpol_${crypto.randomUUID().slice(0, 8)}`,
      companyId: store.company.companyId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }
    store.leavePolicies = [...store.leavePolicies, row]
    pushHistory('leave', null, row, user, `Created leave policy ${row.name}`)
    await logSettingsChange(user, 'leave', `Leave policy created: ${row.name}`)
    return structuredClone(row)
  },

  async updateLeavePolicy(
    id: string,
    patch: Partial<LeavePolicyDefinition>,
  ): Promise<LeavePolicyDefinition> {
    await delay()
    const user = requireAny('leave-policy.manage', 'settings.manage')
    const idx = store.leavePolicies.findIndex((p) => p.id === id)
    if (idx < 0) throw new SettingsServiceError('NOT_FOUND', 'Leave policy not found.')
    const next: LeavePolicyDefinition = {
      ...store.leavePolicies[idx]!,
      ...patch,
      id,
      companyId: store.company.companyId,
      updatedAt: nowIso(),
    }
    settingsValidationService.validateLeavePolicy(next)
    const previous = store.leavePolicies[idx]
    store.leavePolicies = store.leavePolicies.map((p) => (p.id === id ? next : p))
    pushHistory('leave', previous, next, user, `Updated leave policy ${next.name}`)
    await logSettingsChange(user, 'leave', `Leave policy updated: ${next.name}`)
    return structuredClone(next)
  },

  async resetCategory(category: SettingsCategory, confirmed = false): Promise<SystemSettings> {
    await delay()
    const user = requireAny('settings.manage')
    if (category === 'company' || category === 'payroll') {
      throw new SettingsServiceError(
        'VALIDATION',
        `Reset of ${category} configuration is blocked for safety. Confirm via support workflow.`,
      )
    }
    if (!confirmed) {
      throw new SettingsServiceError('VALIDATION', 'Reset requires explicit confirmation.')
    }
    const defaults = cloneDefaultSystemSettings()
    const previous = structuredClone((store as unknown as Record<string, unknown>)[category])
    if (category === 'leave') {
      store.leave = defaults.leave
      store.leavePolicies = defaults.leavePolicies
      syncLeave(store.leave)
    } else if (category in store) {
      ;(store as unknown as Record<string, unknown>)[category] = (
        defaults as unknown as Record<string, unknown>
      )[category]
      if (category === 'attendance') syncAttendance(store.attendance)
      if (category === 'payslip') syncPayslip(store.payslip)
      if (category === 'localization') {
        syncCompanyDefaults({
          ...store.company,
          currencyCode: store.localization.currencyCode,
          currencyLocale: store.localization.currencyLocale,
          timezone: store.localization.timezone,
          dateFormat: store.localization.dateFormat,
          workWeekStart: store.localization.firstDayOfWeek,
        })
      }
    }
    pushHistory(category, previous, (store as unknown as Record<string, unknown>)[category], user, `Reset ${category}`)
    await logSettingsChange(user, category, `Reset ${category} settings to defaults`)
    return structuredClone(store)
  },

  /** Prospective mirrors used by other modules — never mutate historical records. */
  getLiveAttendanceMirror() {
    return getAttendanceSettings()
  },
  getLiveLeaveMirror() {
    return getLeavePolicy()
  },
  getLivePayrollMirror() {
    return getPayrollSettings()
  },
  getLivePayslipMirror() {
    return getPayslipSettings()
  },
}

export type SettingsService = typeof settingsService
