import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { FileUp, Trash2, Upload } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from './Button'
import { FieldLabel, FieldMessage } from './Field'

export interface UploadedFileMeta {
  name: string
  size: number
}

export interface FileUploadProps {
  label?: string
  hint?: string
  error?: string
  accept?: string
  multiple?: boolean
  disabled?: boolean
  /** Maximum file size in bytes. Reject oversized files before calling onFileSelect. */
  maxSizeBytes?: number
  progress?: number | null
  value?: UploadedFileMeta | null
  onFileSelect?: (file: File | null) => void
  onRemove?: () => void
  className?: string
}

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export function FileUpload({
  label = 'Upload file',
  hint,
  error,
  accept,
  multiple = false,
  disabled = false,
  maxSizeBytes,
  progress = null,
  value = null,
  onFileSelect,
  onRemove,
  className,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0] ?? null
    if (file && maxSizeBytes != null && file.size > maxSizeBytes) {
      onFileSelect?.(null)
      return
    }
    onFileSelect?.(file)
  }

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files)
  }

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    if (disabled) return
    handleFiles(event.dataTransfer.files)
  }

  return (
    <div className={cn('w-full', className)}>
      <FieldLabel>{label}</FieldLabel>
      <div
        className={cn(
          'rounded-xl border border-dashed border-surface-300 bg-surface-50 p-6 transition-colors',
          'dark:border-surface-700 dark:bg-surface-900/40',
          isDragging && 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/20',
          disabled && 'opacity-60',
          error && 'border-danger-500',
        )}
        onDragOver={(event) => {
          event.preventDefault()
          if (!disabled) setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
      >
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 rounded-full bg-white p-3 text-primary-700 shadow-sm dark:bg-surface-800 dark:text-primary-300">
            <Upload className="h-5 w-5" aria-hidden />
          </div>
          <p className="text-sm font-medium text-surface-800 dark:text-surface-100">
            Drag & drop a file here
          </p>
          <p className="mt-1 text-helper">or browse from your computer</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            disabled={disabled}
            leftIcon={<FileUp className="h-4 w-4" />}
            onClick={() => inputRef.current?.click()}
          >
            Browse files
          </Button>
          <input
            ref={inputRef}
            type="file"
            className="sr-only"
            accept={accept}
            multiple={multiple}
            disabled={disabled}
            onChange={onInputChange}
          />
        </div>

        {value ? (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-surface-200 bg-white px-3 py-2 dark:border-surface-700 dark:bg-surface-950">
            <div className="min-w-0 text-left">
              <p className="truncate text-sm font-medium text-surface-800 dark:text-surface-100">
                {value.name}
              </p>
              <p className="text-helper">{formatBytes(value.size)}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              iconOnly
              aria-label="Remove file"
              disabled={disabled}
              onClick={() => {
                if (inputRef.current) inputRef.current.value = ''
                onRemove?.()
                onFileSelect?.(null)
              }}
            >
              <Trash2 className="h-4 w-4 text-danger-600" />
            </Button>
          </div>
        ) : null}

        {typeof progress === 'number' ? (
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-xs text-surface-500">
              <span>Uploading…</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-200 dark:bg-surface-800">
              <div
                className="h-full rounded-full bg-primary-600 transition-all duration-150"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          </div>
        ) : null}
      </div>
      <FieldMessage error={error} hint={hint} />
    </div>
  )
}
