import { DEFAULT_PAGE_SIZE } from '@/constants/app'
import { employeeService } from '@/features/employees/services/employeeService'
import type { EmployeeListItem } from '@/features/employees/types'
import {
  departmentsDb,
  getDepartmentByIdSync,
  listDepartmentLocations,
  prependDepartment,
} from '../data/orgDb'
import type {
  Department,
  DepartmentFilters,
  DepartmentFormValues,
  DepartmentListItem,
  DepartmentOption,
} from '../types'
import { DepartmentServiceError } from './errors'

function delay(ms = 320): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

async function countActiveEmployees(departmentId: string): Promise<number> {
  const result = await employeeService.getEmployees({
    filters: { departmentId, employmentStatus: 'active' },
    page: 1,
    pageSize: 1,
  })
  return result.total
}

async function toListItem(department: Department): Promise<DepartmentListItem> {
  let headEmployeeName: string | undefined
  if (department.headEmployeeId) {
    try {
      const head = await employeeService.getEmployeeById(department.headEmployeeId)
      headEmployeeName = head.fullName
    } catch {
      headEmployeeName = undefined
    }
  }

  const employeeCount = await countActiveEmployees(department.id)

  return {
    ...structuredClone(department),
    headEmployeeName,
    employeeCount,
  }
}

function matchesSearch(department: Department, headName: string | undefined, search?: string) {
  if (!search?.trim()) return true
  const q = search.trim().toLowerCase()
  return (
    department.name.toLowerCase().includes(q) ||
    department.code.toLowerCase().includes(q) ||
    (department.location ?? '').toLowerCase().includes(q) ||
    (headName ?? '').toLowerCase().includes(q)
  )
}

function assertUniqueCode(code: string, excludeId?: string) {
  const normalized = code.trim().toUpperCase()
  const duplicate = departmentsDb.find(
    (item) =>
      !item.isDeleted &&
      item.status === 'active' &&
      item.code.toUpperCase() === normalized &&
      item.id !== excludeId,
  )
  if (duplicate) {
    throw new DepartmentServiceError('CONFLICT', 'Department code already exists.')
  }
}

function formToDepartment(
  values: DepartmentFormValues,
  existing?: Department,
  actorName = 'System',
): Department {
  const now = new Date().toISOString()
  return {
    id: existing?.id ?? `dept-${crypto.randomUUID().slice(0, 8)}`,
    code: values.code.trim().toUpperCase(),
    name: values.name.trim(),
    description: values.description?.trim() || undefined,
    headEmployeeId: values.headEmployeeId || undefined,
    location: values.location?.trim() || undefined,
    email: values.email?.trim().toLowerCase() || undefined,
    phone: values.phone?.trim() || undefined,
    status: values.status,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    createdBy: existing?.createdBy ?? actorName,
    updatedBy: actorName,
    isDeleted: existing?.isDeleted ?? false,
    deletedAt: existing?.deletedAt,
    deletedBy: existing?.deletedBy,
  }
}

