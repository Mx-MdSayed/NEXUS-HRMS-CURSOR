import { addDays, format, parseISO, subDays } from 'date-fns'
import { employeeService } from '@/features/employees/services/employeeService'
import {
  initialEmployeeSalaries,
  initialSalaryRevisions,
} from '../data/mockStructures'
import type {
  EmployeeSalary,
  EmployeeSalaryAssignmentForm,
  SalaryAssignmentFilters,
  SalaryOverviewStats,
  SalaryRevision,
  SalaryRevisionFilters,
  SalaryRevisionFormValues,
  StructureComponentLineInput,
} from '../types'
import { calculateSalaryStructure, SalaryCalculationError } from '../utils/calculations'
import { salaryComponentService } from './salaryComponentService'
import { salaryStructureService } from './salaryStructureService'
import { SalaryServiceError } from './errors'
import { DEFAULT_SALARY_CURRENCY } from '@/constants/currencies'

let salariesDb: EmployeeSalary[] = structuredClone(initialEmployeeSalaries)
let revisionsDb: SalaryRevision[] = structuredClone(initialSalaryRevisions)

function delay(ms = 250): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function dayBefore(dateKey: string): string {
  return format(subDays(parseISO(dateKey), 1), 'yyyy-MM-dd')
}

function closePreviousActive(employeeId: string, newEffectiveFrom: string, actor: string) {
  for (let i = 0; i < salariesDb.length; i += 1) {
    const row = salariesDb[i]
    if (row.employeeId !== employeeId) continue
    if (row.status !== 'active') continue
    if (row.effectiveFrom === newEffectiveFrom) {
      throw new SalaryServiceError(
        'CONFLICT',
        'An active salary already exists for this employee on the same effective date.',
      )
    }
    if (row.effectiveFrom > newEffectiveFrom) {
      throw new SalaryServiceError(
        'VALIDATION',
        'Effective date cannot be before an existing future active salary period start.',
      )
    }
    if (!row.effectiveTo || row.effectiveTo >= newEffectiveFrom) {
      salariesDb[i] = {
        ...row,
        status: 'superseded',
        effectiveTo: dayBefore(newEffectiveFrom),
        updatedAt: new Date().toISOString(),
        updatedBy: actor,
      }
    }
  }
}

