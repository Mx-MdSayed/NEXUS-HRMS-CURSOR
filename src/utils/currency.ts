import { companyDefaults } from '@/config'

export function formatCurrency(
  amount: number,
  options?: {
    currencyCode?: string
    locale?: string
    minimumFractionDigits?: number
    maximumFractionDigits?: number
  },
): string {
  const {
    currencyCode = companyDefaults.currencyCode,
    locale = companyDefaults.currencyLocale,
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
  } = options ?? {}

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount)
}
