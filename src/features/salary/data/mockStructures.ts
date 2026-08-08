import { calculateSalaryStructure } from '../utils/calculations'
import { initialSalaryComponents } from './mockComponents'
import type { EmployeeSalary, SalaryRevision, SalaryStructure, StructureComponentLineInput } from '../types'

const now = '2026-08-07T10:00:00.000Z'

function buildStructure(
  id: string,
  code: string,
  name: string,
  description: string,
  inputs: StructureComponentLineInput[],
  effectiveFrom: string,
  status: SalaryStructure['status'] = 'active',
): SalaryStructure {
  const calc = calculateSalaryStructure(initialSalaryComponents, inputs, 'INR')
  return {
    id,
    code,
    name,
    description,
    currency: 'INR',
    components: calc.lines,
    monthlyGross: calc.monthlyGross,
    annualGross: calc.annualGross,
    monthlyCTC: calc.monthlyCTC,
    annualCTC: calc.annualCTC,
    monthlyNet: calc.monthlyNet,
    status,
    effectiveFrom,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: now,
    createdBy: 'System',
    updatedBy: 'System',
    isDeleted: false,
  }
}

const standardInputs: StructureComponentLineInput[] = [
  { componentId: 'sc-basic', fixedAmount: 30000, displayOrder: 1 },
  { componentId: 'sc-hra', percentage: 40, displayOrder: 2 },
  { componentId: 'sc-conv', fixedAmount: 3000, displayOrder: 3 },
  { componentId: 'sc-med', fixedAmount: 1250, displayOrder: 4 },
  { componentId: 'sc-sa', fixedAmount: 5750, displayOrder: 5 },
  { componentId: 'sc-epf', percentage: 12, displayOrder: 10 },
  { componentId: 'sc-pt', fixedAmount: 200, displayOrder: 12 },
  { componentId: 'sc-erpf', percentage: 12, displayOrder: 20 },
]

const seniorInputs: StructureComponentLineInput[] = [
  { componentId: 'sc-basic', fixedAmount: 60000, displayOrder: 1 },
  { componentId: 'sc-hra', percentage: 40, displayOrder: 2 },
  { componentId: 'sc-conv', fixedAmount: 3000, displayOrder: 3 },
  { componentId: 'sc-med', fixedAmount: 2500, displayOrder: 4 },
  { componentId: 'sc-sa', fixedAmount: 14500, displayOrder: 5 },
  { componentId: 'sc-epf', percentage: 12, displayOrder: 10 },
  { componentId: 'sc-pt', fixedAmount: 200, displayOrder: 12 },
  { componentId: 'sc-erpf', percentage: 12, displayOrder: 20 },
]

const internInputs: StructureComponentLineInput[] = [
  { componentId: 'sc-basic', fixedAmount: 15000, displayOrder: 1 },
  { componentId: 'sc-conv', fixedAmount: 1500, displayOrder: 3 },
  { componentId: 'sc-sa', fixedAmount: 3500, displayOrder: 5 },
  { componentId: 'sc-pt', fixedAmount: 0, displayOrder: 12 },
]

const usdInputs: StructureComponentLineInput[] = [
  { componentId: 'sc-basic', fixedAmount: 4500, displayOrder: 1 },
  { componentId: 'sc-hra', percentage: 30, displayOrder: 2 },
  { componentId: 'sc-sa', fixedAmount: 800, displayOrder: 5 },
]

export const initialSalaryStructures: SalaryStructure[] = [
  buildStructure(
    'ss-std',
    'STD-EMP',
    'Standard Employee',
    'Default structure for full-time employees.',
    standardInputs,
    '2026-01-01',
  ),
  buildStructure(
    'ss-senior',
    'SNR-EMP',
    'Senior Employee',
    'Structure for senior individual contributors and leads.',
    seniorInputs,
    '2026-01-01',
  ),
  buildStructure(
    'ss-intern',
    'INT-STIP',
    'Intern Stipend',
    'Simplified stipend structure for interns.',
    internInputs,
    '2026-01-01',
  ),
  (() => {
    const calc = calculateSalaryStructure(initialSalaryComponents, usdInputs, 'USD')
    return {
      id: 'ss-usd',
      code: 'USD-REMOTE',
      name: 'Remote USD Package',
      description: 'Example multi-currency structure for remote contractors.',
      currency: 'USD' as const,
      components: calc.lines,
      monthlyGross: calc.monthlyGross,
      annualGross: calc.annualGross,
      monthlyCTC: calc.monthlyCTC,
      annualCTC: calc.annualCTC,
      monthlyNet: calc.monthlyNet,
      status: 'active' as const,
      effectiveFrom: '2026-04-01',
      createdAt: '2026-04-01T00:00:00.000Z',
      updatedAt: now,
      createdBy: 'System',
      updatedBy: 'System',
      isDeleted: false,
    }
  })(),
  buildStructure(
    'ss-draft',
    'DRAFT-2027',
    'FY 2027 Draft Structure',
    'Draft structure for next fiscal year planning.',
    standardInputs.map((item) =>
      item.componentId === 'sc-basic' ? { ...item, fixedAmount: 32000 } : item,
    ),
    '2027-04-01',
    'draft',
  ),
]

