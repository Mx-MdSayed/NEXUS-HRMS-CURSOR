import { EmployeeServiceError } from '../services/employeeService'

export function getEmployeeErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof EmployeeServiceError) return error.message
  return fallback
}
