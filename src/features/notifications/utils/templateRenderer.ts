export function renderTemplate(template: string, vars: Record<string, unknown> = {}): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_, key: string) => {
    const value = vars[key]
    if (value === null || value === undefined) return ''
    return String(value)
  })
}
