import { useState } from 'react'
import { Button, Modal, Textarea } from '@/components/ui'

export function ApprovalActions({
  disabled,
  onApprove,
  onReject,
  onClarify,
}: {
  disabled?: boolean
  onApprove: (comment?: string) => Promise<void>
  onReject: (comment: string) => Promise<void>
  onClarify: (comment: string) => Promise<void>
}) {
  const [modal, setModal] = useState<'reject' | 'clarify' | null>(null)
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)

  const submitComment = async () => {
    if (!modal) return
    setSaving(true)
    try {
      if (modal === 'reject') await onReject(comment)
      else await onClarify(comment)
      setModal(null)
      setComment('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button variant="success" disabled={disabled} onClick={() => onApprove()}>
          Approve
        </Button>
        <Button variant="outline" disabled={disabled} onClick={() => setModal('clarify')}>
          Needs information
        </Button>
        <Button variant="danger" disabled={disabled} onClick={() => setModal('reject')}>
          Reject
        </Button>
      </div>
      <Modal
        open={Boolean(modal)}
        onClose={() => setModal(null)}
        title={modal === 'reject' ? 'Reject workflow' : 'Request information'}
        footer={
          <>
            <Button variant="outline" onClick={() => setModal(null)}>Cancel</Button>
            <Button variant={modal === 'reject' ? 'danger' : 'primary'} isLoading={saving} onClick={submitComment}>
              Submit
            </Button>
          </>
        }
      >
        <Textarea
          label="Comment"
          requiredMark
          value={comment}
          onChange={(event) => setComment(event.target.value)}
        />
      </Modal>
    </>
  )
}
