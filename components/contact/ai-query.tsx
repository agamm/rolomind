"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Contact } from "@/types/contact"
import { Loader2, Sparkles } from "lucide-react"
import { useMutation } from "@tanstack/react-query"
import { useSummaryGeneration } from "@/hooks/use-summary-generation"
import { SummaryDisplay } from "./summary-display"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface ContactMatch {
  contact: Contact
  reason: string
}

interface AIQueryProps {
  contacts: Contact[]
  onResults?: (results: ContactMatch[]) => void
}

const BATCH_SIZE = 100
const PARALLEL_LIMIT = 6 // Start with 6 parallel requests

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
  let hitRateLimit = false
  
  for (let i = 0; i < batches.length; i += parallelLimit) {
    const chunk = batches.slice(i, i + parallelLimit)
    
    try {
      const promises = chunk.map(batch => queryBatch(batch, query))
      const results = await Promise.all(promises)
      
      results.forEach(matches => allResults.push(...matches))
      completed += chunk.length
      
      onProgress(completed, batches.length, allResults)
      
      // If successful, try increasing parallelism
      if (!hitRateLimit && parallelLimit < 20) {
        parallelLimit = Math.min(parallelLimit + 2, 20)
      }
    } catch (error) {
      // Hit rate limit, reduce parallelism
      const errorMessage = error instanceof Error ? error.message : ''
      if (errorMessage.includes('429') || errorMessage.includes('rate')) {
        hitRateLimit = true
        parallelLimit = Math.max(Math.floor(parallelLimit / 2), 2)
        i -= parallelLimit // Retry this chunk
      } else {
        throw error
      }
    }
  }
  
  return allResults
}

export function AIQuery({ contacts, onResults }: AIQueryProps) {
  const [query, setQuery] = useState("")
  const [progress, setProgress] = useState({ completed: 0, total: 0 })
  const [results, setResults] = useState<ContactMatch[]>([])
  const [enableSummary, setEnableSummary] = useState(true)
  const { summary, isGenerating, error: summaryError, generateSummary, reset: resetSummary } = useSummaryGeneration()
  
  const mutation = useMutation({
    mutationFn: async (searchQuery: string) => {
      setResults([])
      setProgress({ completed: 0, total: 0 })
      onResults?.([])
      resetSummary()
      
      // Create batches
      const batches: Contact[][] = []
      for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
        batches.push(contacts.slice(i, i + BATCH_SIZE))
      }
      
      setProgress({ completed: 0, total: batches.length })
      
      // Process with adaptive parallelism
      const allResults = await processInParallel(
        batches,
        searchQuery,
        (completed, total, results) => {
          setProgress({ completed, total })
          setResults([...results])
          onResults?.([...results])
        }
      )
      
      return allResults
    },
    onSuccess: (allResults, searchQuery) => {
      if (allResults.length > 0 && enableSummary) {
        generateSummary(allResults, searchQuery)
      }
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim() && contacts.length > 0) {
      mutation.mutate(query.trim())
    }
  }

  const progressPercent = progress.total > 0 
    ? Math.round((progress.completed / progress.total) * 100) 
    : 0

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-blue-500" />
          <h2 className="text-lg font-semibold">AI Contact Search</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="e.g., 'CEOs in Israel', 'software engineers at startups'"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={mutation.isPending}
              className="flex-1"
            />
            <Button 
              type="submit" 
              disabled={mutation.isPending || !query.trim() || contacts.length === 0}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Searching
                </>
              ) : (
                'Search'
              )}
            </Button>
          </div>
          
          <div className="flex items-center gap-2 pt-2">
            <Switch
              id="ai-summary"
              checked={enableSummary}
              onCheckedChange={setEnableSummary}
              disabled={mutation.isPending}
            />
            <Label 
              htmlFor="ai-summary" 
              className="text-sm font-normal text-gray-600 cursor-pointer"
            >
              Generate AI summary after search
            </Label>
          </div>
          
          {contacts.length === 0 && (
            <p className="text-sm text-gray-500">
              Import contacts to use AI search.
            </p>
          )}
        </form>
      </div>

      {mutation.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{mutation.error.message}</p>
        </div>
      )}

      {mutation.isPending && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-700" />
              <span className="text-sm font-medium text-blue-900">
                Processing {progress.total} chunks (6-20 in parallel)
              </span>
            </div>
            <span className="text-sm text-blue-700">
              {progressPercent}% ({progress.completed} of {progress.total} complete)
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
          {results.length > 0 && (
            <p className="text-sm text-blue-700">
              Found {results.length} matches so far...
            </p>
          )}
        </div>
      )}

      {mutation.isSuccess && results.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">
            ✓ Found {results.length} matches
          </p>
        </div>
      )}
      
      <SummaryDisplay 
        summary={summary} 
        isGenerating={isGenerating}
        error={summaryError}
      />
    </div>
  )
}