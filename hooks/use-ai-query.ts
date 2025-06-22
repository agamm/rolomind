import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Contact } from '@/types/contact'
import { checkQueryContactsTokens } from '@/lib/client-token-utils'

interface ContactMatch {
  contact: Contact
  reason: string
}

interface UseAIQueryOptions {
  contacts: Contact[]
  onResults?: (results: ContactMatch[]) => void
}

const BATCH_SIZE = 50
const SEMAPHORE_LIMIT = 6

async function queryBatch(
  contacts: Contact[], 
  query: string, 
  signal?: AbortSignal
): Promise<ContactMatch[]> {
  const tokenCheck = checkQueryContactsTokens(query, contacts);
  if (!tokenCheck.isValid && !tokenCheck.needsChunking) {
    throw new Error(tokenCheck.error || 'Token limit exceeded');
  }
  
  const response = await fetch('/api/query-contacts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contacts, query }),
    signal
  })
  
  if (!response.ok) {
    const error = await response.json()
    if (response.status === 402) {
      throw new Error(error.error || 'Insufficient credits. Please add more credits to continue.')
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
      
      const batches: Contact[][] = []
      for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
        batches.push(contacts.slice(i, i + BATCH_SIZE))
      }
      
      setProgress({ completed: 0, total: batches.length })
      
      const allResults: ContactMatch[] = []
      let completed = 0
      let batchIndex = 0
      let activeBatches = 0
      const inFlightPromises = new Map<number, Promise<ContactMatch[]>>()
      
      while (batchIndex < batches.length || activeBatches > 0) {
        // Check if aborted
        if (abortControllerRef.current.signal.aborted) {
          throw new Error('Search aborted')
        }
        
        // Start new batches up to semaphore limit
        while (activeBatches < SEMAPHORE_LIMIT && batchIndex < batches.length) {
          const currentIndex = batchIndex
          const batch = batches[currentIndex]
          
          activeBatches++
          batchIndex++
          
          const promise = queryBatch(batch, query, abortControllerRef.current.signal)
            .then(matches => {
              allResults.push(...matches)
              completed++
              activeBatches--
              
              setProgress({ completed, total: batches.length })
              setResults([...allResults])
              onResults?.([...allResults])
              
              inFlightPromises.delete(currentIndex)
              return matches
            })
            .catch(error => {
              activeBatches--
              completed++
              inFlightPromises.delete(currentIndex)
              
              if (error instanceof Error) {
                if (error.name === 'AbortError') {
                  throw new Error('Search aborted')
                }
                if (error.message.toLowerCase().includes('insufficient credits')) {
                  // Abort all other requests
                  abortControllerRef.current?.abort()
                  throw error
                }
              }
              
              // Update progress even on error
              setProgress({ completed, total: batches.length })
              return []
            })
          
          inFlightPromises.set(currentIndex, promise)
        }
        
        // Wait for at least one to complete before continuing
        if (inFlightPromises.size > 0) {
          await Promise.race(Array.from(inFlightPromises.values()))
        }
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