import type { DepartmentOption, DesignationOption } from '../types'

export const mockDepartments: DepartmentOption[] = [
  { id: 'dept-it', name: 'IT', code: 'IT', isActive: true },
  { id: 'dept-hr', name: 'Human Resources', code: 'HR', isActive: true },
  { id: 'dept-finance', name: 'Finance', code: 'FIN', isActive: true },
  { id: 'dept-sales', name: 'Sales', code: 'SAL', isActive: true },
  { id: 'dept-ops', name: 'Operations', code: 'OPS', isActive: true },
  { id: 'dept-mkt', name: 'Marketing', code: 'MKT', isActive: true },
  { id: 'dept-support', name: 'Support', code: 'SUP', isActive: true },
  { id: 'dept-legal', name: 'Legal', code: 'LEG', isActive: true },
]

export const mockDesignations: DesignationOption[] = [
  { id: 'des-se', name: 'Software Engineer', departmentId: 'dept-it', isActive: true },
  { id: 'des-sse', name: 'Senior Software Engineer', departmentId: 'dept-it', isActive: true },
  { id: 'des-tl', name: 'Tech Lead', departmentId: 'dept-it', isActive: true },
  { id: 'des-hrbp', name: 'HR Business Partner', departmentId: 'dept-hr', isActive: true },
  { id: 'des-hrex', name: 'HR Executive', departmentId: 'dept-hr', isActive: true },
  { id: 'des-acc', name: 'Accountant', departmentId: 'dept-finance', isActive: true },
  { id: 'des-fa', name: 'Finance Analyst', departmentId: 'dept-finance', isActive: true },
  { id: 'des-ae', name: 'Account Executive', departmentId: 'dept-sales', isActive: true },
  { id: 'des-sm', name: 'Sales Manager', departmentId: 'dept-sales', isActive: true },
  { id: 'des-om', name: 'Operations Manager', departmentId: 'dept-ops', isActive: true },
  { id: 'des-mm', name: 'Marketing Manager', departmentId: 'dept-mkt', isActive: true },
  { id: 'des-cs', name: 'Customer Success Associate', departmentId: 'dept-support', isActive: true },
  { id: 'des-lc', name: 'Legal Counsel', departmentId: 'dept-legal', isActive: true },
  { id: 'des-intern', name: 'Intern', isActive: true },
]
