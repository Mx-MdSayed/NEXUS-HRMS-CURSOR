import {
  AUTH_SESSION_TTL_MS,
  AUTH_SESSION_TTL_REMEMBER_MS,
} from '@/constants/app'
import type { AuthSession, LoginCredentials, LoginResult, User } from '@/types'
import {
  AuthServiceError,
  type AuthService,
  type ChangePasswordInput,
  type ResetPasswordInput,
} from './authService'
import { DEV_AUTH_ACCOUNTS, toPublicUser } from './devAuthConfig'
import { clearSession, getSession, isSessionExpired, setSession } from './session'

function delay(ms = 450): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function createToken(userId: string): string {
  return `mock_token_${userId}_${Date.now()}`
}

function buildSession(user: User, rememberMe: boolean): AuthSession {
  const ttl = rememberMe ? AUTH_SESSION_TTL_REMEMBER_MS : AUTH_SESSION_TTL_MS
  return {
    user,
    accessToken: createToken(user.id),
    expiresAt: new Date(Date.now() + ttl).toISOString(),
    rememberMe,
  }
}

/**
 * Temporary development authentication adapter.
 * Swap this implementation for a real API-backed service without changing UI.
 */
export const mockAuthService: AuthService = {
  async login(credentials: LoginCredentials): Promise<LoginResult> {
    await delay()

    const email = credentials.email.trim().toLowerCase()
    const account = DEV_AUTH_ACCOUNTS.find((item) => item.email === email)

    if (!account || account.password !== credentials.password) {
      throw new AuthServiceError(
        'INVALID_CREDENTIALS',
        'Invalid email or password. Please try again.',
      )
    }

    const user = toPublicUser(account)
    const session = buildSession(user, Boolean(credentials.rememberMe))
    setSession(session)
    return { session }
  },

  async logout(): Promise<void> {
    await delay(200)
    clearSession()
  },

  async getCurrentUser(): Promise<User | null> {
    await delay(150)
    const session = getSession()
    if (!session || isSessionExpired(session)) {
      clearSession()
      return null
    }
    return session.user
  },

  async refreshSession(): Promise<LoginResult | null> {
    await delay(200)
    const current = getSession()
    if (!current || isSessionExpired(current)) {
      clearSession()
      return null
    }

    const next = buildSession(current.user, current.rememberMe)
    setSession(next)
    return { session: next }
  },

  async requestPasswordReset(_email: string): Promise<void> {
    await delay()
    // Intentionally no-op / no email enumeration.
  },

  async resetPassword(_input: ResetPasswordInput): Promise<void> {
    await delay()
    // Mock success for UI flow. Backend integration will replace this.
  },

  async changePassword(input: ChangePasswordInput): Promise<void> {
    await delay()
    const session = getSession()
    if (!session || isSessionExpired(session)) {
      clearSession()
      throw new AuthServiceError('SESSION_EXPIRED', 'Your session has expired. Please sign in again.')
    }

    const account = DEV_AUTH_ACCOUNTS.find(
      (item) => item.email === session.user.email.toLowerCase(),
    )

    if (!account || account.password !== input.currentPassword) {
      throw new AuthServiceError('UNAUTHORIZED', 'Current password is incorrect.')
    }

    if (input.currentPassword === input.newPassword) {
      throw new AuthServiceError(
        'UNEXPECTED',
        'New password must be different from the current password.',
      )
    }

    // Development-only in-memory update for the mock adapter.
    account.password = input.newPassword
  },
}
