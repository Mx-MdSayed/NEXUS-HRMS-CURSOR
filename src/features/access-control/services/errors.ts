export type AccessControlErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION'
  | 'LAST_SUPER_ADMIN'

export class AccessControlError extends Error {
  code: AccessControlErrorCode

  constructor(code: AccessControlErrorCode, message: string) {
    super(message)
    this.name = 'AccessControlError'
    this.code = code
  }
}

export function getAccessControlErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (error instanceof AccessControlError) return error.message
  if (error instanceof Error && error.message) return error.message
  return fallback
}
