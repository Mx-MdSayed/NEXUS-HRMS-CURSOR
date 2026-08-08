import { DEFAULT_PAGE_SIZE } from '@/constants/app'
import { ROLES } from '@/constants/roles'
import { DEV_AUTH_ACCOUNTS } from '@/services/auth/devAuthConfig'
import {
  getDepartmentByIdSync,
  getDepartmentNameById,
  getDesignationByIdSync,
  getDesignationNameById,
  listActiveDepartmentOptions,
  listActiveDesignationOptions,
} from '@/features/organization/data/orgDb'
import type { DepartmentOption, DesignationOption } from '@/features/organization/types'
import { buildFullName } from '../utils/format'
import { initialEmployees } from '../data/mockEmployees'
import type {
  Employee,
  EmployeeDocument,
  EmployeeFormValues,
  EmployeeListItem,
  EmployeeListQuery,
  PaginatedEmployees,
} from '../types'
import {
  ALLOWED_DOCUMENT_EXTENSIONS,
  ALLOWED_DOCUMENT_TYPES,
  MAX_DOCUMENT_SIZE_BYTES,
} from '../constants'

let employeesDb: Employee[] = structuredClone(initialEmployees)

function delay(ms = 350): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

export class EmployeeServiceError extends Error {
  code: 'NOT_FOUND' | 'VALIDATION' | 'CONFLICT' | 'UNAUTHORIZED' | 'UNEXPECTED'

  constructor(code: EmployeeServiceError['code'], message: string) {
    super(message)
    this.name = 'EmployeeServiceError'
    this.code = code
  }
}

export function isProtectedSuperAdminEmployee(employee: {
  email: string
  employeeCode: string
}): boolean {
  return DEV_AUTH_ACCOUNTS.some(
    (account) =>
      account.role === ROLES.SUPER_ADMIN &&
      (account.email.toLowerCase() === employee.email.toLowerCase() ||
        account.employeeId === employee.employeeCode),
  )
}

function assertCanManageTarget(employee: Employee, actorRole?: string) {
  if (actorRole === ROLES.HR_ADMIN && isProtectedSuperAdminEmployee(employee)) {
    throw new EmployeeServiceError(
      'UNAUTHORIZED',
      'HR Admin cannot manage Super Admin employee records.',
    )
  }
}

function getDepartmentName(departmentId: string): string {
  return getDepartmentNameById(departmentId)
}

function getDesignationName(designationId: string): string {
  return getDesignationNameById(designationId)
}

function toListItem(employee: Employee): EmployeeListItem {
  return {
    id: employee.id,
    employeeCode: employee.employeeCode,
    fullName: employee.fullName,
    email: employee.email,
    phone: employee.phone,
    profilePhoto: employee.profilePhoto,
    departmentId: employee.departmentId,
    departmentName: getDepartmentName(employee.departmentId),
    designationId: employee.designationId,
    designationName: getDesignationName(employee.designationId),
    employmentType: employee.employmentType,
    employmentStatus: employee.employmentStatus,
    joiningDate: employee.joiningDate,
  }
}

function matchesSearch(employee: Employee, search?: string): boolean {
  if (!search?.trim()) return true
  const q = search.trim().toLowerCase()
  return (
    employee.fullName.toLowerCase().includes(q) ||
    employee.employeeCode.toLowerCase().includes(q) ||
    employee.email.toLowerCase().includes(q) ||
    employee.phone.toLowerCase().includes(q)
  )
}

