export type {
  SalaryComponent,
  SalaryStructure,
  EmployeeSalary,
  SalaryRevision,
  SalaryCalculationResult,
} from './types'

export {
  salaryComponentService,
} from './services/salaryComponentService'
export { salaryStructureService } from './services/salaryStructureService'
export { employeeSalaryService } from './services/employeeSalaryService'
export { salaryCalculationService } from './services/salaryCalculationService'
export { SalaryServiceError } from './services/errors'

export {
  calculateSalaryStructure,
  calculateGross,
  calculateDeductions,
  calculateEmployerContributions,
  calculateNetSalary,
  calculateCTC,
  detectCircularDependencies,
} from './utils/calculations'
export { formatSalaryAmount, monthlyToAnnual, annualToMonthly, roundSalaryAmount } from './utils/money'

export { SalaryIndexPage } from './pages/SalaryIndexPage'
export { SalaryComponentsPage } from './pages/SalaryComponentsPage'
export { SalaryComponentFormPage } from './pages/SalaryComponentFormPage'
export { SalaryStructuresPage } from './pages/SalaryStructuresPage'
export { SalaryStructureFormPage } from './pages/SalaryStructureFormPage'
export { SalaryStructureDetailPage } from './pages/SalaryStructureDetailPage'
export { SalaryAssignmentsPage } from './pages/SalaryAssignmentsPage'
export { SalaryAssignmentFormPage } from './pages/SalaryAssignmentFormPage'
export { SalaryRevisionsPage } from './pages/SalaryRevisionsPage'
export { EmployeeSalaryPage } from './pages/EmployeeSalaryPage'
