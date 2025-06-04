import { useState } from 'react'
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

async function queryBatch(contacts: Contact[], query: string, retries = 3): Promise<ContactMatch[]> {
  try {
    const response = await fetch('/api/query-contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contacts, query })
    })
    
    if (response.status === 429 && retries > 0) {
      // Rate limited - wait and retry
      const retryAfter = parseInt(response.headers.get('retry-after') || '5')
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000))
      return queryBatch(contacts, query, retries - 1)
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
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 2000))
      return queryBatch(contacts, query, retries - 1)
    }
    throw error
  }
}

async function processInParallel(
  batches: Contact[][], 
  query: string, 
  onProgress: (completed: number, total: number, results: ContactMatch[]) => void
) {
  const allResults: ContactMatch[] = []
  let completed = 0
  let parallelLimit = PARALLEL_LIMIT
  
  // Process batches in chunks
  let batchIndex = 0
  
  while (batchIndex < batches.length) {
    const chunk = batches.slice(batchIndex, batchIndex + parallelLimit)
    
    try {
      const promises = chunk.map(batch => queryBatch(batch, query))
      const results = await Promise.all(promises)
      
      results.forEach(matches => allResults.push(...matches))
      completed += chunk.length
      batchIndex += chunk.length
      
      onProgress(completed, batches.length, allResults)
      
      // If successful, try increasing parallelism gradually
      if (parallelLimit < 20) {
        parallelLimit = Math.min(parallelLimit + 1, 20)
      }
    } catch (error) {
      // Handle errors for individual batches
      const errorMessage = error instanceof Error ? error.message : ''
      
      if (errorMessage.includes('429') || errorMessage.includes('rate')) {
        // Reduce parallelism and continue with next chunk
        parallelLimit = Math.max(2, Math.floor(parallelLimit / 2))
        console.log(`Rate limited. Reducing parallel requests to ${parallelLimit}`)
        
        // Add a delay before retrying
        await new Promise(resolve => setTimeout(resolve, 3000))
      } else {
        // For non-rate-limit errors, skip the failed batch and continue
        console.error('Batch failed:', error)
        completed += chunk.length
        batchIndex += chunk.length
        onProgress(completed, batches.length, allResults)
      }
    }
  }
  
  return allResults
}

export function useAIQuery({ contacts, onResults }: UseAIQueryOptions) {
  const [progress, setProgress] = useState({ completed: 0, total: 0 })
  const [results, setResults] = useState<ContactMatch[]>([])
  
  const mutation = useMutation({
    mutationFn: async (query: string) => {
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
      
      // Process with adaptive parallelism
      const allResults = await processInParallel(
        batches,
        query,
        (completed, total, results) => {
          console.log(`Progress: ${completed}/${total} batches (${Math.round((completed/total) * 100)}%)`)
          setProgress({ completed, total })
          setResults([...results])
          onResults?.([...results])
        }
      )
      
      return allResults
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
      mutation.reset()
      setResults([])
      setProgress({ completed: 0, total: 0 })
    }
  }
}