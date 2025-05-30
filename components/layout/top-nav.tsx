"use client"

import React from "react"
import { ImportButton } from "@/components/import"
import { DeleteAllButton } from "@/components/delete"

interface TopNavProps {
  contactCount: number
  onFileSelect: (file: File) => void
  onDeleteAll: () => void
  isImporting: boolean
  isDeleting: boolean
  disabled?: boolean
}

export function TopNav({
  contactCount,
  onFileSelect,
  onDeleteAll,
  isImporting,
  isDeleting,
  disabled = false,
}: TopNavProps) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold text-gray-900">Rolodex</h1>
      <div className="flex items-center gap-3">
        <DeleteAllButton
          onDeleteAll={onDeleteAll}
          isDeleting={isDeleting}
          contactCount={contactCount}
          disabled={disabled}
        />
        <ImportButton
          onFileSelect={onFileSelect}
          isImporting={isImporting}
        />
      </div>
    </div>
  )
}