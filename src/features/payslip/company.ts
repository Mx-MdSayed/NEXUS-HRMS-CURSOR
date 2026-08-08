import { companyDefaults } from '@/config'
import type { PayslipCompanySnapshot } from './types'

const companyProfile: PayslipCompanySnapshot = {
  name: companyDefaults.companyName,
  legalName: companyDefaults.legalName,
  address: [
    companyDefaults.addressLine1,
    companyDefaults.addressLine2,
    companyDefaults.city,
    companyDefaults.state,
    companyDefaults.postalCode,
    companyDefaults.country,
  ]
    .filter(Boolean)
    .join(', '),
  phone: companyDefaults.phone,
  email: companyDefaults.hrEmail ?? companyDefaults.email,
  website: companyDefaults.website,
  taxId: companyDefaults.taxId,
  registrationNumber: companyDefaults.registrationNumber,
  logoUrl: companyDefaults.logoUrl,
}

export const companyProfileService = {
  getCompanyProfile(): PayslipCompanySnapshot {
    return structuredClone(companyProfile)
  },
  updateCompanyProfile(patch: Partial<PayslipCompanySnapshot>): PayslipCompanySnapshot {
    Object.assign(companyProfile, patch)
    return this.getCompanyProfile()
  },
}

export function getCompanyProfile(): PayslipCompanySnapshot {
  return companyProfileService.getCompanyProfile()
}
