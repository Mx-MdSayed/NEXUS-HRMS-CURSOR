import { cn } from '@/utils/cn'
import { formatDate } from '@/utils/date'
import { formatSalaryAmount } from '@/features/salary/utils/money'
import { getPayslipSettings } from '../settings'
import type { Payslip, PayslipComponentLine } from '../types'
import { numberToWords } from '../utils/numberToWords'

interface PayslipTemplateProps {
  payslip: Payslip
  viewerRole: 'admin' | 'employee'
  className?: string
}

function InfoItem({ label, value }: { label: string; value?: string | number }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-slate-900">{value || '-'}</dd>
    </div>
  )
}

function formatPayslipAmount(amount: number, currency: string): string {
  const settings = getPayslipSettings()
  const formatted = formatSalaryAmount(amount, currency)
  return settings.currencyDisplay === 'code' ? `${formatted} ${currency}` : formatted
}

function AmountTable({
  title,
  rows,
  total,
  currency,
}: {
  title: string
  rows: PayslipComponentLine[]
  total: number
  currency: string
}) {
  const settings = getPayslipSettings()
  const visibleRows = settings.showZeroAmountComponents
    ? rows
    : rows.filter((row) => Math.abs(row.amount) > 0)

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200">
      <div className="bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900">{title}</div>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-wide text-slate-500">
            <th className="px-4 py-2 font-semibold">Component</th>
            <th className="px-4 py-2 text-right font-semibold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {visibleRows.length === 0 ? (
            <tr>
              <td className="px-4 py-3 text-slate-500" colSpan={2}>
                No components
              </td>
            </tr>
          ) : (
            visibleRows.map((row) => (
              <tr key={row.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2">
                  <div className="font-medium text-slate-900">{row.componentName}</div>
                  <div className="text-xs text-slate-500">
                    {row.componentCode}
                    {row.taxable ? ' · Taxable' : ''}
                    {row.statutory ? ' · Statutory' : ''}
                  </div>
                </td>
                <td className="px-4 py-2 text-right font-medium tabular-nums text-slate-900">
                  {formatPayslipAmount(row.amount, currency)}
                </td>
              </tr>
            ))
          )}
        </tbody>
        <tfoot>
          <tr className="border-t border-slate-200 bg-slate-50">
            <td className="px-4 py-2 font-semibold text-slate-900">Total</td>
            <td className="px-4 py-2 text-right font-semibold tabular-nums text-slate-900">
              {formatPayslipAmount(total, currency)}
            </td>
          </tr>
        </tfoot>
      </table>
    </section>
  )
}

