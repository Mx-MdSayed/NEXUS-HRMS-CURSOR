/**
 * Temporary development authentication adapter.
 * Swap this implementation for a real API-backed service without changing UI.
 */
import {
  AUTH_SESSION_TTL_MS,
  AUTH_SESSION_TTL_REMEMBER_MS,
} from '@/constants/app'
import { AccessControlError } from '@/features/access-control/services/errors'
import { securityService } from '@/features/access-control/services/securityService'
import { userManagementService } from '@/features/access-control/services/userManagementService'
import type { AuthSession, LoginCredentials, LoginResult, User } from '@/types'
import {
  AuthServiceError,
  type AuthService,
  type ChangePasswordInput,
  type ResetPasswordInput,
} from './authService'
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

export const mockAuthService: AuthService = {
  async login(credentials: LoginCredentials): Promise<LoginResult> {
    await delay()

    const email = credentials.email.trim().toLowerCase()
    try {
      const user = await userManagementService.authenticate(email, credentials.password)
      if (!user) {
        await securityService.recordLogin('unknown', 'Unknown', email, false)
        throw new AuthServiceError(
          'INVALID_CREDENTIALS',
          'Invalid email or password. Please try again.',
        )
      }
      await securityService.recordLogin(user.id, user.name, user.email, true)
      const session = buildSession(user, Boolean(credentials.rememberMe))
      setSession(session)
      return { session }
    } catch (error) {
      if (error instanceof AccessControlError) {
        await securityService.recordLogin('unknown', 'Unknown', email, false)
        throw new AuthServiceError('UNAUTHORIZED', error.message)
      }
      throw error
    }
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
    const managed = userManagementService.findByEmailSync(session.user.email)
    return managed ?? session.user
  },

  async refreshSession(): Promise<LoginResult | null> {
    await delay(200)
    const current = getSession()
    if (!current || isSessionExpired(current)) {
      clearSession()
      return null
    }
    const managed = userManagementService.findByEmailSync(current.user.email)
    const user = managed ?? current.user
    const next = buildSession(user, current.rememberMe)
    setSession(next)
    return { session: next }
  },

  async requestPasswordReset(_email: string): Promise<void> {
    await delay()
  },

  async resetPassword(_input: ResetPasswordInput): Promise<void> {
    await delay()
  },

  async changePassword(input: ChangePasswordInput): Promise<void> {
    await delay()
    const session = getSession()
    if (!session || isSessionExpired(session)) {
      clearSession()
      throw new AuthServiceError('SESSION_EXPIRED', 'Your session has expired. Please sign in again.')
    }

    const internal = userManagementService.findInternalByEmail(session.user.email)
    if (!internal || internal.password !== input.currentPassword) {
      throw new AuthServiceError('UNAUTHORIZED', 'Current password is incorrect.')
    }

    if (input.currentPassword === input.newPassword) {
      throw new AuthServiceError(
        'UNEXPECTED',
        'New password must be different from the current password.',
      )
    }

    internal.password = input.newPassword
    userManagementService.markPasswordChanged(internal.id)
    const refreshed = userManagementService.findByEmailSync(session.user.email)
    if (refreshed) {
      setSession(buildSession(refreshed, session.rememberMe))
    }
  },
}
