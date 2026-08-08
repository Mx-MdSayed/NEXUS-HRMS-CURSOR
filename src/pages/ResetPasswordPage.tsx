import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { MIN_PASSWORD_LENGTH } from '@/constants/app'
import { AuthLayout } from '@/components/layouts/AuthLayout'
import { PasswordInput } from '@/components/forms/PasswordInput'
import { PasswordStrength } from '@/components/forms/PasswordStrength'
import { Button } from '@/components/ui'
import { authService, getAuthErrorMessage } from '@/services/auth'
import { showError, showSuccess } from '@/utils/toast'

interface ResetPasswordFormValues {
  newPassword: string
  confirmPassword: string
}

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token') ?? 'dev-reset-token'

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  })

  const newPassword = watch('newPassword')

  const onSubmit = async (values: ResetPasswordFormValues) => {
    try {
      await authService.resetPassword({
        token,
        newPassword: values.newPassword,
      })
      showSuccess('Password updated successfully. Please sign in.')
      navigate('/login', { replace: true })
    } catch (error) {
      showError(getAuthErrorMessage(error))
    }
  }

  return (
    <AuthLayout
      title="Reset password"
      description="Choose a new password for your account."
      footer={
        <p className="text-center text-sm text-surface-500">
          <Link to="/login" className="font-medium text-primary-700 hover:underline dark:text-primary-400">
            Back to login
          </Link>
        </p>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div>
          <PasswordInput
            label="New Password"
            autoComplete="new-password"
            requiredMark
            error={errors.newPassword?.message}
            {...register('newPassword', {
              required: 'New password is required',
              minLength: {
                value: MIN_PASSWORD_LENGTH,
                message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
              },
            })}
          />
          <PasswordStrength password={newPassword} />
        </div>

        <PasswordInput
          label="Confirm Password"
          autoComplete="new-password"
          requiredMark
          error={errors.confirmPassword?.message}
          {...register('confirmPassword', {
            required: 'Please confirm your password',
            validate: (value) => value === newPassword || 'Passwords do not match',
          })}
        />

        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Reset Password
        </Button>
      </form>
    </AuthLayout>
  )
}
