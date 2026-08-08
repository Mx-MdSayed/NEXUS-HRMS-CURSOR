import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { MIN_PASSWORD_LENGTH } from '@/constants/app'
import { useAuth } from '@/contexts/AuthContext'
import { AuthLayout } from '@/components/layouts/AuthLayout'
import { PasswordInput } from '@/components/forms/PasswordInput'
import { Button, Checkbox, Input } from '@/components/ui'
import { getAuthErrorMessage, getRememberedEmail } from '@/services/auth'
import { showError, showSuccess } from '@/utils/toast'

interface LoginFormValues {
  email: string
  password: string
  rememberMe: boolean
}

export function LoginPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { login } = useAuth()
  const rememberedEmail = getRememberedEmail()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: rememberedEmail,
      password: '',
      rememberMe: Boolean(rememberedEmail),
    },
  })

  const onSubmit = async (values: LoginFormValues) => {
    try {
      await login({
        email: values.email,
        password: values.password,
        rememberMe: values.rememberMe,
      })
      showSuccess('Signed in successfully.')
      const redirect = params.get('redirect') || '/dashboard'
      navigate(redirect, { replace: true })
    } catch (error) {
      showError(getAuthErrorMessage(error))
    }
  }

  return (
    <AuthLayout
      title="Sign in"
      description="Enter your credentials to access the HRMS workspace."
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          requiredMark
          error={errors.email?.message}
          {...register('email', {
            required: 'Email address is required.',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Enter a valid email address.',
            },
          })}
        />

        <PasswordInput
          label="Password"
          autoComplete="current-password"
          requiredMark
          error={errors.password?.message}
          {...register('password', {
            required: 'Password is required.',
            minLength: {
              value: MIN_PASSWORD_LENGTH,
              message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
            },
          })}
        />

        <div className="flex items-center justify-between gap-3">
          <Checkbox label="Remember me" {...register('rememberMe')} />
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-primary-700 hover:underline dark:text-primary-400"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" isLoading={isSubmitting} loadingLabel="Signing in…">
          Sign in
        </Button>
      </form>
    </AuthLayout>
  )
}
