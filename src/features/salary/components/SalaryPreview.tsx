import { formatSalaryAmount } from '../utils/money'
import type { SalaryCalculationResult } from '../types'
import type { SalaryCurrencyCode } from '@/constants/currencies'

interface SalaryPreviewProps {
  result: SalaryCalculationResult | null
  currency?: SalaryCurrencyCode
  compact?: boolean
}

export function SalaryPreview({ result, currency = 'INR', compact }: SalaryPreviewProps) {
  if (!result) {
    return (
      <div className="rounded-xl border border-dashed border-surface-300 p-6 text-sm text-surface-500 dark:border-surface-700">
        Add components to see a live salary preview.
      </div>
    )
  }

  const cur = result.currency || currency

  return (
    <div
      className={
        compact
          ? 'space-y-4'
          : 'space-y-5 rounded-xl border border-surface-200 bg-white p-5 shadow-card dark:border-surface-800 dark:bg-surface-900'
      }
    >
      <h3 className="text-card-title">Salary preview</h3>

      <section>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-surface-500">
          Earnings
        </h4>
        <ul className="space-y-1.5 text-sm">
          {result.earnings.map((item) => (
            <li key={item.componentId} className="flex justify-between gap-3">
              <span>
                {item.name}
                {!item.taxable ? (
                  <span className="ml-1 text-xs text-surface-400">(non-taxable)</span>
                ) : null}
              </span>
              <span className="font-medium tabular-nums">{formatSalaryAmount(item.amount, cur)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex justify-between border-t border-surface-100 pt-2 text-sm font-semibold dark:border-surface-800">
          <span>Gross salary</span>
          <span className="tabular-nums">{formatSalaryAmount(result.monthlyGross, cur)}</span>
        </div>
      </section>

      <section>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-surface-500">
          Deductions
        </h4>
        {result.deductions.length === 0 ? (
          <p className="text-sm text-surface-500">No deductions</p>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {result.deductions.map((item) => (
              <li key={item.componentId} className="flex justify-between gap-3">
                <span>
                  {item.name}
                  {item.statutory ? (
                    <span className="ml-1 text-xs text-surface-400">(statutory)</span>
                  ) : null}
                </span>
                <span className="font-medium tabular-nums">
                  {formatSalaryAmount(item.amount, cur)}
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-2 flex justify-between border-t border-surface-100 pt-2 text-sm font-semibold dark:border-surface-800">
          <span>Net salary</span>
          <span className="tabular-nums">{formatSalaryAmount(result.monthlyNet, cur)}</span>
        </div>
      </section>

      <section>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-surface-500">
          Employer contributions
        </h4>
        {result.employerContributions.length === 0 ? (
          <p className="text-sm text-surface-500">None</p>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {result.employerContributions.map((item) => (
              <li key={item.componentId} className="flex justify-between gap-3">
                <span>{item.name}</span>
                <span className="font-medium tabular-nums">
                  {formatSalaryAmount(item.amount, cur)}
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 space-y-1 rounded-lg bg-surface-50 p-3 text-sm dark:bg-surface-950/50">
          <div className="flex justify-between font-semibold">
            <span>Monthly CTC</span>
            <span className="tabular-nums">{formatSalaryAmount(result.monthlyCTC, cur)}</span>
          </div>
          <div className="flex justify-between text-surface-600 dark:text-surface-300">
            <span>Annual CTC</span>
            <span className="tabular-nums">{formatSalaryAmount(result.annualCTC, cur)}</span>
          </div>
          <div className="flex justify-between text-surface-600 dark:text-surface-300">
            <span>Annual gross</span>
            <span className="tabular-nums">{formatSalaryAmount(result.annualGross, cur)}</span>
          </div>
        </div>
      </section>
    </div>
  )
}
