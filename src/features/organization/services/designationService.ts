import { DEFAULT_PAGE_SIZE } from '@/constants/app'
import { employeeService } from '@/features/employees/services/employeeService'
import type { EmployeeListItem } from '@/features/employees/types'
import { DESIGNATION_LEVEL_RANK } from '../constants'
import {
  designationsDb,
  getDepartmentByIdSync,
  getDepartmentNameById,
  getDesignationByIdSync,
  prependDesignation,
} from '../data/orgDb'
import type {
  Designation,
  DesignationFilters,
  DesignationFormValues,
  DesignationListItem,
  DesignationOption,
} from '../types'
import { DesignationServiceError } from './errors'

function delay(ms = 320): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

async function countActiveEmployees(designationId: string): Promise<number> {
  const result = await employeeService.getEmployees({
    filters: { designationId, employmentStatus: 'active' },
    page: 1,
    pageSize: 1,
  })
  return result.total
}

async function toListItem(designation: Designation): Promise<DesignationListItem> {
  return {
    ...structuredClone(designation),
    departmentName: getDepartmentNameById(designation.departmentId),
    employeeCount: await countActiveEmployees(designation.id),
  }
}

function matchesSearch(designation: Designation, departmentName: string, search?: string) {
  if (!search?.trim()) return true
  const q = search.trim().toLowerCase()
  return (
    designation.name.toLowerCase().includes(q) ||
    designation.code.toLowerCase().includes(q) ||
    departmentName.toLowerCase().includes(q) ||
    designation.level.toLowerCase().includes(q)
  )
}

function assertUniqueCode(code: string, excludeId?: string) {
  const normalized = code.trim().toUpperCase()
  const duplicate = designationsDb.find(
    (item) => !item.isDeleted && item.code.toUpperCase() === normalized && item.id !== excludeId,
  )
  if (duplicate) {
    throw new DesignationServiceError('CONFLICT', 'Designation code already exists.')
  }
}

function assertUniqueNameInDepartment(name: string, departmentId: string, excludeId?: string) {
  const normalized = name.trim().toLowerCase()
  const duplicate = designationsDb.find(
    (item) =>
      !item.isDeleted &&
      item.departmentId === departmentId &&
      item.name.trim().toLowerCase() === normalized &&
      item.id !== excludeId,
  )
  if (duplicate) {
    throw new DesignationServiceError(
      'CONFLICT',
      'Designation name already exists in this department.',
    )
  }
}

