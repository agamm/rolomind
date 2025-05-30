"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash2, Loader2 } from "lucide-react"
import { ConfirmationDialog } from "./confirmation-dialog"

interface DeleteAllButtonProps {
  onDeleteAll: () => void
  isDeleting: boolean
  contactCount: number
  disabled?: boolean
}

export function DeleteAllButton({
  onDeleteAll,
  isDeleting,
  contactCount,
  disabled = false,
}: DeleteAllButtonProps) {
  const [showDialog, setShowDialog] = useState(false)

  const handleClick = () => {
    if (contactCount === 0) return
    setShowDialog(true)
  }

  const handleConfirm = () => {
    setShowDialog(false)
    onDeleteAll()
  }

  const handleCancel = () => {
    setShowDialog(false)
  }

  if (contactCount === 0) {
    return null // Don't show button when there are no contacts
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={disabled || isDeleting}
        className="text-gray-600 hover:text-red-600 hover:border-red-300"
      >
        {isDeleting ? (
          <Loader2 className="w-4 h-4 animate-spin mr-1" />
        ) : (
          <Trash2 className="w-4 h-4 mr-1" />
        )}
        {isDeleting ? "Deleting..." : "Delete All"}
      </Button>

      <ConfirmationDialog
        isOpen={showDialog}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        title="Delete All Contacts"
        message={`Are you sure you want to delete all ${contactCount} contacts? This action cannot be undone.`}
        confirmText="Delete All"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </>
  )
}