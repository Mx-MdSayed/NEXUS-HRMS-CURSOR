import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { AuthLayout } from '@/components/layouts/AuthLayout'
import { Button, Input } from '@/components/ui'
import { authService, getAuthErrorMessage } from '@/services/auth'
import { showError } from '@/utils/toast'

interface ForgotPasswordFormValues {
  email: string
}

export function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    defaultValues: { email: '' },
  })

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    try {
      await authService.requestPasswordReset(values.email.trim().toLowerCase())
      setSubmitted(true)
    } catch (error) {
      showError(getAuthErrorMessage(error))
    }
  }

  return (
    <AuthLayout
      title="Forgot password"
      description="Enter your email and we will send reset instructions if an account exists."
      footer={
        <p className="text-center text-sm text-surface-500">
          <Link to="/login" className="font-medium text-primary-700 hover:underline dark:text-primary-400">
            Back to login
          </Link>
        </p>
      }
    >
      {submitted ? (
        <div className="rounded-lg border border-success-100 bg-success-50 px-4 py-3 text-sm text-success-700 dark:border-success-600/30 dark:bg-success-600/10 dark:text-success-500">
          If an account exists for this email, password reset instructions will be sent.
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            requiredMark
            error={errors.email?.message}
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Enter a valid email address',
              },
            })}
          />
          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Send Reset Link
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}
