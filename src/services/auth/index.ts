import type { AuthService } from './authService'
import { mockAuthService } from './mockAuthService'

/**
 * Active authentication adapter.
 * Replace `mockAuthService` with a real backend implementation when available.
 */
export const authService: AuthService = mockAuthService

export {
  AuthServiceError,
  getAuthErrorMessage,
  type AuthService,
  type ChangePasswordInput,
  type ResetPasswordInput,
} from './authService'
export {
  clearRememberedEmail,
  clearSession,
  getRememberedEmail,
  getSession,
  isSessionExpired,
  setRememberedEmail,
  setSession,
} from './session'
export { DEV_AUTH_ACCOUNTS } from './devAuthConfig'
