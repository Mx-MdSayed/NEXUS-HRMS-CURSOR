import { useCallback, useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import {
  DataTable,
  PageHeader,
  Select,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui'
import { showError } from '@/utils/toast'
import { getSettingsErrorMessage } from '../services/errors'
import { settingsService } from '../services/settingsService'
import type { SettingsCategory, SettingsHistoryEntry } from '../types'

const CATEGORY_OPTIONS: { value: SettingsCategory | ''; label: string }[] = [
  { value: '', label: 'All categories' },
  { value: 'company', label: 'Company' },
  { value: 'organization', label: 'Organization' },
  { value: 'attendance', label: 'Attendance' },
  { value: 'leave', label: 'Leave' },
  { value: 'payroll', label: 'Payroll' },
  { value: 'payslip', label: 'Payslip' },
  { value: 'localization', label: 'Localization' },
  { value: 'notifications', label: 'Notifications' },
  { value: 'workflow', label: 'Workflow' },
  { value: 'branding', label: 'Branding' },
]

export function SettingsAuditPage() {
  const [rows, setRows] = useState<SettingsHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<SettingsCategory | ''>('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await settingsService.getHistory(category || undefined)
      setRows(data)
    } catch (err) {
      showError(getSettingsErrorMessage(err, 'Unable to load settings history.'))
    } finally {
      setLoading(false)
    }
  }, [category])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit"
        description="Settings change history with actor, category, and summary."
        breadcrumbs={[{ label: 'Home' }, { label: 'Settings', href: '/settings' }, { label: 'Audit' }]}
      />

      <Select
        label="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value as SettingsCategory | '')}
        options={CATEGORY_OPTIONS}
        className="w-56"
      />

      <DataTable
        isLoading={loading}
        isEmpty={rows.length === 0}
        emptyTitle="No settings changes recorded"
        emptyDescription="Configuration updates will appear here after they are saved."
        columnCount={5}
      >
        <TableHeader>
          <TableRow>
            <TableHead>When</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Changed by</TableHead>
            <TableHead>Summary</TableHead>
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="whitespace-nowrap">
                {format(parseISO(row.changedAt), 'dd MMM yyyy HH:mm')}
              </TableCell>
              <TableCell>{row.settingCategory}</TableCell>
              <TableCell>{row.changedByName}</TableCell>
              <TableCell className="max-w-[240px] truncate">{row.summary}</TableCell>
              <TableCell className="max-w-[200px] truncate text-xs text-surface-500">
                {row.newValue.slice(0, 80)}
                {row.newValue.length > 80 ? '…' : ''}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </DataTable>
    </div>
  )
}
