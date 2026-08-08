export function maskSensitiveValue(value?: string, visibleDigits = 4): string {
  if (!value) return '—'
  const cleaned = value.replace(/\s+/g, '')
  if (cleaned.length <= visibleDigits) return 'XXXX'
  return `${'X'.repeat(Math.max(4, cleaned.length - visibleDigits))}${cleaned.slice(-visibleDigits)}`
}

export function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export function buildFullName(firstName: string, middleName: string | undefined, lastName: string): string {
  return [firstName, middleName, lastName].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
}
