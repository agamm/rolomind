import { useQuery } from '@tanstack/react-query';

interface OpenRouterCredits {
  data: {
    total_credits: number;
    total_usage: number;
  };
}

export function useOpenRouterCredits() {
  return useQuery<OpenRouterCredits>({
    queryKey: ['openrouter-credits'],
    queryFn: async () => {
      const response = await fetch('/api/openrouter-credits');
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('OpenRouter API key not configured');
        }
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch credits');
      }
      
      return response.json();
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });
}