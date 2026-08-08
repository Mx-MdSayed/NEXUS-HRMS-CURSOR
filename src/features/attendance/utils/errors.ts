import { AttendanceServiceError } from '../services/errors'

export function getAttendanceErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AttendanceServiceError) return error.message
  return fallback
}
