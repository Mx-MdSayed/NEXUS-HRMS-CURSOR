import type { PayrollValidationIssue } from '../types'

interface PayrollValidationPanelProps {
  ready: number
  errors: PayrollValidationIssue[]
  warnings: PayrollValidationIssue[]
}

export function PayrollValidationPanel({
  ready,
  errors,
  warnings,
}: PayrollValidationPanelProps) {
  return (
    <div className="space-y-4" role="region" aria-label="Payroll validation summary">
      <div className="flex flex-wrap gap-3 text-sm">
        <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
          Ready: {ready} employees
        </span>
        <span className="rounded-md bg-amber-50 px-2.5 py-1 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          Warnings: {warnings.length}
        </span>
        <span className="rounded-md bg-rose-50 px-2.5 py-1 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
          Errors: {errors.length}
        </span>
      </div>

      {errors.length > 0 ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50/80 p-3 dark:border-rose-900 dark:bg-rose-950/30">
          <h3 className="text-sm font-semibold text-rose-900 dark:text-rose-100">Errors</h3>
          <ul className="mt-2 space-y-1 text-sm text-rose-800 dark:text-rose-200">
            {errors.map((issue, index) => (
              <li key={`${issue.employeeId}-e-${index}`}>
                <span className="font-medium">{issue.employeeName}</span> — {issue.message}{' '}
                <span className="text-xs opacity-80">[{issue.code}]</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {warnings.length > 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-3 dark:border-amber-900 dark:bg-amber-950/30">
          <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100">Warnings</h3>
          <ul className="mt-2 space-y-1 text-sm text-amber-800 dark:text-amber-200">
            {warnings.map((issue, index) => (
              <li key={`${issue.employeeId}-w-${index}`}>
                <span className="font-medium">{issue.employeeName}</span> — {issue.message}{' '}
                <span className="text-xs opacity-80">[{issue.code}]</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
