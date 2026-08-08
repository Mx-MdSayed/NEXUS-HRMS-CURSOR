/**
 * CSV helpers with formula-injection neutralization.
 * Prefix risky cells so spreadsheet apps do not execute formulas.
 */
const FORMULA_PREFIX = /^[=+\-@]/

export function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  let text = String(value)
  if (FORMULA_PREFIX.test(text)) {
    text = `'${text}`
  }
  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`
  }
  return text
}

export function downloadCsv(filename: string, lines: string[]): void {
  const csv = `\uFEFF${lines.join('\n')}`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportRowsToCsv<T extends Record<string, unknown>>(input: {
  filename: string
  columns: Array<{ key: keyof T; header: string }>
  rows: T[]
}): void {
  const header = input.columns.map((column) => sanitizeCsvCell(column.header)).join(',')
  const body = input.rows.map((row) =>
    input.columns.map((column) => sanitizeCsvCell(row[column.key])).join(','),
  )
  downloadCsv(input.filename, [header, ...body])
}
