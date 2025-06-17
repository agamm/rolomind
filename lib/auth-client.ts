import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
  fetchOptions: {
    onError: (error) => {
      console.error("Auth error:", error);
    },
  },
});

export const { useSession, signIn, signOut, signUp } = authClient;