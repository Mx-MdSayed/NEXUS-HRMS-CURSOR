export type {
  AccountType,
  DepartmentOption,
  DesignationOption,
  DocumentCategory,
  DocumentStatus,
  EmergencyContact,
  Employee,
  EmployeeActivity,
  EmployeeAddress,
  EmployeeBanking,
  EmployeeDocument,
  EmployeeFilters,
  EmployeeFormValues,
  EmployeeKyc,
  EmployeeListItem,
  EmployeeListQuery,
  EmploymentType,
  Gender,
  MaritalStatus,
  PaginatedEmployees,
} from './types'

export {
  ACCOUNT_TYPE_OPTIONS,
  ALLOWED_DOCUMENT_EXTENSIONS,
  ALLOWED_DOCUMENT_TYPES,
  DOCUMENT_CATEGORY_LABELS,
  DOCUMENT_CATEGORY_OPTIONS,
  EMPLOYMENT_STATUS_OPTIONS,
  EMPLOYMENT_TYPE_LABELS,
  EMPLOYMENT_TYPE_OPTIONS,
  GENDER_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  MAX_DOCUMENT_SIZE_BYTES,
} from './constants'

export { employeeService, EmployeeServiceError } from './services/employeeService'
export type { EmployeeService } from './services/employeeService'

export { EmployeeDirectoryGuard } from './components/EmployeeDirectoryGuard'
export { EmployeeForm } from './components/EmployeeForm'

export { EmployeeListPage } from './pages/EmployeeListPage'
export { EmployeeCreatePage } from './pages/EmployeeCreatePage'
export { EmployeeEditPage } from './pages/EmployeeEditPage'
export { EmployeeProfilePage } from './pages/EmployeeProfilePage'
