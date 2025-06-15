import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Contact } from '@/types/contact'

interface ContactMatch {
  contact: Contact
  reason: string
}

interface UseAIQueryOptions {
  contacts: Contact[]
  onResults?: (results: ContactMatch[]) => void
}

const BATCH_SIZE = 50
const PARALLEL_LIMIT = 6

async function queryBatch(
  contacts: Contact[], 
  query: string, 
  signal?: AbortSignal,
  retries = 3
): Promise<ContactMatch[]> {
  try {
    const response = await fetch('/api/query-contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contacts, query }),
      signal
    })
    
    if (response.status === 429 && retries > 0) {
      // Rate limited - wait and retry
      const retryAfter = parseInt(response.headers.get('retry-after') || '5')
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000))
      return queryBatch(contacts, query, signal, retries - 1)
    }
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Query failed')
    }
    
    const { matches } = await response.json()
    
    if (!matches || !Array.isArray(matches)) {
      return []
    }
    
    return matches.map((m: { id: string; reason: string }) => ({
      contact: contacts.find(c => c.id === m.id)!,
      reason: m.reason
    })).filter(m => m.contact)
  } catch (error) {
    // Don't retry on abort
    if (error instanceof Error && error.name === 'AbortError') {
      return []
    }
    
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 2000))
      return queryBatch(contacts, query, signal, retries - 1)
    }
    throw error
  }
}

async function processWithSemaphore(
  batches: Contact[][], 
  query: string, 
  signal: AbortSignal,
  onProgress: (completed: number, total: number, results: ContactMatch[]) => void
) {
  const allResults: ContactMatch[] = []
  let completed = 0
  let semaphoreLimit = PARALLEL_LIMIT
  let activeBatches = 0
  let batchIndex = 0
  let hasRateLimit = false
  
  // Create a queue to process batches
  const processBatch = async (batch: Contact[], index: number): Promise<void> => {
    try {
      const matches = await queryBatch(batch, query, signal)
      allResults.push(...matches)
      
      // Update progress immediately when this batch completes
      completed++
      onProgress(completed, batches.length, allResults)
      
      // If successful and not rate limited, try increasing parallelism
      if (!hasRateLimit && semaphoreLimit < 20) {
        semaphoreLimit = Math.min(semaphoreLimit + 1, 20)
      }
    } catch (error) {
      if (error instanceof Error && (error.name === 'AbortError' || error.message === 'Search aborted')) {
        throw error
      }
      
      const errorMessage = error instanceof Error ? error.message : ''
      
      if (errorMessage.includes('429') || errorMessage.includes('rate')) {
        hasRateLimit = true
        semaphoreLimit = Math.max(2, Math.floor(semaphoreLimit / 2))
        console.log(`Rate limited. Reducing parallel requests to ${semaphoreLimit}`)
        
        // Retry this batch after delay
        await new Promise(resolve => setTimeout(resolve, 3000))
        await processBatch(batch, index)
      } else {
        // Skip failed batch
        console.error('Batch failed:', error)
        completed++
        onProgress(completed, batches.length, allResults)
      }
    } finally {
      activeBatches--
    }
  }
  
  // Process all batches with semaphore control
  const promises: Promise<void>[] = []
  
  while (batchIndex < batches.length || activeBatches > 0) {
    // Check if aborted
    if (signal.aborted) {
      throw new Error('Search aborted')
    }
    
    // Start new batches if under semaphore limit
    while (activeBatches < semaphoreLimit && batchIndex < batches.length) {
      const batch = batches[batchIndex]
      activeBatches++
      promises.push(processBatch(batch, batchIndex))
      batchIndex++
    }
    
    // Wait a bit before checking again
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  // Wait for all promises to complete
  await Promise.allSettled(promises)
  
  return allResults
}

export function useAIQuery({ contacts, onResults }: UseAIQueryOptions) {
  const [progress, setProgress] = useState({ completed: 0, total: 0 })
  const [results, setResults] = useState<ContactMatch[]>([])
  const abortControllerRef = React.useRef<AbortController | null>(null)
  
  const mutation = useMutation({
    mutationFn: async (query: string) => {
      // Create new abort controller
      abortControllerRef.current = new AbortController()
      
      // Reset state
      setResults([])
      setProgress({ completed: 0, total: 0 })
      onResults?.([])
      
      // Create batches
      const batches: Contact[][] = []
      for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
        batches.push(contacts.slice(i, i + BATCH_SIZE))
      }
      
      console.log(`Processing ${contacts.length} contacts in ${batches.length} batches`)
      setProgress({ completed: 0, total: batches.length })
      
      try {
        // Process with semaphore-based parallelism
        const allResults = await processWithSemaphore(
          batches,
          query,
          abortControllerRef.current.signal,
          (completed, total, results) => {
            console.log(`Progress: ${completed}/${total} batches (${Math.round((completed/total) * 100)}%)`)
            setProgress({ completed, total })
            setResults([...results])
            onResults?.([...results])
          }
        )
        
        return allResults
      } catch (error) {
        if (error instanceof Error && error.message === 'Search aborted') {
          console.log('Search was aborted by user')
          return results // Return partial results
        }
        throw error
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