import type { DesignationLevel, OrgEntityStatus } from './types'

export const ORG_STATUS_OPTIONS: Array<{ value: OrgEntityStatus; label: string }> = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

export const DESIGNATION_LEVEL_LABELS: Record<DesignationLevel, string> = {
  entry: 'Entry',
  junior: 'Junior',
  mid: 'Mid',
  senior: 'Senior',
  lead: 'Lead',
  manager: 'Manager',
  senior_manager: 'Senior Manager',
  director: 'Director',
}

export const DESIGNATION_LEVEL_OPTIONS = (
  Object.entries(DESIGNATION_LEVEL_LABELS) as Array<[DesignationLevel, string]>
).map(([value, label]) => ({ value, label }))

export const DESIGNATION_LEVEL_RANK: Record<DesignationLevel, number> = {
  entry: 10,
  junior: 20,
  mid: 30,
  senior: 40,
  lead: 50,
  manager: 60,
  senior_manager: 70,
  director: 80,
}