function formToDesignation(
  values: DesignationFormValues,
  existing?: Designation,
  actorName = 'System',
): Designation {
  const now = new Date().toISOString()
  return {
    id: existing?.id ?? `des-${crypto.randomUUID().slice(0, 8)}`,
    code: values.code.trim().toUpperCase(),
    name: values.name.trim(),
    description: values.description?.trim() || undefined,
    departmentId: values.departmentId,
    level: values.level,
    rank: DESIGNATION_LEVEL_RANK[values.level],
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

export const designationService = {
  async getDesignations(
    filters: DesignationFilters = {},
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
  ): Promise<{
    data: DesignationListItem[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }> {
    await delay()
    const enriched = await Promise.all(
      designationsDb.filter((item) => !item.isDeleted).map(async (item) => toListItem(item)),
    )

    let rows = enriched.filter((item) => {
      if (filters.departmentId && item.departmentId !== filters.departmentId) return false
      if (filters.level && item.level !== filters.level) return false
      if (filters.status && item.status !== filters.status) return false
      if (!matchesSearch(item, item.departmentName, filters.search)) return false
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

  async getDesignationById(id: string): Promise<DesignationListItem> {
    await delay()
    const designation = getDesignationByIdSync(id)
    if (!designation) throw new DesignationServiceError('NOT_FOUND', 'Designation not found.')
    return toListItem(designation)
  },

  async getDesignationOptions(departmentId?: string): Promise<DesignationOption[]> {
    await delay(120)
    return designationsDb
      .filter((item) => {
        if (item.isDeleted) return false
        if (departmentId && item.departmentId !== departmentId) return false
        return true
      })
      .map((item) => ({
        id: item.id,
        name: item.name,
        code: item.code,
        departmentId: item.departmentId,
        isActive: item.status === 'active',
      }))
  },

  async createDesignation(values: DesignationFormValues, actorName = 'System'): Promise<Designation> {
    await delay()
    if (!values.name.trim()) throw new DesignationServiceError('VALIDATION', 'Designation name is required.')
    if (!values.code.trim()) throw new DesignationServiceError('VALIDATION', 'Designation code is required.')
    if (!values.departmentId) {
      throw new DesignationServiceError('VALIDATION', 'Department is required.')
    }
    if (!getDepartmentByIdSync(values.departmentId)) {
      throw new DesignationServiceError('VALIDATION', 'Selected department is invalid.')
    }
    assertUniqueCode(values.code)
    assertUniqueNameInDepartment(values.name, values.departmentId)
    const designation = formToDesignation(values, undefined, actorName)
    prependDesignation(designation)
    return structuredClone(designation)
  },

  async updateDesignation(
    id: string,
    values: DesignationFormValues,
    actorName = 'System',
  ): Promise<Designation> {
    await delay()
    const index = designationsDb.findIndex((item) => item.id === id && !item.isDeleted)
    if (index < 0) throw new DesignationServiceError('NOT_FOUND', 'Designation not found.')
    if (!values.name.trim()) throw new DesignationServiceError('VALIDATION', 'Designation name is required.')
    if (!values.code.trim()) throw new DesignationServiceError('VALIDATION', 'Designation code is required.')
    if (!values.departmentId) {
      throw new DesignationServiceError('VALIDATION', 'Department is required.')
    }
    if (!getDepartmentByIdSync(values.departmentId)) {
      throw new DesignationServiceError('VALIDATION', 'Selected department is invalid.')
    }
    assertUniqueCode(values.code, id)
    assertUniqueNameInDepartment(values.name, values.departmentId, id)
    const updated = formToDesignation(values, designationsDb[index], actorName)
    designationsDb[index] = updated
    return structuredClone(updated)
  },

  async deleteDesignation(id: string, actorName = 'System'): Promise<void> {
    await delay()
    const designation = getDesignationByIdSync(id)
    if (!designation) throw new DesignationServiceError('NOT_FOUND', 'Designation not found.')

    const activeCount = await countActiveEmployees(id)
    if (activeCount > 0) {
      throw new DesignationServiceError(
        'VALIDATION',
        'This designation is currently assigned to employees.',
      )
    }

    designation.isDeleted = true
    designation.deletedAt = new Date().toISOString()
    designation.deletedBy = actorName
    designation.updatedAt = designation.deletedAt
    designation.updatedBy = actorName
  },

  async activateDesignation(id: string, actorName = 'System'): Promise<Designation> {
    await delay()
    const designation = getDesignationByIdSync(id)
    if (!designation) throw new DesignationServiceError('NOT_FOUND', 'Designation not found.')
    assertUniqueCode(designation.code, id)
    designation.status = 'active'
    designation.updatedAt = new Date().toISOString()
    designation.updatedBy = actorName
    return structuredClone(designation)
  },

  async deactivateDesignation(id: string, actorName = 'System'): Promise<Designation> {
    await delay()
    const designation = getDesignationByIdSync(id)
    if (!designation) throw new DesignationServiceError('NOT_FOUND', 'Designation not found.')

    const activeCount = await countActiveEmployees(id)
    if (activeCount > 0) {
      throw new DesignationServiceError(
        'VALIDATION',
        'This designation is currently assigned to employees.',
      )
    }

    designation.status = 'inactive'
    designation.updatedAt = new Date().toISOString()
    designation.updatedBy = actorName
    return structuredClone(designation)
  },

  async getDesignationEmployees(id: string): Promise<EmployeeListItem[]> {
    await delay()
    const designation = getDesignationByIdSync(id)
    if (!designation) throw new DesignationServiceError('NOT_FOUND', 'Designation not found.')
    const result = await employeeService.getEmployees({
      filters: { designationId: id },
      page: 1,
      pageSize: 100,
      sortBy: 'fullName',
    })
    return result.data
  },

  designationToFormValues(designation: Designation): DesignationFormValues {
    return {
      name: designation.name,
      code: designation.code,
      description: designation.description ?? '',
      departmentId: designation.departmentId,
      level: designation.level,
      status: designation.status,
    }
  },
}

export type DesignationService = typeof designationService
