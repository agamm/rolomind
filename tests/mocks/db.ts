import { vi } from 'vitest'
import type { Contact } from '@/types/contact'

// Mock database functions
export const mockGetAllContacts = vi.fn()
export const mockCreateContactsBatch = vi.fn()
export const mockUpdateContact = vi.fn()
export const mockDeleteContact = vi.fn()
export const mockDeleteAllContacts = vi.fn()

// Default mock implementations
mockGetAllContacts.mockResolvedValue([])
mockCreateContactsBatch.mockResolvedValue(undefined)
mockUpdateContact.mockResolvedValue(undefined)
mockDeleteContact.mockResolvedValue(undefined)
mockDeleteAllContacts.mockResolvedValue(undefined)

// Mock the db module
vi.mock('@/db', () => ({
  getAllContacts: mockGetAllContacts,
  createContactsBatch: mockCreateContactsBatch,
  updateContact: mockUpdateContact,
  deleteContact: mockDeleteContact,
  deleteAllContacts: mockDeleteAllContacts
}))

// Helper to set mock contacts
export function setMockContacts(contacts: Contact[]) {
  mockGetAllContacts.mockResolvedValue(contacts)
}

// Helper to reset all mocks
export function resetDbMocks() {
  mockGetAllContacts.mockReset().mockResolvedValue([])
  mockCreateContactsBatch.mockReset().mockResolvedValue(undefined)
  mockUpdateContact.mockReset().mockResolvedValue(undefined)
  mockDeleteContact.mockReset().mockResolvedValue(undefined)
  mockDeleteAllContacts.mockReset().mockResolvedValue(undefined)
}