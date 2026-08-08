import { useMemo, useState } from 'react'
import { cn } from '@/utils/cn'
import { MIN_PASSWORD_LENGTH } from '@/constants/app'

export function getPasswordStrength(password: string): {
  score: 0 | 1 | 2 | 3 | 4
  label: string
} {
  let score = 0
  if (password.length >= MIN_PASSWORD_LENGTH) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1

  const labels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'] as const
  return { score: score as 0 | 1 | 2 | 3 | 4, label: labels[score] }
}

export function PasswordStrength({ password }: { password: string }) {
  const strength = useMemo(() => getPasswordStrength(password), [password])
  if (!password) return null

  return (
    <div className="mt-2 space-y-1" aria-live="polite">
      <div className="flex gap-1">
        {Array.from({ length: 4 }).map((_, index) => (
          <span
            key={index}
            className={cn(
              'h-1.5 flex-1 rounded-full bg-surface-200 dark:bg-surface-700',
              strength.score > index &&
                (strength.score <= 1
                  ? 'bg-danger-500'
                  : strength.score === 2
                    ? 'bg-warning-500'
                    : 'bg-success-500'),
            )}
          />
        ))}
      </div>
      <p className="text-helper">Strength: {strength.label}</p>
    </div>
  )
}

export function usePasswordConfirmation() {
  const [password, setPassword] = useState('')
  return { password, setPassword }
}
