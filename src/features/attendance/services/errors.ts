export class AttendanceServiceError extends Error {
  code: 'NOT_FOUND' | 'VALIDATION' | 'CONFLICT' | 'UNAUTHORIZED' | 'UNEXPECTED'

  constructor(code: AttendanceServiceError['code'], message: string) {
    super(message)
    this.name = 'AttendanceServiceError'
    this.code = code
  }
}
