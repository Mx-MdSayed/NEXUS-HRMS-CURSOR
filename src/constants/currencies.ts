/** Supported salary currencies — do not assume INR inside salary components. */
export type SalaryCurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP'

export interface CurrencyConfig {
  code: SalaryCurrencyCode
  label: string
  symbol: string
  locale: string
  /** Display / rounding fraction digits */
  fractionDigits: number
}

export const SALARY_CURRENCIES: Record<SalaryCurrencyCode, CurrencyConfig> = {
  INR: {
    code: 'INR',
    label: 'Indian Rupee (INR)',
    symbol: '₹',
    locale: 'en-IN',
    fractionDigits: 2,
  },
  USD: {
    code: 'USD',
    label: 'US Dollar (USD)',
    symbol: '$',
    locale: 'en-US',
    fractionDigits: 2,
  },
  EUR: {
    code: 'EUR',
    label: 'Euro (EUR)',
    symbol: '€',
    locale: 'de-DE',
    fractionDigits: 2,
  },
  GBP: {
    code: 'GBP',
    label: 'British Pound (GBP)',
    symbol: '£',
    locale: 'en-GB',
    fractionDigits: 2,
  },
}

export const DEFAULT_SALARY_CURRENCY: SalaryCurrencyCode = 'INR'

export const SALARY_CURRENCY_OPTIONS = (
  Object.values(SALARY_CURRENCIES) as CurrencyConfig[]
).map((item) => ({
  value: item.code,
  label: item.label,
}))

export function getCurrencyConfig(code: string): CurrencyConfig {
  if (code in SALARY_CURRENCIES) {
    return SALARY_CURRENCIES[code as SalaryCurrencyCode]
  }
  return SALARY_CURRENCIES[DEFAULT_SALARY_CURRENCY]
}
