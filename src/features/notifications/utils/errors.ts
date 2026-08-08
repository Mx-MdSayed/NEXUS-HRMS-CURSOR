import { NotificationServiceError } from '../services/errors'

export function getNotificationErrorMessage(error: unknown, fallback = 'Unable to update notifications.'): string {
  if (error instanceof NotificationServiceError) return error.message
  if (error instanceof Error) return error.message
  return fallback
}
