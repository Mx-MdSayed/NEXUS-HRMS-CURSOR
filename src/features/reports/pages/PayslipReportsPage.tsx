import { useCallback, useState } from 'react'
import { Archive, FileCheck2, FileText } from 'lucide-react'
import { Card, CardContent, ErrorState, PageLoader } from '@/components/ui'
import { formatSalaryAmount } from '@/features/salary/utils/money'
import { formatDate } from '@/utils/date'
import {
  ReportFilters,
  ReportKpiCard,
  ReportPageShell,
  ReportPieChart,
  ReportTable,
} from '../components'
import { useReportQuery } from '../hooks/useReportQuery'
import { reportService } from '../services/reportService'
import type { PayslipReport, ReportFilters as ReportFilterValues } from '../types'

const defaultFilters: ReportFilterValues = { preset: 'this_year' }

type PayslipReportRow = PayslipReport['rows'][number]

export function PayslipReportsPage() {
  const [filters, setFilters] = useState<ReportFilterValues>(defaultFilters)
  const loader = useCallback(
    (nextFilters: ReportFilterValues, auth: Parameters<typeof reportService.getPayslipReport>[1]) =>
      reportService.getPayslipReport(nextFilters, auth),
    [],
  )
  const { data: report, error, isLoading } = useReportQuery(filters, loader)

  if (isLoading && !report) return <PageLoader label="Loading payslip report" />
  if (error || !report) return <ErrorState title="Unable to load payslip report" message={error} />

  return (
    <ReportPageShell
      title="Payslip Reports"
      description="Restricted payslip generation status, rows, and totals grouped by currency."
      exportFilename="payslip-report"
      exportColumns={[
        { key: 'payslipNumber', header: 'Payslip' },
        { key: 'employeeCode', header: 'Employee ID' },
        { key: 'employeeName', header: 'Name' },
        { key: 'departmentName', header: 'Department' },
        { key: 'monthKey', header: 'Month' },
        { key: 'currency', header: 'Currency' },
        { key: 'netSalary', header: 'Net Salary' },
        { key: 'status', header: 'Status' },
      ]}
      exportRows={report.rows}
    >
      <ReportFilters
        value={filters}
        onApply={setFilters}
        onReset={() => setFilters(defaultFilters)}
        showCurrency
        showStatus
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <ReportKpiCard title="Generated" value={report.generated} icon={FileCheck2} />
        <ReportKpiCard title="Published" value={report.published} icon={FileText} />
        <ReportKpiCard title="Archived" value={report.archived} icon={Archive} />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <ReportPieChart title="Payslip status" data={report.statusDistribution} />
        <Card>
          <CardContent>
            <h2 className="mb-4 text-card-title">Payslip totals by currency</h2>
            <div className="space-y-3">
              {report.totalsByCurrency.map((total) => (
                <div
                  key={total.currency}
                  className="flex items-center justify-between rounded-lg border border-surface-200 p-3 dark:border-surface-800"
                >
                  <span className="font-medium">{total.currency}</span>
                  <span>{formatSalaryAmount(total.payslipNet ?? 0, total.currency)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <ReportTable<PayslipReportRow>
        title="Payslip rows"
        rows={report.rows}
        columns={[
          { key: 'payslipNumber', header: 'Payslip' },
          { key: 'employeeCode', header: 'Employee ID' },
          { key: 'employeeName', header: 'Name' },
          { key: 'departmentName', header: 'Department' },
          { key: 'monthKey', header: 'Month' },
          { key: 'currency', header: 'Currency' },
          { key: 'netSalary', header: 'Net Salary', render: (row) => formatSalaryAmount(row.netSalary, row.currency) },
          { key: 'status', header: 'Status' },
          { key: 'generatedAt', header: 'Generated', render: (row) => formatDate(row.generatedAt) },
        ]}
      />
    </ReportPageShell>
  )
}
