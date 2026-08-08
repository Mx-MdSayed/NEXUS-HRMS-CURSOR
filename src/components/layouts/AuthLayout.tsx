import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Moon, Sun } from 'lucide-react'
import { APP_NAME, APP_TAGLINE } from '@/constants'
import { useTheme } from '@/contexts/ThemeContext'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'

export function AuthLayout({
  title,
  description,
  children,
  footer,
}: {
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
}) {
  const { isDark, toggleTheme } = useTheme()

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-surface-100 px-4 py-10 dark:bg-surface-950">
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgb(47_145_138_/_0.12),_transparent_55%)]"
        aria-hidden
      />
      <div className="absolute top-4 right-4 z-20">
        <Button
          variant="ghost"
          size="sm"
          className="!px-2"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={toggleTheme}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>

      <Card className="relative z-10 w-full max-w-md">
        <CardHeader>
          <div>
            <Link to="/login" className="mb-4 inline-flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 font-display text-sm font-bold text-white">
                N
              </span>
              <span>
                <span className="block font-display text-sm font-semibold text-surface-900 dark:text-surface-50">
                  {APP_NAME}
                </span>
                <span className="block text-xs text-surface-500 dark:text-surface-400">{APP_TAGLINE}</span>
              </span>
            </Link>
            <CardTitle className="text-xl">{title}</CardTitle>
            {description ? <CardDescription>{description}</CardDescription> : null}
          </div>
        </CardHeader>
        <CardContent>
          {children}
          {footer ? <div className="mt-6">{footer}</div> : null}
        </CardContent>
      </Card>
    </div>
  )
}
