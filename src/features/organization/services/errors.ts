export class DepartmentServiceError extends Error {
  code: 'NOT_FOUND' | 'VALIDATION' | 'CONFLICT' | 'UNAUTHORIZED' | 'UNEXPECTED'

  constructor(code: DepartmentServiceError['code'], message: string) {
    super(message)
    this.name = 'DepartmentServiceError'
    this.code = code
  }
}

export class DesignationServiceError extends Error {
  code: 'NOT_FOUND' | 'VALIDATION' | 'CONFLICT' | 'UNAUTHORIZED' | 'UNEXPECTED'

  constructor(code: DesignationServiceError['code'], message: string) {
    super(message)
    this.name = 'DesignationServiceError'
    this.code = code
  }
}
