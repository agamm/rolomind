"use client"

import React, { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { HelpCircle, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

export function ImportHelpButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleClick = () => {
    startTransition(() => {
      router.push("/dashboard/import-help")
    })
  }

  return (
    <Button 
      variant="ghost" 
      size="sm"
      className="h-9 w-9 p-0 rounded-none hover:bg-gray-50"
      title="Import Help"
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <HelpCircle className="w-4 h-4" />
      )}
    </Button>
  )
}