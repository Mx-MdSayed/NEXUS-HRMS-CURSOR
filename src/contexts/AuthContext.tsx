import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { LoginCredentials, PermissionName, RoleName, User } from '@/types'
import {
  authService,
  clearRememberedEmail,
  clearSession,
  getRememberedEmail,
  getSession,
  isSessionExpired,
  setRememberedEmail,
} from '@/services/auth'
import {
  hasAllPermissions as checkAllPermissions,
  hasAnyPermission as checkAnyPermission,
  hasPermission as checkPermission,
  hasRole as checkRole,
} from '@/lib/permissions'
import { showError, showInfo } from '@/utils/toast'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<User>
  logout: () => Promise<void>
  refreshSession: () => Promise<User | null>
  hasPermission: (permission: PermissionName | PermissionName[]) => boolean
  hasAnyPermission: (permissions: PermissionName[]) => boolean
  hasAllPermissions: (permissions: PermissionName[]) => boolean
  hasRole: (role: RoleName | RoleName[]) => boolean
  rememberedEmail: string
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [rememberedEmail, setRememberedEmailState] = useState('')

  useEffect(() => {
    let active = true

    const bootstrap = async () => {
      try {
        setRememberedEmailState(getRememberedEmail())
        const session = getSession()

        if (!session || isSessionExpired(session)) {
          clearSession()
          if (active) setUser(null)
          return
        }

        const currentUser = await authService.getCurrentUser()
        if (active) setUser(currentUser)
      } catch {
        clearSession()
        if (active) setUser(null)
      } finally {
        if (active) setIsLoading(false)
      }
    }

    void bootstrap()

    return () => {
      active = false
    }
  }, [])

  const login = useCallback(async (credentials: LoginCredentials) => {
    const result = await authService.login(credentials)
    setUser(result.session.user)

    if (credentials.rememberMe) {
      setRememberedEmail(credentials.email.trim().toLowerCase())
      setRememberedEmailState(credentials.email.trim().toLowerCase())
    } else {
      clearRememberedEmail()
      setRememberedEmailState('')
    }

    return result.session.user
  }, [])

  const logout = useCallback(async () => {
    await authService.logout()
    clearSession()
    setUser(null)
    showInfo('You have been signed out.')
  }, [])

  const refreshSession = useCallback(async () => {
    const result = await authService.refreshSession()
    if (!result) {
      setUser(null)
      showError('Your session has expired. Please sign in again.')
      return null
    }
    setUser(result.session.user)
    return result.session.user
  }, [])

  const hasPermission = useCallback(
    (permission: PermissionName | PermissionName[]) => checkPermission(user, permission),
    [user],
  )
  const hasAnyPermission = useCallback(
    (permissions: PermissionName[]) => checkAnyPermission(user, permissions),
    [user],
  )
  const hasAllPermissions = useCallback(
    (permissions: PermissionName[]) => checkAllPermissions(user, permissions),
    [user],
  )
  const hasRole = useCallback(
    (role: RoleName | RoleName[]) => checkRole(user, role),
    [user],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      logout,
      refreshSession,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      hasRole,
      rememberedEmail,
    }),
    [
      user,
      isLoading,
      login,
      logout,
      refreshSession,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      hasRole,
      rememberedEmail,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
