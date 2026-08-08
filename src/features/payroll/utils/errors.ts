import { PayrollServiceError } from '../services/errors'

export function getPayrollErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof PayrollServiceError) return error.message
  if (error instanceof Error && error.message) return error.message
  return fallback
}
