import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns'
import { companyDefaults } from '@/config'

function toDate(value: Date | string | number): Date | null {
  if (value instanceof Date) return isValid(value) ? value : null
  if (typeof value === 'number') {
    const date = new Date(value)
    return isValid(date) ? date : null
  }
  const parsed = parseISO(value)
  return isValid(parsed) ? parsed : null
}

export function formatDate(
  value: Date | string | number,
  pattern: string = companyDefaults.dateFormat,
): string {
  const date = toDate(value)
  if (!date) return '—'
  return format(date, pattern)
}

export function formatRelativeDate(value: Date | string | number): string {
  const date = toDate(value)
  if (!date) return '—'
  return formatDistanceToNow(date, { addSuffix: true })
}

export function formatDateTime(value: Date | string | number): string {
  return formatDate(value, "dd MMM yyyy, hh:mm a")
}
