import type { AuthSession } from '@/types'
import {
  AUTH_REMEMBER_EMAIL_KEY,
  AUTH_SESSION_STORAGE_KEY,
} from '@/constants/app'

function readStorage(preferLocal: boolean): Storage {
  return preferLocal ? window.localStorage : window.sessionStorage
}

function parseSession(raw: string | null): AuthSession | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as AuthSession
    if (!parsed?.user?.id || !parsed.accessToken || !parsed.expiresAt) return null
    return parsed
  } catch {
    return null
  }
}

export function getSession(): AuthSession | null {
  if (typeof window === 'undefined') return null

  const fromLocal = parseSession(window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY))
  if (fromLocal) return fromLocal

  return parseSession(window.sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY))
}

export function setSession(session: AuthSession): void {
  const storage = readStorage(session.rememberMe)
  const alternate = readStorage(!session.rememberMe)

  alternate.removeItem(AUTH_SESSION_STORAGE_KEY)
  storage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session))
}

export function clearSession(): void {
  window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY)
  window.sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY)
}

export function isSessionExpired(session: AuthSession | null): boolean {
  if (!session) return true
  return new Date(session.expiresAt).getTime() <= Date.now()
}

export function getRememberedEmail(): string {
  return window.localStorage.getItem(AUTH_REMEMBER_EMAIL_KEY) ?? ''
}

export function setRememberedEmail(email: string): void {
  window.localStorage.setItem(AUTH_REMEMBER_EMAIL_KEY, email)
}

export function clearRememberedEmail(): void {
  window.localStorage.removeItem(AUTH_REMEMBER_EMAIL_KEY)
}
