"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth/auth-client";
import { useSubscription } from "@/hooks/use-subscription";
import { Loader2 } from "lucide-react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const { loading, hasSubscription } = useSubscription();
  const router = useRouter();

  useEffect(() => {
    if (session === null) {
      router.push("/sign-in");
    } else if (!loading && !hasSubscription) {
      router.push("/app/billing");
    }
  }, [session, loading, hasSubscription, router]);

  if (!session || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!hasSubscription) {
    return null;
  }

  return <>{children}</>;
}