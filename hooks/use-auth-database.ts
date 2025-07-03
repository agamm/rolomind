import { useEffect } from 'react';
import { useSession } from '@/lib/auth/auth-client';
import { initializeUserDatabase, clearUserDatabase } from '@/db/indexdb';

/**
 * Hook that automatically initializes/clears the user database based on authentication state
 * Should be used at the app level to ensure database is properly set up
 */
export function useAuthDatabase() {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user?.email) {
      // User is authenticated, initialize their database
      initializeUserDatabase(session.user.email);
    } else {
      // User is not authenticated, clear database reference
      clearUserDatabase();
    }
  }, [session?.user?.email]);

  return {
    isAuthenticated: !!session?.user?.email,
    userEmail: session?.user?.email
  };
}