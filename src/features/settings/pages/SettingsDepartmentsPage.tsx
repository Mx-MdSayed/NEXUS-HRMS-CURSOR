import { PageHeader } from '@/components/ui'
import { DepartmentListPage } from '@/features/organization'

export function SettingsDepartmentsPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Departments"
        description="Manage department codes, heads, and status from company settings."
        breadcrumbs={[
          { label: 'Home' },
          { label: 'Settings', href: '/settings' },
          { label: 'Departments' },
        ]}
      />
      <DepartmentListPage />
    </div>
  )
}
