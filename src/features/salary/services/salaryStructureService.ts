import type { SalaryCurrencyCode } from '@/constants/currencies'
import { initialSalaryStructures } from '../data/mockStructures'
import type {
  SalaryStructure,
  SalaryStructureFilters,
  SalaryStructureFormValues,
  StructureComponentLineInput,
} from '../types'
import { calculateSalaryStructure, SalaryCalculationError } from '../utils/calculations'
import { salaryComponentService } from './salaryComponentService'
import { SalaryServiceError } from './errors'

let structuresDb: SalaryStructure[] = structuredClone(initialSalaryStructures)

function delay(ms = 250): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function toInputs(structure: SalaryStructure): StructureComponentLineInput[] {
  return structure.components.map((line) => ({
    componentId: line.componentId,
    fixedAmount: line.fixedAmount,
    percentage: line.percentage,
    displayOrder: line.displayOrder,
    override: line.override,
  }))
}

function buildStructureFromForm(
  data: SalaryStructureFormValues,
  actorName: string,
  existing?: SalaryStructure,
): SalaryStructure {
  if (!data.name.trim()) throw new SalaryServiceError('VALIDATION', 'Structure name is required.')
  const code = data.code.trim().toUpperCase()
  if (!code) throw new SalaryServiceError('VALIDATION', 'Structure code is required.')
  if (
    structuresDb.some(
      (item) =>
        !item.isDeleted && item.id !== existing?.id && item.code.toUpperCase() === code,
    )
  ) {
    throw new SalaryServiceError('CONFLICT', 'Structure code must be unique.')
  }
  if (!data.effectiveFrom) {
    throw new SalaryServiceError('VALIDATION', 'Effective from date is required.')
  }
  if (!data.components.length) {
    throw new SalaryServiceError('VALIDATION', 'Add at least one salary component.')
  }

  const masters = salaryComponentService.listAllSync()
  let calc
  try {
    calc = calculateSalaryStructure(masters, data.components, data.currency)
  } catch (error) {
    if (error instanceof SalaryCalculationError) {
      throw new SalaryServiceError(
        error.code === 'CIRCULAR' ? 'CONFLICT' : 'VALIDATION',
        error.message,
      )
    }
    throw error
  }

  const nowIso = new Date().toISOString()
  return {
    id: existing?.id ?? `ss-${crypto.randomUUID().slice(0, 8)}`,
    code,
    name: data.name.trim(),
    description: data.description?.trim() || undefined,
    currency: data.currency,
    components: calc.lines,
    monthlyGross: calc.monthlyGross,
    annualGross: calc.annualGross,
    monthlyCTC: calc.monthlyCTC,
    annualCTC: calc.annualCTC,
    monthlyNet: calc.monthlyNet,
    status: data.status,
    effectiveFrom: data.effectiveFrom,
    effectiveTo: existing?.effectiveTo,
    createdAt: existing?.createdAt ?? nowIso,
    updatedAt: nowIso,
    createdBy: existing?.createdBy ?? actorName,
    updatedBy: actorName,
    isDeleted: false,
  }
}