export function PayslipTemplate({ payslip, viewerRole, className }: PayslipTemplateProps) {
  const settings = getPayslipSettings()
  const showEmployerContribution =
    viewerRole === 'admin' && settings.showEmployerContribution && payslip.employerContributions.length > 0
  const showEmployerCost = viewerRole === 'admin' && settings.showEmployerCostToEmployee

  return (
    <article
      className={cn(
        'payslip-document mx-auto max-w-4xl rounded-xl bg-white p-8 text-black shadow-card',
        className,
      )}
    >
      {settings.showCompanyHeader ? (
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-6">
          <div className="flex items-center gap-4">
            {payslip.companySnapshot.logoUrl ? (
              <img
                src={payslip.companySnapshot.logoUrl}
                alt=""
                className="h-14 w-14 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-slate-900 text-lg font-bold text-white">
                {payslip.companySnapshot.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-slate-950">{payslip.companySnapshot.name}</h1>
              {payslip.companySnapshot.legalName ? (
                <p className="text-sm text-slate-600">{payslip.companySnapshot.legalName}</p>
              ) : null}
              <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">
                {[payslip.companySnapshot.address, payslip.companySnapshot.phone, payslip.companySnapshot.email]
                  .filter(Boolean)
                  .join(' | ')}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payslip</p>
            <p className="mt-1 text-lg font-bold text-slate-950">{payslip.payslipNumber}</p>
            <p className="text-sm text-slate-600">{payslip.monthKey}</p>
          </div>
        </header>
      ) : null}

      <section className="grid gap-6 py-6 md:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-700">Employee details</h2>
          <dl className="grid grid-cols-2 gap-4">
            <InfoItem label="Employee" value={payslip.employeeNameSnapshot} />
            <InfoItem label="Employee code" value={payslip.employeeCodeSnapshot} />
            <InfoItem label="Department" value={payslip.departmentSnapshot} />
            <InfoItem label="Designation" value={payslip.designationSnapshot} />
            <InfoItem
              label="Joining date"
              value={
                payslip.joiningDateSnapshot
                  ? formatDate(payslip.joiningDateSnapshot, settings.dateFormat)
                  : undefined
              }
            />
            <InfoItem label="Status" value={payslip.status} />
          </dl>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-700">Payroll period</h2>
          <dl className="grid grid-cols-2 gap-4">
            <InfoItem label="Period start" value={formatDate(payslip.periodStart, settings.dateFormat)} />
            <InfoItem label="Period end" value={formatDate(payslip.periodEnd, settings.dateFormat)} />
            <InfoItem label="Currency" value={payslip.currency} />
            <InfoItem label="Generated on" value={formatDate(payslip.generatedAt, settings.dateFormat)} />
            {payslip.companySnapshot.taxId ? <InfoItem label="Tax ID" value={payslip.companySnapshot.taxId} /> : null}
            {payslip.companySnapshot.registrationNumber ? (
              <InfoItem label="Registration" value={payslip.companySnapshot.registrationNumber} />
            ) : null}
          </dl>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <AmountTable
          title="Earnings"
          rows={payslip.earnings}
          total={payslip.grossEarnings}
          currency={payslip.currency}
        />
        <AmountTable
          title="Deductions"
          rows={payslip.deductions}
          total={payslip.totalDeductions}
          currency={payslip.currency}
        />
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-700">Net salary equation</p>
            <p className="mt-1 text-sm text-slate-600">
              Gross earnings - total deductions = net salary
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-600">
              {formatPayslipAmount(payslip.grossEarnings, payslip.currency)} -{' '}
              {formatPayslipAmount(payslip.totalDeductions, payslip.currency)}
            </p>
            <p className="text-2xl font-bold text-slate-950">
              {formatPayslipAmount(payslip.netSalary, payslip.currency)}
            </p>
          </div>
        </div>
        <p className="mt-3 text-sm font-medium text-slate-700">
          Amount in words: {numberToWords(payslip.netSalary, payslip.currency)}
        </p>
        {showEmployerCost ? (
          <p className="mt-2 text-sm text-slate-600">
            Employer cost: {formatPayslipAmount(payslip.employerCost, payslip.currency)}
          </p>
        ) : null}
      </section>

      {showEmployerContribution ? (
        <section className="mt-6">
          <AmountTable
            title="Employer contributions"
            rows={payslip.employerContributions}
            total={payslip.employerContribution}
            currency={payslip.currency}
          />
        </section>
      ) : null}

      <section className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 p-4">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-700">
            Attendance summary
          </h2>
          <dl className="grid grid-cols-2 gap-4">
            <InfoItem label="Working days" value={payslip.workingDays} />
            <InfoItem label="Payable days" value={payslip.payableDays} />
            <InfoItem label="Present days" value={payslip.presentDays} />
            <InfoItem label="Absent days" value={payslip.absentDays} />
            <InfoItem label="Half days" value={payslip.halfDays} />
            <InfoItem label="Paid leave" value={payslip.paidLeaveDays} />
            <InfoItem label="Unpaid leave" value={payslip.unpaidLeaveDays} />
            <InfoItem label="Overtime hours" value={payslip.overtimeHours} />
          </dl>
        </div>

        <div className="rounded-lg border border-slate-200 p-4">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-700">Payment info</h2>
          {settings.showBankDetails ? (
            <dl className="grid grid-cols-2 gap-4">
              <InfoItem label="Method" value={payslip.paymentMethod} />
              <InfoItem label="Payment date" value={payslip.paymentDate ? formatDate(payslip.paymentDate, settings.dateFormat) : undefined} />
              <InfoItem label="Bank" value={payslip.bankName} />
              <InfoItem label="Account" value={payslip.accountNumberMasked} />
              <InfoItem label="IFSC" value={payslip.ifsc} />
              <InfoItem label="Reference" value={payslip.transactionReference} />
            </dl>
          ) : (
            <p className="text-sm text-slate-500">Bank details are hidden by payslip settings.</p>
          )}
        </div>
      </section>

      <footer className="mt-8 border-t border-slate-200 pt-4 text-center text-xs text-slate-500">
        {settings.footerText}
      </footer>
    </article>
  )
}
