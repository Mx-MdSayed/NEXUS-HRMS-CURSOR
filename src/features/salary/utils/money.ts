import type { SalaryCurrencyCode } from '@/constants/currencies'
import { getCurrencyConfig } from '@/constants/currencies'
import { formatCurrency } from '@/utils/currency'

/**
 * Round monetary amounts using currency precision.
 * Avoids unsafe floating-point accumulation in salary math.
 */
export function roundSalaryAmount(amount: number, currency: SalaryCurrencyCode | string = 'INR'): number {
  const digits = getCurrencyConfig(currency).fractionDigits
  const factor = 10 ** digits
  // Number.EPSILON helps stabilize edge cases like 1.005
  return Math.round((amount + Number.EPSILON) * factor) / factor
}

export function monthlyToAnnual(monthly: number, currency: SalaryCurrencyCode | string = 'INR'): number {
  return roundSalaryAmount(monthly * 12, currency)
}

export function annualToMonthly(annual: number, currency: SalaryCurrencyCode | string = 'INR'): number {
  return roundSalaryAmount(annual / 12, currency)
}

export function formatSalaryAmount(
  amount: number,
  currency: SalaryCurrencyCode | string = 'INR',
  options?: { minimumFractionDigits?: number; maximumFractionDigits?: number },
): string {
  const config = getCurrencyConfig(currency)
  return formatCurrency(roundSalaryAmount(amount, currency), {
    currencyCode: config.code,
    locale: config.locale,
    minimumFractionDigits: options?.minimumFractionDigits ?? 0,
    maximumFractionDigits: options?.maximumFractionDigits ?? config.fractionDigits,
  })
}
