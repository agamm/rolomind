"use client"

import React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ImportButton } from "@/components/import"
import { ThemeToggle } from "./theme-toggle"
import { useSession, signOut } from "@/lib/auth/auth-client"
import { Button } from "@/components/ui/button"
import { LogOut, CreditCard } from "lucide-react"

interface TopNavProps {
  contactCount: number
  onFileSelect: (file: File) => void
  isImporting: boolean
  disabled?: boolean
}

export function TopNav({
  contactCount,
  onFileSelect,
  isImporting,
  disabled = false,
}: TopNavProps) {
  const { data: session } = useSession();
  const router = useRouter();
  
  return (
    <div className="flex items-center justify-between relative">
      <Link href="/dashboard/app" className="no-underline relative" style={{ overflow: 'visible', padding: '20px 0' }}>
        <h1 className="display-text text-primary">Rolomind</h1>
      </Link>
      <div className="flex items-center gap-2">
        <ImportButton
          onFileSelect={onFileSelect}
          isImporting={isImporting}
        />
        <ThemeToggle />
        {session?.user && (
          <>
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/billing")}
              className="h-9 px-3"
            >
              <CreditCard className="h-4 w-4 mr-1.5" />
              Billing
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                await signOut();
                router.push("/");
              }}
              className="h-9 px-3"
            >
              <LogOut className="h-4 w-4 mr-1.5" />
              Sign Out
            </Button>
          </>
        )}
      </div>
    </div>
  )
}