function snapshotFromStructure(
  structure: SalaryStructure,
  employeeId: string,
  id: string,
  effectiveFrom: string,
  effectiveTo: string | undefined,
  status: EmployeeSalary['status'],
  overrides?: Partial<EmployeeSalary>,
): EmployeeSalary {
  return {
    id,
    employeeId,
    structureId: structure.id,
    structureCode: structure.code,
    structureName: structure.name,
    currency: structure.currency,
    monthlyGross: structure.monthlyGross,
    annualGross: structure.annualGross,
    monthlyCTC: structure.monthlyCTC,
    annualCTC: structure.annualCTC,
    monthlyNet: structure.monthlyNet,
    components: structure.components.map((line) => ({ ...line, override: false })),
    effectiveFrom,
    effectiveTo,
    status,
    createdAt: effectiveFrom + 'T09:00:00.000Z',
    updatedAt: now,
    createdBy: 'System',
    updatedBy: 'System',
    ...overrides,
  }
}

const std = initialSalaryStructures[0]
const senior = initialSalaryStructures[1]
const intern = initialSalaryStructures[2]

export const initialEmployeeSalaries: EmployeeSalary[] = [
  snapshotFromStructure(std, 'emp-1003', 'es-1003-1', '2024-09-01', '2025-12-31', 'superseded', {
    revisionReason: 'Joining package',
  }),
  (() => {
    const calc = calculateSalaryStructure(
      initialSalaryComponents,
      [
        { componentId: 'sc-basic', fixedAmount: 32000, displayOrder: 1 },
        { componentId: 'sc-hra', percentage: 40, displayOrder: 2 },
        { componentId: 'sc-conv', fixedAmount: 3000, displayOrder: 3 },
        { componentId: 'sc-med', fixedAmount: 1250, displayOrder: 4 },
        { componentId: 'sc-sa', fixedAmount: 5750, displayOrder: 5 },
        { componentId: 'sc-epf', percentage: 12, displayOrder: 10 },
        { componentId: 'sc-pt', fixedAmount: 200, displayOrder: 12 },
        { componentId: 'sc-erpf', percentage: 12, displayOrder: 20 },
      ],
      'INR',
    )
    return {
      id: 'es-1003-2',
      employeeId: 'emp-1003',
      structureId: std.id,
      structureCode: std.code,
      structureName: std.name,
      currency: 'INR' as const,
      monthlyGross: calc.monthlyGross,
      annualGross: calc.annualGross,
      monthlyCTC: calc.monthlyCTC,
      annualCTC: calc.annualCTC,
      monthlyNet: calc.monthlyNet,
      components: calc.lines.map((line) => ({
        ...line,
        override: line.componentId === 'sc-basic',
      })),
      effectiveFrom: '2026-01-01',
      status: 'active' as const,
      revisionReason: 'Annual revision FY26',
      notes: 'Basic override vs standard structure.',
      createdAt: '2026-01-01T09:00:00.000Z',
      updatedAt: now,
      createdBy: 'Harper HR',
      updatedBy: 'Harper HR',
    }
  })(),
  snapshotFromStructure(senior, 'emp-1001', 'es-1001-1', '2025-04-01', undefined, 'active'),
  snapshotFromStructure(senior, 'emp-1002', 'es-1002-1', '2025-04-01', undefined, 'active'),
  snapshotFromStructure(std, 'emp-2041', 'es-2041-1', '2025-02-14', undefined, 'active'),
  snapshotFromStructure(std, 'emp-1988', 'es-1988-1', '2025-06-01', undefined, 'active'),
  snapshotFromStructure(senior, 'emp-2110', 'es-2110-1', '2025-08-01', undefined, 'active'),
  snapshotFromStructure(std, 'emp-1875', 'es-1875-1', '2025-03-01', undefined, 'active'),
  snapshotFromStructure(std, 'emp-2201', 'es-2201-1', '2026-01-15', undefined, 'active'),
  snapshotFromStructure(std, 'emp-2202', 'es-2202-1', '2026-02-01', undefined, 'active'),
  snapshotFromStructure(intern, 'emp-2195', 'es-2195-1', '2026-06-01', undefined, 'active'),
  snapshotFromStructure(std, 'emp-2198', 'es-2198-1', '2025-11-01', undefined, 'active'),
]

export const initialSalaryRevisions: SalaryRevision[] = [
  {
    id: 'sr-1',
    employeeId: 'emp-1003',
    previousSalaryId: 'es-1003-1',
    newSalaryId: 'es-1003-2',
    previousMonthlyGross: std.monthlyGross,
    newMonthlyGross: initialEmployeeSalaries.find((item) => item.id === 'es-1003-2')!.monthlyGross,
    previousAnnualCTC: std.annualCTC,
    newAnnualCTC: initialEmployeeSalaries.find((item) => item.id === 'es-1003-2')!.annualCTC,
    currency: 'INR',
    structureId: 'ss-std',
    effectiveFrom: '2026-01-01',
    reason: 'Annual revision FY26',
    notes: 'Merit increase on basic.',
    status: 'applied',
    createdAt: '2025-12-15T10:00:00.000Z',
    createdBy: 'Harper HR',
    appliedAt: '2026-01-01T09:00:00.000Z',
    appliedBy: 'Harper HR',
  },
  {
    id: 'sr-2',
    employeeId: 'emp-2041',
    previousSalaryId: 'es-2041-1',
    previousMonthlyGross: std.monthlyGross,
    newMonthlyGross: senior.monthlyGross,
    previousAnnualCTC: std.annualCTC,
    newAnnualCTC: senior.annualCTC,
    currency: 'INR',
    structureId: 'ss-senior',
    effectiveFrom: '2026-09-01',
    reason: 'Promotion to Senior AE',
    status: 'pending',
    createdAt: '2026-08-01T11:00:00.000Z',
    createdBy: 'Harper HR',
  },
]
