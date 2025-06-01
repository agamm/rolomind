import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'

export interface Summary {
  summary: string
  keyInsights: string[]
  totalMatches: number
}

interface ContactMatch {
  contact: any
  reason: string
}

interface UseSummaryGenerationOptions {
  onSuccess?: (summary: Summary) => void
  onError?: (error: Error) => void
}

export function useSummaryGeneration(options?: UseSummaryGenerationOptions) {
  const [summary, setSummary] = useState<Summary | null>(null)

  const mutation = useMutation({
    mutationFn: async ({ contacts, query }: { contacts: ContactMatch[], query: string }) => {
      const response = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts, query })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate summary')
      }
      
      const data = await response.json()
      return data as Summary
    },
    onSuccess: (data) => {
      setSummary(data)
      options?.onSuccess?.(data)
    },
    onError: (error: Error) => {
      console.error('Summary generation failed:', error)
      options?.onError?.(error)
    }
  })

  const generateSummary = (contacts: ContactMatch[], query: string) => {
    if (contacts.length === 0) return
    mutation.mutate({ contacts, query })
  }

  const reset = () => {
    setSummary(null)
    mutation.reset()
  }

  return {
    summary,
    isGenerating: mutation.isPending,
    error: mutation.error,
    generateSummary,
    reset
  }
}