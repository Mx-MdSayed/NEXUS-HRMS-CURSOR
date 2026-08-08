import type { Employee } from '@/features/employees/types'

function present(value: unknown): boolean {
  return typeof value === 'string' ? value.trim().length > 0 : Boolean(value)
}

export function calculateProfileCompleteness(employee: Employee): number {
  const fields = [
    employee.firstName,
    employee.lastName,
    employee.email,
    employee.personalEmail,
    employee.phone,
    employee.dateOfBirth,
    employee.gender,
    employee.maritalStatus,
    employee.nationality,
    employee.address.line1,
    employee.address.city,
    employee.address.state,
    employee.address.country,
    employee.address.postalCode,
    employee.emergencyContacts[0]?.name,
    employee.emergencyContacts[0]?.phone,
    employee.kyc.nationalId || employee.kyc.taxId || employee.kyc.passportNumber,
    employee.banking.accountHolderName,
    employee.banking.bankName,
    employee.banking.accountNumber,
  ]

  const completed = fields.filter(present).length
  return Math.round((completed / fields.length) * 100)
}
