"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth/auth-client";
import { authClient } from "@/lib/auth/auth-client";

export function useSubscription() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [customerState, setCustomerState] = useState<any>(null);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!session) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await authClient.customer.state();
        setCustomerState(data);
        
        const hasActive = data?.activeSubscriptions?.some(
          (sub: any) => sub.status === "active" || sub.status === "trialing"
        ) || false;
        
        setHasSubscription(hasActive);
      } catch (error) {
        console.error("Error checking subscription:", error);
        setHasSubscription(false);
      } finally {
        setLoading(false);
      }
    };

    checkSubscription();
  }, [session]);

  return { loading, hasSubscription, customerState };
}