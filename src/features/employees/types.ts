import type { EmploymentStatus } from '@/types'
import type { DepartmentOption, DesignationOption } from '@/features/organization/types'

export type { DepartmentOption, DesignationOption }

export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'intern' | 'temporary'
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say'
export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed' | 'other'
export type AccountType = 'savings' | 'current' | 'salary'
export type DocumentCategory =
  | 'resume'
  | 'id_proof'
  | 'address_proof'
  | 'education'
  | 'experience'
  | 'joining_letter'
  | 'other'
export type DocumentStatus = 'uploaded' | 'verified' | 'rejected'

export interface EmployeeAddress {
  line1: string
  line2?: string
  city: string
  state: string
  country: string
  postalCode: string
}

export interface EmergencyContact {
  id: string
  name: string
  relationship: string
  phone: string
  alternatePhone?: string
  address?: string
}

export interface EmployeeKyc {
  nationalId?: string
  taxId?: string
  passportNumber?: string
  passportExpiry?: string
  drivingLicense?: string
  otherId?: string
}

export interface EmployeeBanking {
  accountHolderName?: string
  bankName?: string
  accountNumber?: string
  ifsc?: string
  swift?: string
  branchName?: string
  accountType?: AccountType
}

export interface EmployeeDocument {
  id: string
  name: string
  category: DocumentCategory
  fileType: string
  fileSize: number
  uploadedAt: string
  uploadedBy: string
  status: DocumentStatus
  url?: string
}

export interface EmployeeActivity {
  id: string
  action: string
  description: string
  actorName: string
  createdAt: string
}

export interface Employee {
  id: string
  employeeCode: string
  firstName: string
  middleName?: string
  lastName: string
  fullName: string
  profilePhoto?: string
  email: string
  personalEmail?: string
  phone: string
  alternatePhone?: string
  dateOfBirth?: string
  gender?: Gender
  maritalStatus?: MaritalStatus
  nationality?: string
  address: EmployeeAddress
  departmentId: string
  designationId: string
  reportingManagerId?: string
  joiningDate: string
  confirmationDate?: string
  employmentType: EmploymentType
  employmentStatus: EmploymentStatus
  workLocation?: string
  shift?: string
  salaryCurrency: string
  emergencyContacts: EmergencyContact[]
  kyc: EmployeeKyc
  banking: EmployeeBanking
  documents: EmployeeDocument[]
  activity: EmployeeActivity[]
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy: string
  isDeleted: boolean
  deletedAt?: string
  deletedBy?: string
}

export interface EmployeeListItem {
  id: string
  employeeCode: string
  fullName: string
  email: string
  phone: string
  profilePhoto?: string
  departmentId: string
  departmentName: string
  designationId: string
  designationName: string
  employmentType: EmploymentType
  employmentStatus: EmploymentStatus
  joiningDate: string
}

export interface EmployeeFilters {
  search?: string
  departmentId?: string
  designationId?: string
  employmentType?: EmploymentType | ''
  employmentStatus?: EmploymentStatus | ''
  joiningFrom?: string
  joiningTo?: string
  includeDeleted?: boolean
}

export interface EmployeeListQuery {
  filters?: EmployeeFilters
  page?: number
  pageSize?: number
  sortBy?: keyof EmployeeListItem | 'fullName'
  sortDirection?: 'asc' | 'desc'
}

export interface PaginatedEmployees {
  data: EmployeeListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type EmployeeFormValues = {
  employeeCode: string
  firstName: string
  middleName?: string
  lastName: string
  email: string
  personalEmail?: string
  phone: string
  alternatePhone?: string
  dateOfBirth?: string
  gender?: Gender | ''
  maritalStatus?: MaritalStatus | ''
  nationality?: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  country: string
  postalCode: string
  departmentId: string
  designationId: string
  reportingManagerId?: string
  joiningDate: string
  confirmationDate?: string
  employmentType: EmploymentType
  employmentStatus: EmploymentStatus
  workLocation?: string
  shift?: string
  salaryCurrency: string
  emergencyName?: string
  emergencyRelationship?: string
  emergencyPhone?: string
  emergencyAlternatePhone?: string
  emergencyAddress?: string
  nationalId?: string
  taxId?: string
  passportNumber?: string
  passportExpiry?: string
  drivingLicense?: string
  otherId?: string
  accountHolderName?: string
  bankName?: string
  accountNumber?: string
  ifsc?: string
  swift?: string
  branchName?: string
  accountType?: AccountType | ''
}
