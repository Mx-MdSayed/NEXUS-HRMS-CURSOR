import { DepartmentServiceError, DesignationServiceError } from '../services/errors'

export function getOrgErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof DepartmentServiceError || error instanceof DesignationServiceError) {
    return error.message
  }
  return fallback
}
