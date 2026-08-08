export type OrgEntityStatus = 'active' | 'inactive'

export type DesignationLevel =
  | 'entry'
  | 'junior'
  | 'mid'
  | 'senior'
  | 'lead'
  | 'manager'
  | 'senior_manager'
  | 'director'

export interface Department {
  id: string
  code: string
  name: string
  description?: string
  headEmployeeId?: string
  location?: string
  email?: string
  phone?: string
  status: OrgEntityStatus
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy: string
  isDeleted: boolean
  deletedAt?: string
  deletedBy?: string
}

export interface Designation {
  id: string
  code: string
  name: string
  description?: string
  departmentId: string
  level: DesignationLevel
  rank: number
  status: OrgEntityStatus
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy: string
  isDeleted: boolean
  deletedAt?: string
  deletedBy?: string
}

export interface DepartmentListItem extends Department {
  headEmployeeName?: string
  employeeCount: number
}

export interface DesignationListItem extends Designation {
  departmentName: string
  employeeCount: number
}

export interface DepartmentFilters {
  search?: string
  status?: OrgEntityStatus | ''
  location?: string
}

export interface DesignationFilters {
  search?: string
  departmentId?: string
  level?: DesignationLevel | ''
  status?: OrgEntityStatus | ''
}

export interface DepartmentFormValues {
  name: string
  code: string
  description?: string
  headEmployeeId?: string
  location?: string
  email?: string
  phone?: string
  status: OrgEntityStatus
}

export interface DesignationFormValues {
  name: string
  code: string
  description?: string
  departmentId: string
  level: DesignationLevel
  status: OrgEntityStatus
}

/** Lightweight option shape used by Employee forms and filters. */
export interface DepartmentOption {
  id: string
  name: string
  code: string
  isActive: boolean
}

export interface DesignationOption {
  id: string
  name: string
  code?: string
  departmentId?: string
  isActive: boolean
}
