export type ReportServiceErrorCode = 'UNAUTHORIZED' | 'VALIDATION' | 'NOT_FOUND'

export class ReportServiceError extends Error {
  code: ReportServiceErrorCode

  constructor(code: ReportServiceErrorCode, message: string) {
    super(message)
    this.name = 'ReportServiceError'
    this.code = code
  }
}
