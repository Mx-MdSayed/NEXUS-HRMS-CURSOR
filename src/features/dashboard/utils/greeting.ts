import { format, getHours } from 'date-fns'

export function getGreeting(date = new Date()): string {
  const hour = getHours(date)
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function formatDashboardDate(date = new Date()): string {
  return format(date, 'EEEE, dd MMM yyyy')
}

export function formatTimeLabel(value?: string): string {
  if (!value) return '—'
  return value
}
