import { DEFAULT_PAGE_SIZE } from '@/constants/app'
import type { SalaryCurrencyCode } from '@/constants/currencies'
import { isPercentageMethod, methodToPercentageBase } from '../constants'
import { initialSalaryComponents } from '../data/mockComponents'
import type {
  SalaryComponent,
  SalaryComponentFilters,
  SalaryComponentFormValues,
} from '../types'
import { SalaryServiceError } from './errors'

let componentsDb: SalaryComponent[] = structuredClone(initialSalaryComponents)

function delay(ms = 220): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function validateForm(data: SalaryComponentFormValues, excludeId?: string) {
  if (!data.name.trim()) throw new SalaryServiceError('VALIDATION', 'Name is required.')
  const code = data.code.trim().toUpperCase()
  if (!code) throw new SalaryServiceError('VALIDATION', 'Code is required.')
  if (
    componentsDb.some(
      (item) => !item.isDeleted && item.id !== excludeId && item.code.toUpperCase() === code,
    )
  ) {
    throw new SalaryServiceError('CONFLICT', 'Component code must be unique.')
  }
  if (isPercentageMethod(data.calculationMethod)) {
    if (data.percentage === undefined || Number.isNaN(data.percentage)) {
      throw new SalaryServiceError('VALIDATION', 'Percentage is required for percentage methods.')
    }
    if (data.percentage < 0 || data.percentage > 100) {
      throw new SalaryServiceError('VALIDATION', 'Percentage must be between 0 and 100.')
    }
  } else {
    if (data.fixedAmount === undefined || Number.isNaN(data.fixedAmount)) {
      throw new SalaryServiceError('VALIDATION', 'Fixed amount is required.')
    }
    if (data.fixedAmount < 0) {
      throw new SalaryServiceError('VALIDATION', 'Fixed amount cannot be negative.')
    }
  }
}

export const salaryComponentService = {
  /** Sync access for calculation engine / other services. */
  listActiveSync(): SalaryComponent[] {
    return componentsDb.filter((item) => !item.isDeleted && item.status === 'active')
  },

  listAllSync(): SalaryComponent[] {
    return componentsDb.filter((item) => !item.isDeleted)
  },

  getByIdSync(id: string): SalaryComponent | undefined {
    return componentsDb.find((item) => item.id === id && !item.isDeleted)
  },

  async getComponents(filters: SalaryComponentFilters = {}): Promise<SalaryComponent[]> {
    await delay()
    let rows = componentsDb.filter((item) => !item.isDeleted)
    if (filters.category) rows = rows.filter((item) => item.category === filters.category)
    if (filters.status) rows = rows.filter((item) => item.status === filters.status)
    if (filters.search?.trim()) {
      const q = filters.search.trim().toLowerCase()
      rows = rows.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q) ||
          (item.description ?? '').toLowerCase().includes(q),
      )
    }
    return structuredClone(rows.sort((a, b) => a.displayOrder - b.displayOrder))
  },

  async getComponentById(id: string): Promise<SalaryComponent> {
    await delay(100)
    const item = componentsDb.find((row) => row.id === id && !row.isDeleted)
    if (!item) throw new SalaryServiceError('NOT_FOUND', 'Salary component not found.')
    return structuredClone(item)
  },

  async createComponent(
    data: SalaryComponentFormValues,
    actorName = 'System',
  ): Promise<SalaryComponent> {
    await delay()
    validateForm(data)
    const nowIso = new Date().toISOString()
    const created: SalaryComponent = {
      id: `sc-${crypto.randomUUID().slice(0, 8)}`,
      code: data.code.trim().toUpperCase(),
      name: data.name.trim(),
      description: data.description?.trim() || undefined,
      category: data.category,
      calculationMethod: data.calculationMethod,
      percentage: isPercentageMethod(data.calculationMethod) ? data.percentage : undefined,
      percentageOf:
        methodToPercentageBase(data.calculationMethod) ?? data.percentageOf,
      fixedAmount: data.calculationMethod === 'fixed' ? data.fixedAmount : undefined,
      taxable: data.taxable,
      statutory: data.statutory,
      recurring: data.recurring,
      employerContribution:
        data.employerContribution || data.category === 'employer_contribution',
      employeeContribution: data.employeeContribution || data.category === 'deduction',
      currency: data.currency,
      status: data.status,
      displayOrder: data.displayOrder,
      createdAt: nowIso,
      updatedAt: nowIso,
      createdBy: actorName,
      updatedBy: actorName,
      isDeleted: false,
    }
    componentsDb.push(created)
    return structuredClone(created)
  },

  async updateComponent(
    id: string,
    data: SalaryComponentFormValues,
    actorName = 'System',
  ): Promise<SalaryComponent> {
    await delay()
    const index = componentsDb.findIndex((item) => item.id === id && !item.isDeleted)
    if (index < 0) throw new SalaryServiceError('NOT_FOUND', 'Salary component not found.')
    validateForm(data, id)
    const existing = componentsDb[index]
    const updated: SalaryComponent = {
      ...existing,
      code: data.code.trim().toUpperCase(),
      name: data.name.trim(),
      description: data.description?.trim() || undefined,
      category: data.category,
      calculationMethod: data.calculationMethod,
      percentage: isPercentageMethod(data.calculationMethod) ? data.percentage : undefined,
      percentageOf:
        methodToPercentageBase(data.calculationMethod) ?? data.percentageOf,
      fixedAmount: data.calculationMethod === 'fixed' ? data.fixedAmount : undefined,
      taxable: data.taxable,
      statutory: data.statutory,
      recurring: data.recurring,
      employerContribution:
        data.employerContribution || data.category === 'employer_contribution',
      employeeContribution: data.employeeContribution || data.category === 'deduction',
      currency: data.currency as SalaryCurrencyCode,
      status: data.status,
      displayOrder: data.displayOrder,
      updatedAt: new Date().toISOString(),
      updatedBy: actorName,
    }
    componentsDb[index] = updated
    return structuredClone(updated)
  },

  async deleteComponent(id: string, actorName = 'System'): Promise<void> {
    await delay()
    const index = componentsDb.findIndex((item) => item.id === id && !item.isDeleted)
    if (index < 0) throw new SalaryServiceError('NOT_FOUND', 'Salary component not found.')
    componentsDb[index] = {
      ...componentsDb[index],
      isDeleted: true,
      status: 'inactive',
      deletedAt: new Date().toISOString(),
      deletedBy: actorName,
      updatedAt: new Date().toISOString(),
      updatedBy: actorName,
    }
  },

  async activateComponent(id: string, actorName = 'System'): Promise<SalaryComponent> {
    await delay()
    const index = componentsDb.findIndex((item) => item.id === id && !item.isDeleted)
    if (index < 0) throw new SalaryServiceError('NOT_FOUND', 'Salary component not found.')
    componentsDb[index] = {
      ...componentsDb[index],
      status: 'active',
      updatedAt: new Date().toISOString(),
      updatedBy: actorName,
    }
    return structuredClone(componentsDb[index])
  },

  async deactivateComponent(id: string, actorName = 'System'): Promise<SalaryComponent> {
    await delay()
    const index = componentsDb.findIndex((item) => item.id === id && !item.isDeleted)
    if (index < 0) throw new SalaryServiceError('NOT_FOUND', 'Salary component not found.')
    componentsDb[index] = {
      ...componentsDb[index],
      status: 'inactive',
      updatedAt: new Date().toISOString(),
      updatedBy: actorName,
    }
    return structuredClone(componentsDb[index])
  },
}

export { DEFAULT_PAGE_SIZE }
