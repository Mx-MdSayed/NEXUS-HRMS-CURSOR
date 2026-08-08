import { PayslipServiceError } from '../services/errors'

export function getPayslipErrorMessage(err: unknown, fallback = 'Something went wrong.'): string {
  if (err instanceof PayslipServiceError) return err.message
  if (err instanceof Error && err.message) return err.message
  return fallback
}
