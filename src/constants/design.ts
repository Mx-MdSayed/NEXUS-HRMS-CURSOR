/** Centralized design token names for documentation and typed usage. */

export const colorTokens = {
  primary: 'var(--hrms-primary)',
  primaryHover: 'var(--hrms-primary-hover)',
  secondary: 'var(--hrms-secondary)',
  background: 'var(--hrms-bg)',
  surface: 'var(--hrms-surface)',
  card: 'var(--hrms-card)',
  border: 'var(--hrms-border)',
  textPrimary: 'var(--hrms-text)',
  textSecondary: 'var(--hrms-text-secondary)',
  muted: 'var(--hrms-muted)',
  success: 'var(--hrms-success)',
  warning: 'var(--hrms-warning)',
  danger: 'var(--hrms-danger)',
  info: 'var(--hrms-info)',
} as const

export const radiusTokens = {
  sm: 'var(--hrms-radius-sm)',
  md: 'var(--hrms-radius-md)',
  lg: 'var(--hrms-radius-lg)',
} as const

export const shadowTokens = {
  sm: 'var(--hrms-shadow-sm)',
  md: 'var(--hrms-shadow-md)',
  lg: 'var(--hrms-shadow-lg)',
} as const

export const spacingScale = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
} as const
