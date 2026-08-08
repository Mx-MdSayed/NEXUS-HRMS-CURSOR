import type { EmploymentType, DocumentCategory, Gender, MaritalStatus, AccountType } from './types'
import type { EmploymentStatus } from '@/types'

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  contract: 'Contract',
  intern: 'Intern',
  temporary: 'Temporary',
}

export const EMPLOYMENT_TYPE_OPTIONS = (
  Object.entries(EMPLOYMENT_TYPE_LABELS) as Array<[EmploymentType, string]>
).map(([value, label]) => ({ value, label }))

export const GENDER_OPTIONS: Array<{ value: Gender; label: string }> = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
]

export const MARITAL_STATUS_OPTIONS: Array<{ value: MaritalStatus; label: string }> = [
  { value: 'single', label: 'Single' },
  { value: 'married', label: 'Married' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' },
  { value: 'other', label: 'Other' },
]

export const ACCOUNT_TYPE_OPTIONS: Array<{ value: AccountType; label: string }> = [
  { value: 'savings', label: 'Savings' },
  { value: 'current', label: 'Current' },
  { value: 'salary', label: 'Salary' },
]

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  resume: 'Resume',
  id_proof: 'ID Proof',
  address_proof: 'Address Proof',
  education: 'Education Certificate',
  experience: 'Experience Certificate',
  joining_letter: 'Joining Letter',
  other: 'Other',
}

export const DOCUMENT_CATEGORY_OPTIONS = (
  Object.entries(DOCUMENT_CATEGORY_LABELS) as Array<[DocumentCategory, string]>
).map(([value, label]) => ({ value, label }))

export const EMPLOYMENT_STATUS_OPTIONS: Array<{ value: EmploymentStatus; label: string }> = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'probation', label: 'Probation' },
  { value: 'on_leave', label: 'On Leave' },
  { value: 'terminated', label: 'Terminated' },
]

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

export const ALLOWED_DOCUMENT_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx']
export const MAX_DOCUMENT_SIZE_BYTES = 5 * 1024 * 1024
