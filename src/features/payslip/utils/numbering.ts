import { getPayslipSettings } from '../settings'

export function generatePayslipNumber(year: number, month: number, sequence: number): string {
  const prefix = getPayslipSettings().numberPrefix
  return `${prefix}-${year}-${String(month).padStart(2, '0')}-${String(sequence).padStart(4, '0')}`
}
