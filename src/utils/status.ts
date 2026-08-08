import { EMPLOYMENT_STATUS_LABELS, ROLE_LABELS } from '@/constants'
import type { EmploymentStatus, RoleName } from '@/types'

export function formatEmploymentStatus(status: EmploymentStatus): string {
  return EMPLOYMENT_STATUS_LABELS[status]
}

export function formatRole(role: RoleName): string {
  return ROLE_LABELS[role]
}

export function toTitleCase(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}
