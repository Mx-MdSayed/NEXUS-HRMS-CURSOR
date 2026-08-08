import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Printer } from 'lucide-react'
import { Button, ErrorState, PageLoader } from '@/components/ui'
import { ROLES } from '@/constants/roles'
import { useAuth } from '@/contexts/AuthContext'
import { attendanceService } from '@/features/attendance/services/attendanceService'
import { PayslipTemplate } from '../components/PayslipTemplate'
import { payslipService } from '../services/payslipService'
import type { Payslip } from '../types'
import { getPayslipErrorMessage } from '../utils/errors'

export function PayslipPrintPage() {
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
      const row = await payslipService.printPayslip(id)
      if (user?.role === ROLES.EMPLOYEE) {
        const linkedEmployeeId = await attendanceService.resolveLinkedEmployeeId(user)
        if (!linkedEmployeeId || linkedEmployeeId !== row.employeeId) {
          setError('You can only print your own payslips.')
          setPayslip(null)
          return
        }
      }
      setPayslip(row)
      document.title = `${row.payslipNumber} - ${row.employeeCodeSnapshot}`
    } catch (err) {
      setError(getPayslipErrorMessage(err, 'Failed to load payslip for print.'))
    } finally {
      setIsLoading(false)
    }
  }, [id, user])

  useEffect(() => {
    void load()
  }, [load])

  if (isLoading) return <PageLoader label="Preparing payslip print view" />
  if (error || !payslip) {
    return <ErrorState title="Unable to print payslip" message={error ?? 'Payslip not found.'} />
  }

  return (
    <div className="payslip-print-page min-h-screen bg-surface-100 px-4 py-6 dark:bg-surface-950">
      <div className="no-print mx-auto mb-4 flex max-w-4xl items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
            Print {payslip.payslipNumber}
          </h1>
          <p className="text-sm text-surface-500">
            Use your browser print dialog to print or save this payslip as PDF.
          </p>
        </div>
        <Button leftIcon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>
          Print
        </Button>
      </div>

      <PayslipTemplate
        payslip={payslip}
        viewerRole={user?.role === ROLES.EMPLOYEE ? 'employee' : 'admin'}
        className="shadow-none"
      />
    </div>
  )
}
