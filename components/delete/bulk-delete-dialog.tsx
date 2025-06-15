"use client"

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface BulkDeleteDialogProps {
  isOpen: boolean
  count: number
  onConfirm: () => void
  onCancel: () => void
  isDeleting?: boolean
}

export function BulkDeleteDialog({ 
  isOpen, 
  count, 
  onConfirm, 
  onCancel, 
  isDeleting = false 
}: BulkDeleteDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete {count} contacts?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete {count} contact{count > 1 ? 's' : ''} from your database.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="rounded-lg border bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800 p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              You are about to permanently delete <span className="font-semibold">{count}</span> contact{count > 1 ? 's' : ''}. This action cannot be undone.
            </p>
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
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              `Delete ${count} Contact${count > 1 ? 's' : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}