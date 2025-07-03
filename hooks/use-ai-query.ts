import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Contact } from '@/types/contact'
import { Semaphore } from '@/lib/semaphore'

interface ContactMatch {
  contact: Contact
  reason: string
}

interface UseAIQueryOptions {
  contacts: Contact[]
  onResults?: (results: ContactMatch[]) => void
}

const MAX_CONCURRENT = 6

async function queryBatch(
  contacts: Contact[], 
  query: string, 
  signal?: AbortSignal
): Promise<ContactMatch[]> {
  const response = await fetch('/api/query-contacts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contacts, query }),
    signal
  })
  
  if (!response.ok) {
    const error = await response.json()
    if (response.status === 402) {
      throw new Error(error.details || error.error || 'AI service not configured. Please configure your API keys in Settings > AI Keys.')
    }
    throw new Error(error.error || error.message || 'Query failed')
  }
  
  const { matches } = await response.json()
  
  if (!matches || !Array.isArray(matches)) {
    return []
  }
  
  return matches.map((m: { id: string; reason: string }) => ({
    contact: contacts.find(c => c.id === m.id)!,
    reason: m.reason
  })).filter(m => m.contact)
}

export function useAIQuery({ contacts, onResults }: UseAIQueryOptions) {
  const [progress, setProgress] = useState({ completed: 0, total: 0 })
  const [results, setResults] = useState<ContactMatch[]>([])
  const abortControllerRef = React.useRef<AbortController | null>(null)
  
  const mutation = useMutation({
    mutationFn: async (query: string) => {
      abortControllerRef.current = new AbortController()
      
      setResults([])
      setProgress({ completed: 0, total: 0 })
      onResults?.([])
      
      // Create simple batches of 100 contacts each
      const BATCH_SIZE = 100;
      const batches: Contact[][] = [];
      for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
        batches.push(contacts.slice(i, i + BATCH_SIZE));
      }
      
      setProgress({ completed: 0, total: batches.length })
      
      const allResults: ContactMatch[] = []
      let completed = 0
      
      // Create semaphore for this search operation
      const semaphore = new Semaphore(MAX_CONCURRENT)
      
      // Process all batches with semaphore control
      const batchPromises = batches.map(async (batch) => {
        return semaphore.withLock(async () => {
          try {
            // Check if aborted before making request
            if (abortControllerRef.current?.signal.aborted) {
              throw new Error('Search aborted')
            }
            
            const matches = await queryBatch(batch, query, abortControllerRef.current?.signal)
            
            allResults.push(...matches)
            completed++
            
            setProgress({ completed, total: batches.length })
            setResults([...allResults])
            onResults?.([...allResults])
            
            return matches
          } catch (error) {
            completed++
            
            if (error instanceof Error) {
              if (error.name === 'AbortError' || error.message === 'Search aborted') {
                throw error
              }
              if (error.message.toLowerCase().includes('insufficient credits')) {
                // Abort all other requests
                abortControllerRef.current?.abort()
                throw error
              }
              if (error.message.toLowerCase().includes('api key not configured') || 
                  error.message.toLowerCase().includes('ai service not configured')) {
                // Abort all other requests for API key errors
                abortControllerRef.current?.abort()
                throw error
              }
            }
            
            // Update progress even on error
            setProgress({ completed, total: batches.length })
            return []
          }
        })
      })
      
      // Wait for all batches to complete
      const batchResults = await Promise.allSettled(batchPromises)
      
      // Check if any batch failed with an API key error
      const apiKeyError = batchResults.find(result => 
        result.status === 'rejected' && 
        result.reason instanceof Error && 
        (result.reason.message.toLowerCase().includes('api key not configured') ||
         result.reason.message.toLowerCase().includes('ai service not configured'))
      )
      
      if (apiKeyError && apiKeyError.status === 'rejected') {
        throw apiKeyError.reason
      }
      
      return allResults
    },
    onError: () => {
      // Ensure abort controller is cleaned up on error
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        abortControllerRef.current.abort()
      }
    }
  })
  
  const searchContacts = (query: string) => {
    if (query.trim() && contacts.length > 0) {
      mutation.mutate(query.trim())
    }
  }
  
  const progressPercent = progress.total > 0 
    ? Math.round((progress.completed / progress.total) * 100) 
    : 0
  
  const stopSearch = () => {
    if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
      abortControllerRef.current.abort()
    }
  }
  
  return {
    searchContacts,
    isSearching: mutation.isPending,
    error: mutation.error,
    results,
    progress: {
      ...progress,
      percent: progressPercent
    },
    reset: () => {
      stopSearch()
      mutation.reset()
      setResults([])
      setProgress({ completed: 0, total: 0 })
    },
    stopSearch
  }
}