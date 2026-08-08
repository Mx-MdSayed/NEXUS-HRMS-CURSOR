export class LeaveServiceError extends Error {
  code: 'NOT_FOUND' | 'VALIDATION' | 'CONFLICT' | 'UNAUTHORIZED' | 'UNEXPECTED'

  constructor(code: LeaveServiceError['code'], message: string) {
    super(message)
    this.name = 'LeaveServiceError'
    this.code = code
  }
}
