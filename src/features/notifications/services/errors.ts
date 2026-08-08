export type NotificationErrorCode =
  | 'NOT_FOUND'
  | 'VALIDATION'
  | 'CONFLICT'
  | 'UNAUTHORIZED'
  | 'UNEXPECTED'

export class NotificationServiceError extends Error {
  code: NotificationErrorCode

  constructor(code: NotificationErrorCode, message: string) {
    super(message)
    this.name = 'NotificationServiceError'
    this.code = code
  }
}
