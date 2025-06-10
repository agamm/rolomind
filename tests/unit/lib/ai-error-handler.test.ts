import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handleAIError, isRetryableError, getRetryDelay } from '@/lib/ai-error-handler'
import { APICallError } from 'ai'

// Mock console.error to prevent noise in tests
vi.spyOn(console, 'error').mockImplementation(() => {})

describe('AI Error Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('handleAIError', () => {
    it('should handle rate limit errors (429)', async () => {
      // Create a mock error that looks like a rate limit error
      const mockError = {
        statusCode: 429,
        isRetryable: true,
        responseHeaders: { 'retry-after': '60' },
        url: 'https://api.openrouter.ai/v1/completions',
        responseBody: 'rate limit exceeded'
      }
      
      // Mock APICallError.isInstance to identify our mock as an APICallError
      vi.spyOn(APICallError, 'isInstance').mockReturnValue(true)
      
      const response = handleAIError(mockError)
      
      expect(response.status).toBe(429)
      expect(response.headers.get('retry-after')).toBe('60')
      expect(response.headers.get('content-type')).toBe('application/json')
      
      const data = await response.json()
      expect(data.error).toBe('Rate limit exceeded')
      expect(data.isRetryable).toBe(true)
      expect(data.retryAfter).toBe(60)
    })

    it('should handle retryable errors with 503 status', async () => {
      const mockError = {
        statusCode: 500,
        isRetryable: true,
        url: 'https://api.openrouter.ai/v1/completions'
      }
      
      vi.spyOn(APICallError, 'isInstance').mockReturnValue(true)
      const response = handleAIError(mockError)
      
      expect(response.status).toBe(503)
      const data = await response.json()
      expect(data.error).toBe('Temporary API error')
      expect(data.isRetryable).toBe(true)
    })

    it('should handle non-retryable API errors', async () => {
      const mockError = {
        statusCode: 400,
        isRetryable: false,
        url: 'https://api.openrouter.ai/v1/completions'
      }
      
      vi.spyOn(APICallError, 'isInstance').mockReturnValue(true)
      const response = handleAIError(mockError)
      
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('API error')
      expect(data.statusCode).toBe(400)
    })

    it('should handle generic non-API errors', async () => {
      const error = new Error('Something went wrong')
      vi.spyOn(APICallError, 'isInstance').mockReturnValue(false)
      
      const response = handleAIError(error)
      
      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Internal server error')
    })

    it('should handle non-Error objects gracefully', async () => {
      vi.spyOn(APICallError, 'isInstance').mockReturnValue(false)
      const response = handleAIError('String error')
      
      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Internal server error')
    })

    it('should handle API errors without status code', async () => {
      const mockError = {
        isRetryable: false,
        url: 'https://api.openrouter.ai/v1/completions'
      }
      
      vi.spyOn(APICallError, 'isInstance').mockReturnValue(true)
      const response = handleAIError(mockError)
      
      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('API error')
    })
  })

  describe('isRetryableError', () => {
    it('should identify 429 status as retryable', () => {
      const response = new Response('', { status: 429 })
      expect(isRetryableError(response)).toBe(true)
    })

    it('should identify 503 status as retryable', () => {
      const response = new Response('', { status: 503 })
      expect(isRetryableError(response)).toBe(true)
    })

    it('should not identify 400 status as retryable', () => {
      const response = new Response('', { status: 400 })
      expect(isRetryableError(response)).toBe(false)
    })

    it('should not identify 500 status as retryable', () => {
      const response = new Response('', { status: 500 })
      expect(isRetryableError(response)).toBe(false)
    })
  })

  describe('getRetryDelay', () => {
    it('should extract retry delay from header', () => {
      const response = new Response('', {
        headers: { 'retry-after': '120' }
      })
      expect(getRetryDelay(response)).toBe(120000) // 120 seconds in ms
    })

    it('should return null if no retry-after header', () => {
      const response = new Response('')
      expect(getRetryDelay(response)).toBe(null)
    })

    it('should return null for invalid retry-after value', () => {
      const response = new Response('', {
        headers: { 'retry-after': 'invalid' }
      })
      expect(getRetryDelay(response)).toBe(null)
    })
  })
})