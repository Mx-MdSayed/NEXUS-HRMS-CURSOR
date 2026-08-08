import type { CompanySettings, PermissionName } from '@/types'
import type { AttendanceSettings } from '@/features/attendance/types'
import type { LeavePolicyConfig } from '@/features/leave/types'

export type SettingsCategory =
  | 'company'
  | 'organization'
  | 'attendance'
  | 'leave'
  | 'payroll'
  | 'payslip'
  | 'localization'
  | 'notifications'
  | 'workflow'
  | 'branding'
  | 'general'

export type Weekday =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

export type HolidayType = 'public' | 'company' | 'optional'
export type EntityStatus = 'active' | 'inactive'
export type AttendanceMethod = 'manual' | 'web' | 'both'
export type PayrollFrequency = 'monthly' | 'weekly' | 'bi_weekly' | 'semi_monthly'
export type PayrollRounding = 'none' | 'nearest' | 'two_decimals'
export type TimeFormat = '12h' | '24h'
export type ApproverMode = 'reporting_manager' | 'hr' | 'specific_user'

export interface CompanyLocation {
  id: string
  companyId: string
  name: string
  code: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
  timezone: string
  contactPerson?: string
  contactPhone?: string
  status: EntityStatus
  createdAt: string
  updatedAt: string
}

export interface WorkSchedule {
  id: string
  companyId: string
  name: string
  code: string
  workingDays: Weekday[]
  startTime: string
  endTime: string
  breakEnabled: boolean
  breakDurationMinutes: number
  flexibleBreak: boolean
  gracePeriodMinutes: number
  minimumWorkingHours: number
  overtimeEnabled: boolean
  minimumOvertimeMinutes: number
  status: EntityStatus
  createdAt: string
  updatedAt: string
}

export interface CompanyHoliday {
  id: string
  companyId: string
  name: string
  date: string
  type: HolidayType
  locationId?: string
  locationName?: string
  description?: string
  optional: boolean
  status: EntityStatus
  createdAt: string
  updatedAt: string
}

export interface LeavePolicyDefinition {
  id: string
  companyId: string
  name: string
  leaveTypeCode: string
  leaveTypeName: string
  annualAllocation: number
  monthlyAccrualEnabled: boolean
  monthlyAccrualDays: number
  carryForwardEnabled: boolean
  carryForwardLimit: number
  minimumNoticeDays: number
  maximumConsecutiveDays: number
  requiresApproval: boolean
  requiresDocument: boolean
  halfDayAllowed: boolean
  assignment: 'all' | 'department' | 'employee'
  assignmentTargetId?: string
  status: EntityStatus
  createdAt: string
  updatedAt: string
}

export interface AttendanceModuleSettings extends AttendanceSettings {
  method: AttendanceMethod
  defaultScheduleId?: string
  lateThresholdMinutes: number
  autoAbsentEnabled: boolean
  overtimeEnabled: boolean
  minimumOvertimeMinutes: number
}

export interface PayrollModuleSettings {
  frequency: PayrollFrequency
  periodStartDay: number
  periodEndDay: number
  currencyCode: string
  workingDaysBasis: 'calendar' | 'schedule'
  rounding: PayrollRounding
  overtimeEnabled: boolean
  taxEnabled: boolean
  deductionsEnabled: boolean
  employerContributionsEnabled: boolean
  /** Existing payroll engine settings mirrored for convenience. */
  lopBasis: 'basic' | 'gross'
  halfDayValue: number
  lateDeductionEnabled: boolean
  standardWorkingHoursPerDay: number
  overtimeMultiplier: number
  pfEmployeePercent: number
  pfEmployerPercent: number
  pfWageCap: number
  esiEmployeePercent: number
  esiEmployerPercent: number
  esiWageThreshold: number
  professionalTaxFixed: number
  allowMixedCurrencies: boolean
}

export interface PayslipModuleSettings {
  numberPrefix: string
  title: string
  showCompanyHeader: boolean
  showEmployeeId: boolean
  showBankLastDigits: boolean
  showEarnings: boolean
  showDeductions: boolean
  showNetSalary: boolean
  showEmployerContribution: boolean
  showEmployerCostToEmployee: boolean
  showBankDetails: boolean
  footerText: string
  authorizedSignatoryName: string
  authorizedSignatoryDesignation: string
  dateFormat: string
  currencyDisplay: 'symbol' | 'code'
  showZeroAmountComponents: boolean
}

export interface LocalizationSettings {
  language: string
  currencyCode: string
  currencyLocale: string
  dateFormat: string
  timeFormat: TimeFormat
  timezone: string
  firstDayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6
}

export interface BrandingSettings {
  logoUrl?: string
  faviconUrl?: string
  loginLogoUrl?: string
  dashboardLogoUrl?: string
  emailLogoUrl?: string
  primaryColor: string
  secondaryColor: string
}

export interface NotificationModuleSettings {
  inAppEnabled: boolean
  leaveNotifications: boolean
  attendanceNotifications: boolean
  payrollNotifications: boolean
  payslipNotifications: boolean
  workflowNotifications: boolean
  mandatorySystemNotifications: boolean
}

export interface WorkflowModuleSettings {
  leaveApproverMode: ApproverMode
  leaveApproverUserId?: string
  attendanceApproverMode: ApproverMode
  attendanceApproverUserId?: string
  profileApproverMode: ApproverMode
  profileApproverUserId?: string
  payrollApproverMode: ApproverMode
  payrollApproverUserId?: string
  fallbackToHr: boolean
}

export interface LeaveGlobalSettings extends LeavePolicyConfig {}

export interface SystemSettings {
  company: CompanySettings
  localization: LocalizationSettings
  branding: BrandingSettings
  attendance: AttendanceModuleSettings
  leave: LeaveGlobalSettings
  leavePolicies: LeavePolicyDefinition[]
  locations: CompanyLocation[]
  workSchedules: WorkSchedule[]
  holidays: CompanyHoliday[]
  payroll: PayrollModuleSettings
  payslip: PayslipModuleSettings
  notifications: NotificationModuleSettings
  workflow: WorkflowModuleSettings
}

export interface SettingsHistoryEntry {
  id: string
  settingCategory: SettingsCategory
  changedBy: string
  changedByName: string
  changedAt: string
  previousValue: string
  newValue: string
  summary: string
}

export interface SettingsNavItem {
  id: string
  label: string
  description: string
  path: string
  icon: string
  group: 'organization' | 'hr' | 'payroll' | 'system'
  permission: PermissionName | PermissionName[]
  summaryKey?: keyof SystemSettings | 'departments' | 'designations'
}
