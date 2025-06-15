"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, X } from "lucide-react"

interface ConfirmationDialogProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  isDestructive?: boolean
  isLoading?: boolean
}

export function ConfirmationDialog({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = false,
  isLoading = false,
}: ConfirmationDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 border-border">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <AlertTriangle className={`w-6 h-6 ${isDestructive ? 'text-destructive' : 'text-yellow-500 dark:text-yellow-400'}`} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {title}
              </h3>
              <p className="text-muted-foreground mb-6">
                {message}
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={onCancel}
                  disabled={isLoading}
                >
                  {cancelText}
                </Button>
                <Button
                  variant={isDestructive ? "destructive" : "default"}
                  onClick={onConfirm}
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : confirmText}
                </Button>
              </div>
            </div>
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}