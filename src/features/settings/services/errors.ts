export type SettingsErrorCode = 'UNAUTHORIZED' | 'VALIDATION' | 'NOT_FOUND' | 'CONFLICT'

export class SettingsServiceError extends Error {
  code: SettingsErrorCode

  constructor(code: SettingsErrorCode, message: string) {
    super(message)
    this.name = 'SettingsServiceError'
    this.code = code
  }
}

export function getSettingsErrorMessage(error: unknown, fallback = 'Unable to save settings.'): string {
  if (error instanceof SettingsServiceError) return error.message
  if (error instanceof Error && error.message) return error.message
  return fallback
}
