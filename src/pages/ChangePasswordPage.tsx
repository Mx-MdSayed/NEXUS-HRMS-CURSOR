import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { MIN_PASSWORD_LENGTH } from '@/constants/app'
import { PasswordInput } from '@/components/forms/PasswordInput'
import { PasswordStrength } from '@/components/forms/PasswordStrength'
import { Button, Card, CardContent, PageHeader } from '@/components/ui'
import { authService, getAuthErrorMessage } from '@/services/auth'
import { showError, showSuccess } from '@/utils/toast'

interface ChangePasswordFormValues {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export function ChangePasswordPage() {
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const newPassword = watch('newPassword')

  const onSubmit = async (values: ChangePasswordFormValues) => {
    try {
      await authService.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      showSuccess('Password changed successfully.')
      reset()
      navigate('/profile')
    } catch (error) {
      showError(getAuthErrorMessage(error))
    }
  }

  return (
    <div>
      <PageHeader
        title="Change Password"
        description="Update your account password. Never share your credentials."
        breadcrumbs={[{ label: 'Home' }, { label: 'Change Password' }]}
      />

      <Card className="max-w-xl">
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <PasswordInput
              label="Current Password"
              autoComplete="current-password"
              requiredMark
              error={errors.currentPassword?.message}
              {...register('currentPassword', {
                required: 'Current password is required',
              })}
            />

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
              label="Confirm New Password"
              autoComplete="new-password"
              requiredMark
              error={errors.confirmPassword?.message}
              {...register('confirmPassword', {
                required: 'Please confirm your new password',
                validate: (value) => value === newPassword || 'Passwords do not match',
              })}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                Update Password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
