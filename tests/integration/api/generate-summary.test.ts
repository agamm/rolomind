import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import '../../mocks/ai'

// Mock authentication
vi.mock('@/lib/auth/server', () => ({
  getServerSession: vi.fn().mockResolvedValue({
    user: { id: 'test-user', email: 'test@example.com' }
  }),
  getUserApiKeys: vi.fn().mockResolvedValue({
    openrouterApiKey: 'test-key',
    openaiApiKey: 'test-key'
  })
}))

// Mock AI client
vi.mock('@/lib/ai-client', () => ({
  getAIModel: vi.fn().mockResolvedValue({
    // Mock model object
    name: 'test-model'
  })
}))

describe('Generate Summary API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create summaries from search results', async () => {
    const handler = await import('@/app/api/generate-summary/route')
    
    const contacts = [
      {
        contact: {
          name: 'John Doe',
          email: 'john@example.com',
          company: 'Tech Corp',
          title: 'CEO',
          location: 'San Francisco'
        },
        reason: 'CEO in tech industry'
      },
      {
        contact: {
          name: 'Jane Smith',
          email: 'jane@example.com',
          company: 'AI Startup',
          title: 'CTO',
          location: 'New York'
        },
        reason: 'CTO at AI company'
      }
    ]

    const request = new NextRequest('http://localhost:3000/api/generate-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contacts,
        query: 'tech leaders'
      })
    })

    const response = await handler.POST(request)
    expect(response.status).toBe(200)
    
    const data = await response.json()
    expect(data.summary).toContain('2 contacts')
    expect(data.keyInsights).toBeInstanceOf(Array)
    expect(data.keyInsights.length).toBeLessThanOrEqual(4)
    expect(data.totalMatches).toBe(2)
  })

  it('should include key insights (max 4)', async () => {
    const { mockGenerateObject } = await import('../../mocks/ai')
    const handler = await import('@/app/api/generate-summary/route')
    
    // Create 10 contacts
    const manyContacts = Array(10).fill(null).map((_, i) => ({
      contact: {
        name: `Contact ${i}`,
        email: `contact${i}@example.com`,
        company: `Company ${i}`,
        title: 'Executive',
        location: 'USA'
      },
      reason: `Match reason ${i}`
    }))

    const request = new NextRequest('http://localhost:3000/api/generate-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contacts: manyContacts,
        query: 'executives'
      })
    })

    await handler.POST(request)

    // Check that the mock was called with the right prompt
    expect(mockGenerateObject).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining('10 contacts'),
        schema: expect.objectContaining({
          shape: expect.objectContaining({
            keyInsights: expect.any(Object)
          })
        })
      })
    )
  })

  it('should handle empty results gracefully', async () => {
    const handler = await import('@/app/api/generate-summary/route')
    
    const request = new NextRequest('http://localhost:3000/api/generate-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contacts: [],
        query: 'no results'
      })
    })

    const response = await handler.POST(request)
    expect(response.status).toBe(400)
    
    const data = await response.json()
    expect(data.error).toBe('No contacts provided')
  })

  it('should validate query parameter', async () => {
    const handler = await import('@/app/api/generate-summary/route')
    
    const request = new NextRequest('http://localhost:3000/api/generate-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contacts: [{ contact: { name: 'Test' }, reason: 'Test' }],
        query: null
      })
    })

    const response = await handler.POST(request)
    expect(response.status).toBe(400)
    
    const data = await response.json()
    expect(data.error).toBe('Query is required')
  })

  it('should handle rate limit errors specifically', async () => {
    const { mockGenerateObject } = await import('../../mocks/ai')
    mockGenerateObject.mockRejectedValueOnce(new Error('rate limit exceeded'))
    
    const handler = await import('@/app/api/generate-summary/route')
    
    const request = new NextRequest('http://localhost:3000/api/generate-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contacts: [{ contact: { name: 'Test' }, reason: 'Test' }],
        query: 'test'
      })
    })

    const response = await handler.POST(request)
    expect(response.status).toBe(429)
    
    const data = await response.json()
    expect(data.error).toContain('Rate limit exceeded')
  })

  it('should handle generic AI errors', async () => {
    const { mockGenerateObject } = await import('../../mocks/ai')
    mockGenerateObject.mockRejectedValueOnce(new Error('AI service error'))
    
    const handler = await import('@/app/api/generate-summary/route')
    
    const request = new NextRequest('http://localhost:3000/api/generate-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contacts: [{ contact: { name: 'Test' }, reason: 'Test' }],
        query: 'test'
      })
    })

    const response = await handler.POST(request)
    expect(response.status).toBe(500)
    
    const data = await response.json()
    expect(data.error).toBe('Failed to generate summary')
  })

  it('should format contact summaries correctly in prompt', async () => {
    const { mockGenerateObject } = await import('../../mocks/ai')
    const handler = await import('@/app/api/generate-summary/route')
    
    const contacts = [
      {
        contact: {
          name: 'John Doe',
          email: 'john@example.com',
          company: 'Tech Corp',
          title: 'CEO',
          location: 'San Francisco'
        },
        reason: 'CEO in tech'
      }
    ]

    const request = new NextRequest('http://localhost:3000/api/generate-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contacts,
        query: 'tech CEOs'
      })
    })

    await handler.POST(request)

    const callArgs = mockGenerateObject.mock.calls[0][0]
    expect(callArgs.prompt).toContain('John Doe')
    expect(callArgs.prompt).toContain('john@example.com')
    expect(callArgs.prompt).toContain('Tech Corp')
    expect(callArgs.prompt).toContain('CEO')
    expect(callArgs.prompt).toContain('San Francisco')
    expect(callArgs.prompt).toContain('CEO in tech')
  })

  it('should include total match count in response', async () => {
    const handler = await import('@/app/api/generate-summary/route')
    
    const contacts = Array(25).fill(null).map((_, i) => ({
      contact: {
        name: `Contact ${i}`,
        email: `contact${i}@example.com`,
        company: `Company ${i}`,
        title: 'Manager',
        location: 'Remote'
      },
      reason: 'Remote manager'
    }))

    const request = new NextRequest('http://localhost:3000/api/generate-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contacts,
        query: 'remote managers'
      })
    })

    const response = await handler.POST(request)
    const data = await response.json()
    
    expect(data.totalMatches).toBe(25)
    expect(data.summary).toContain('25')
  })
})