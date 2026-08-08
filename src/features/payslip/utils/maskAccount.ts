import { maskSensitiveValue } from '@/features/employees/utils/format'

export function maskAccountNumber(value?: string): string {
  return maskSensitiveValue(value, 4)
}

export { maskSensitiveValue }
