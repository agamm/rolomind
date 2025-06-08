"use client"

import React, { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Contact } from "@/types/contact"
import { Loader2, Sparkles, X } from "lucide-react"
import { useSummaryGeneration } from "@/hooks/use-summary-generation"
import { useAIQuery } from "@/hooks/use-ai-query"
import { useResultsProcessing } from "@/hooks/use-results-processing"
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
  onSearchingChange?: (isSearching: boolean) => void
  onProcessingChange?: (isProcessing: boolean) => void
}


export function AIQuery({ contacts, onResults, onSearchingChange, onProcessingChange }: AIQueryProps) {
  const [query, setQuery] = useState("")
  const [enableSummary, setEnableSummary] = useState(false)
  const [isStopping, setIsStopping] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const timerRef = React.useRef<NodeJS.Timeout | null>(null)
  const { summary, isGenerating, error: summaryError, generateSummary, reset: resetSummary } = useSummaryGeneration()
  const { processResults, isProcessing: isProcessingResults, reset: resetProcessing } = useResultsProcessing()
  
  const {
    searchContacts,
    isSearching,
    error,
    results,
    progress,
    reset: resetQuery,
    stopSearch
  } = useAIQuery({ 
    contacts, 
    onResults: (results) => {
      // While searching, show results as they come in
      onResults?.(results)
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    resetSummary()
    resetProcessing()
    setIsStopping(false)
    setElapsedSeconds(0)
    searchContacts(query)
  }
  
  const handleStop = () => {
    setIsStopping(true)
    stopSearch()
    // Reset after a short delay to show feedback
    setTimeout(() => setIsStopping(false), 500)
  }
  
  // Timer effect
  useEffect(() => {
    if (isSearching) {
      // Start timer
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1)
      }, 1000)
    } else {
      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isSearching])
  
  // Notify parent component of searching state changes
  useEffect(() => {
    onSearchingChange?.(isSearching)
  }, [isSearching, onSearchingChange])
  
  // Notify parent component of processing state changes
  useEffect(() => {
    onProcessingChange?.(isProcessingResults)
  }, [isProcessingResults, onProcessingChange])
  
  // Handle post-processing when search completes
  useEffect(() => {
    if (!isSearching && results.length > 0 && query) {
      // Search just completed, process results
      processResults(query, results).then(processedResults => {
        if (processedResults) {
          onResults?.(processedResults)
          if (enableSummary) {
            generateSummary(processedResults, query)
          }
        }
      })
    }
  }, [isSearching]) // Only trigger when isSearching changes
  
  // Format elapsed time
  const formatElapsedTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

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
              disabled={isSearching}
              className="flex-1"
            />
            <Button 
              type="submit" 
              disabled={isSearching || !query.trim() || contacts.length === 0}
            >
              {isSearching ? (
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
              disabled={isSearching}
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

      {error && error.message !== 'Search aborted' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error.message}</p>
        </div>
      )}

      {(isSearching || isProcessingResults) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-700" />
              <span className="text-sm font-medium text-blue-900">
                {isProcessingResults ? 'Sorting and cleaning results...' : `Querying contacts in batches... (${formatElapsedTime(elapsedSeconds)})`}
              </span>
            </div>
            {isSearching && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-blue-700">
                  {progress.percent}% ({progress.completed} of {progress.total} complete)
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStop}
                  className="h-7 px-3 cursor-pointer hover:bg-gray-100"
                  type="button"
                  disabled={isStopping}
                >
                  {isStopping ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                      Stopping...
                    </>
                  ) : (
                    <>
                      <X className="h-3.5 w-3.5 mr-1" />
                      Stop
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
          {isSearching && (
            <>
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-blue-200">
                <div 
                  className="h-full bg-blue-600 transition-all duration-300 ease-out"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              {results.length > 0 && (
                <p className="text-sm text-blue-700">
                  Found {results.length} matches so far...
                </p>
              )}
            </>
          )}
        </div>
      )}

      {!isSearching && !isProcessingResults && results.length > 0 && (
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