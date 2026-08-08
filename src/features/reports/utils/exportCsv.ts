import { exportRowsToCsv } from '@/utils/csv'

interface ExportReportInput<T extends Record<string, unknown>> {
  filename: string
  columns: Array<{ key: keyof T; header: string }>
  rows: T[]
}

export function exportReportToCSV<T extends Record<string, unknown>>(
  input: ExportReportInput<T>,
): void {
  exportRowsToCsv(input)
}
