import { formatSalaryAmount } from '@/features/salary/utils/money'
import type { PayrollRun } from '../types'

interface PayrollRunSummaryProps {
  run: PayrollRun
}

export function PayrollRunSummary({ run }: PayrollRunSummaryProps) {
  const items = [
    { label: 'Employees', value: String(run.employeeCount) },
    { label: 'Gross Payroll', value: formatSalaryAmount(run.grossPayroll, run.currency) },
    { label: 'Deductions', value: formatSalaryAmount(run.totalDeductions, run.currency) },
    {
      label: 'Employer Contributions',
      value: formatSalaryAmount(run.totalEmployerContribution, run.currency),
    },
    { label: 'Net Payroll', value: formatSalaryAmount(run.totalNetPayroll, run.currency) },
    { label: 'Employer Cost', value: formatSalaryAmount(run.totalEmployerCost, run.currency) },
    { label: 'Average Net', value: formatSalaryAmount(run.averageNetSalary, run.currency) },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-lg border border-surface-200 bg-surface-50/80 px-3 py-2 dark:border-surface-700 dark:bg-surface-800/40"
        >
          <p className="text-xs text-surface-500 dark:text-surface-400">{item.label}</p>
          <p className="mt-1 text-sm font-semibold tabular-nums text-surface-900 dark:text-surface-50">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  )
}
