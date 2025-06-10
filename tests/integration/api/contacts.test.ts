import { describe, it, expect, beforeEach } from 'vitest'
import { sampleContacts, createTestContact } from '../../fixtures/contacts'
import { 
  mockGetAllContacts, 
  mockCreateContactsBatch, 
  mockUpdateContact,
  mockDeleteContact,
  mockDeleteAllContacts,
  setMockContacts,
  resetDbMocks
} from '../../mocks/db'

describe('Contacts API', () => {
  beforeEach(() => {
    resetDbMocks()
  })

  describe('GET /api/contacts', () => {
    it('should retrieve all contacts', async () => {
      setMockContacts(sampleContacts)
      
      const handler = await import('@/app/api/contacts/route')
      const response = await handler.GET()
      
      expect(response.status).toBe(200)
      const data = await response.json()
      
      expect(data.success).toBe(true)
      expect(data.contacts).toHaveLength(sampleContacts.length)
      expect(mockGetAllContacts).toHaveBeenCalledOnce()
    })

    it('should handle database errors gracefully', async () => {
      mockGetAllContacts.mockRejectedValueOnce(new Error('Database connection failed'))
      
      const handler = await import('@/app/api/contacts/route')
      const response = await handler.GET()
      
      expect(response.status).toBe(500)
      const data = await response.json()
      
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to load contacts')
      expect(data.contacts).toEqual([])
    })

    it('should return empty array when no contacts exist', async () => {
      setMockContacts([])
      
      const handler = await import('@/app/api/contacts/route')
      const response = await handler.GET()
      
      expect(response.status).toBe(200)
      const data = await response.json()
      
      expect(data.success).toBe(true)
      expect(data.contacts).toEqual([])
    })
  })

  describe('POST /api/contacts', () => {
    it('should create contacts in batch', async () => {
      const newContacts = [
        createTestContact({ name: 'New Contact 1' }),
        createTestContact({ name: 'New Contact 2' })
      ]
      
      const handler = await import('@/app/api/contacts/route')
      const request = new Request('http://localhost:3000/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts: newContacts })
      })
      
      const response = await handler.POST(request)
      
      expect(response.status).toBe(200)
      const data = await response.json()
      
      expect(data.success).toBe(true)
      expect(mockCreateContactsBatch).toHaveBeenCalled()
      
      // Check that the contacts were passed (dates will be serialized)
      const calledWith = mockCreateContactsBatch.mock.calls[0][0]
      expect(calledWith).toHaveLength(2)
      expect(calledWith[0].name).toBe('New Contact 1')
      expect(calledWith[1].name).toBe('New Contact 2')
    })

    it('should validate contacts data', async () => {
      const handler = await import('@/app/api/contacts/route')
      const request = new Request('http://localhost:3000/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts: 'not-an-array' })
      })
      
      const response = await handler.POST(request)
      
      expect(response.status).toBe(400)
      const data = await response.json()
      
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid contacts data')
      expect(mockCreateContactsBatch).not.toHaveBeenCalled()
    })

    it('should handle database errors during creation', async () => {
      mockCreateContactsBatch.mockRejectedValueOnce(new Error('Database write failed'))
      
      const handler = await import('@/app/api/contacts/route')
      const request = new Request('http://localhost:3000/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts: [createTestContact()] })
      })
      
      const response = await handler.POST(request)
      
      expect(response.status).toBe(500)
      const data = await response.json()
      
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to save contacts')
    })
  })

  describe('PUT /api/contacts', () => {
    it('should update existing contact', async () => {
      const updatedContact = { ...sampleContacts[0], name: 'Updated Name' }
      
      const handler = await import('@/app/api/contacts/route')
      const request = new Request('http://localhost:3000/api/contacts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedContact)
      })
      
      const response = await handler.PUT(request)
      
      expect(response.status).toBe(200)
      const data = await response.json()
      
      expect(data.success).toBe(true)
      expect(data.contact.name).toBe('Updated Name')
      expect(mockUpdateContact).toHaveBeenCalled()
    })

    it('should require contact ID for update', async () => {
      const contactWithoutId = { ...sampleContacts[0], id: undefined }
      
      const handler = await import('@/app/api/contacts/route')
      const request = new Request('http://localhost:3000/api/contacts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactWithoutId)
      })
      
      const response = await handler.PUT(request)
      
      expect(response.status).toBe(400)
      const data = await response.json()
      
      expect(data.success).toBe(false)
      expect(data.error).toBe('Contact ID is required')
      expect(mockUpdateContact).not.toHaveBeenCalled()
    })

    it('should handle update errors', async () => {
      mockUpdateContact.mockRejectedValueOnce(new Error('Contact not found'))
      
      const handler = await import('@/app/api/contacts/route')
      const request = new Request('http://localhost:3000/api/contacts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sampleContacts[0])
      })
      
      const response = await handler.PUT(request)
      
      expect(response.status).toBe(500)
      const data = await response.json()
      
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to update contact')
    })
  })

  describe('DELETE /api/contacts', () => {
    it('should delete single contact by ID', async () => {
      const handler = await import('@/app/api/contacts/route')
      const request = new Request('http://localhost:3000/api/contacts?id=test-1', {
        method: 'DELETE'
      })
      
      const response = await handler.DELETE(request)
      
      expect(response.status).toBe(200)
      const data = await response.json()
      
      expect(data.success).toBe(true)
      expect(data.message).toBe('Contact deleted successfully')
      expect(mockDeleteContact).toHaveBeenCalledWith('test-1')
      expect(mockDeleteAllContacts).not.toHaveBeenCalled()
    })

    it('should delete all contacts when no ID provided', async () => {
      const handler = await import('@/app/api/contacts/route')
      const request = new Request('http://localhost:3000/api/contacts', {
        method: 'DELETE'
      })
      
      const response = await handler.DELETE(request)
      
      expect(response.status).toBe(200)
      const data = await response.json()
      
      expect(data.success).toBe(true)
      expect(data.message).toBe('All contacts deleted')
      expect(mockDeleteAllContacts).toHaveBeenCalledOnce()
      expect(mockDeleteContact).not.toHaveBeenCalled()
    })

    it('should handle delete errors', async () => {
      mockDeleteContact.mockRejectedValueOnce(new Error('Delete failed'))
      
      const handler = await import('@/app/api/contacts/route')
      const request = new Request('http://localhost:3000/api/contacts?id=test-1', {
        method: 'DELETE'
      })
      
      const response = await handler.DELETE(request)
      
      expect(response.status).toBe(500)
      const data = await response.json()
      
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to delete contact')
    })
  })
})