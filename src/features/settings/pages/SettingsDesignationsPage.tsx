import { PageHeader } from '@/components/ui'
import { DesignationListPage } from '@/features/organization'

export function SettingsDesignationsPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Designations"
        description="Manage job titles and levels from company settings."
        breadcrumbs={[
          { label: 'Home' },
          { label: 'Settings', href: '/settings' },
          { label: 'Designations' },
        ]}
      />
      <DesignationListPage />
    </div>
  )
}
