/** Sidebar section labels for admin navigation grouping. */
export const NAVIGATION_GROUP_LABELS = {
  main: 'Main',
  people: 'People',
  payroll: 'Payroll',
  management: 'Management',
  system: 'System',
  account: 'Account',
} as const

export type NavigationGroupId = keyof typeof NAVIGATION_GROUP_LABELS

export const NAVIGATION_GROUP_ORDER: NavigationGroupId[] = [
  'main',
  'people',
  'payroll',
  'management',
  'system',
  'account',
]
