export { SettingsLayout } from './components/SettingsLayout'
export { SettingsDashboardPage } from './pages/SettingsDashboardPage'
export { CompanySettingsPage } from './pages/CompanySettingsPage'
export { OrganizationSettingsPage } from './pages/OrganizationSettingsPage'
export { SettingsDepartmentsPage } from './pages/SettingsDepartmentsPage'
export { SettingsDesignationsPage } from './pages/SettingsDesignationsPage'
export { LocationsSettingsPage } from './pages/LocationsSettingsPage'
export { WorkSchedulesSettingsPage } from './pages/WorkSchedulesSettingsPage'
export { HolidaysSettingsPage } from './pages/HolidaysSettingsPage'
export { LeavePoliciesSettingsPage } from './pages/LeavePoliciesSettingsPage'
export { AttendanceSettingsPage } from './pages/AttendanceSettingsPage'
export { PayrollSettingsConfigPage } from './pages/PayrollSettingsConfigPage'
export { PayslipSettingsConfigPage } from './pages/PayslipSettingsConfigPage'
export { LocalizationSettingsPage } from './pages/LocalizationSettingsPage'
export { NotificationSettingsPage } from './pages/NotificationSettingsPage'
export { WorkflowSettingsPage } from './pages/WorkflowSettingsPage'
export { BrandingSettingsPage } from './pages/BrandingSettingsPage'
export { SettingsAuditPage } from './pages/SettingsAuditPage'

export type {
  AttendanceModuleSettings,
  BrandingSettings,
  CompanyHoliday,
  CompanyLocation,
  EntityStatus,
  HolidayType,
  LeavePolicyDefinition,
  LocalizationSettings,
  NotificationModuleSettings,
  PayslipModuleSettings,
  PayrollModuleSettings,
  SettingsCategory,
  SettingsHistoryEntry,
  SettingsNavItem,
  SystemSettings,
  Weekday,
  WorkSchedule,
  WorkflowModuleSettings,
} from './types'

export { settingsService } from './services/settingsService'
export { SETTINGS_NAV, canAccessSettingsNav } from './utils/nav'
