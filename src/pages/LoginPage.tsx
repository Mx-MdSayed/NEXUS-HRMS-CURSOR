import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { APP_NAME, APP_TAGLINE } from '@/constants'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from '@/components/ui'
import { showInfo, showSuccess } from '@/utils/toast'

interface LoginFormValues {
  email: string
  password: string
}

export function LoginPage() {
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: 'alex.morgan@nexus-hrms.com',
      password: '',
    },
  })

  const onSubmit = async (_values: LoginFormValues) => {
    showSuccess('Signed in to the foundation shell.')
    showInfo('Real authentication will be implemented later.')
    navigate('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-100 px-4 dark:bg-surface-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgb(47_145_138_/_0.12),_transparent_55%)]" aria-hidden />
      <Card className="relative z-10 w-full max-w-md">
        <CardHeader>
          <div>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 font-display text-sm font-bold text-white">
              N
            </div>
            <CardTitle className="text-xl">{APP_NAME}</CardTitle>
            <CardDescription>{APP_TAGLINE}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Enter a valid email address',
                },
              })}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'Password must be at least 6 characters' },
              })}
            />
            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              Sign in
            </Button>
            <p className="text-center text-xs text-surface-500 dark:text-surface-400">
              Auth is a placeholder in Module 1. Use any password of 6+ characters to continue.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
