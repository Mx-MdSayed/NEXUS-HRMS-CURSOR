import type { SalaryCurrencyCode } from '@/constants/currencies'
import { methodToPercentageBase } from '../constants'
import type {
  PercentageBase,
  SalaryCalculationResult,
  SalaryComponent,
  StructureComponentLine,
  StructureComponentLineInput,
} from '../types'
import { annualToMonthly, monthlyToAnnual, roundSalaryAmount } from './money'

export class SalaryCalculationError extends Error {
  code: 'CIRCULAR' | 'VALIDATION' | 'MISSING'

  constructor(code: SalaryCalculationError['code'], message: string) {
    super(message)
    this.name = 'SalaryCalculationError'
    this.code = code
  }
}

function resolvePercentageBase(method: StructureComponentLine['calculationMethod']): PercentageBase | undefined {
  return methodToPercentageBase(method) ?? undefined
}

/**
 * Detect circular percentage dependencies among structure lines.
 * Fixed components and percentage_of_gross/ctc/taxable are resolved in order
 * after basic/gross are known — we still reject A↔B percentage_of_basic loops
 * and self-references.
 */
export function detectCircularDependencies(
  lines: Array<Pick<StructureComponentLine, 'componentId' | 'componentCode' | 'calculationMethod'>>,
): { valid: boolean; message?: string } {
  const basicCodes = new Set(
    lines
      .filter((item) => item.componentCode.toUpperCase() === 'BASIC' || item.componentCode.toUpperCase() === 'BASIC_SALARY')
      .map((item) => item.componentId),
  )

  for (const line of lines) {
    if (line.calculationMethod === 'percentage_of_basic' && basicCodes.has(line.componentId)) {
      return { valid: false, message: 'A component cannot depend on itself (percentage of basic).' }
    }
  }

  // Graph: percentage_of_basic edges from component → basic component(s)
  // If any non-basic component is also used as base for another circular chain via code aliases — keep simple.
  const edges = new Map<string, string[]>()
  for (const line of lines) {
    if (line.calculationMethod === 'percentage_of_basic') {
      for (const basicId of basicCodes) {
        if (basicId === line.componentId) continue
        const list = edges.get(line.componentId) ?? []
        list.push(basicId)
        edges.set(line.componentId, list)
      }
    }
  }

  // Also treat percentage_of_gross where the component itself is the only gross contributor in a loop —
  // gross depends on all earnings; percentage_of_gross is resolved after gross of fixed+basic% earnings,
  // so true circularity is limited. Reject if someone marks BASIC as percentage_of_gross.
  for (const line of lines) {
    if (
      (line.calculationMethod === 'percentage_of_gross' ||
        line.calculationMethod === 'percentage_of_ctc' ||
        line.calculationMethod === 'percentage_of_taxable') &&
      (line.componentCode.toUpperCase() === 'BASIC' || line.componentCode.toUpperCase() === 'BASIC_SALARY')
    ) {
      return {
        valid: false,
        message: 'Basic Salary cannot be calculated as a percentage of Gross/CTC/Taxable (circular dependency).',
      }
    }
  }

  const visiting = new Set<string>()
  const visited = new Set<string>()

  function dfs(node: string): boolean {
    if (visiting.has(node)) return true
    if (visited.has(node)) return false
    visiting.add(node)
    for (const next of edges.get(node) ?? []) {
      if (dfs(next)) return true
    }
    visiting.delete(node)
    visited.add(node)
    return false
  }

  for (const node of edges.keys()) {
    if (dfs(node)) {
      return { valid: false, message: 'Circular dependency detected between salary components.' }
    }
  }

  return { valid: true }
}

function buildLines(
  masters: SalaryComponent[],
  inputs: StructureComponentLineInput[],
): StructureComponentLine[] {
  const byId = new Map(masters.map((item) => [item.id, item]))
  return inputs
    .map((input, index) => {
      const master = byId.get(input.componentId)
      if (!master || master.isDeleted) {
        throw new SalaryCalculationError('MISSING', `Salary component ${input.componentId} not found.`)
      }
      const method = master.calculationMethod
      const percentageBase = resolvePercentageBase(method)
      return {
        id: `scl-${master.id}-${index}`,
        componentId: master.id,
        componentCode: master.code,
        componentName: master.name,
        category: master.category,
        calculationMethod: method,
        percentage:
          input.percentage ??
          master.percentage ??
          (method !== 'fixed' ? undefined : undefined),
        percentageOf: percentageBase ?? master.percentageOf,
        fixedAmount:
          input.fixedAmount ??
          master.fixedAmount ??
          (method === 'fixed' ? 0 : undefined),
        taxable: master.taxable,
        statutory: master.statutory,
        recurring: master.recurring,
        employerContribution: master.employerContribution || master.category === 'employer_contribution',
        employeeContribution: master.employeeContribution || master.category === 'deduction',
        displayOrder: input.displayOrder ?? master.displayOrder ?? index + 1,
        amount: 0,
        override: Boolean(input.override),
      } satisfies StructureComponentLine
    })
    .sort((a, b) => a.displayOrder - b.displayOrder)
}

