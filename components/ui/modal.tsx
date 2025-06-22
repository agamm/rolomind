import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogProps,
  DialogContentProps
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface ModalProps extends Omit<DialogProps, 'onOpenChange'> {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
  showCloseButton?: boolean
  preventOutsideClick?: boolean
  preventEscapeKey?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

const sizeClasses = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
  full: 'sm:max-w-[90vw]'
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  showCloseButton = true,
  preventOutsideClick = false,
  preventEscapeKey = false,
  size = 'md',
  ...props
}: ModalProps) {
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose()
    }
  }

  const handlePointerDownOutside: DialogContentProps['onPointerDownOutside'] = (e) => {
    if (preventOutsideClick) {
      e.preventDefault()
    }
  }

  const handleEscapeKeyDown: DialogContentProps['onEscapeKeyDown'] = (e) => {
    if (preventEscapeKey) {
      e.preventDefault()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange} {...props}>
      <DialogContent
        className={cn(sizeClasses[size], className)}
        onPointerDownOutside={handlePointerDownOutside}
        onEscapeKeyDown={handleEscapeKeyDown}
        hideCloseButton={!showCloseButton}
      >
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        {children}
      </DialogContent>
    </Dialog>
  )
}

// Convenience wrapper for centered content
export function ModalCenteredContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 py-4">
      {children}
    </div>
  )
}