export type PayslipServiceErrorCode =
  | 'NOT_FOUND'
  | 'VALIDATION'
  | 'CONFLICT'
  | 'UNAUTHORIZED'
  | 'LOCKED'
  | 'NOT_FINALIZED'

export class PayslipServiceError extends Error {
  code: PayslipServiceErrorCode

  constructor(code: PayslipServiceErrorCode, message: string) {
    super(message)
    this.name = 'PayslipServiceError'
    this.code = code
  }
}
