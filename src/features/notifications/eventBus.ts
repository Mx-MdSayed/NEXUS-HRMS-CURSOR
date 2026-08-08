import type { Notification } from './types'

type NotificationEvent =
  | { type: 'created'; notification: Notification }
  | { type: 'updated'; notification: Notification }
  | { type: 'bulk-updated'; recipientIds?: string[] }

type Listener = (event: NotificationEvent) => void

const listeners = new Set<Listener>()

export const notificationEventBus = {
  emit(event: NotificationEvent) {
    listeners.forEach((listener) => listener(event))
  },
  on(listener: Listener) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}
