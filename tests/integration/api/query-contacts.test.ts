import { describe, it, expect, beforeEach } from 'vitest'
import { sampleContacts } from '../../fixtures/contacts'
import '../../mocks/ai'

describe('Query Contacts API', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  it('should process simple keyword searches', async () => {
    const mockResponse = {
      matches: [
        { id: 'test-1', reason: 'CEO at Tech Startup' },
        { id: 'test-2', reason: 'CEO at AI Company' }
      ]
    }

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    })

    const response = await fetch('/api/query-contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'CEO',
        contacts: sampleContacts.slice(0, 3)
      })
    })

    const data = await response.json()
    expect(data.matches).toHaveLength(2)
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/query-contacts',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('CEO')
      })
    )
  })

  it('should handle complex queries (CEOs in USA)', async () => {
    const { mockGenerateObject } = await import('../../mocks/ai')
    
    // Import the actual route handler
    const handler = await import('@/app/api/query-contacts/route')
    
    const request = new Request('http://localhost:3000/api/query-contacts', {
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

    const request = new Request('http://localhost:3000/api/query-contacts', {
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
    
    const request = new Request('http://localhost:3000/api/query-contacts', {
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

  it('should use RELAXED mode with specific keywords', async () => {
    const { mockGenerateObject } = await import('../../mocks/ai')
    const handler = await import('@/app/api/query-contacts/route')
    
    const request = new Request('http://localhost:3000/api/query-contacts', {
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
        prompt: expect.stringContaining('RELAXED mode if query contains: "might"')
      })
    )
  })

  it('should handle non-descriptive contact names query', async () => {
    const handler = await import('@/app/api/query-contacts/route')
    
    const request = new Request('http://localhost:3000/api/query-contacts', {
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
    
    const request = new Request('http://localhost:3000/api/query-contacts', {
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
    
    const request = new Request('http://localhost:3000/api/query-contacts', {
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

    const request = new Request('http://localhost:3000/api/query-contacts', {
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
    
    const request = new Request('http://localhost:3000/api/query-contacts', {
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