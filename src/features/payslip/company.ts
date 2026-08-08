import { companyDefaults } from '@/config'
import type { PayslipCompanySnapshot } from './types'

const companyProfile: PayslipCompanySnapshot = {
  name: companyDefaults.companyName,
  legalName: companyDefaults.legalName,
  address: '4th Floor, Nexus Tower, Manyata Tech Park, Bengaluru, Karnataka 560045',
  phone: '+91 80 4567 8900',
  email: 'hr@nexushrms.example',
  website: 'https://nexushrms.example',
  taxId: '29AABCN1234F1Z5',
  registrationNumber: 'U72900KA2020PTC123456',
  logoUrl: companyDefaults.logoUrl,
}

export const companyProfileService = {
  getCompanyProfile(): PayslipCompanySnapshot {
    return structuredClone(companyProfile)
  },
}

export function getCompanyProfile(): PayslipCompanySnapshot {
  return companyProfileService.getCompanyProfile()
}
