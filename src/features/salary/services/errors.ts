export class SalaryServiceError extends Error {
  code: 'NOT_FOUND' | 'VALIDATION' | 'CONFLICT' | 'UNAUTHORIZED' | 'UNEXPECTED'

  constructor(code: SalaryServiceError['code'], message: string) {
    super(message)
    this.name = 'SalaryServiceError'
    this.code = code
  }
}
