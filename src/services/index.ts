export {
  authService,
  AuthServiceError,
  getAuthErrorMessage,
  clearRememberedEmail,
  clearSession,
  getRememberedEmail,
  getSession,
  isSessionExpired,
  setRememberedEmail,
  setSession,
  DEV_AUTH_ACCOUNTS,
} from './auth'
export type { AuthService, ChangePasswordInput, ResetPasswordInput } from './auth'

/** Future API base URL for backend integration. */
export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'
