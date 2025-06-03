"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Contact } from "@/types/contact"

interface DeleteConfirmationDialogProps {
  isOpen: boolean
  contact: Contact | null
  onConfirm: () => void
  onCancel: () => void
  isDeleting?: boolean
}

export function DeleteConfirmationDialog({
  isOpen,
  contact,
  onConfirm,
  onCancel,
  isDeleting = false
}: DeleteConfirmationDialogProps) {
  if (!contact) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Contact</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this contact? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="rounded-lg border bg-gray-50 p-4 space-y-2">
            <p className="font-medium text-gray-900">{contact.name}</p>
            {contact.company && (
              <p className="text-sm text-gray-600">{contact.company}</p>
            )}
            {contact.contactInfo.emails.length > 0 && (
              <p className="text-sm text-gray-600">{contact.contactInfo.emails[0]}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Contact"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}