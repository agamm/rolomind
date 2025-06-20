"use client";

import { useSession } from "@/lib/auth/auth-client";

export function useIsAuthenticated() {
  const { data: session, isPending } = useSession();
  
  return {
    isAuthenticated: !!session?.user,
    isLoading: isPending,
    user: session?.user || null,
  };
}