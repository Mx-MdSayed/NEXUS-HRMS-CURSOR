type CacheEntry<T> = {
  value: T
  expiresAt: number
}

const store = new Map<string, CacheEntry<unknown>>()

/** Simple in-memory report cache foundation (not distributed). */
export const reportCache = {
  get<T>(key: string): T | null {
    const entry = store.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
      store.delete(key)
      return null
    }
    return entry.value as T
  },

  set<T>(key: string, value: T, ttlMs = 30_000): void {
    store.set(key, { value, expiresAt: Date.now() + ttlMs })
  },

  clear(prefix?: string): void {
    if (!prefix) {
      store.clear()
      return
    }
    for (const key of store.keys()) {
      if (key.startsWith(prefix)) store.delete(key)
    }
  },
}
