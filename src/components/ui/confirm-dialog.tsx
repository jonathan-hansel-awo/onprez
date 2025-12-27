'use client'

import { ReactNode } from 'react'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

type DialogVariant = 'info' | 'warning' | 'danger' | 'success'

interface VariantConfig {
  icon: typeof AlertTriangle
  iconBg: string
  iconColor: string
  buttonVariant: 'primary' | 'secondary' | 'ghost'
  buttonClass?: string
}

const variantConfig: { [key in DialogVariant]: VariantConfig } = {
  info: {
    icon: Info,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    buttonVariant: 'primary',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    buttonVariant: 'primary',
    buttonClass: 'bg-amber-600 hover:bg-amber-700',
  },
  danger: {
    icon: XCircle,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    buttonVariant: 'primary',
    buttonClass: 'bg-red-600 hover:bg-red-700',
  },
  success: {
    icon: CheckCircle,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    buttonVariant: 'primary',
    buttonClass: 'bg-green-600 hover:bg-green-700',
  },
}

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  children?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: DialogVariant
  isLoading?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'info',
  isLoading = false,
}: ConfirmDialogProps) {
  const config = variantConfig[variant]
  const Icon = config.icon

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalBody className="text-center sm:text-left">
        <div className="sm:flex sm:items-start">
          <div
            className={cn(
              'mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10',
              config.iconBg
            )}
          >
            <Icon className={cn('h-6 w-6', config.iconColor)} aria-hidden="true" />
          </div>
          <div className="mt-3 sm:ml-4 sm:mt-0">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {description && <p className="mt-2 text-sm text-gray-500">{description}</p>}
            {children && <div className="mt-4">{children}</div>}
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={isLoading}>
          {cancelLabel}
        </Button>
        <Button
          variant={config.buttonVariant}
          onClick={onConfirm}
          disabled={isLoading}
          className={config.buttonClass}
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Processing...
            </>
          ) : (
            confirmLabel
          )}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
