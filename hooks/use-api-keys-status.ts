"use client";

import { useState, useEffect } from 'react';

interface ApiKeysStatus {
  hasOpenrouterKey: boolean;
  hasOpenaiKey: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useApiKeysStatus() {
  const [status, setStatus] = useState<ApiKeysStatus>({
    hasOpenrouterKey: false,
    hasOpenaiKey: false,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    const checkApiKeys = async () => {
      try {
        const response = await fetch('/api/ai-keys');
        if (response.ok) {
          const data = await response.json();
          setStatus({
            hasOpenrouterKey: !!data.openrouterApiKey,
            hasOpenaiKey: !!data.openaiApiKey,
            isLoading: false,
            error: null
          });
        } else {
          setStatus({
            hasOpenrouterKey: false,
            hasOpenaiKey: false,
            isLoading: false,
            error: 'Failed to check API keys'
          });
        }
      } catch (error) {
        setStatus({
          hasOpenrouterKey: false,
          hasOpenaiKey: false,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    };

    checkApiKeys();
  }, []);

  return status;
}