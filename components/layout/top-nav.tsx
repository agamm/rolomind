"use client"

import React from "react"
import Link from "next/link"
import { ImportButton } from "@/components/import"
import { DeleteAllButton } from "@/components/delete"
import { ExportButton } from "@/components/export/export-button"

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
      <Link href="/" className="no-underline">
        <h1 className="text-2xl font-bold text-gray-900 hover:text-gray-700 transition-colors cursor-pointer">Rolodex</h1>
      </Link>
      <div className="flex items-center gap-3">
        {contactCount > 0 && <ExportButton />}
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