export const departmentService = {
  async getDepartments(
    filters: DepartmentFilters = {},
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
  ): Promise<{ data: DepartmentListItem[]; total: number; page: number; pageSize: number; totalPages: number }> {
    await delay()
    const enriched = await Promise.all(
      departmentsDb
        .filter((item) => !item.isDeleted)
        .map(async (item) => toListItem(item)),
    )

    let rows = enriched.filter((item) => {
      if (filters.status && item.status !== filters.status) return false
      if (filters.location && item.location !== filters.location) return false
      if (!matchesSearch(item, item.headEmployeeName, filters.search)) return false
      return true
    })

    rows = rows.sort((a, b) => a.name.localeCompare(b.name))
    const total = rows.length
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const safePage = Math.min(Math.max(page, 1), totalPages)
    const start = (safePage - 1) * pageSize

    return {
      data: rows.slice(start, start + pageSize),
      total,
      page: safePage,
      pageSize,
      totalPages,
    }
  },

  async getDepartmentById(id: string): Promise<DepartmentListItem> {
    await delay()
    const department = getDepartmentByIdSync(id)
    if (!department) throw new DepartmentServiceError('NOT_FOUND', 'Department not found.')
    return toListItem(department)
  },

  async getDepartmentOptions(): Promise<DepartmentOption[]> {
    await delay(120)
    return departmentsDb
      .filter((item) => !item.isDeleted)
      .map((item) => ({
        id: item.id,
        name: item.name,
        code: item.code,
        isActive: item.status === 'active',
      }))
  },

  async getLocations(): Promise<string[]> {
    await delay(80)
    return listDepartmentLocations()
  },

  async createDepartment(values: DepartmentFormValues, actorName = 'System'): Promise<Department> {
    await delay()
    if (!values.name.trim()) throw new DepartmentServiceError('VALIDATION', 'Department name is required.')
    if (!values.code.trim()) throw new DepartmentServiceError('VALIDATION', 'Department code is required.')
    assertUniqueCode(values.code)
    const department = formToDepartment(values, undefined, actorName)
    prependDepartment(department)
    return structuredClone(department)
  },

  async updateDepartment(
    id: string,
    values: DepartmentFormValues,
    actorName = 'System',
  ): Promise<Department> {
    await delay()
    const index = departmentsDb.findIndex((item) => item.id === id && !item.isDeleted)
    if (index < 0) throw new DepartmentServiceError('NOT_FOUND', 'Department not found.')
    if (!values.name.trim()) throw new DepartmentServiceError('VALIDATION', 'Department name is required.')
    if (!values.code.trim()) throw new DepartmentServiceError('VALIDATION', 'Department code is required.')
    assertUniqueCode(values.code, id)
    const updated = formToDepartment(values, departmentsDb[index], actorName)
    departmentsDb[index] = updated
    return structuredClone(updated)
  },

  async deleteDepartment(id: string, actorName = 'System'): Promise<void> {
    await delay()
    const department = getDepartmentByIdSync(id)
    if (!department) throw new DepartmentServiceError('NOT_FOUND', 'Department not found.')

    const activeCount = await countActiveEmployees(id)
    if (activeCount > 0) {
      throw new DepartmentServiceError(
        'VALIDATION',
        'This department has active employees. Reassign employees before deactivating or deleting the department.',
      )
    }

    department.isDeleted = true
    department.deletedAt = new Date().toISOString()
    department.deletedBy = actorName
    department.updatedAt = department.deletedAt
    department.updatedBy = actorName
  },

  async activateDepartment(id: string, actorName = 'System'): Promise<Department> {
    await delay()
    const department = getDepartmentByIdSync(id)
    if (!department) throw new DepartmentServiceError('NOT_FOUND', 'Department not found.')
    assertUniqueCode(department.code, id)
    department.status = 'active'
    department.updatedAt = new Date().toISOString()
    department.updatedBy = actorName
    return structuredClone(department)
  },

  async deactivateDepartment(id: string, actorName = 'System'): Promise<Department> {
    await delay()
    const department = getDepartmentByIdSync(id)
    if (!department) throw new DepartmentServiceError('NOT_FOUND', 'Department not found.')

    const activeCount = await countActiveEmployees(id)
    if (activeCount > 0) {
      throw new DepartmentServiceError(
        'VALIDATION',
        'This department has active employees. Reassign employees before deactivating or deleting the department.',
      )
    }

    department.status = 'inactive'
    department.updatedAt = new Date().toISOString()
    department.updatedBy = actorName
    return structuredClone(department)
  },

  async getDepartmentEmployees(id: string): Promise<EmployeeListItem[]> {
    await delay()
    const department = getDepartmentByIdSync(id)
    if (!department) throw new DepartmentServiceError('NOT_FOUND', 'Department not found.')
    const result = await employeeService.getEmployees({
      filters: { departmentId: id },
      page: 1,
      pageSize: 100,
      sortBy: 'fullName',
    })
    return result.data
  },

  departmentToFormValues(department: Department): DepartmentFormValues {
    return {
      name: department.name,
      code: department.code,
      description: department.description ?? '',
      headEmployeeId: department.headEmployeeId ?? '',
      location: department.location ?? '',
      email: department.email ?? '',
      phone: department.phone ?? '',
      status: department.status,
    }
  },
}

export type DepartmentService = typeof departmentService
