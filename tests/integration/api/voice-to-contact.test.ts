import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/voice-to-contact/route'
import { createTestContact } from '../../fixtures/contacts'
import type { Contact } from '@/types/contact'

// Mock the AI SDK
vi.mock('ai', () => ({
  experimental_transcribe: vi.fn(),
  generateObject: vi.fn()
}))

// Mock OpenAI SDK
vi.mock('@ai-sdk/openai', () => ({
  openai: {
    transcription: vi.fn(() => 'whisper-1-model')
  }
}))

// Mock openrouter
vi.mock('@/lib/openrouter-config', () => ({
  openrouter: vi.fn(() => 'claude-3-haiku-model')
}))

describe('Voice to Contact API Route', () => {
  let mockTranscribe: any
  let mockGenerateObject: any

  beforeEach(async () => {
    vi.clearAllMocks()
    process.env.OPENAI_API_KEY = 'test-key'
    
    // Get the mocked functions
    const aiModule = await import('ai')
    mockTranscribe = vi.mocked(aiModule.experimental_transcribe)
    mockGenerateObject = vi.mocked(aiModule.generateObject)
    
    // Set default mock responses
    mockTranscribe.mockResolvedValue({
      text: 'They mentioned they love hiking and their new email is jane@example.com'
    })
    
    mockGenerateObject.mockResolvedValue({
      object: {}
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should merge voice transcription data with existing contact using LLM', async () => {
    // Mock LLM response that merges data intelligently
    mockGenerateObject.mockResolvedValueOnce({
      object: {
        emails: ['jane@example.com'],
        notesComplete: 'Initial notes about the contact.\n\nLoves hiking and outdoor activities.'
      }
    })

    const testContact: Contact = createTestContact({
      id: '1',
      name: 'Jane Doe',
      company: 'Tech Corp',
      notes: 'Initial notes about the contact.',
      contactInfo: {
        emails: ['jane.doe@techcorp.com'],
        phones: [],
        linkedinUrl: '',
        otherUrls: []
      }
    })

    const audioBlob = new Blob(['audio data'], { type: 'audio/webm' })
    const formData = new FormData()
    formData.append('audio', audioBlob, 'recording.webm')
    formData.append('contact', JSON.stringify(testContact))

    const request = new NextRequest('http://localhost:3000/api/voice-to-contact', {
      method: 'POST',
      body: formData
    })

    const response = await POST(request)
    const data = await response.json()

    if (response.status !== 200) {
      console.error('Response error:', data)
    }

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    
    // Verify LLM was called with correct prompt including existing contact data
    expect(mockGenerateObject).toHaveBeenCalledWith({
      model: 'claude-3-haiku-model',
      schema: expect.any(Object),
      prompt: expect.stringContaining('Current contact information:')
    })

    const llmPrompt = mockGenerateObject.mock.calls[0][0].prompt
    expect(llmPrompt).toContain(JSON.stringify(testContact, null, 2))
    expect(llmPrompt).toContain('They mentioned they love hiking and their new email is jane@example.com')
    expect(llmPrompt).toContain('Merge existing notes with new information')

    // Verify the response contains merged data
    expect(data.updatedContact.contactInfo.emails).toEqual([
      'jane.doe@techcorp.com',
      'jane@example.com'
    ])
    expect(data.updatedContact.notes).toBe('Initial notes about the contact.\n\nLoves hiking and outdoor activities.')
    
    // Verify changes tracking
    expect(data.changes).toEqual({
      emails: ['jane@example.com'],
      notesComplete: 'Initial notes about the contact.\n\nLoves hiking and outdoor activities.'
    })
  })

  it('should use form data values instead of original contact data', async () => {
    mockGenerateObject.mockResolvedValueOnce({
      object: {
        location: 'Austin, TX'
      }
    })

    // Original contact from DB
    const originalContact: Contact = createTestContact({
      id: '1',
      name: 'John Smith',
      company: 'Old Company',
      role: 'Developer',
      location: 'San Francisco',
      notes: 'Original notes'
    })

    // Contact with form edits (simulating unsaved changes)
    const formEditedContact: Contact = {
      ...originalContact,
      company: 'New Company',
      role: 'Senior Developer',
      notes: 'Original notes\n\nAdded some new info manually'
    }

    const audioBlob = new Blob(['audio data'], { type: 'audio/webm' })
    const formData = new FormData()
    formData.append('audio', audioBlob, 'recording.webm')
    formData.append('contact', JSON.stringify(formEditedContact))

    const request = new NextRequest('http://localhost:3000/api/voice-to-contact', {
      method: 'POST',
      body: formData
    })

    const response = await POST(request)
    const data = await response.json()

    if (response.status !== 200) {
      console.error('Response error:', data)
    }

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)

    // Verify LLM received the form-edited contact data
    const llmPrompt = mockGenerateObject.mock.calls[0][0].prompt
    expect(llmPrompt).toContain('"company": "New Company"')
    expect(llmPrompt).toContain('"role": "Senior Developer"')
    expect(llmPrompt).toContain('Added some new info manually')

    // Verify merged result preserves form edits
    expect(data.updatedContact.company).toBe('New Company')
    expect(data.updatedContact.role).toBe('Senior Developer')
    expect(data.updatedContact.location).toBe('Austin, TX')
  })

  it('should handle array merging without duplicates', async () => {
    mockGenerateObject.mockResolvedValueOnce({
      object: {
        emails: ['john@example.com', 'john@newcompany.com'],
        phones: ['+1234567890'],
        otherUrls: [
          { platform: 'Twitter', url: 'https://twitter.com/john' }
        ]
      }
    })

    const testContact: Contact = createTestContact({
      contactInfo: {
        emails: ['john@example.com', 'john.doe@oldcompany.com'],
        phones: ['+1234567890', '+0987654321'],
        linkedinUrl: 'https://linkedin.com/in/john',
        otherUrls: [
          { platform: 'GitHub', url: 'https://github.com/john' }
        ]
      }
    })

    const audioBlob = new Blob(['audio data'], { type: 'audio/webm' })
    const formData = new FormData()
    formData.append('audio', audioBlob, 'recording.webm')
    formData.append('contact', JSON.stringify(testContact))

    const request = new NextRequest('http://localhost:3000/api/voice-to-contact', {
      method: 'POST',
      body: formData
    })

    const response = await POST(request)
    const data = await response.json()

    if (response.status !== 200) {
      console.error('Response error:', data)
    }

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)

    // Verify no duplicate emails
    expect(data.updatedContact.contactInfo.emails).toEqual([
      'john@example.com',
      'john.doe@oldcompany.com',
      'john@newcompany.com'
    ])

    // Verify no duplicate phones
    expect(data.updatedContact.contactInfo.phones).toEqual([
      '+1234567890',
      '+0987654321'
    ])

    // Verify otherUrls are appended
    expect(data.updatedContact.contactInfo.otherUrls).toEqual([
      { platform: 'GitHub', url: 'https://github.com/john' },
      { platform: 'Twitter', url: 'https://twitter.com/john' }
    ])
  })

  it('should handle field removal requests', async () => {
    mockGenerateObject.mockResolvedValueOnce({
      object: {
        fieldsToRemove: ['phones', 'company']
      }
    })

    const testContact: Contact = createTestContact({
      company: 'Tech Corp',
      contactInfo: {
        emails: ['test@example.com'],
        phones: ['+1234567890'],
        linkedinUrl: '',
        otherUrls: []
      }
    })

    const audioBlob = new Blob(['audio data'], { type: 'audio/webm' })
    const formData = new FormData()
    formData.append('audio', audioBlob, 'recording.webm')
    formData.append('contact', JSON.stringify(testContact))

    const request = new NextRequest('http://localhost:3000/api/voice-to-contact', {
      method: 'POST',
      body: formData
    })

    const response = await POST(request)
    const data = await response.json()

    if (response.status !== 200) {
      console.error('Response error:', data)
    }

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)

    // Verify fields were removed
    expect(data.updatedContact.company).toBeUndefined()
    expect(data.updatedContact.contactInfo.phones).toEqual([])
    
    // Verify other fields remain
    expect(data.updatedContact.contactInfo.emails).toEqual(['test@example.com'])
  })

  it('should return error when OpenAI API key is not configured', async () => {
    delete process.env.OPENAI_API_KEY

    const audioBlob = new Blob(['audio data'], { type: 'audio/webm' })
    const formData = new FormData()
    formData.append('audio', audioBlob, 'recording.webm')
    formData.append('contact', JSON.stringify(createTestContact()))

    const request = new NextRequest('http://localhost:3000/api/voice-to-contact', {
      method: 'POST',
      body: formData
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toContain('OpenAI API key is not configured')
  })
})