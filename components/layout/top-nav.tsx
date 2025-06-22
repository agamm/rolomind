"use client"

import React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ImportButton } from "@/components/import"
import { ThemeToggle } from "./theme-toggle"
import { useSession, signOut } from "@/lib/auth/auth-client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, CreditCard, User, ChevronDown, Coins, Loader2 } from "lucide-react"
import { useCredits } from "@/hooks/use-credits"

interface TopNavProps {
  contactCount: number
  onFileSelect: (file: File) => void
  isImporting: boolean
  disabled?: boolean
}

export function TopNav({
  onFileSelect,
  isImporting,
}: TopNavProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { credits, loading: creditsLoading } = useCredits();
  
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-9 px-3">
                <User className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">{session.user.name || session.user.email}</span>
                <span className="sm:hidden">Profile</span>
                <ChevronDown className="h-4 w-4 ml-1.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{session.user.name || "User"}</p>
                <p className="text-xs text-muted-foreground">{session.user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Credits</span>
                </div>
                {creditsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : credits ? (
                  <span className="text-sm font-medium">
                    {credits.remaining} / {credits.total}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">--</span>
                )}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => router.push("/dashboard/billing")}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Billing
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={async () => {
                  await signOut();
                  router.push("/");
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}