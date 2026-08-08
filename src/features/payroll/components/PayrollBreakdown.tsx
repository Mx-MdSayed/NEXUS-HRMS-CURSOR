import { formatSalaryAmount } from '@/features/salary/utils/money'
import type { PayrollComponent, PayrollEmployee } from '../types'

interface PayrollBreakdownProps {
  employee: PayrollEmployee
}

function Section({
  title,
  rows,
  totalLabel,
  total,
  currency,
}: {
  title: string
  rows: PayrollComponent[]
  totalLabel: string
  total: number
  currency: string
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-50">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-surface-500">None</p>
      ) : (
        <ul className="divide-y divide-surface-200 dark:divide-surface-700 rounded-lg border border-surface-200 dark:border-surface-700">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
            >
              <span className="text-surface-700 dark:text-surface-200">
                {row.componentName}
                {row.statutory ? (
                  <span className="ml-2 text-xs text-surface-400">(statutory config)</span>
                ) : null}
              </span>
              <span className="font-medium tabular-nums text-surface-900 dark:text-surface-50">
                {formatSalaryAmount(row.amount, currency)}
              </span>
            </li>
          ))}
          <li className="flex items-center justify-between gap-3 bg-surface-50 px-3 py-2 text-sm font-semibold dark:bg-surface-800/60">
            <span>{totalLabel}</span>
            <span className="tabular-nums">{formatSalaryAmount(total, currency)}</span>
          </li>
        </ul>
      )}
    </div>
  )
}

export function PayrollBreakdown({ employee }: PayrollBreakdownProps) {
  const earnings = employee.components.filter((c) => c.category === 'earning')
  const deductions = employee.components.filter((c) => c.category === 'deduction')
  const employer = employee.components.filter((c) => c.category === 'employer_contribution')
  const currency = employee.currency

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Section
        title="Earnings"
        rows={earnings}
        totalLabel="Gross Earnings"
        total={employee.grossEarnings}
        currency={currency}
      />
      <Section
        title="Employee Deductions"
        rows={deductions}
        totalLabel="Total Deductions"
        total={employee.totalDeductions}
        currency={currency}
      />
      <div className="space-y-4">
        <Section
          title="Employer Contributions"
          rows={employer}
          totalLabel="Employer Contributions"
          total={employee.employerContribution}
          currency={currency}
        />
        <div className="rounded-lg border border-surface-200 p-3 dark:border-surface-700">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-surface-600 dark:text-surface-300">Net Salary</dt>
              <dd className="font-semibold tabular-nums text-surface-900 dark:text-surface-50">
                {formatSalaryAmount(employee.netSalary, currency)}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-surface-600 dark:text-surface-300">Employer Cost</dt>
              <dd className="font-semibold tabular-nums text-surface-900 dark:text-surface-50">
                {formatSalaryAmount(employee.employerCost, currency)}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}
