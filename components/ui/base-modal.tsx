import React from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface BaseModalProps {
  isOpen: boolean
  onClose?: () => void
  title?: React.ReactNode
  description?: React.ReactNode
  icon?: React.ReactNode
  children?: React.ReactNode
  footer?: React.ReactNode
  className?: string
  contentClassName?: string
  hideCloseButton?: boolean
  preventOutsideClick?: boolean
}

export function BaseModal({
  isOpen,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  className,
  contentClassName,
  hideCloseButton = false,
  preventOutsideClick = false
}: BaseModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && onClose) {
        onClose()
      }
    }}>
      <DialogContent 
        className={cn("sm:max-w-md", contentClassName)}
        onPointerDownOutside={(e) => preventOutsideClick && e.preventDefault()}
        hideCloseButton={hideCloseButton}
      >
        {(title || description || icon) && (
          <DialogHeader>
            <div className={cn("flex flex-col items-center gap-4 py-4", className)}>
              {icon}
              {title && <DialogTitle className="text-center">{title}</DialogTitle>}
              {description && (
                <DialogDescription className="text-center">
                  {description}
                </DialogDescription>
              )}
            </div>
          </DialogHeader>
        )}
        
        {children}
        
        {footer && (
          <DialogFooter>
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}