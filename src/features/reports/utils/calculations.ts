import { differenceInCalendarMonths, parseISO } from 'date-fns'
import type { SalaryCurrencyCode } from '@/constants/currencies'
import type { EmployeeListItem } from '@/features/employees/types'
import type { EmployeeSalary } from '@/features/salary/types'
import type { CurrencyTotal, TrendResult } from '../types'

export function calculateAttendancePercentage(presentEquivalent: number, workingDays: number): number {
  if (workingDays <= 0) return 0
  return Math.round((presentEquivalent / workingDays) * 10000) / 100
}

export function calculateTrend(current: number, previous: number): TrendResult {
  const delta = current - previous
  const percentage = previous === 0 ? (current === 0 ? 0 : 100) : (delta / previous) * 100
  return {
    current,
    previous,
    delta,
    percentage: Math.round(percentage * 100) / 100,
    direction: delta > 0 ? 'up' : delta < 0 ? 'down' : 'neutral',
  }
}

export function calculateHeadcount(employees: EmployeeListItem[]): number {
  return employees.filter((employee) => employee.employmentStatus !== 'terminated').length
}

export function groupByCurrency<T extends { currency: SalaryCurrencyCode }>(
  rows: T[],
  mapper: (row: T) => Partial<Omit<CurrencyTotal, 'currency' | 'count'>>,
): CurrencyTotal[] {
  const map = new Map<SalaryCurrencyCode, CurrencyTotal>()
  for (const row of rows) {
    const current = map.get(row.currency) ?? { currency: row.currency, count: 0 }
    const values = mapper(row)
    current.count += 1
    for (const [key, value] of Object.entries(values)) {
      if (typeof value !== 'number') continue
      const totals = current as unknown as Record<string, number | string>
      totals[key] = Number(totals[key] ?? 0) + value
    }
    map.set(row.currency, current)
  }
  return Array.from(map.values()).sort((a, b) => a.currency.localeCompare(b.currency))
}

export function countBy<T>(rows: T[], getKey: (row: T) => string): Array<{ name: string; value: number }> {
  const map = new Map<string, number>()
  for (const row of rows) {
    const key = getKey(row) || 'Unassigned'
    map.set(key, (map.get(key) ?? 0) + 1)
  }
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name))
}

export function tenureMonths(joiningDate: string, asOf = new Date()): number {
  return Math.max(0, differenceInCalendarMonths(asOf, parseISO(joiningDate)))
}

export function tenureBucket(months: number): string {
  if (months < 6) return '0-6 months'
  if (months < 12) return '6-12 months'
  if (months < 36) return '1-3 years'
  if (months < 60) return '3-5 years'
  return '5+ years'
}

export function salaryRangeBucket(amount: number): string {
  if (amount < 25000) return '< ₹25K'
  if (amount < 50000) return '₹25K–₹50K'
  if (amount < 75000) return '₹50K–₹75K'
  if (amount < 100000) return '₹75K–₹1L'
  return '₹1L+'
}

export function salaryRangeBucketForCurrency(amount: number, currency: SalaryCurrencyCode): string {
  if (currency !== 'INR') {
    if (amount < 25000) return '< 25K'
    if (amount < 50000) return '25K–50K'
    if (amount < 75000) return '50K–75K'
    if (amount < 100000) return '75K–100K'
    return '100K+'
  }
  return salaryRangeBucket(amount)
}

export function salaryRangeBucketsByCurrency(assignments: EmployeeSalary[]): Array<{
  currency: SalaryCurrencyCode
  buckets: Array<{ name: string; value: number }>
}> {
  const byCurrency = new Map<SalaryCurrencyCode, EmployeeSalary[]>()
  assignments.forEach((assignment) => {
    byCurrency.set(assignment.currency, [...(byCurrency.get(assignment.currency) ?? []), assignment])
  })
  return Array.from(byCurrency.entries()).map(([currency, rows]) => ({
    currency,
    buckets: countBy(rows, (row) => salaryRangeBucketForCurrency(row.monthlyGross, currency)),
  }))
}