function formToEmployee(
  values: EmployeeFormValues,
  existing?: Employee,
  actorName = 'System',
): Employee {
  const now = new Date().toISOString()
  const fullName = buildFullName(values.firstName, values.middleName, values.lastName)

  const emergencyContacts =
    values.emergencyName && values.emergencyPhone
      ? [
          {
            id: existing?.emergencyContacts[0]?.id ?? `ec-${crypto.randomUUID().slice(0, 8)}`,
            name: values.emergencyName,
            relationship: values.emergencyRelationship || 'Other',
            phone: values.emergencyPhone,
            alternatePhone: values.emergencyAlternatePhone || undefined,
            address: values.emergencyAddress || undefined,
          },
        ]
      : existing?.emergencyContacts ?? []

  return {
    id: existing?.id ?? `emp-${crypto.randomUUID().slice(0, 8)}`,
    employeeCode: values.employeeCode.trim().toUpperCase(),
    firstName: values.firstName.trim(),
    middleName: values.middleName?.trim() || undefined,
    lastName: values.lastName.trim(),
    fullName,
    profilePhoto: existing?.profilePhoto,
    email: values.email.trim().toLowerCase(),
    personalEmail: values.personalEmail?.trim().toLowerCase() || undefined,
    phone: values.phone.trim(),
    alternatePhone: values.alternatePhone?.trim() || undefined,
    dateOfBirth: values.dateOfBirth || undefined,
    gender: values.gender || undefined,
    maritalStatus: values.maritalStatus || undefined,
    nationality: values.nationality?.trim() || undefined,
    address: {
      line1: values.addressLine1.trim(),
      line2: values.addressLine2?.trim() || undefined,
      city: values.city.trim(),
      state: values.state.trim(),
      country: values.country.trim(),
      postalCode: values.postalCode.trim(),
    },
    departmentId: values.departmentId,
    designationId: values.designationId,
    reportingManagerId: values.reportingManagerId || undefined,
    joiningDate: values.joiningDate,
    confirmationDate: values.confirmationDate || undefined,
    employmentType: values.employmentType,
    employmentStatus: values.employmentStatus,
    workLocation: values.workLocation?.trim() || undefined,
    shift: values.shift?.trim() || undefined,
    salaryCurrency: values.salaryCurrency || 'INR',
    emergencyContacts,
    kyc: {
      nationalId: values.nationalId?.trim() || undefined,
      taxId: values.taxId?.trim() || undefined,
      passportNumber: values.passportNumber?.trim() || undefined,
      passportExpiry: values.passportExpiry || undefined,
      drivingLicense: values.drivingLicense?.trim() || undefined,
      otherId: values.otherId?.trim() || undefined,
    },
    banking: {
      accountHolderName: values.accountHolderName?.trim() || undefined,
      bankName: values.bankName?.trim() || undefined,
      accountNumber: values.accountNumber?.trim() || undefined,
      ifsc: values.ifsc?.trim() || undefined,
      swift: values.swift?.trim() || undefined,
      branchName: values.branchName?.trim() || undefined,
      accountType: values.accountType || undefined,
    },
    documents: existing?.documents ?? [],
    activity: existing?.activity ?? [
      {
        id: `act-${crypto.randomUUID().slice(0, 8)}`,
        action: 'created',
        description: 'Employee record created',
        actorName,
        createdAt: now,
      },
    ],
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    createdBy: existing?.createdBy ?? actorName,
    updatedBy: actorName,
    isDeleted: existing?.isDeleted ?? false,
    deletedAt: existing?.deletedAt,
    deletedBy: existing?.deletedBy,
  }
}

function validateUniqueness(values: EmployeeFormValues, excludeId?: string): void {
  const code = values.employeeCode.trim().toUpperCase()
  const email = values.email.trim().toLowerCase()

  const duplicateCode = employeesDb.find(
    (item) => !item.isDeleted && item.employeeCode === code && item.id !== excludeId,
  )
  if (duplicateCode) {
    throw new EmployeeServiceError('CONFLICT', 'Employee ID already exists.')
  }

  const duplicateEmail = employeesDb.find(
    (item) => !item.isDeleted && item.email === email && item.id !== excludeId,
  )
  if (duplicateEmail) {
    throw new EmployeeServiceError('CONFLICT', 'Work email already exists.')
  }

  if (values.reportingManagerId && values.reportingManagerId === excludeId) {
    throw new EmployeeServiceError('VALIDATION', 'An employee cannot be their own reporting manager.')
  }

  const department = getDepartmentByIdSync(values.departmentId)
  if (!department || department.status !== 'active') {
    // Allow keeping an existing inactive department assignment during edit.
    const existing = excludeId
      ? employeesDb.find((item) => item.id === excludeId && !item.isDeleted)
      : undefined
    if (!existing || existing.departmentId !== values.departmentId || !department) {
      throw new EmployeeServiceError('VALIDATION', 'Select a valid active department.')
    }
  }

  const designation = getDesignationByIdSync(values.designationId)
  if (!designation) {
    throw new EmployeeServiceError('VALIDATION', 'Select a valid designation.')
  }
  if (designation.departmentId !== values.departmentId) {
    throw new EmployeeServiceError(
      'VALIDATION',
      'Selected designation does not belong to the selected department.',
    )
  }
  if (designation.status !== 'active') {
    const existing = excludeId
      ? employeesDb.find((item) => item.id === excludeId && !item.isDeleted)
      : undefined
    if (!existing || existing.designationId !== values.designationId) {
      throw new EmployeeServiceError('VALIDATION', 'Select a valid active designation.')
    }
  }
}

