import { toast, type ToastOptions } from 'react-toastify'
import { TOAST_AUTO_CLOSE_MS } from '@/constants'

const defaultOptions: ToastOptions = {
  autoClose: TOAST_AUTO_CLOSE_MS,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
}

export function showSuccess(message: string, options?: ToastOptions): void {
  toast.success(message, { ...defaultOptions, ...options })
}

export function showError(message: string, options?: ToastOptions): void {
  toast.error(message, { ...defaultOptions, ...options })
}

export function showInfo(message: string, options?: ToastOptions): void {
  toast.info(message, { ...defaultOptions, ...options })
}

export function showWarning(message: string, options?: ToastOptions): void {
  toast.warning(message, { ...defaultOptions, ...options })
}
