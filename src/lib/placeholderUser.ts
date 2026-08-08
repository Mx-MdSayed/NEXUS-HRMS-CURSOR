import type { User } from '@/types'

/** Placeholder current user until auth module is implemented. */
export const PLACEHOLDER_USER: User = {
  id: 'usr_demo_001',
  firstName: 'Alex',
  lastName: 'Morgan',
  email: 'alex.morgan@nexus-hrms.com',
  role: 'hr_admin',
  employmentStatus: 'active',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}