function pushActivity(employee: Employee, action: string, description: string, actorName: string) {
  employee.activity = [
    {
      id: `act-${crypto.randomUUID().slice(0, 8)}`,
      action,
      description,
      actorName,
      createdAt: new Date().toISOString(),
    },
    ...employee.activity,
  ]
}

export const employeeService = {
  async getDepartments(): Promise<DepartmentOption[]> {
    await delay(120)
    return listActiveDepartmentOptions()
  },

  async getDesignations(departmentId?: string): Promise<DesignationOption[]> {
    await delay(120)
    return listActiveDesignationOptions(departmentId)
  },

  async getEmployees(query: EmployeeListQuery = {}): Promise<PaginatedEmployees> {
    await delay()
    const {
      filters = {},
      page = 1,
      pageSize = DEFAULT_PAGE_SIZE,
      sortBy = 'fullName',
      sortDirection = 'asc',
    } = query

    let rows = employeesDb.filter((employee) => {
      if (!filters.includeDeleted && employee.isDeleted) return false
      if (!matchesSearch(employee, filters.search)) return false
      if (filters.departmentId && employee.departmentId !== filters.departmentId) return false
      if (filters.designationId && employee.designationId !== filters.designationId) return false
      if (filters.employmentType && employee.employmentType !== filters.employmentType) return false
      if (filters.employmentStatus && employee.employmentStatus !== filters.employmentStatus) {
        return false
      }
      if (filters.joiningFrom && employee.joiningDate < filters.joiningFrom) return false
      if (filters.joiningTo && employee.joiningDate > filters.joiningTo) return false
      return true
    })

    rows = [...rows].sort((a, b) => {
      const left = String(toListItem(a)[sortBy] ?? '')
      const right = String(toListItem(b)[sortBy] ?? '')
      const compared = left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' })
      return sortDirection === 'asc' ? compared : -compared
    })

    const total = rows.length
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const safePage = Math.min(Math.max(page, 1), totalPages)
    const start = (safePage - 1) * pageSize
    const data = rows.slice(start, start + pageSize).map(toListItem)

    return { data, total, page: safePage, pageSize, totalPages }
  },

  async getEmployeeById(id: string): Promise<Employee> {
    await delay()
    const employee = employeesDb.find((item) => item.id === id && !item.isDeleted)
    if (!employee) {
      throw new EmployeeServiceError('NOT_FOUND', 'Employee not found.')
    }
    return structuredClone(employee)
  },

  async getEmployeeByEmail(email: string): Promise<Employee | null> {
    await delay(150)
    const employee = employeesDb.find(
      (item) => !item.isDeleted && item.email.toLowerCase() === email.toLowerCase(),
    )
    return employee ? structuredClone(employee) : null
  },

  async createEmployee(values: EmployeeFormValues, actorName = 'System'): Promise<Employee> {
    await delay()
    validateUniqueness(values)
    const employee = formToEmployee(values, undefined, actorName)
    employeesDb = [employee, ...employeesDb]
    return structuredClone(employee)
  },

  async updateEmployee(
    id: string,
    values: EmployeeFormValues,
    actorName = 'System',
    actorRole?: string,
  ): Promise<Employee> {
    await delay()
    const index = employeesDb.findIndex((item) => item.id === id && !item.isDeleted)
    if (index < 0) throw new EmployeeServiceError('NOT_FOUND', 'Employee not found.')

    const existing = employeesDb[index]
    assertCanManageTarget(existing, actorRole)
    validateUniqueness(values, id)
    if (values.reportingManagerId === id) {
      throw new EmployeeServiceError('VALIDATION', 'An employee cannot be their own reporting manager.')
    }

    const updated = formToEmployee(values, existing, actorName)
    pushActivity(updated, 'updated', 'Employee profile updated', actorName)
    employeesDb[index] = updated
    return structuredClone(updated)
  },

  async softDeleteEmployee(id: string, actorName = 'System', actorRole?: string): Promise<void> {
    await delay()
    const employee = employeesDb.find((item) => item.id === id && !item.isDeleted)
    if (!employee) throw new EmployeeServiceError('NOT_FOUND', 'Employee not found.')
    assertCanManageTarget(employee, actorRole)
    employee.isDeleted = true
    employee.deletedAt = new Date().toISOString()
    employee.deletedBy = actorName
    employee.updatedAt = employee.deletedAt
    employee.updatedBy = actorName
    pushActivity(employee, 'deleted', 'Employee soft deleted', actorName)
  },

  /** Soft-delete alias used by list/profile actions. */
  async deleteEmployee(id: string, actorName = 'System', actorRole?: string): Promise<void> {
    return this.softDeleteEmployee(id, actorName, actorRole)
  },

  async updateOwnPersonalInfo(
    id: string,
    values: {
      personalEmail?: string
      phone: string
      alternatePhone?: string
      addressLine1: string
      addressLine2?: string
      city: string
      state: string
      country: string
      postalCode: string
      emergencyName?: string
      emergencyRelationship?: string
      emergencyPhone?: string
      emergencyAlternatePhone?: string
      emergencyAddress?: string
    },
    actorName = 'System',
  ): Promise<Employee> {
    await delay()
    const index = employeesDb.findIndex((item) => item.id === id && !item.isDeleted)
    if (index < 0) throw new EmployeeServiceError('NOT_FOUND', 'Employee not found.')

    const existing = employeesDb[index]
    const emergencyContacts =
      values.emergencyName && values.emergencyPhone
        ? [
            {
              id: existing.emergencyContacts[0]?.id ?? `ec-${crypto.randomUUID().slice(0, 8)}`,
              name: values.emergencyName,
              relationship: values.emergencyRelationship || 'Other',
              phone: values.emergencyPhone,
              alternatePhone: values.emergencyAlternatePhone || undefined,
              address: values.emergencyAddress || undefined,
            },
          ]
        : existing.emergencyContacts

    const updated: Employee = {
      ...existing,
      personalEmail: values.personalEmail?.trim().toLowerCase() || undefined,
      phone: values.phone.trim(),
      alternatePhone: values.alternatePhone?.trim() || undefined,
      address: {
        line1: values.addressLine1.trim(),
        line2: values.addressLine2?.trim() || undefined,
        city: values.city.trim(),
        state: values.state.trim(),
        country: values.country.trim(),
        postalCode: values.postalCode.trim(),
      },
      emergencyContacts,
      updatedAt: new Date().toISOString(),
      updatedBy: actorName,
    }
    pushActivity(updated, 'updated', 'Personal profile details updated', actorName)
    employeesDb[index] = updated
    return structuredClone(updated)
  },

  async activateEmployee(id: string, actorName = 'System', actorRole?: string): Promise<Employee> {
    await delay()
    const employee = employeesDb.find((item) => item.id === id && !item.isDeleted)
    if (!employee) throw new EmployeeServiceError('NOT_FOUND', 'Employee not found.')
    assertCanManageTarget(employee, actorRole)
    employee.employmentStatus = 'active'
    employee.updatedAt = new Date().toISOString()
    employee.updatedBy = actorName
    pushActivity(employee, 'status_changed', 'Employee activated', actorName)
    return structuredClone(employee)
  },

  async deactivateEmployee(id: string, actorName = 'System', actorRole?: string): Promise<Employee> {
    await delay()
    const employee = employeesDb.find((item) => item.id === id && !item.isDeleted)
    if (!employee) throw new EmployeeServiceError('NOT_FOUND', 'Employee not found.')
    assertCanManageTarget(employee, actorRole)
    employee.employmentStatus = 'inactive'
    employee.updatedAt = new Date().toISOString()
    employee.updatedBy = actorName
    pushActivity(employee, 'status_changed', 'Employee deactivated', actorName)
    return structuredClone(employee)
  },

  async getEmployeeDocuments(id: string): Promise<EmployeeDocument[]> {
    const employee = await this.getEmployeeById(id)
    return employee.documents
  },

  async addEmployeeDocument(
    id: string,
    file: File,
    category: EmployeeDocument['category'],
    actorName = 'System',
  ): Promise<EmployeeDocument> {
    await delay(500)
    const employee = employeesDb.find((item) => item.id === id && !item.isDeleted)
    if (!employee) throw new EmployeeServiceError('NOT_FOUND', 'Employee not found.')

    const extension = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}`
    if (
      !ALLOWED_DOCUMENT_TYPES.includes(file.type) &&
      !ALLOWED_DOCUMENT_EXTENSIONS.includes(extension)
    ) {
      throw new EmployeeServiceError(
        'VALIDATION',
        'Invalid document type. Allowed: PDF, JPG, PNG, DOC, DOCX.',
      )
    }

    if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
      throw new EmployeeServiceError('VALIDATION', 'Document exceeds the 5 MB size limit.')
    }

    const document: EmployeeDocument = {
      id: `doc-${crypto.randomUUID().slice(0, 8)}`,
      name: file.name,
      category,
      fileType: file.type || extension,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
      uploadedBy: actorName,
      status: 'uploaded',
      url: URL.createObjectURL(file),
    }

    employee.documents = [document, ...employee.documents]
    employee.updatedAt = new Date().toISOString()
    employee.updatedBy = actorName
    pushActivity(employee, 'document_uploaded', `${file.name} uploaded`, actorName)
    return structuredClone(document)
  },

  async deleteEmployeeDocument(id: string, documentId: string, actorName = 'System'): Promise<void> {
    await delay()
    const employee = employeesDb.find((item) => item.id === id && !item.isDeleted)
    if (!employee) throw new EmployeeServiceError('NOT_FOUND', 'Employee not found.')
    const doc = employee.documents.find((item) => item.id === documentId)
    if (!doc) throw new EmployeeServiceError('NOT_FOUND', 'Document not found.')
    employee.documents = employee.documents.filter((item) => item.id !== documentId)
    employee.updatedAt = new Date().toISOString()
    employee.updatedBy = actorName
    pushActivity(employee, 'document_deleted', `${doc.name} deleted`, actorName)
  },

  employeeToFormValues(employee: Employee): EmployeeFormValues {
    const emergency = employee.emergencyContacts[0]
    return {
      employeeCode: employee.employeeCode,
      firstName: employee.firstName,
      middleName: employee.middleName ?? '',
      lastName: employee.lastName,
      email: employee.email,
      personalEmail: employee.personalEmail ?? '',
      phone: employee.phone,
      alternatePhone: employee.alternatePhone ?? '',
      dateOfBirth: employee.dateOfBirth ?? '',
      gender: employee.gender ?? '',
      maritalStatus: employee.maritalStatus ?? '',
      nationality: employee.nationality ?? '',
      addressLine1: employee.address.line1,
      addressLine2: employee.address.line2 ?? '',
      city: employee.address.city,
      state: employee.address.state,
      country: employee.address.country,
      postalCode: employee.address.postalCode,
      departmentId: employee.departmentId,
      designationId: employee.designationId,
      reportingManagerId: employee.reportingManagerId ?? '',
      joiningDate: employee.joiningDate,
      confirmationDate: employee.confirmationDate ?? '',
      employmentType: employee.employmentType,
      employmentStatus: employee.employmentStatus,
      workLocation: employee.workLocation ?? '',
      shift: employee.shift ?? '',
      salaryCurrency: employee.salaryCurrency,
      emergencyName: emergency?.name ?? '',
      emergencyRelationship: emergency?.relationship ?? '',
      emergencyPhone: emergency?.phone ?? '',
      emergencyAlternatePhone: emergency?.alternatePhone ?? '',
      emergencyAddress: emergency?.address ?? '',
      nationalId: employee.kyc.nationalId ?? '',
      taxId: employee.kyc.taxId ?? '',
      passportNumber: employee.kyc.passportNumber ?? '',
      passportExpiry: employee.kyc.passportExpiry ?? '',
      drivingLicense: employee.kyc.drivingLicense ?? '',
      otherId: employee.kyc.otherId ?? '',
      accountHolderName: employee.banking.accountHolderName ?? '',
      bankName: employee.banking.bankName ?? '',
      accountNumber: employee.banking.accountNumber ?? '',
      ifsc: employee.banking.ifsc ?? '',
      swift: employee.banking.swift ?? '',
      branchName: employee.banking.branchName ?? '',
      accountType: employee.banking.accountType ?? '',
    }
  },
}

export type EmployeeService = typeof employeeService
