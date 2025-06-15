import { APICallError } from 'ai';

export interface ErrorResponse {
  error: string;
  message: string;
  isRetryable?: boolean;
  retryAfter?: number;
  statusCode?: number;
}

export function handleAIError(error: unknown): Response {
  console.error('AI SDK Error:', error);
  
  // Check if it's an API call error
  if (APICallError.isInstance(error)) {
    const apiError = error as APICallError;
    
    // Log detailed error information
    console.error('API Call Error Details:', {
      url: apiError.url,
      statusCode: apiError.statusCode,
      isRetryable: apiError.isRetryable,
      responseBody: apiError.responseBody,
      responseHeaders: apiError.responseHeaders,
    });
    
    // Handle rate limit errors (typically 429 status code)
    if (apiError.statusCode === 429) {
      const retryAfter = apiError.responseHeaders?.['retry-after'];
      const errorResponse: ErrorResponse = {
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.',
        isRetryable: true,
        retryAfter: retryAfter ? parseInt(retryAfter) : undefined
      };
      
      return new Response(
        JSON.stringify(errorResponse),
        { 
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...(retryAfter && { 'Retry-After': retryAfter })
          }
        }
      );
    }
    
    // Handle other retryable errors
    if (apiError.isRetryable) {
      const errorResponse: ErrorResponse = {
        error: 'Temporary API error',
        message: 'A temporary error occurred. Please try again.',
        isRetryable: true
      };
      
      return new Response(
        JSON.stringify(errorResponse),
        { 
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Check for credit limit errors (usually 402 Payment Required or specific error messages)
    if (apiError.statusCode === 402 || 
        (apiError.responseBody && typeof apiError.responseBody === 'string' && 
         (apiError.responseBody.toLowerCase().includes('credit') || 
          apiError.responseBody.toLowerCase().includes('insufficient funds') ||
          apiError.responseBody.toLowerCase().includes('quota exceeded')))) {
      const errorResponse: ErrorResponse = {
        error: 'Insufficient credits',
        message: 'API credit limit reached. Please check your API credits or try again later.',
        statusCode: 402
      };
      
      return new Response(
        JSON.stringify(errorResponse),
        { 
          status: 402,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Handle other non-retryable API errors
    const errorResponse: ErrorResponse = {
      error: 'API error',
      message: 'An error occurred while processing your request.',
      statusCode: apiError.statusCode
    };
    
    return new Response(
      JSON.stringify(errorResponse),
      { 
        status: apiError.statusCode || 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  // Handle generic errors
  const errorResponse: ErrorResponse = {
    error: 'Internal server error',
    message: 'An unexpected error occurred.'
  };
  
  return new Response(
    JSON.stringify(errorResponse),
    { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

// Helper to check if an error response indicates it's retryable
export function isRetryableError(response: Response): boolean {
  if (response.status === 429 || response.status === 503) {
    return true;
  }
  
  // Don't check response body for isRetryable flag to avoid async issues
  return false;
}

// Helper to get retry delay from response
export function getRetryDelay(response: Response): number | null {
  const retryAfter = response.headers.get('retry-after');
  if (retryAfter) {
    const delay = parseInt(retryAfter);
    return isNaN(delay) ? null : delay * 1000; // Convert to milliseconds
  }
  return null;
}