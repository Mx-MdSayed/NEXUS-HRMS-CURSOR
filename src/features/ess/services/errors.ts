export type EssServiceErrorCode = 'UNAUTHORIZED' | 'NOT_FOUND' | 'VALIDATION' | 'CONFLICT'

export class EssServiceError extends Error {
  code: EssServiceErrorCode

  constructor(code: EssServiceErrorCode, message: string) {
    super(message)
    this.name = 'EssServiceError'
    this.code = code
  }
}
