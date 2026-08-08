import type { ManagedUser } from '../types'

export function exportUsersToCsv(rows: ManagedUser[]): void {
  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'employeeCode', header: 'Employee ID' },
    { key: 'roleName', header: 'Role' },
    { key: 'status', header: 'Status' },
    { key: 'departmentName', header: 'Department' },
  ] as const
  const escape = (value: unknown) => {
    const text = String(value ?? '')
    if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`
    return text
  }
  const lines = [
    columns.map((column) => column.header).join(','),
    ...rows.map((row) =>
      columns.map((column) => escape(row[column.key as keyof ManagedUser])).join(','),
    ),
  ]
  const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `users-export-${new Date().toISOString().slice(0, 10)}.csv`
  anchor.click()
  URL.revokeObjectURL(url)
}

export function exportRolesToCsv(
  rows: Array<{ name: string; description: string; userCount: number; permissionCount: number; status: string }>,
): void {
  const lines = [
    'Role,Description,User Count,Permission Count,Status',
    ...rows.map((row) =>
      [row.name, row.description, row.userCount, row.permissionCount, row.status]
        .map((value) => {
          const text = String(value)
          return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
        })
        .join(','),
    ),
  ]
  const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `roles-export-${new Date().toISOString().slice(0, 10)}.csv`
  anchor.click()
  URL.revokeObjectURL(url)
}
