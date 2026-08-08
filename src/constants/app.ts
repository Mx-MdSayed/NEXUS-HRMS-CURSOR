export const APP_NAME = 'Nexus HRMS'
export const APP_SHORT_NAME = 'Nexus'
export const APP_TAGLINE = 'Human Resource Management System'
export const APP_VERSION = '0.1.0'

export const THEME_STORAGE_KEY = 'nexus-hrms-theme'
export const SIDEBAR_STORAGE_KEY = 'nexus-hrms-sidebar-collapsed'
export const AUTH_SESSION_STORAGE_KEY = 'nexus-hrms-auth-session'
export const AUTH_REMEMBER_EMAIL_KEY = 'nexus-hrms-remember-email'

export const DEFAULT_PAGE_SIZE = 10
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const

export const TOAST_AUTO_CLOSE_MS = 3500

/** Session lifetime in milliseconds. */
export const AUTH_SESSION_TTL_MS = 1000 * 60 * 60 * 8
export const AUTH_SESSION_TTL_REMEMBER_MS = 1000 * 60 * 60 * 24 * 14

export const MIN_PASSWORD_LENGTH = 8
