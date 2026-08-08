export class PayrollServiceError extends Error {
  code:
    | 'NOT_FOUND'
    | 'VALIDATION'
    | 'CONFLICT'
    | 'UNAUTHORIZED'
    | 'LOCKED'
    | 'MIXED_CURRENCY'
    | 'CALCULATION'

  constructor(code: PayrollServiceError['code'], message: string) {
    super(message)
    this.name = 'PayrollServiceError'
    this.code = code
  }
}
