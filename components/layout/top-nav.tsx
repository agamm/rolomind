"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ImportButton, ImportHelpButton } from "@/components/import"
import { ThemeToggle } from "./theme-toggle"
import { useSession, signOut } from "@/lib/auth/auth-client"
import { useOpenRouterCredits } from "@/hooks/use-openrouter-credits"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, CreditCard, User, ChevronDown, Key, Loader2, Menu, X } from "lucide-react"

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
  const { data: session, isPending } = useSession();
  const { data: credits } = useOpenRouterCredits();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };
  
  return (
    <div className="relative">
      <div className="flex items-center justify-between">
        <Link href="/dashboard/app" className="no-underline relative touch-manipulation" style={{ overflow: 'visible', padding: '20px 0' }}>
          <h1 className="display-text text-primary">Rolomind</h1>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden sm:flex items-center gap-3 sm:gap-2">
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white/80 backdrop-blur-sm">
            <ImportButton
              onFileSelect={onFileSelect}
              isImporting={isImporting}
              disabled={isPending || !session?.user?.email}
            />
            <div className="w-px h-8 sm:h-6 bg-gray-200" />
            <ImportHelpButton />
          </div>
          <ThemeToggle />
          {isPending ? (
            <Button variant="outline" disabled>
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              <span className="hidden sm:inline">Loading...</span>
              <span className="sm:hidden">...</span>
            </Button>
          ) : session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
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
                <DropdownMenuItem
                  className="cursor-pointer h-10 touch-manipulation"
                  onClick={() => router.push("/dashboard/billing")}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  <span>Billing</span>
                  {credits && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      ${(credits.data.total_credits - credits.data.total_usage).toFixed(0)}
                    </span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer h-10 touch-manipulation"
                  onClick={() => router.push("/dashboard/ai-keys")}
                >
                  <Key className="h-4 w-4 mr-2" />
                  <span>AI Keys</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:text-destructive h-10 touch-manipulation"
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
          ) : (
            <Button variant="outline" disabled>
              <User className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Not signed in</span>
              <span className="sm:hidden">---</span>
            </Button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="sm:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMobileMenu}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="sm:hidden absolute top-16 left-0 right-0 bg-background/98 backdrop-blur-md shadow-2xl border border-gray-200/80 dark:border-gray-100/50 z-50 mx-4 rounded-2xl">
          <div className="py-6 px-4 space-y-4">
            {/* Import Section */}
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white/80 backdrop-blur-sm">
              <ImportButton
                onFileSelect={onFileSelect}
                isImporting={isImporting}
                disabled={isPending || !session?.user?.email}
              />
              <div className="w-px h-8 bg-gray-200" />
              <ImportHelpButton />
            </div>
            
            {/* User Actions */}
            {isPending ? (
              <Button variant="outline" className="w-full h-14 text-base rounded-xl border-gray-200 bg-white/50" disabled>
                <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                Loading...
              </Button>
            ) : session?.user ? (
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full h-14 justify-start text-base rounded-xl border-gray-200 bg-white/50 hover:bg-white hover:border-gray-300 transition-all"
                  onClick={() => {
                    router.push("/dashboard/billing");
                    closeMobileMenu();
                  }}
                >
                  <CreditCard className="h-5 w-5 mr-3" />
                  <span>Billing</span>
                  {credits && (
                    <span className="ml-auto text-sm text-muted-foreground">
                      ${(credits.data.total_credits - credits.data.total_usage).toFixed(0)}
                    </span>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full h-14 justify-start text-base rounded-xl border-gray-200 bg-white/50 hover:bg-white hover:border-gray-300 transition-all"
                  onClick={() => {
                    router.push("/dashboard/ai-keys");
                    closeMobileMenu();
                  }}
                >
                  <Key className="h-5 w-5 mr-3" />
                  <span>AI Keys</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full h-14 justify-start text-base rounded-xl border-red-200 bg-red-50/50 text-destructive hover:bg-red-50 hover:border-red-300 hover:text-destructive transition-all"
                  onClick={async () => {
                    await signOut();
                    router.push("/");
                    closeMobileMenu();
                  }}
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button variant="outline" className="w-full h-14 text-base rounded-xl border-gray-200 bg-white/50" disabled>
                <User className="h-5 w-5 mr-3" />
                Not signed in
              </Button>
            )}
            
            {/* Theme Toggle */}
            <div className="flex justify-center pt-2">
              <div className="p-2">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}