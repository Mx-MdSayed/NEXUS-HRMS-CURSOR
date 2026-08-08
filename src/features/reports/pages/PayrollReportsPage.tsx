import { useCallback, useState } from 'react'
import { Banknote, CheckCircle2, Clock3 } from 'lucide-react'
import { Card, CardContent, ErrorState, PageLoader } from '@/components/ui'
import { formatSalaryAmount } from '@/features/salary/utils/money'
import {
  ReportFilters,
  ReportKpiCard,
  ReportLineChart,
  ReportPageShell,
  ReportTable,
} from '../components'
import { useReportQuery } from '../hooks/useReportQuery'
import { reportService } from '../services/reportService'
import type { PayrollReport, ReportFilters as ReportFilterValues } from '../types'

const defaultFilters: ReportFilterValues = { preset: 'this_year' }

type PayrollRunRow = PayrollReport['runs'][number]
type DepartmentPayrollRow = PayrollReport['departmentSummary'][number]

export function PayrollReportsPage() {
  const [filters, setFilters] = useState<ReportFilterValues>(defaultFilters)
  const loader = useCallback(
    (nextFilters: ReportFilterValues, auth: Parameters<typeof reportService.getPayrollReport>[1]) =>
      reportService.getPayrollReport(nextFilters, auth),
    [],
  )
  const { data: report, error, isLoading } = useReportQuery(filters, loader)

  if (isLoading && !report) return <PageLoader label="Loading payroll report" />
  if (error || !report) return <ErrorState title="Unable to load payroll report" message={error} />

  return (
    <ReportPageShell
      title="Payroll Reports"
      description="Restricted payroll run analytics grouped by currency, with department summary for the selected run."
      exportFilename="payroll-report"
      exportColumns={[
        { key: 'name', header: 'Run' },
        { key: 'monthKey', header: 'Month' },
        { key: 'status', header: 'Status' },
        { key: 'currency', header: 'Currency' },
        { key: 'employeeCount', header: 'Employees' },
        { key: 'grossPayroll', header: 'Gross Payroll' },
        { key: 'totalDeductions', header: 'Deductions' },
        { key: 'netPayroll', header: 'Net Payroll' },
      ]}
      exportRows={report.runs}
    >
      <ReportFilters
        value={filters}
        onApply={setFilters}
        onReset={() => setFilters(defaultFilters)}
        showCurrency
        showStatus
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ReportKpiCard title="Payroll runs" value={report.runs.length} icon={Banknote} />
        <ReportKpiCard
          title="Finalized"
          value={report.runs.filter((run) => run.status === 'finalized').length}
          icon={CheckCircle2}
        />
        <ReportKpiCard
          title="Pending approval"
          value={report.runs.filter((run) => run.status === 'pending_approval').length}
          icon={Clock3}
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <ReportLineChart title="Net payroll trend" data={report.trend} />
        <Card>
          <CardContent>
            <h2 className="mb-4 text-card-title">Totals by currency</h2>
            <div className="space-y-3">
              {report.totalsByCurrency.map((total) => (
                <div
                  key={total.currency}
                  className="flex items-center justify-between rounded-lg border border-surface-200 p-3 dark:border-surface-800"
                >
                  <span className="font-medium">{total.currency}</span>
                  <span>{formatSalaryAmount(total.netPayroll ?? 0, total.currency)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <ReportTable<PayrollRunRow>
        title="Payroll runs"
        rows={report.runs}
        columns={[
          { key: 'name', header: 'Run' },
          { key: 'monthKey', header: 'Month' },
          { key: 'status', header: 'Status' },
          { key: 'currency', header: 'Currency' },
          { key: 'employeeCount', header: 'Employees' },
          { key: 'grossPayroll', header: 'Gross', render: (row) => formatSalaryAmount(row.grossPayroll, row.currency) },
          { key: 'netPayroll', header: 'Net', render: (row) => formatSalaryAmount(row.netPayroll, row.currency) },
        ]}
      />
      <ReportTable<DepartmentPayrollRow>
        title="Department summary for selected run"
        rows={report.departmentSummary}
        columns={[
          { key: 'departmentName', header: 'Department' },
          { key: 'employees', header: 'Employees' },
          { key: 'grossPayroll', header: 'Gross' },
          { key: 'deductions', header: 'Deductions' },
          { key: 'netPayroll', header: 'Net' },
          { key: 'employerCost', header: 'Employer Cost' },
        ]}
      />
    </ReportPageShell>
  )
}