/**
 * Central salary calculation engine.
 * Order: fixed earnings → % of basic → gross → % of gross/taxable → deductions → employer → CTC → annual.
 */
export function calculateSalaryStructure(
  masters: SalaryComponent[],
  inputs: StructureComponentLineInput[],
  currency: SalaryCurrencyCode = 'INR',
  options?: { assumedMonthlyCtc?: number },
): SalaryCalculationResult {
  const circular = detectCircularDependencies(
    inputs.map((input) => {
      const master = masters.find((item) => item.id === input.componentId)
      return {
        componentId: input.componentId,
        componentCode: master?.code ?? '',
        calculationMethod: master?.calculationMethod ?? 'fixed',
      }
    }),
  )
  if (!circular.valid) {
    throw new SalaryCalculationError('CIRCULAR', circular.message ?? 'Circular dependency.')
  }

  const lines = buildLines(masters, inputs)

  // Pass 1: fixed earnings + identify basic
  let basicAmount = 0
  for (const line of lines) {
    if (line.category !== 'earning') continue
    if (line.calculationMethod === 'fixed') {
      line.amount = roundSalaryAmount(line.fixedAmount ?? 0, currency)
      if (
        line.componentCode.toUpperCase() === 'BASIC' ||
        line.componentCode.toUpperCase() === 'BASIC_SALARY'
      ) {
        basicAmount = line.amount
      }
    }
  }

  // Pass 2: percentage of basic earnings
  for (const line of lines) {
    if (line.category !== 'earning') continue
    if (line.calculationMethod === 'percentage_of_basic') {
      const pct = line.percentage ?? 0
      if (pct < 0) throw new SalaryCalculationError('VALIDATION', 'Percentage cannot be negative.')
      line.amount = roundSalaryAmount((basicAmount * pct) / 100, currency)
    }
  }

  // Interim gross (fixed + % basic only) — used for % of gross earnings
  let interimGross = roundSalaryAmount(
    lines
      .filter(
        (item) =>
          item.category === 'earning' &&
          (item.calculationMethod === 'fixed' || item.calculationMethod === 'percentage_of_basic'),
      )
      .reduce((sum, item) => sum + item.amount, 0),
    currency,
  )

  // Pass 3: percentage of gross / taxable (earnings)
  let taxableInterim = roundSalaryAmount(
    lines
      .filter(
        (item) =>
          item.category === 'earning' &&
          item.taxable &&
          (item.calculationMethod === 'fixed' || item.calculationMethod === 'percentage_of_basic'),
      )
      .reduce((sum, item) => sum + item.amount, 0),
    currency,
  )

  for (const line of lines) {
    if (line.category !== 'earning') continue
    if (line.calculationMethod === 'percentage_of_gross') {
      line.amount = roundSalaryAmount((interimGross * (line.percentage ?? 0)) / 100, currency)
    }
    if (line.calculationMethod === 'percentage_of_taxable') {
      line.amount = roundSalaryAmount((taxableInterim * (line.percentage ?? 0)) / 100, currency)
    }
  }

  // Final gross after all earnings except % of CTC
  let monthlyGross = roundSalaryAmount(
    lines.filter((item) => item.category === 'earning').reduce((sum, item) => sum + item.amount, 0),
    currency,
  )

  // Pass 4: employee deductions
  for (const line of lines) {
    if (line.category !== 'deduction') continue
    if (line.calculationMethod === 'fixed') {
      line.amount = roundSalaryAmount(line.fixedAmount ?? 0, currency)
    } else if (line.calculationMethod === 'percentage_of_basic') {
      line.amount = roundSalaryAmount((basicAmount * (line.percentage ?? 0)) / 100, currency)
    } else if (line.calculationMethod === 'percentage_of_gross') {
      line.amount = roundSalaryAmount((monthlyGross * (line.percentage ?? 0)) / 100, currency)
    } else if (line.calculationMethod === 'percentage_of_taxable') {
      const taxable = lines
        .filter((item) => item.category === 'earning' && item.taxable)
        .reduce((sum, item) => sum + item.amount, 0)
      line.amount = roundSalaryAmount((taxable * (line.percentage ?? 0)) / 100, currency)
    }
  }

  const totalDeductions = roundSalaryAmount(
    lines.filter((item) => item.category === 'deduction').reduce((sum, item) => sum + item.amount, 0),
    currency,
  )

  // Pass 5: employer contributions (may need CTC assumption for % of CTC)
  let assumedCtc = options?.assumedMonthlyCtc ?? monthlyGross

  for (const line of lines) {
    if (line.category !== 'employer_contribution') continue
    if (line.calculationMethod === 'fixed') {
      line.amount = roundSalaryAmount(line.fixedAmount ?? 0, currency)
    } else if (line.calculationMethod === 'percentage_of_basic') {
      line.amount = roundSalaryAmount((basicAmount * (line.percentage ?? 0)) / 100, currency)
    } else if (line.calculationMethod === 'percentage_of_gross') {
      line.amount = roundSalaryAmount((monthlyGross * (line.percentage ?? 0)) / 100, currency)
    } else if (line.calculationMethod === 'percentage_of_ctc') {
      line.amount = roundSalaryAmount((assumedCtc * (line.percentage ?? 0)) / 100, currency)
    }
  }

  let totalEmployer = roundSalaryAmount(
    lines
      .filter((item) => item.category === 'employer_contribution')
      .reduce((sum, item) => sum + item.amount, 0),
    currency,
  )

  let monthlyCTC = roundSalaryAmount(monthlyGross + totalEmployer, currency)

  // Resolve % of CTC earnings/employer with final CTC (one refinement pass)
  assumedCtc = monthlyCTC
  for (const line of lines) {
    if (line.calculationMethod === 'percentage_of_ctc') {
      line.amount = roundSalaryAmount((assumedCtc * (line.percentage ?? 0)) / 100, currency)
    }
  }

  // Recompute earnings that used CTC, then employer, then CTC again
  monthlyGross = roundSalaryAmount(
    lines.filter((item) => item.category === 'earning').reduce((sum, item) => sum + item.amount, 0),
    currency,
  )
  totalEmployer = roundSalaryAmount(
    lines
      .filter((item) => item.category === 'employer_contribution')
      .reduce((sum, item) => sum + item.amount, 0),
    currency,
  )
  monthlyCTC = roundSalaryAmount(monthlyGross + totalEmployer, currency)

  const taxableEarnings = roundSalaryAmount(
    lines
      .filter((item) => item.category === 'earning' && item.taxable)
      .reduce((sum, item) => sum + item.amount, 0),
    currency,
  )

  return {
    currency,
    earnings: lines
      .filter((item) => item.category === 'earning')
      .map((item) => ({
        componentId: item.componentId,
        code: item.componentCode,
        name: item.componentName,
        amount: item.amount,
        taxable: item.taxable,
      })),
    deductions: lines
      .filter((item) => item.category === 'deduction')
      .map((item) => ({
        componentId: item.componentId,
        code: item.componentCode,
        name: item.componentName,
        amount: item.amount,
        statutory: item.statutory,
      })),
    employerContributions: lines
      .filter((item) => item.category === 'employer_contribution')
      .map((item) => ({
        componentId: item.componentId,
        code: item.componentCode,
        name: item.componentName,
        amount: item.amount,
      })),
    totalEarnings: monthlyGross,
    monthlyGross,
    annualGross: monthlyToAnnual(monthlyGross, currency),
    totalDeductions,
    monthlyNet: roundSalaryAmount(monthlyGross - totalDeductions, currency),
    totalEmployerContributions: totalEmployer,
    monthlyCTC,
    annualCTC: monthlyToAnnual(monthlyCTC, currency),
    taxableEarnings,
    lines,
  }
}

export function calculateGross(result: SalaryCalculationResult): number {
  return result.monthlyGross
}

export function calculateDeductions(result: SalaryCalculationResult): number {
  return result.totalDeductions
}

export function calculateEmployerContributions(result: SalaryCalculationResult): number {
  return result.totalEmployerContributions
}

export function calculateNetSalary(result: SalaryCalculationResult): number {
  return result.monthlyNet
}

export function calculateCTC(result: SalaryCalculationResult): {
  monthlyCTC: number
  annualCTC: number
} {
  return { monthlyCTC: result.monthlyCTC, annualCTC: result.annualCTC }
}

export { monthlyToAnnual, annualToMonthly, roundSalaryAmount }
