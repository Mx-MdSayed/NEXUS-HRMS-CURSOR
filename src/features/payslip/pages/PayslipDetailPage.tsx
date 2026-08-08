import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Card, CardContent, ErrorState, PageHeader, PageLoader } from '@/components/ui'
import { ROLES } from '@/constants/roles'
import { useAuth } from '@/contexts/AuthContext'
import { PayslipActions } from '../components/PayslipActions'
import { PayslipTemplate } from '../components/PayslipTemplate'
import { payslipService } from '../services/payslipService'
import type { Payslip } from '../types'
import { getPayslipErrorMessage } from '../utils/errors'

export function PayslipDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [payslip, setPayslip] = useState<Payslip | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    setError(null)
    try {
      const row = await payslipService.getPayslipById(id, user)
      setPayslip(row)
    } catch (err) {
      setError(getPayslipErrorMessage(err, 'Failed to load payslip.'))
    } finally {
      setIsLoading(false)
    }
  }, [id, user])

  useEffect(() => {
    void load()
  }, [load])

  if (isLoading) return <PageLoader label="Loading payslip" />
  if (error || !payslip) {
    return <ErrorState title="Unable to load payslip" message={error ?? 'Payslip not found.'} />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={payslip.payslipNumber}
        description={`${payslip.employeeNameSnapshot} salary document for ${payslip.monthKey}.`}
        breadcrumbs={[
          { label: 'Home' },
          { label: 'Payslips', href: '/payslips' },
          { label: payslip.payslipNumber },
        ]}
        actions={<PayslipActions payslip={payslip} onArchive={setPayslip} />}
      />

      <Card>
        <CardContent className="overflow-x-auto bg-surface-100 dark:bg-surface-950">
          <PayslipTemplate
            payslip={payslip}
            viewerRole={user?.role === ROLES.EMPLOYEE ? 'employee' : 'admin'}
          />
        </CardContent>
      </Card>
    </div>
  )
}
