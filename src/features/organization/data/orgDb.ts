import type { Department, DepartmentOption, Designation, DesignationOption } from '../types'
import { initialDepartments } from './mockDepartments'
import { initialDesignations } from './mockDesignations'

export let departmentsDb: Department[] = structuredClone(initialDepartments)
export let designationsDb: Designation[] = structuredClone(initialDesignations)

export function resetOrgDb() {
  departmentsDb = structuredClone(initialDepartments)
  designationsDb = structuredClone(initialDesignations)
}

export function replaceDepartments(next: Department[]) {
  departmentsDb.splice(0, departmentsDb.length, ...next)
}

export function replaceDesignations(next: Designation[]) {
  designationsDb.splice(0, designationsDb.length, ...next)
}

export function prependDepartment(department: Department) {
  departmentsDb.unshift(department)
}

export function prependDesignation(designation: Designation) {
  designationsDb.unshift(designation)
}

export function getDepartmentByIdSync(id: string): Department | undefined {
  return departmentsDb.find((item) => item.id === id && !item.isDeleted)
}

export function getDesignationByIdSync(id: string): Designation | undefined {
  return designationsDb.find((item) => item.id === id && !item.isDeleted)
}

export function getDepartmentNameById(id: string): string {
  return getDepartmentByIdSync(id)?.name ?? '—'
}

export function getDesignationNameById(id: string): string {
  return getDesignationByIdSync(id)?.name ?? '—'
}

export function listActiveDepartmentOptions(): DepartmentOption[] {
  return departmentsDb
    .filter((item) => !item.isDeleted && item.status === 'active')
    .map((item) => ({
      id: item.id,
      name: item.name,
      code: item.code,
      isActive: true,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function listActiveDesignationOptions(departmentId?: string): DesignationOption[] {
  return designationsDb
    .filter((item) => {
      if (item.isDeleted || item.status !== 'active') return false
      if (!departmentId) return true
      return item.departmentId === departmentId
    })
    .map((item) => ({
      id: item.id,
      name: item.name,
      code: item.code,
      departmentId: item.departmentId,
      isActive: true,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function listDepartmentLocations(): string[] {
  const locations = new Set<string>()
  departmentsDb.forEach((item) => {
    if (!item.isDeleted && item.location?.trim()) locations.add(item.location.trim())
  })
  return Array.from(locations).sort((a, b) => a.localeCompare(b))
}
