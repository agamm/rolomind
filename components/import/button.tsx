"use client"

import React, { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, Loader2 } from "lucide-react"

interface ImportButtonProps {
  onFileSelect: (file: File) => void
  isImporting: boolean
  disabled?: boolean
}

export function ImportButton({
  onFileSelect,
  isImporting,
  disabled = false,
}: ImportButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onFileSelect(file)
      // Reset the input so the same file can be selected again
      event.target.value = ""
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isImporting}
      />
      <Button
        variant="outline"
        onClick={handleClick}
        disabled={disabled || isImporting}
        className="h-9 px-3 cursor-pointer"
      >
        {isImporting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Upload className="w-4 h-4 mr-1.5" />}
        {isImporting ? "Importing..." : "Import CSV"}
      </Button>
    </>
  )
}