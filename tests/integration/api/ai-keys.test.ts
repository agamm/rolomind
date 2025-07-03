import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, PUT } from '@/app/api/ai-keys/route'

// Mock dependencies
vi.mock('@/lib/auth/server', () => ({
  getServerSession: vi.fn(),
  getUserApiKeys: vi.fn(),
  updateUserApiKeys: vi.fn()
}))

vi.mock('@/lib/ai-client', () => ({
  validateApiKeys: vi.fn()
}))

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Map())
}))

describe('AI Keys API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/ai-keys', () => {
    it('should return 401 when user is not authenticated', async () => {
      const { getServerSession } = await import('@/lib/auth/server')
      vi.mocked(getServerSession).mockResolvedValueOnce(null)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
    })

    it('should return empty keys when user has no stored keys', async () => {
      const { getServerSession, getUserApiKeys } = await import('@/lib/auth/server')
      
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { 
          id: 'test-user', 
          email: 'test@example.com',
          name: 'Test User',
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      } as any)
      vi.mocked(getUserApiKeys).mockResolvedValueOnce(null)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        openrouterApiKey: '',
        openaiApiKey: ''
      })
    })

    it('should return user API keys when they exist', async () => {
      const { getServerSession, getUserApiKeys } = await import('@/lib/auth/server')
      
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { 
          id: 'test-user', 
          email: 'test@example.com',
          name: 'Test User',
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      } as any)
      vi.mocked(getUserApiKeys).mockResolvedValueOnce({
        openrouterApiKey: 'sk-or-v1-test-key',
        openaiApiKey: 'sk-test-openai-key'
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        openrouterApiKey: 'sk-or-v1-test-key',
        openaiApiKey: 'sk-test-openai-key'
      })
    })

    it('should handle null keys gracefully', async () => {
      const { getServerSession, getUserApiKeys } = await import('@/lib/auth/server')
      
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { 
          id: 'test-user', 
          email: 'test@example.com',
          name: 'Test User',
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      } as any)
      vi.mocked(getUserApiKeys).mockResolvedValueOnce({
        openrouterApiKey: null,
        openaiApiKey: null
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        openrouterApiKey: '',
        openaiApiKey: ''
      })
    })

    it('should return 500 when getUserApiKeys throws error', async () => {
      const { getServerSession, getUserApiKeys } = await import('@/lib/auth/server')
      
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { 
          id: 'test-user', 
          email: 'test@example.com',
          name: 'Test User',
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      } as any)
      vi.mocked(getUserApiKeys).mockRejectedValueOnce(new Error('Database error'))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch API keys')
    })
  })

  describe('PUT /api/ai-keys', () => {
    it('should return 401 when user is not authenticated', async () => {
      const { getServerSession } = await import('@/lib/auth/server')
      vi.mocked(getServerSession).mockResolvedValueOnce(null)

      const request = new NextRequest('http://localhost:3000/api/ai-keys', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          openrouterApiKey: 'sk-or-v1-test',
          openaiApiKey: 'sk-test'
        })
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
    })

    it('should return 400 when API keys are invalid', async () => {
      const { getServerSession } = await import('@/lib/auth/server')
      const { validateApiKeys } = await import('@/lib/ai-client')
      
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { 
          id: 'test-user', 
          email: 'test@example.com',
          name: 'Test User',
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      } as any)
      vi.mocked(validateApiKeys).mockReturnValueOnce({
        isValid: false,
        errors: ['OpenRouter API key is required']
      })

      const request = new NextRequest('http://localhost:3000/api/ai-keys', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          openrouterApiKey: '',
          openaiApiKey: 'sk-test'
        })
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid API keys')
      expect(data.details).toEqual(['OpenRouter API key is required'])
    })

    it('should successfully update API keys when valid', async () => {
      const { getServerSession, updateUserApiKeys } = await import('@/lib/auth/server')
      const { validateApiKeys } = await import('@/lib/ai-client')
      
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { 
          id: 'test-user', 
          email: 'test@example.com',
          name: 'Test User',
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      } as any)
      vi.mocked(validateApiKeys).mockReturnValueOnce({
        isValid: true,
        errors: []
      })
      vi.mocked(updateUserApiKeys).mockResolvedValueOnce(true)

      const request = new NextRequest('http://localhost:3000/api/ai-keys', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          openrouterApiKey: 'sk-or-v1-test-key',
          openaiApiKey: 'sk-test-openai-key'
        })
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(updateUserApiKeys).toHaveBeenCalledWith(
        'sk-or-v1-test-key',
        'sk-test-openai-key'
      )
    })

    it('should not update masked API keys', async () => {
      const { getServerSession, updateUserApiKeys } = await import('@/lib/auth/server')
      const { validateApiKeys } = await import('@/lib/ai-client')
      
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { 
          id: 'test-user', 
          email: 'test@example.com',
          name: 'Test User',
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      } as any)
      vi.mocked(validateApiKeys).mockReturnValueOnce({
        isValid: true,
        errors: []
      })
      vi.mocked(updateUserApiKeys).mockResolvedValueOnce(true)

      const request = new NextRequest('http://localhost:3000/api/ai-keys', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          openrouterApiKey: 'sk-or-***************',
          openaiApiKey: 'sk-test-openai-key'
        })
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(updateUserApiKeys).toHaveBeenCalledWith(
        undefined,
        'sk-test-openai-key'
      )
    })

    it('should handle case where no updates are needed', async () => {
      const { getServerSession, updateUserApiKeys } = await import('@/lib/auth/server')
      const { validateApiKeys } = await import('@/lib/ai-client')
      
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { 
          id: 'test-user', 
          email: 'test@example.com',
          name: 'Test User',
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      } as any)
      vi.mocked(validateApiKeys).mockReturnValueOnce({
        isValid: true,
        errors: []
      })

      const request = new NextRequest('http://localhost:3000/api/ai-keys', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          openrouterApiKey: 'sk-or-***************',
          openaiApiKey: 'sk-***************'
        })
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(updateUserApiKeys).not.toHaveBeenCalled()
    })

    it('should return 500 when update fails', async () => {
      const { getServerSession, updateUserApiKeys } = await import('@/lib/auth/server')
      const { validateApiKeys } = await import('@/lib/ai-client')
      
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { 
          id: 'test-user', 
          email: 'test@example.com',
          name: 'Test User',
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      } as any)
      vi.mocked(validateApiKeys).mockReturnValueOnce({
        isValid: true,
        errors: []
      })
      vi.mocked(updateUserApiKeys).mockRejectedValueOnce(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/ai-keys', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          openrouterApiKey: 'sk-or-v1-test-key',
          openaiApiKey: 'sk-test-openai-key'
        })
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to update API keys')
    })
  })
})