export const salaryStructureService = {
  listActiveSync(): SalaryStructure[] {
    return structuresDb.filter((item) => !item.isDeleted && item.status === 'active')
  },

  getByIdSync(id: string): SalaryStructure | undefined {
    return structuresDb.find((item) => item.id === id && !item.isDeleted)
  },

  async getStructures(filters: SalaryStructureFilters = {}): Promise<SalaryStructure[]> {
    await delay()
    let rows = structuresDb.filter((item) => !item.isDeleted)
    if (filters.status) rows = rows.filter((item) => item.status === filters.status)
    if (filters.currency) rows = rows.filter((item) => item.currency === filters.currency)
    if (filters.search?.trim()) {
      const q = filters.search.trim().toLowerCase()
      rows = rows.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q) ||
          (item.description ?? '').toLowerCase().includes(q),
      )
    }
    return structuredClone(rows.sort((a, b) => a.name.localeCompare(b.name)))
  },

  async getStructureById(id: string): Promise<SalaryStructure> {
    await delay(120)
    const item = structuresDb.find((row) => row.id === id && !row.isDeleted)
    if (!item) throw new SalaryServiceError('NOT_FOUND', 'Salary structure not found.')
    return structuredClone(item)
  },

  async createStructure(
    data: SalaryStructureFormValues,
    actorName = 'System',
  ): Promise<SalaryStructure> {
    await delay()
    const created = buildStructureFromForm(data, actorName)
    structuresDb.push(created)
    return structuredClone(created)
  },

  async updateStructure(
    id: string,
    data: SalaryStructureFormValues,
    actorName = 'System',
  ): Promise<SalaryStructure> {
    await delay()
    const index = structuresDb.findIndex((item) => item.id === id && !item.isDeleted)
    if (index < 0) throw new SalaryServiceError('NOT_FOUND', 'Salary structure not found.')
    const updated = buildStructureFromForm(data, actorName, structuresDb[index])
    structuresDb[index] = updated
    return structuredClone(updated)
  },

  async duplicateStructure(id: string, actorName = 'System'): Promise<SalaryStructure> {
    await delay()
    const source = structuresDb.find((item) => item.id === id && !item.isDeleted)
    if (!source) throw new SalaryServiceError('NOT_FOUND', 'Salary structure not found.')
    const year = new Date().getFullYear() + 1
    const baseCode = `${source.code}-COPY`
    let code = baseCode
    let n = 1
    while (structuresDb.some((item) => !item.isDeleted && item.code === code)) {
      code = `${baseCode}-${n++}`
    }
    const created = buildStructureFromForm(
      {
        name: `${source.name} - ${year}`,
        code,
        description: source.description ? `${source.description} (copy)` : 'Duplicated structure',
        currency: source.currency as SalaryCurrencyCode,
        effectiveFrom: `${year}-01-01`,
        status: 'draft',
        components: toInputs(source),
      },
      actorName,
    )
    structuresDb.push(created)
    return structuredClone(created)
  },

  async deleteStructure(id: string, actorName = 'System'): Promise<void> {
    await delay()
    const index = structuresDb.findIndex((item) => item.id === id && !item.isDeleted)
    if (index < 0) throw new SalaryServiceError('NOT_FOUND', 'Salary structure not found.')
    structuresDb[index] = {
      ...structuresDb[index],
      isDeleted: true,
      status: 'inactive',
      deletedAt: new Date().toISOString(),
      deletedBy: actorName,
      updatedAt: new Date().toISOString(),
      updatedBy: actorName,
    }
  },

  async activateStructure(id: string, actorName = 'System'): Promise<SalaryStructure> {
    await delay()
    const index = structuresDb.findIndex((item) => item.id === id && !item.isDeleted)
    if (index < 0) throw new SalaryServiceError('NOT_FOUND', 'Salary structure not found.')
    structuresDb[index] = {
      ...structuresDb[index],
      status: 'active',
      updatedAt: new Date().toISOString(),
      updatedBy: actorName,
    }
    return structuredClone(structuresDb[index])
  },

  async deactivateStructure(id: string, actorName = 'System'): Promise<SalaryStructure> {
    await delay()
    const index = structuresDb.findIndex((item) => item.id === id && !item.isDeleted)
    if (index < 0) throw new SalaryServiceError('NOT_FOUND', 'Salary structure not found.')
    structuresDb[index] = {
      ...structuresDb[index],
      status: 'inactive',
      updatedAt: new Date().toISOString(),
      updatedBy: actorName,
    }
    return structuredClone(structuresDb[index])
  },

  async previewStructure(
    data: Pick<SalaryStructureFormValues, 'currency' | 'components'>,
  ) {
    await delay(80)
    try {
      return calculateSalaryStructure(
        salaryComponentService.listAllSync(),
        data.components,
        data.currency,
      )
    } catch (error) {
      if (error instanceof SalaryCalculationError) {
        throw new SalaryServiceError(
          error.code === 'CIRCULAR' ? 'CONFLICT' : 'VALIDATION',
          error.message,
        )
      }
      throw error
    }
  },
}
