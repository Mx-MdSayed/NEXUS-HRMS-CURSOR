import { format } from 'date-fns'
import { settingsService } from '../services/settingsService'

/** Format: PREFIX-YYYY-MM-NNNN e.g. PS-2026-08-0001 */
export function formatPayslipNumber(sequence: number, at = new Date()): string {
  const prefix = settingsService.getSummary().payslipPrefix || 'PS'
  const year = format(at, 'yyyy')
  const month = format(at, 'MM')
  const seq = String(Math.max(1, sequence)).padStart(4, '0')
  return `${prefix}-${year}-${month}-${seq}`
}

export function formatEmployeeIdPreview(prefix: string, nextNumber: number): string {
  return `${prefix.trim() || 'EMP'}${nextNumber}`
}
