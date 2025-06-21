"use client";

import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth/auth-client";
import { useIsAuthenticated } from "./use-is-authenticated";

export function useIsPayingCustomer() {
  const { isAuthenticated } = useIsAuthenticated();
  
  const { data: customerState, isLoading, error } = useQuery({
    queryKey: ["customer-state"],
    queryFn: async () => {
      const { data } = await authClient.customer.state();
      return data;
    },
    enabled: isAuthenticated,
    retry: false,
  });

  // Handle potential differences in customer state structure
  const subscriptions = (customerState as any)?.subscriptions || [];
  const benefits = (customerState as any)?.benefits || [];
  const meters = (customerState as any)?.meters || [];
  
  const hasActiveSubscription = subscriptions.some(
    (sub: any) => sub.status === "active" || sub.status === "trialing"
  );

  const activeSubscriptions = subscriptions.filter(
    (sub: any) => sub.status === "active" || sub.status === "trialing"
  );

  return {
    isPayingCustomer: hasActiveSubscription,
    isLoading,
    error,
    customerState,
    activeSubscriptions,
    grantedBenefits: benefits,
    meters,
  };
}