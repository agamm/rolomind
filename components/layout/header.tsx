"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "@/lib/auth/auth-client";
import { Loader2 } from "lucide-react";

export function Header() {
  const { data: session, isPending } = useSession();

  return (
    <header className="absolute top-0 z-50 w-full">
      <div className="container flex h-16 items-center justify-end">
        <div className="flex items-center space-x-2">
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
      </div>
    </header>
  );
}