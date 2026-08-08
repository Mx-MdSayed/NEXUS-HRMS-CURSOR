type ClassValue = string | number | boolean | null | undefined | ClassValue[]

function flatten(values: ClassValue[]): string[] {
  const result: string[] = []

  for (const value of values) {
    if (!value) continue
    if (Array.isArray(value)) {
      result.push(...flatten(value))
      continue
    }
    result.push(String(value))
  }

  return result
}

export function cn(...values: ClassValue[]): string {
  return flatten(values).join(' ')
}
