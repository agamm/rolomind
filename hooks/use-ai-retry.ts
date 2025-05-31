import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
}

interface ErrorResponse {
  error: string;
  message: string;
  isRetryable?: boolean;
  retryAfter?: number;
  statusCode?: number;
}

export function useAIRetry(options: RetryOptions = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffFactor = 2
  } = options;

  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const executeWithRetry = useCallback(async <T,>(
    fn: () => Promise<T>,
    onError?: (error: ErrorResponse, retryCount: number) => void
  ): Promise<T> => {
    let lastError: Error | null = null;
    let currentDelay = initialDelay;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        setRetryCount(attempt);
        setIsRetrying(attempt > 0);
        
        const result = await fn();
        
        // Reset retry count on success
        setRetryCount(0);
        setIsRetrying(false);
        
        return result;
      } catch (error) {
        lastError = error as Error;
        
        // Check if it's a Response error
        if (error instanceof Response) {
          const response = error;
          
          // Try to parse error response
          let errorData: ErrorResponse | null = null;
          try {
            const contentType = response.headers.get('content-type');
            if (contentType?.includes('application/json')) {
              errorData = await response.json();
            }
          } catch {
            // Ignore JSON parse errors
          }
          
          // If not retryable or max retries reached, throw
          if (!errorData?.isRetryable || attempt === maxRetries) {
            setIsRetrying(false);
            
            if (onError) {
              onError(errorData || {
                error: 'Request failed',
                message: `Request failed with status ${response.status}`,
                statusCode: response.status
              }, attempt);
            }
            
            throw error;
          }
          
          // Calculate retry delay
          let delay = currentDelay;
          
          // Use server-provided retry delay if available
          if (errorData.retryAfter) {
            delay = errorData.retryAfter * 1000; // Convert to milliseconds
          } else {
            // Use exponential backoff
            currentDelay = Math.min(currentDelay * backoffFactor, maxDelay);
          }
          
          // Show retry notification
          toast.info(`Rate limited. Retrying in ${Math.ceil(delay / 1000)}s... (Attempt ${attempt + 1}/${maxRetries})`);
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay));
          
          continue;
        }
        
        // For non-Response errors, don't retry
        setIsRetrying(false);
        throw error;
      }
    }
    
    setIsRetrying(false);
    throw lastError || new Error('Maximum retries exceeded');
  }, [maxRetries, initialDelay, maxDelay, backoffFactor]);

  return {
    executeWithRetry,
    isRetrying,
    retryCount
  };
}

// Helper function to check if a response is retryable
export async function checkRetryableResponse(response: Response): Promise<boolean> {
  if (response.status === 429 || response.status === 503) {
    return true;
  }
  
  try {
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const data = await response.json();
      return data.isRetryable === true;
    }
  } catch {
    // Ignore errors
  }
  
  return false;
}