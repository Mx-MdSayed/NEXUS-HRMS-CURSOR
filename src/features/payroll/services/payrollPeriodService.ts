import { getPeriodBounds } from '../utils/calculations'
import type { PayrollPeriod, PayrollPeriodStatus } from '../types'
import { PayrollServiceError } from './errors'
import { DEMO_PAYROLL_MONTH, DEMO_PAYROLL_YEAR } from '../constants'

let periodsDb: PayrollPeriod[] = []

function delay(ms = 120): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function nowIso() {
  return new Date().toISOString()
}

function seedIfEmpty() {
  if (periodsDb.length > 0) return
  const jul = getPeriodBounds(7, 2026)
  const aug = getPeriodBounds(DEMO_PAYROLL_MONTH, DEMO_PAYROLL_YEAR)
  periodsDb = [
    {
      id: 'pp-2026-07',
      month: 7,
      year: 2026,
      monthKey: jul.monthKey,
      startDate: jul.startDate,
      endDate: jul.endDate,
      status: 'finalized',
      createdAt: '2026-07-01T08:00:00.000Z',
      createdBy: 'Harper HR',
      updatedAt: '2026-07-28T16:00:00.000Z',
      updatedBy: 'Ava Admin',
    },
    {
      id: 'pp-2026-08',
      month: aug.month,
      year: aug.year,
      monthKey: aug.monthKey,
      startDate: aug.startDate,
      endDate: aug.endDate,
      status: 'draft',
      createdAt: '2026-08-01T08:00:00.000Z',
      createdBy: 'Harper HR',
      updatedAt: '2026-08-01T08:00:00.000Z',
      updatedBy: 'Harper HR',
    },
  ]
}

seedIfEmpty()

export const payrollPeriodService = {
  async getPeriods(): Promise<PayrollPeriod[]> {
    await delay()
    return structuredClone(periodsDb.sort((a, b) => b.monthKey.localeCompare(a.monthKey)))
  },

  async getPeriodById(id: string): Promise<PayrollPeriod> {
    await delay(80)
    const row = periodsDb.find((p) => p.id === id)
    if (!row) throw new PayrollServiceError('NOT_FOUND', 'Payroll period not found.')
    return structuredClone(row)
  },

  async getOrCreatePeriod(
    month: number,
    year: number,
    actor: string,
  ): Promise<PayrollPeriod> {
    await delay(80)
    if (month < 1 || month > 12) {
      throw new PayrollServiceError('VALIDATION', 'Month must be between 1 and 12.')
    }
    if (year < 2000 || year > 2100) {
      throw new PayrollServiceError('VALIDATION', 'Year is out of supported range.')
    }
    const bounds = getPeriodBounds(month, year)
    const existing = periodsDb.find((p) => p.monthKey === bounds.monthKey)
    if (existing) return structuredClone(existing)

    const now = nowIso()
    const period: PayrollPeriod = {
      id: `pp-${bounds.monthKey}`,
      month,
      year,
      monthKey: bounds.monthKey,
      startDate: bounds.startDate,
      endDate: bounds.endDate,
      status: 'draft',
      createdAt: now,
      createdBy: actor,
      updatedAt: now,
      updatedBy: actor,
    }
    periodsDb.push(period)
    return structuredClone(period)
  },

  async createPeriod(data: {
    month: number
    year: number
    createdBy: string
  }): Promise<PayrollPeriod> {
    return this.getOrCreatePeriod(data.month, data.year, data.createdBy)
  },

  async updatePeriod(
    id: string,
    data: Partial<Pick<PayrollPeriod, 'status'>>,
    actor: string,
  ): Promise<PayrollPeriod> {
    await delay(80)
    const idx = periodsDb.findIndex((p) => p.id === id)
    if (idx < 0) throw new PayrollServiceError('NOT_FOUND', 'Payroll period not found.')
    periodsDb[idx] = {
      ...periodsDb[idx],
      ...data,
      updatedAt: nowIso(),
      updatedBy: actor,
    }
    return structuredClone(periodsDb[idx])
  },

  async setStatus(id: string, status: PayrollPeriodStatus, actor: string) {
    return this.updatePeriod(id, { status }, actor)
  },
}
