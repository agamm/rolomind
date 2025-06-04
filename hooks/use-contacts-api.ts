import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Contact } from '@/types/contact'

interface ContactsResponse {
  success: boolean
  contacts: Contact[]
  error?: string
}

interface ImportResponse {
  success: boolean
  contacts: Contact[]
  parserUsed: string
  totalImported: number
  error?: string
}

// Fetch contacts from API
export function useContacts() {
  return useQuery({
    queryKey: ['contacts'],
    queryFn: async (): Promise<Contact[]> => {
      const response = await fetch('/api/contacts')
      const data: ContactsResponse = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load contacts')
      }
      
      // Convert date strings back to Date objects
      return data.contacts.map((contact) => ({
        ...contact,
        createdAt: new Date(contact.createdAt),
        updatedAt: new Date(contact.updatedAt),
      }))
    },
    staleTime: 0, // Always refetch when invalidated
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
  })
}

// Save contacts mutation
export function useSaveContacts() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (contacts: Contact[]): Promise<void> => {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts })
      })
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to save contacts')
      }
    },
    onSuccess: () => {
      // Invalidate and refetch contacts
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
}

// Import CSV mutation
export function useImportContacts() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (file: File): Promise<ImportResponse> => {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData
      })
      
      const data: ImportResponse = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Import failed')
      }
      
      return data
    },
    onSuccess: () => {
      // Just invalidate to refetch fresh data from the API
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
}

// Delete all contacts mutation
export function useDeleteAllContacts() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (): Promise<void> => {
      const response = await fetch('/api/contacts', {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete all contacts')
      }
    },
    onSuccess: () => {
      // Clear the contacts cache
      queryClient.setQueryData(['contacts'], [])
      
      // Also invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
}