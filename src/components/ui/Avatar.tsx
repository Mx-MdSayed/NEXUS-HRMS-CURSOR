import { useMemo, type HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export type AvatarSize = 'sm' | 'md' | 'lg'

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string | null
  alt?: string
  name?: string
  size?: AvatarSize
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
}

function getInitials(name?: string, alt?: string): string {
  const source = (name ?? alt ?? '').trim()
  if (!source) return '?'
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export function Avatar({
  src,
  alt,
  name,
  size = 'md',
  className,
  ...props
}: AvatarProps) {
  const initials = useMemo(() => getInitials(name, alt), [name, alt])

  return (
    <div
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-100 font-semibold text-primary-800',
        'dark:bg-primary-950 dark:text-primary-200',
        sizeClasses[size],
        className,
      )}
      aria-label={alt ?? name ?? 'Avatar'}
      role="img"
      {...props}
    >
      {src ? (
        <img src={src} alt={alt ?? name ?? ''} className="h-full w-full object-cover" />
      ) : (
        <span aria-hidden>{initials}</span>
      )}
    </div>
  )
}
