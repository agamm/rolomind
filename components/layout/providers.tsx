"use client"

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from 'next-themes'
import { useAuthDatabase } from '@/hooks/use-auth-database'

function AuthDatabaseProvider({ children }: { children: React.ReactNode }) {
  // Initialize the user database based on authentication state
  useAuthDatabase()
  return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider 
        attribute="class" 
        defaultTheme="system" 
        enableSystem
        disableTransitionOnChange
      >
        <AuthDatabaseProvider>
          {children}
        </AuthDatabaseProvider>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  )
}