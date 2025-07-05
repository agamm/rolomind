"use client"

import React, { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface BackButtonProps {
  href: string
  children?: React.ReactNode
}

export function BackButton({ href, children = "Back to Contacts" }: BackButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleClick = () => {
    startTransition(() => {
      router.push(href)
    })
  }

  return (
    <Button 
      variant="outline" 
      size="sm"
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <ArrowLeft className="w-4 h-4 mr-2" />
      )}
      {children}
    </Button>
  )
}