function buildSnapshot(
  employeeId: string,
  structureId: string,
  effectiveFrom: string,
  actorName: string,
  notes?: string,
  overrides?: EmployeeSalaryAssignmentForm['overrides'],
  revisionReason?: string,
): EmployeeSalary {
  const structure = salaryStructureService.getByIdSync(structureId)
  if (!structure || structure.isDeleted) {
    throw new SalaryServiceError('NOT_FOUND', 'Salary structure not found.')
  }
  if (structure.status !== 'active' && structure.status !== 'draft') {
    throw new SalaryServiceError('VALIDATION', 'Only active or draft structures can be assigned.')
  }

  const inputs: StructureComponentLineInput[] = structure.components.map((line) => {
    const override = overrides?.[line.componentId]
    return {
      componentId: line.componentId,
      fixedAmount: override?.fixedAmount ?? line.fixedAmount,
      percentage: override?.percentage ?? line.percentage,
      displayOrder: line.displayOrder,
      override: Boolean(override),
    }
  })

  let calc
  try {
    calc = calculateSalaryStructure(
      salaryComponentService.listAllSync(),
      inputs,
      structure.currency,
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

  if (calc.monthlyGross <= 0) {
    throw new SalaryServiceError('VALIDATION', 'Salary amount must be greater than zero.')
  }

  const nowIso = new Date().toISOString()
  return {
    id: `es-${crypto.randomUUID().slice(0, 8)}`,
    employeeId,
    structureId: structure.id,
    structureCode: structure.code,
    structureName: structure.name,
    currency: structure.currency,
    monthlyGross: calc.monthlyGross,
    annualGross: calc.annualGross,
    monthlyCTC: calc.monthlyCTC,
    annualCTC: calc.annualCTC,
    monthlyNet: calc.monthlyNet,
    components: calc.lines.map((line) => ({
      ...line,
      override: Boolean(overrides?.[line.componentId]),
    })),
    effectiveFrom,
    status: 'active',
    notes,
    revisionReason,
    createdAt: nowIso,
    updatedAt: nowIso,
    createdBy: actorName,
    updatedBy: actorName,
  }
}

export const employeeSalaryService = {
  async getEmployeeSalary(employeeId: string): Promise<EmployeeSalary | null> {
    await delay(120)
    const active = salariesDb
      .filter((item) => item.employeeId === employeeId && item.status === 'active')
      .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0]
    return active ? structuredClone(active) : null
  },

  async getSalaryHistory(employeeId: string): Promise<EmployeeSalary[]> {
    await delay(120)
    return structuredClone(
      salariesDb
        .filter((item) => item.employeeId === employeeId)
        .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom)),
    )
  },

  async getAssignments(filters: SalaryAssignmentFilters = {}): Promise<
    Array<EmployeeSalary & { employeeName: string; employeeCode: string; departmentId: string }>
  > {
    await delay()
    const employees = await employeeService.getEmployees({ page: 1, pageSize: 200 })
    const empMap = new Map(employees.data.map((item) => [item.id, item]))

    let rows = salariesDb
      .filter((item) => item.status === 'active')
      .map((item) => {
        const emp = empMap.get(item.employeeId)
        return {
          ...item,
          employeeName: emp?.fullName ?? 'Unknown',
          employeeCode: emp?.employeeCode ?? '—',
          departmentId: emp?.departmentId ?? '',
        }
      })

    if (filters.status) rows = rows.filter((item) => item.status === filters.status)
    if (filters.departmentId) {
      rows = rows.filter((item) => item.departmentId === filters.departmentId)
    }
    if (filters.search?.trim()) {
      const q = filters.search.trim().toLowerCase()
      rows = rows.filter(
        (item) =>
          item.employeeName.toLowerCase().includes(q) ||
          item.employeeCode.toLowerCase().includes(q) ||
          item.structureName.toLowerCase().includes(q),
      )
    }

    return structuredClone(rows.sort((a, b) => a.employeeName.localeCompare(b.employeeName)))
  },

  async assignSalary(
    data: EmployeeSalaryAssignmentForm,
    actorName = 'System',
  ): Promise<EmployeeSalary> {
    await delay()
    try {
      await employeeService.getEmployeeById(data.employeeId)
    } catch {
      throw new SalaryServiceError('NOT_FOUND', 'Employee not found.')
    }
    if (!data.effectiveFrom) {
      throw new SalaryServiceError('VALIDATION', 'Effective from date is required.')
    }

    closePreviousActive(data.employeeId, data.effectiveFrom, actorName)
    const snapshot = buildSnapshot(
      data.employeeId,
      data.structureId,
      data.effectiveFrom,
      actorName,
      data.notes,
      data.overrides,
      'Initial assignment',
    )
    salariesDb.unshift(snapshot)
    return structuredClone(snapshot)
  },

  async updateSalary(
    id: string,
    data: Partial<EmployeeSalaryAssignmentForm>,
    actorName = 'System',
  ): Promise<EmployeeSalary> {
    await delay()
    const index = salariesDb.findIndex((item) => item.id === id)
    if (index < 0) throw new SalaryServiceError('NOT_FOUND', 'Employee salary not found.')
    const existing = salariesDb[index]
    if (existing.status !== 'active') {
      throw new SalaryServiceError('VALIDATION', 'Only active salary records can be updated.')
    }
    // Updates create a revision-like replacement for payroll snapshot integrity
    const effectiveFrom = data.effectiveFrom ?? format(addDays(new Date(), 0), 'yyyy-MM-dd')
    closePreviousActive(existing.employeeId, effectiveFrom, actorName)
    const snapshot = buildSnapshot(
      existing.employeeId,
      data.structureId ?? existing.structureId,
      effectiveFrom,
      actorName,
      data.notes ?? existing.notes,
      data.overrides,
      'Salary update',
    )
    salariesDb.unshift(snapshot)
    return structuredClone(snapshot)
  },

  async createSalaryRevision(
    data: SalaryRevisionFormValues,
    actorName = 'System',
    applyImmediately = true,
  ): Promise<SalaryRevision> {
    await delay()
    try {
      await employeeService.getEmployeeById(data.employeeId)
    } catch {
      throw new SalaryServiceError('NOT_FOUND', 'Employee not found.')
    }
    if (!data.reason?.trim()) {
      throw new SalaryServiceError('VALIDATION', 'Revision reason is required.')
    }
    if (!data.effectiveFrom) {
      throw new SalaryServiceError('VALIDATION', 'Effective from date is required.')
    }

    const current = salariesDb
      .filter((item) => item.employeeId === data.employeeId && item.status === 'active')
      .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0]

    const structure = salaryStructureService.getByIdSync(data.structureId)
    if (!structure) throw new SalaryServiceError('NOT_FOUND', 'Salary structure not found.')

    // Preview new amounts
    const preview = buildSnapshot(
      data.employeeId,
      data.structureId,
      data.effectiveFrom,
      actorName,
      data.notes,
      data.overrides,
      data.reason,
    )

    const revision: SalaryRevision = {
      id: `sr-${crypto.randomUUID().slice(0, 8)}`,
      employeeId: data.employeeId,
      previousSalaryId: current?.id,
      previousMonthlyGross: current?.monthlyGross ?? 0,
      newMonthlyGross: preview.monthlyGross,
      previousAnnualCTC: current?.annualCTC ?? 0,
      newAnnualCTC: preview.annualCTC,
      currency: preview.currency,
      structureId: data.structureId,
      effectiveFrom: data.effectiveFrom,
      reason: data.reason.trim(),
      notes: data.notes?.trim(),
      status: applyImmediately ? 'applied' : 'pending',
      createdAt: new Date().toISOString(),
      createdBy: actorName,
    }

    if (applyImmediately) {
      closePreviousActive(data.employeeId, data.effectiveFrom, actorName)
      salariesDb.unshift(preview)
      revision.newSalaryId = preview.id
      revision.appliedAt = new Date().toISOString()
      revision.appliedBy = actorName
    }

    revisionsDb.unshift(revision)
    return structuredClone(revision)
  },

  async applySalaryRevision(id: string, actorName = 'System'): Promise<SalaryRevision> {
    await delay()
    const index = revisionsDb.findIndex((item) => item.id === id)
    if (index < 0) throw new SalaryServiceError('NOT_FOUND', 'Salary revision not found.')
    const revision = revisionsDb[index]
    if (revision.status !== 'pending') {
      throw new SalaryServiceError('VALIDATION', 'Only pending revisions can be applied.')
    }

    closePreviousActive(revision.employeeId, revision.effectiveFrom, actorName)
    const snapshot = buildSnapshot(
      revision.employeeId,
      revision.structureId,
      revision.effectiveFrom,
      actorName,
      revision.notes,
      undefined,
      revision.reason,
    )
    salariesDb.unshift(snapshot)
    const updated: SalaryRevision = {
      ...revision,
      status: 'applied',
      newSalaryId: snapshot.id,
      newMonthlyGross: snapshot.monthlyGross,
      newAnnualCTC: snapshot.annualCTC,
      appliedAt: new Date().toISOString(),
      appliedBy: actorName,
    }
    revisionsDb[index] = updated
    return structuredClone(updated)
  },

  async getSalaryRevisions(filters: SalaryRevisionFilters = {}): Promise<
    Array<SalaryRevision & { employeeName: string; employeeCode: string }>
  > {
    await delay()
    const employees = await employeeService.getEmployees({ page: 1, pageSize: 200 })
    const empMap = new Map(employees.data.map((item) => [item.id, item]))

    let rows = revisionsDb.map((item) => {
      const emp = empMap.get(item.employeeId)
      return {
        ...item,
        employeeName: emp?.fullName ?? 'Unknown',
        employeeCode: emp?.employeeCode ?? '—',
      }
    })

    if (filters.status) rows = rows.filter((item) => item.status === filters.status)
    if (filters.employeeId) rows = rows.filter((item) => item.employeeId === filters.employeeId)
    if (filters.search?.trim()) {
      const q = filters.search.trim().toLowerCase()
      rows = rows.filter(
        (item) =>
          item.employeeName.toLowerCase().includes(q) ||
          item.employeeCode.toLowerCase().includes(q) ||
          item.reason.toLowerCase().includes(q),
      )
    }

    return structuredClone(rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
  },

  async getOverviewStats(): Promise<SalaryOverviewStats> {
    await delay(100)
    const structures = salaryStructureService.listActiveSync().length
    const components = salaryComponentService.listActiveSync().length
    const active = salariesDb.filter((item) => item.status === 'active')
    const pendingRevisions = revisionsDb.filter((item) => item.status === 'pending').length
    const totalMonthlyGross = active.reduce((sum, item) => sum + item.monthlyGross, 0)
    const totalAnnualCTC = active.reduce((sum, item) => sum + item.annualCTC, 0)
    return {
      structures,
      components,
      employeesWithSalary: active.length,
      pendingRevisions,
      totalMonthlyGross,
      totalAnnualCTC,
      currency: DEFAULT_SALARY_CURRENCY,
    }
  },

  /**
   * Payroll compatibility: resolve the EmployeeSalary snapshot effective on a given date.
   * Future payroll MUST use this snapshot — not today's live structure.
   */
  async getApplicableSalaryForPeriod(
    employeeId: string,
    periodDate: string,
  ): Promise<EmployeeSalary | null> {
    await delay(50)
    const match = salariesDb
      .filter((item) => item.employeeId === employeeId)
      .filter((item) => item.effectiveFrom <= periodDate)
      .filter((item) => !item.effectiveTo || item.effectiveTo >= periodDate)
      .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0]
    return match ? structuredClone(match) : null
  },

  /**
   * All salary snapshots that overlap a payroll period (for mid-month revision proration).
   */
  async getSalariesOverlappingPeriod(
    employeeId: string,
    periodStart: string,
    periodEnd: string,
  ): Promise<EmployeeSalary[]> {
    await delay(40)
    return structuredClone(
      salariesDb
        .filter((item) => item.employeeId === employeeId)
        .filter((item) => item.effectiveFrom <= periodEnd)
        .filter((item) => !item.effectiveTo || item.effectiveTo >= periodStart)
        .sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom)),
    )
  },
}
