import { useNavigate } from 'react-router-dom'
import { Button, Card, CardContent, CardHeader, CardTitle, StatusBadge } from '@/components/ui'
import { formatCurrency } from '@/utils/currency'
import type { PayrollSummary } from '../types'

export function PayrollSummaryCard({ data }: { data: PayrollSummary }) {
  const navigate = useNavigate()

  return (
    <Card>
      <CardHeader>
        <div className="flex w-full items-start justify-between gap-3">
          <div>
            <CardTitle>Payroll Summary</CardTitle>
            <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">{data.periodLabel}</p>
          </div>
          <StatusBadge status={data.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-surface-500 dark:text-surface-400">Current Payroll</p>
          <p className="mt-1 font-display text-3xl font-semibold text-surface-900 dark:text-surface-50">
            {formatCurrency(data.totalPayroll)}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-surface-200 px-3 py-2 dark:border-surface-800">
            <p className="text-xs text-surface-500">Paid</p>
            <p className="mt-1 text-sm font-semibold text-success-700 dark:text-success-500">
              {formatCurrency(data.paidAmount)}
            </p>
          </div>
          <div className="rounded-lg border border-surface-200 px-3 py-2 dark:border-surface-800">
            <p className="text-xs text-surface-500">Pending</p>
            <p className="mt-1 text-sm font-semibold text-warning-700 dark:text-warning-500">
              {formatCurrency(data.pendingAmount)}
            </p>
          </div>
        </div>
        <p className="text-sm text-surface-500 dark:text-surface-400">
          Employees processed: {data.employeesProcessed} / {data.totalEmployees}
        </p>
        <Button variant="outline" onClick={() => navigate('/payroll')}>
          Open Payroll
        </Button>
      </CardContent>
    </Card>
  )
}
