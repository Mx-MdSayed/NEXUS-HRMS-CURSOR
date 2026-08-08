import { ReportServiceError } from '../services/errors'

export function getReportErrorMessage(error: unknown, fallback = 'Failed to load report.'): string {
  if (error instanceof ReportServiceError) return error.message
  if (error instanceof Error) return error.message || fallback
  return fallback
}
