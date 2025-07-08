"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "@/lib/auth/auth-client";
import { Loader2, Menu, X } from "lucide-react";
import { useState } from "react";

export function Header() {
  const { data: session, isPending } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="absolute top-0 z-50 w-full">
      <div className="container flex h-16 items-center justify-end">
        {/* Desktop Navigation */}
        <div className="hidden sm:flex items-center space-x-3">
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : session ? (
            <>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" asChild>
                <Link href="/dashboard/app">App</Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={async () => {
                  await signOut();
                }}
              >
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" asChild>
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" asChild>
                <Link href="/sign-up">Get Started</Link>
              </Button>
            </>
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
        <div className="sm:hidden absolute top-16 left-0 right-0 bg-background/95 backdrop-blur-md shadow-lg">
          <div className="container py-4 space-y-3">
            {isPending ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : session ? (
              <>
                <Button 
                  variant="ghost" 
                  className="w-full h-12 text-muted-foreground hover:text-foreground justify-start touch-manipulation" 
                  asChild
                  onClick={closeMobileMenu}
                >
                  <Link href="/dashboard/app">App</Link>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full h-12 text-muted-foreground hover:text-foreground justify-start touch-manipulation"
                  onClick={async () => {
                    await signOut();
                    closeMobileMenu();
                  }}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  className="w-full h-12 text-muted-foreground hover:text-foreground justify-start touch-manipulation" 
                  asChild
                  onClick={closeMobileMenu}
                >
                  <Link href="/sign-in">Sign In</Link>
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full h-12 text-muted-foreground hover:text-foreground justify-start touch-manipulation" 
                  asChild
                  onClick={closeMobileMenu}
                >
                  <Link href="/sign-up">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}