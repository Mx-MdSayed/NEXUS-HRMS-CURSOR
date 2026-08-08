import { Archive, Download, Eye, Printer } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui'
import { PERMISSIONS } from '@/constants/permissions'
import { useAuth } from '@/contexts/AuthContext'
import { showError, showInfo, showSuccess } from '@/utils/toast'
import { cn } from '@/utils/cn'
import type { Payslip } from '../types'
import { getPayslipErrorMessage } from '../utils/errors'
import { payslipService } from '../services/payslipService'

interface PayslipActionsProps {
  payslip: Payslip
  onArchive?: (payslip: Payslip) => void
  className?: string
  compact?: boolean
}

export function PayslipActions({ payslip, onArchive, className, compact = false }: PayslipActionsProps) {
  const navigate = useNavigate()
  const { user, hasPermission } = useAuth()
  const canView = hasPermission(PERMISSIONS.PAYSLIP_VIEW) || hasPermission(PERMISSIONS.PAYSLIP_MANAGE)
  const canPrint = hasPermission(PERMISSIONS.PAYSLIP_PRINT) || hasPermission(PERMISSIONS.PAYSLIP_MANAGE)
  const canDownload =
    hasPermission(PERMISSIONS.PAYSLIP_DOWNLOAD) || hasPermission(PERMISSIONS.PAYSLIP_MANAGE)
  const canArchive = hasPermission(PERMISSIONS.PAYSLIP_MANAGE) && payslip.status !== 'archived'
  const size = compact ? 'sm' : 'md'

  async function handleDownload() {
    try {
      const result = await payslipService.downloadPayslip(payslip.id)
      showInfo(result.message)
      navigate(`/payslips/${payslip.id}/print`)
    } catch (err) {
      showError(getPayslipErrorMessage(err, 'Failed to prepare payslip download.'))
    }
  }

  async function handleArchive() {
    try {
      const archived = await payslipService.archivePayslip(payslip.id, user?.name ?? 'System')
      showSuccess('Payslip archived.')
      onArchive?.(archived)
    } catch (err) {
      showError(getPayslipErrorMessage(err, 'Failed to archive payslip.'))
    }
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {canView ? (
        <Button
          size={size}
          variant="secondary"
          leftIcon={<Eye className="h-4 w-4" />}
          onClick={() => navigate(`/payslips/${payslip.id}`)}
        >
          View
        </Button>
      ) : null}
      {canPrint ? (
        <Button
          size={size}
          variant="outline"
          leftIcon={<Printer className="h-4 w-4" />}
          onClick={() => navigate(`/payslips/${payslip.id}/print`)}
        >
          Print
        </Button>
      ) : null}
      {canDownload ? (
        <Button
          size={size}
          variant="outline"
          leftIcon={<Download className="h-4 w-4" />}
          onClick={() => void handleDownload()}
        >
          Download
        </Button>
      ) : null}
      {canArchive ? (
        <Button
          size={size}
          variant="danger"
          leftIcon={<Archive className="h-4 w-4" />}
          onClick={() => void handleArchive()}
        >
          Archive
        </Button>
      ) : null}
    </div>
  )
}
