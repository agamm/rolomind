"use client";

import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth/auth-client";

interface CustomerMeter {
  id: string;
  consumedUnits: number;
  creditedUnits: number;
  balance: number;
  meter: {
    id: string;
    name: string;
  };
}

async function fetchCredits() {
  const response = await authClient.usage.meters.list({
    query: {
      page: 1,
      limit: 10,
    },
  });

  console.log('Customer meters response:', response);

  const items = response.data?.result?.items as CustomerMeter[] | undefined;
  
  if (!items) return null;

  // Find the Credits meter
  const creditsMeter = items.find(item => 
    item.meter.name === 'Credits' || item.meter.name.toLowerCase() === 'credits'
  );

  if (!creditsMeter) return null;

  return {
    used: creditsMeter.consumedUnits,
    remaining: creditsMeter.balance,
    total: creditsMeter.creditedUnits,
  };
}

export function useCredits() {
  const { data: credits, isLoading: loading, error, refetch } = useQuery({
    queryKey: ['credits'],
    queryFn: fetchCredits,
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  return { 
    credits, 
    loading, 
    error,
    refetch 
  };
}