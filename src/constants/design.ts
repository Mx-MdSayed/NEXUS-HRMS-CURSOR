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
  /** Standard control radius — inputs, buttons, badges */
  control: 'var(--hrms-radius-md)',
  /** Cards and panels */
  panel: 'var(--hrms-radius-lg)',
} as const

export const shadowTokens = {
  none: 'none',
  sm: 'var(--hrms-shadow-sm)',
  md: 'var(--hrms-shadow-md)',
  lg: 'var(--hrms-shadow-lg)',
} as const

/** Spacing scale in pixels — align with Tailwind spacing utilities. */
export const spacingScale = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  page: 24,
  section: 24,
  card: 20,
  form: 16,
} as const

export const typographyScale = {
  pageTitle: 'text-page-title',
  sectionTitle: 'text-section-title',
  cardTitle: 'text-card-title',
  body: 'text-body',
  small: 'text-small',
  label: 'text-label',
  helper: 'text-helper',
} as const
