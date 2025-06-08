import { useState } from 'react'
import { Contact } from '@/types/contact'

interface ContactMatch {
  contact: Contact
  reason: string
}

interface ProcessedResults {
  sortedResults: ContactMatch[]
  processingNote?: string
}

export function useResultsProcessing() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [processedResults, setProcessedResults] = useState<ContactMatch[] | null>(null)
  const [processingNote, setProcessingNote] = useState<string | undefined>()

  const processResults = async (query: string, results: ContactMatch[]) => {
    if (!results || results.length === 0) {
      return
    }

    setIsProcessing(true)
    setError(null)
    
    try {
      const response = await fetch('/api/process-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, results })
      })

      if (!response.ok) {
        throw new Error('Failed to process results')
      }

      const data: ProcessedResults = await response.json()
      setProcessedResults(data.sortedResults)
      setProcessingNote(data.processingNote)
      
      return data.sortedResults
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      console.error('Results processing error:', error)
      // Return original results on error
      return results
    } finally {
      setIsProcessing(false)
    }
  }

  const reset = () => {
    setIsProcessing(false)
    setError(null)
    setProcessedResults(null)
    setProcessingNote(undefined)
  }

  return {
    processResults,
    isProcessing,
    error,
    processedResults,
    processingNote,
    reset
  }
}