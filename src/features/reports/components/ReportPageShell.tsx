import type { ReactNode } from 'react'
import { Download, Printer } from 'lucide-react'
import { Button, PageHeader } from '@/components/ui'
import { PERMISSIONS } from '@/constants/permissions'
import { useAuth } from '@/contexts/AuthContext'
import { showSuccess } from '@/utils/toast'
import { exportReportToCSV } from '../utils/exportCsv'

interface ReportPageShellProps<T extends object> {
  title: string
  description: string
  children: ReactNode
  exportFilename?: string
  exportColumns?: Array<{ key: keyof T; header: string }>
  exportRows?: T[]
}

export function ReportPageShell<T extends object>({
  title,
  description,
  children,
  exportFilename,
  exportColumns,
  exportRows,
}: ReportPageShellProps<T>) {
  const { hasPermission } = useAuth()
  const canExport = hasPermission(PERMISSIONS.REPORT_EXPORT)
  const hasExport = Boolean(exportFilename && exportColumns?.length && exportRows)

  const handleExport = () => {
    if (!exportFilename || !exportColumns || !exportRows) return
    exportReportToCSV({
      filename: exportFilename,
      columns: exportColumns as Array<{ key: keyof Record<string, unknown>; header: string }>,
      rows: exportRows as Array<Record<string, unknown>>,
    })
    showSuccess('Report exported to CSV.')
  }

  return (
    <div className="space-y-6 report-print-area">
      <PageHeader
        title={title}
        description={description}
        breadcrumbs={[{ label: 'Home' }, { label: 'Reports' }, { label: title }]}
        actions={
          <div className="flex gap-2 no-print">
            {canExport && hasExport ? (
              <Button variant="secondary" leftIcon={<Download className="h-4 w-4" />} onClick={handleExport}>
                Export CSV
              </Button>
            ) : null}
            <Button variant="secondary" leftIcon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>
              Print
            </Button>
          </div>
        }
      />
      {children}
    </div>
  )
}
