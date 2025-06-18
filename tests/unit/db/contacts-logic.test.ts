import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createTestContact } from '../../fixtures/contacts'

// We'll test the actual implementations by spying on the Dexie methods
// This ensures our functions are calling the right Dexie methods with the right arguments

describe('Database Contact Functions - Logic Testing', () => {
  let mockDb: any
  
  beforeEach(() => {
    // Reset modules to ensure fresh mocks
    vi.resetModules()
    
    // Create a fresh mock for each test
    mockDb = {
      contacts: {
        toArray: vi.fn().mockResolvedValue([]),
        get: vi.fn().mockResolvedValue(undefined),
        add: vi.fn().mockResolvedValue('mock-id'),
        bulkAdd: vi.fn().mockResolvedValue(undefined),
        put: vi.fn().mockResolvedValue(undefined),
        bulkPut: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined),
        bulkDelete: vi.fn().mockResolvedValue(undefined),
        clear: vi.fn().mockResolvedValue(undefined),
        count: vi.fn().mockResolvedValue(0),
        where: vi.fn().mockReturnThis(),
        equals: vi.fn().mockReturnThis(),
        filter: vi.fn().mockImplementation(() => ({
          toArray: vi.fn().mockResolvedValue([])
        }))
      }
    }
    
    // Mock the db import
    vi.doMock('@/db/indexdb/index', () => ({
      db: mockDb
    }))
  })

  describe('getAllContacts', () => {
    it('should call db.contacts.toArray()', async () => {
      const { getAllContacts } = await import('@/db/indexdb/contacts')
      
      const mockContacts = [
        createTestContact({ id: '1', name: 'John' }),
        createTestContact({ id: '2', name: 'Jane' })
      ]
      mockDb.contacts.toArray.mockResolvedValue(mockContacts)
      
      const result = await getAllContacts()
      
      expect(mockDb.contacts.toArray).toHaveBeenCalledOnce()
      expect(result).toEqual(mockContacts)
    })
  })

  describe('getContactById', () => {
    it('should call db.contacts.get with the provided id', async () => {
      const { getContactById } = await import('@/db/indexdb/contacts')
      
      const mockContact = createTestContact({ id: 'test-123' })
      mockDb.contacts.get.mockResolvedValue(mockContact)
      
      const result = await getContactById('test-123')
      
      expect(mockDb.contacts.get).toHaveBeenCalledWith('test-123')
      expect(result).toEqual(mockContact)
    })
  })

  describe('createContact', () => {
    it('should generate an id if not provided', async () => {
      const { createContact } = await import('@/db/indexdb/contacts')
      
      const newContact = createTestContact({ id: undefined })
      const result = await createContact(newContact)
      
      expect(mockDb.contacts.add).toHaveBeenCalledOnce()
      const callArg = mockDb.contacts.add.mock.calls[0][0]
      expect(callArg.id).toBeDefined()
      expect(callArg.id).not.toBe(undefined)
      expect(result).toBe(callArg.id)
    })

    it('should use provided id and add timestamps', async () => {
      const { createContact } = await import('@/db/indexdb/contacts')
      
      const newContact = createTestContact({ id: 'custom-id' })
      await createContact(newContact)
      
      expect(mockDb.contacts.add).toHaveBeenCalledOnce()
      const callArg = mockDb.contacts.add.mock.calls[0][0]
      expect(callArg.id).toBe('custom-id')
      expect(callArg.createdAt).toBeInstanceOf(Date)
      expect(callArg.updatedAt).toBeInstanceOf(Date)
    })
  })

  describe('createContactsBatch', () => {
    it('should call bulkAdd with contacts having ids and timestamps', async () => {
      const { createContactsBatch } = await import('@/db/indexdb/contacts')
      
      const contacts = [
        createTestContact({ id: undefined, name: 'Contact 1' }),
        createTestContact({ id: 'existing-id', name: 'Contact 2' })
      ]
      
      await createContactsBatch(contacts)
      
      expect(mockDb.contacts.bulkAdd).toHaveBeenCalledOnce()
      const callArg = mockDb.contacts.bulkAdd.mock.calls[0][0]
      
      expect(callArg).toHaveLength(2)
      expect(callArg[0].id).toBeDefined()
      expect(callArg[0].createdAt).toBeInstanceOf(Date)
      expect(callArg[1].id).toBe('existing-id')
    })
  })

  describe('updateContact', () => {
    it('should call put with updated timestamp', async () => {
      const { updateContact } = await import('@/db/indexdb/contacts')
      
      const contact = createTestContact({ id: 'update-1' })
      const originalUpdatedAt = contact.updatedAt
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10))
      
      await updateContact(contact)
      
      expect(mockDb.contacts.put).toHaveBeenCalledOnce()
      const callArg = mockDb.contacts.put.mock.calls[0][0]
      
      expect(callArg.id).toBe('update-1')
      expect(callArg.updatedAt).toBeInstanceOf(Date)
      expect(callArg.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime())
    })
  })

  describe('deleteContact', () => {
    it('should call delete with the provided id', async () => {
      const { deleteContact } = await import('@/db/indexdb/contacts')
      
      await deleteContact('delete-123')
      
      expect(mockDb.contacts.delete).toHaveBeenCalledOnce()
      expect(mockDb.contacts.delete).toHaveBeenCalledWith('delete-123')
    })
  })

  describe('deleteContactsBatch', () => {
    it('should call bulkDelete with the provided ids', async () => {
      const { deleteContactsBatch } = await import('@/db/indexdb/contacts')
      
      const ids = ['id1', 'id2', 'id3']
      await deleteContactsBatch(ids)
      
      expect(mockDb.contacts.bulkDelete).toHaveBeenCalledOnce()
      expect(mockDb.contacts.bulkDelete).toHaveBeenCalledWith(ids)
    })
  })

  describe('deleteAllContacts', () => {
    it('should call clear', async () => {
      const { deleteAllContacts } = await import('@/db/indexdb/contacts')
      
      await deleteAllContacts()
      
      expect(mockDb.contacts.clear).toHaveBeenCalledOnce()
    })
  })

  describe('getContactsCount', () => {
    it('should call count and return the result', async () => {
      const { getContactsCount } = await import('@/db/indexdb/contacts')
      
      mockDb.contacts.count.mockResolvedValue(42)
      
      const result = await getContactsCount()
      
      expect(mockDb.contacts.count).toHaveBeenCalledOnce()
      expect(result).toBe(42)
    })
  })

  describe('searchContacts', () => {
    it('should filter contacts by query in multiple fields', async () => {
      const { searchContacts } = await import('@/db/indexdb/contacts')
      
      const mockFilteredContacts = [
        createTestContact({ name: 'John Doe' })
      ]
      
      // Create a chain that returns filtered results
      const filterChain = {
        toArray: vi.fn().mockResolvedValue(mockFilteredContacts)
      }
      mockDb.contacts.filter.mockReturnValue(filterChain)
      
      const result = await searchContacts('john')
      
      expect(mockDb.contacts.filter).toHaveBeenCalledOnce()
      
      // Get the filter function that was passed
      const filterFn = mockDb.contacts.filter.mock.calls[0][0]
      
      // Test the filter function logic
      expect(filterFn({ name: 'John Doe', company: 'Tech', role: 'Dev', location: 'NY' })).toBe(true)
      expect(filterFn({ name: 'Jane', company: 'John Corp', role: 'Dev', location: 'NY' })).toBe(true)
      expect(filterFn({ name: 'Jane', company: 'Tech', role: 'Developer', location: 'NY' })).toBe(false)
      
      expect(result).toEqual(mockFilteredContacts)
    })
  })
})