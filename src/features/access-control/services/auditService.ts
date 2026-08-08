import type { SecurityEvent, SecurityEventType } from '../types'

let events: SecurityEvent[] = []
let seq = 1

function delay(ms = 80): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const auditService = {
  async log(input: {
    userId?: string
    userName?: string
    eventType: SecurityEventType
    description: string
    metadata?: Record<string, string>
  }): Promise<SecurityEvent> {
    await delay()
    const event: SecurityEvent = {
      id: `sec_${seq++}`,
      userId: input.userId,
      userName: input.userName,
      eventType: input.eventType,
      description: input.description,
      timestamp: new Date().toISOString(),
      metadata: input.metadata,
    }
    events = [event, ...events].slice(0, 200)
    return event
  },

  async list(limit = 50): Promise<SecurityEvent[]> {
    await delay()
    return events.slice(0, limit)
  },

  seed(initial: SecurityEvent[]): void {
    events = [...initial]
    seq = initial.length + 1
  },
}
