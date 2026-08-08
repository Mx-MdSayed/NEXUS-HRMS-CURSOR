interface ExportReportInput<T extends Record<string, unknown>> {
  filename: string
  columns: Array<{ key: keyof T; header: string }>
  rows: T[]
}

function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  const raw = String(value)
  if (raw.includes(',') || raw.includes('"') || raw.includes('\n')) {
    return `"${raw.replaceAll('"', '""')}"`
  }
  return raw
}

export function exportReportToCSV<T extends Record<string, unknown>>({
  filename,
  columns,
  rows,
}: ExportReportInput<T>): void {
  const header = columns.map((column) => escapeCsvValue(column.header)).join(',')
  const body = rows.map((row) =>
    columns.map((column) => escapeCsvValue(row[column.key])).join(','),
  )
  const csv = `\uFEFF${[header, ...body].join('\n')}`
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
