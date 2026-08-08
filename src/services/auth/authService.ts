import type { LoginCredentials, LoginResult, User } from '@/types'

export interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
}

export interface ResetPasswordInput {
  token: string
  newPassword: string
}

export interface AuthService {
  login(credentials: LoginCredentials): Promise<LoginResult>
  logout(): Promise<void>
  getCurrentUser(): Promise<User | null>
  refreshSession(): Promise<LoginResult | null>
  requestPasswordReset(email: string): Promise<void>
  resetPassword(input: ResetPasswordInput): Promise<void>
  changePassword(input: ChangePasswordInput): Promise<void>
}

export class AuthServiceError extends Error {
  code: 'INVALID_CREDENTIALS' | 'SESSION_EXPIRED' | 'UNAUTHORIZED' | 'NETWORK_ERROR' | 'UNEXPECTED'

  constructor(
    code: AuthServiceError['code'],
    message: string,
  ) {
    super(message)
    this.name = 'AuthServiceError'
    this.code = code
  }
}

export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof AuthServiceError) {
    switch (error.code) {
      case 'INVALID_CREDENTIALS':
        return 'Invalid email or password. Please try again.'
      case 'SESSION_EXPIRED':
        return 'Your session has expired. Please sign in again.'
      case 'UNAUTHORIZED':
        return 'You are not authorized to perform this action.'
      case 'NETWORK_ERROR':
        return 'Unable to reach the authentication service. Please try again.'
      default:
        return 'Something went wrong while signing in. Please try again.'
    }
  }

  return 'Something went wrong while signing in. Please try again.'
}
