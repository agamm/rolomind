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

  const hasActiveSubscription = customerState?.subscriptions?.some(
    (sub) => sub.status === "active" || sub.status === "trialing"
  ) ?? false;

  const activeSubscriptions = customerState?.subscriptions?.filter(
    (sub) => sub.status === "active" || sub.status === "trialing"
  ) ?? [];

  const grantedBenefits = customerState?.benefits ?? [];
  
  const meters = customerState?.meters ?? [];

  return {
    isPayingCustomer: hasActiveSubscription,
    isLoading,
    error,
    customerState,
    activeSubscriptions,
    grantedBenefits,
    meters,
  };
}