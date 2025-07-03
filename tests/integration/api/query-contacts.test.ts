import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { sampleContacts } from '../../fixtures/contacts'
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

describe('Query Contacts API', () => {
  beforeEach(() => {
    global.fetch = vi.fn() as any
  })


  it('should handle complex queries (CEOs in USA)', async () => {
    const { mockGenerateObject } = await import('../../mocks/ai')
    
    // Import the actual route handler
    const handler = await import('@/app/api/query-contacts/route')
    
    const request = new NextRequest('http://localhost:3000/api/query-contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'CEOs in USA',
        contacts: sampleContacts.slice(0, 3)
      })
    })

    const response = await handler.POST(request)
    const data = await response.json()

    expect(data.matches).toHaveLength(3)
    expect(data.matches[0].reason).toContain('San Francisco')
    expect(mockGenerateObject).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining('CEOs in USA')
      })
    )
  })

  it('should enforce batch size limit of 100 contacts', async () => {
    const handler = await import('@/app/api/query-contacts/route')
    
    // Create 101 contacts
    const manyContacts = Array(101).fill(null).map((_, i) => ({
      ...sampleContacts[0],
      id: `test-${i}`
    }))

    const request = new NextRequest('http://localhost:3000/api/query-contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'test',
        contacts: manyContacts
      })
    })

    const response = await handler.POST(request)
    expect(response.status).toBe(400)
    
    const data = await response.json()
    expect(data.error).toBe('Too many contacts')
  })

  it('should handle temporal queries correctly', async () => {
    const { mockGenerateObject } = await import('../../mocks/ai')
    const handler = await import('@/app/api/query-contacts/route')
    
    const request = new NextRequest('http://localhost:3000/api/query-contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'connected before 2024',
        contacts: sampleContacts.slice(5, 7) // Old contacts
      })
    })

    const response = await handler.POST(request)
    const data = await response.json()

    expect(data.matches).toHaveLength(2)
    expect(mockGenerateObject).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining('before 2024')
      })
    )
  })

  it('should handle queries with specific keywords like "might"', async () => {
    const { mockGenerateObject } = await import('../../mocks/ai')
    const handler = await import('@/app/api/query-contacts/route')
    
    const request = new NextRequest('http://localhost:3000/api/query-contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'might know investors',
        contacts: sampleContacts.slice(0, 3)
      })
    })

    await handler.POST(request)

    expect(mockGenerateObject).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining('might know investors')
      })
    )
  })

  it('should handle non-descriptive contact names query', async () => {
    const handler = await import('@/app/api/query-contacts/route')
    
    const request = new NextRequest('http://localhost:3000/api/query-contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'non descriptive contact names',
        contacts: sampleContacts.slice(3, 5) // tmp and Contact 123
      })
    })

    const response = await handler.POST(request)
    const data = await response.json()

    expect(data.matches).toHaveLength(2)
    expect(data.matches[0].reason).toContain('placeholder')
  })

  it('should handle empty query gracefully', async () => {
    const handler = await import('@/app/api/query-contacts/route')
    
    const request = new NextRequest('http://localhost:3000/api/query-contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: '',
        contacts: sampleContacts
      })
    })

    const response = await handler.POST(request)
    expect(response.status).toBe(400)
    
    const data = await response.json()
    expect(data.error).toBe('Invalid request')
  })

  it('should handle missing contacts array', async () => {
    const handler = await import('@/app/api/query-contacts/route')
    
    const request = new NextRequest('http://localhost:3000/api/query-contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'test'
      })
    })

    const response = await handler.POST(request)
    expect(response.status).toBe(400)
    
    const data = await response.json()
    expect(data.error).toBe('Invalid request')
  })

  it('should include all relevant contact fields in prompt', async () => {
    const { mockGenerateObject } = await import('../../mocks/ai')
    const handler = await import('@/app/api/query-contacts/route')
    
    const contactWithAllFields = {
      ...sampleContacts[0],
      notes: 'Important notes here',
      source: 'linkedin' as const
    }

    const request = new NextRequest('http://localhost:3000/api/query-contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'test',
        contacts: [contactWithAllFields]
      })
    })

    await handler.POST(request)

    const callArgs = mockGenerateObject.mock.calls[0][0]
    expect(callArgs.prompt).toContain(contactWithAllFields.name)
    expect(callArgs.prompt).toContain(contactWithAllFields.company)
    expect(callArgs.prompt).toContain(contactWithAllFields.role)
    expect(callArgs.prompt).toContain(contactWithAllFields.location)
    expect(callArgs.prompt).toContain(contactWithAllFields.notes)
    expect(callArgs.prompt).toContain(contactWithAllFields.source)
  })

  it('should handle AI errors gracefully', async () => {
    const { mockGenerateObject } = await import('../../mocks/ai')
    mockGenerateObject.mockRejectedValueOnce(new Error('AI service unavailable'))
    
    const handler = await import('@/app/api/query-contacts/route')
    
    const request = new NextRequest('http://localhost:3000/api/query-contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'test',
        contacts: sampleContacts.slice(0, 1)
      })
    })

    const response = await handler.POST(request)
    expect(response.status).toBe(500) // The error handler returns 500 for generic errors
    
    const data = await response.json()
    expect(data.error).toBeDefined()
  })
})