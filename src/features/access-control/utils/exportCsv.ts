import { downloadCsv, sanitizeCsvCell } from '@/utils/csv'
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
  const lines = [
    columns.map((column) => sanitizeCsvCell(column.header)).join(','),
    ...rows.map((row) =>
      columns.map((column) => sanitizeCsvCell(row[column.key as keyof ManagedUser])).join(','),
    ),
  ]
  downloadCsv(`users-export-${new Date().toISOString().slice(0, 10)}.csv`, lines)
}

export function exportRolesToCsv(
  rows: Array<{ name: string; description: string; userCount: number; permissionCount: number; status: string }>,
): void {
  const lines = [
    ['Role', 'Description', 'User Count', 'Permission Count', 'Status'].map(sanitizeCsvCell).join(','),
    ...rows.map((row) =>
      [row.name, row.description, row.userCount, row.permissionCount, row.status]
        .map(sanitizeCsvCell)
        .join(','),
    ),
  ]
  downloadCsv(`roles-export-${new Date().toISOString().slice(0, 10)}.csv`, lines)
}
