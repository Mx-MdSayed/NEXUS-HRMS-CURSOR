import { useEffect, useState } from 'react'
import { Wallet } from 'lucide-react'
import { Card, CardContent, ErrorState, PageLoader } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { formatSalaryAmount } from '@/features/salary/utils/money'
import { formatDate } from '@/utils/date'
import {
  ReportBarChart,
  ReportFilters,
  ReportKpiCard,
  ReportPageShell,
  ReportTable,
} from '../components'
import { reportService } from '../services/reportService'
import type { ReportFilters as ReportFilterValues, SalaryReport, SalaryReportRow } from '../types'
import { getReportErrorMessage } from '../utils/errors'

const defaultFilters: ReportFilterValues = { preset: 'this_month' }

export function SalaryReportsPage() {
  const { hasPermission } = useAuth()
  const [filters, setFilters] = useState<ReportFilterValues>(defaultFilters)
  const [report, setReport] = useState<SalaryReport | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setIsLoading(true)
      setError('')
      try {
        const data = await reportService.getSalaryReport(filters, { permissions: [], hasPermission })
        if (!cancelled) setReport(data)
      } catch (err) {
        if (!cancelled) setError(getReportErrorMessage(err))
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [filters, hasPermission])

  if (isLoading && !report) return <PageLoader label="Loading salary report" />
  if (error || !report) return <ErrorState title="Unable to load salary report" message={error} />

  return (
    <ReportPageShell
      title="Salary Reports"
      description="Restricted compensation reporting with totals grouped by currency."
      exportFilename="salary-report"
      exportColumns={[
        { key: 'employeeCode', header: 'Employee ID' },
        { key: 'employeeName', header: 'Name' },
        { key: 'departmentName', header: 'Department' },
        { key: 'structureName', header: 'Structure' },
        { key: 'currency', header: 'Currency' },
        { key: 'monthlyGross', header: 'Monthly Gross' },
        { key: 'monthlyNet', header: 'Monthly Net' },
        { key: 'annualCTC', header: 'Annual CTC' },
      ]}
      exportRows={report.rows}
    >
      <ReportFilters
        value={filters}
        onApply={setFilters}
        onReset={() => setFilters(defaultFilters)}
        showCurrency
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {report.totalsByCurrency.map((total) => (
          <ReportKpiCard
            key={total.currency}
            title={`${total.currency} monthly gross`}
            value={formatSalaryAmount(total.monthlyGross ?? 0, total.currency)}
            description={`${total.count} assignments`}
            icon={Wallet}
          />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <ReportBarChart title="INR salary distribution" data={report.distribution} />
        <Card>
          <CardContent>
            <h2 className="mb-4 text-card-title">Department salary totals</h2>
            <div className="space-y-3">
              {report.departmentTotals.map((row) => (
                <div
                  key={`${row.departmentId}-${row.currency}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-surface-200 p-3 dark:border-surface-800"
                >
                  <div>
                    <p className="font-medium text-surface-900 dark:text-surface-50">{row.departmentName}</p>
                    <p className="text-xs text-surface-500">
                      {row.count} employees · {row.currency}
                    </p>
                  </div>
                  <p className="font-semibold">
                    {formatSalaryAmount(row.monthlyGross ?? 0, row.currency)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <ReportTable<SalaryReportRow>
        title="Salary assignments"
        rows={report.rows}
        columns={[
          { key: 'employeeCode', header: 'Employee ID' },
          { key: 'employeeName', header: 'Name' },
          { key: 'departmentName', header: 'Department' },
          { key: 'structureName', header: 'Structure' },
          { key: 'currency', header: 'Currency' },
          {
            key: 'monthlyGross',
            header: 'Monthly Gross',
            render: (row) => formatSalaryAmount(row.monthlyGross, row.currency),
          },
          {
            key: 'monthlyNet',
            header: 'Monthly Net',
            render: (row) => formatSalaryAmount(row.monthlyNet, row.currency),
          },
          {
            key: 'annualCTC',
            header: 'Annual CTC',
            render: (row) => formatSalaryAmount(row.annualCTC, row.currency),
          },
          { key: 'effectiveFrom', header: 'Effective From', render: (row) => formatDate(row.effectiveFrom) },
        ]}
      />
    </ReportPageShell>
  )
}
