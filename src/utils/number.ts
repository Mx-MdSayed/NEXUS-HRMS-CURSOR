import { companyDefaults } from '@/config'

export function formatNumber(
  value: number,
  options?: {
    locale?: string
    minimumFractionDigits?: number
    maximumFractionDigits?: number
  },
): string {
  const {
    locale = companyDefaults.currencyLocale,
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
  } = options ?? {}

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value)
}

export function formatInteger(value: number, locale?: string): string {
  return formatNumber(value, {
    locale,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}
