const belowTwenty = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
]

const tens = [
  '',
  '',
  'twenty',
  'thirty',
  'forty',
  'fifty',
  'sixty',
  'seventy',
  'eighty',
  'ninety',
]

const currencyLabels: Record<string, { major: string; minor: string }> = {
  INR: { major: 'rupees', minor: 'paise' },
  USD: { major: 'dollars', minor: 'cents' },
}

function wordsUnderThousand(value: number): string {
  if (value < 20) return belowTwenty[value]
  if (value < 100) {
    const rest = value % 10
    return rest ? `${tens[Math.floor(value / 10)]} ${belowTwenty[rest]}` : tens[value / 10]
  }
  const rest = value % 100
  return rest
    ? `${belowTwenty[Math.floor(value / 100)]} hundred ${wordsUnderThousand(rest)}`
    : `${belowTwenty[Math.floor(value / 100)]} hundred`
}

function integerToWords(value: number): string {
  if (value === 0) return 'zero'
  const units = [
    { value: 1_000_000_000, label: 'billion' },
    { value: 1_000_000, label: 'million' },
    { value: 1_000, label: 'thousand' },
    { value: 1, label: '' },
  ]
  let remaining = value
  const parts: string[] = []
  for (const unit of units) {
    const count = Math.floor(remaining / unit.value)
    if (!count) continue
    parts.push(`${wordsUnderThousand(count)}${unit.label ? ` ${unit.label}` : ''}`)
    remaining %= unit.value
  }
  return parts.join(' ')
}

function sentenceCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function numberToWords(amount: number, currency = 'INR'): string {
  const labels = currencyLabels[currency] ?? { major: currency, minor: 'minor units' }
  const safeAmount = Math.max(0, Math.round((amount + Number.EPSILON) * 100) / 100)
  const major = Math.floor(safeAmount)
  const minor = Math.round((safeAmount - major) * 100)
  const majorWords = `${integerToWords(major)} ${labels.major}`
  const minorWords = minor > 0 ? ` and ${integerToWords(minor)} ${labels.minor}` : ''
  return `${sentenceCase(majorWords)}${minorWords} only`
}
