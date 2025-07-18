"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Contact } from "@/types/contact"
import { Loader2, Sparkles, X } from "lucide-react"
import { useSummaryGeneration } from "@/hooks/use-summary-generation"
import { useAIQuery } from "@/hooks/use-ai-query"
import { useResultsProcessing } from "@/hooks/use-results-processing"
import { SummaryDisplay } from "./summary-display"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface ContactMatch {
  contact: Contact
  reason: string
}

interface AIQueryProps {
  contacts: Contact[]
  onResults?: (results: ContactMatch[]) => void
  onSearchingChange?: (isSearching: boolean) => void
  onProcessingChange?: (isProcessing: boolean) => void
  onReset?: () => void
  onError?: (error: Error) => void
}


export function AIQuery({ contacts, onResults, onSearchingChange, onProcessingChange, onReset, onError }: AIQueryProps) {
  const [query, setQuery] = useState("")
  const [enableSummary, setEnableSummary] = useState(false)
  const [isStopping, setIsStopping] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [hasSearched, setHasSearched] = useState(false)
  const timerRef = React.useRef<NodeJS.Timeout | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const { summary, isGenerating, error: summaryError, generateSummary, reset: resetSummary } = useSummaryGeneration()
  const { processResults, isProcessing: isProcessingResults, reset: resetProcessing } = useResultsProcessing()
  
  const {
    searchContacts,
    isSearching,
    error,
    results,
    progress,
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
    setHasSearched(true)
    searchContacts(query)
  }
  
  const handleStop = () => {
    setIsStopping(true)
    stopSearch()
    // Reset after a short delay to show feedback
    setTimeout(() => setIsStopping(false), 500)
  }
  
  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

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
  
  // Show toast for errors and reset state
  useEffect(() => {
    if (error && error.message !== 'Search aborted') {
      // Only show toast for non-API key errors since we display those in the UI
      if (!error.message.toLowerCase().includes('api key not configured') && 
          !error.message.toLowerCase().includes('ai service not configured')) {
        toast.error(error.message)
      }
      // Reset timer
      setElapsedSeconds(0)
      // Clear the timer interval
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      // Notify parent component
      onError?.(error)
      // Force searching and processing states to false
      onSearchingChange?.(false)
      onProcessingChange?.(false)
    }
  }, [error, onError, onSearchingChange, onProcessingChange])
  
  // Handle post-processing when search completes
  useEffect(() => {
    if (!isSearching && results.length > 0 && query) {
      // Search just completed, process results
      processResults(query, results).then(processedResults => {
        if (processedResults) {
          // Process results already returns the sorted results with reasons preserved
          onResults?.(processedResults)
          if (enableSummary) {
            generateSummary(processedResults, query)
          }
        }
      })
    }
  }, [isSearching]) // eslint-disable-line react-hooks/exhaustive-deps
  
  // Format elapsed time
  const formatElapsedTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      <div className="ai-search-form fade-in">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 ai-icon" />
          <h2 className="text-xl font-semibold">AI Contact Search</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2 items-center">
            <input
              ref={inputRef}
              placeholder="e.g., 'CEOs in Dallas', 'software engineers at startups'"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                // Reset search state when user modifies the query
                if (hasSearched) {
                  setHasSearched(false)
                  onResults?.([])
                }
              }}
              disabled={isSearching}
              className="flex-1 soft-input"
            />
            {query.trim() && (
              <Button
                type="submit" 
                disabled={isSearching || contacts.length === 0}
                className="h-[42px]"
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
            )}
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
              className="text-sm font-normal cursor-pointer"
            >
              Generate AI summary after search
            </Label>
          </div>
        </form>
      </div>

      {error && error.message !== 'Search aborted' && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4">
          <p className="text-destructive font-medium">{error.message}</p>
          {(error.message.toLowerCase().includes('api key not configured') || 
            error.message.toLowerCase().includes('ai service not configured')) && (
            <div className="mt-3">
              <Button asChild variant="outline" size="sm">
                <a href="/dashboard/ai-keys">
                  Configure API Keys
                </a>
              </Button>
            </div>
          )}
        </div>
      )}

      {(isSearching || isProcessingResults) && (
        <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', borderColor: 'rgba(139, 92, 246, 0.3)', borderWidth: '1px', borderStyle: 'solid' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm font-medium">
                {isProcessingResults ? 'Sorting and cleaning results...' : `Querying contacts in batches... (${formatElapsedTime(elapsedSeconds)})`}
              </span>
            </div>
            {isSearching && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-primary font-medium">
                  {progress.percent}% ({progress.completed} of {progress.total} complete)
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleStop}
                  className="h-7 px-3 cursor-pointer hover:bg-purple-100 hover:text-purple-700"
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
              <div className="relative h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>
                <div 
                  className="h-full bg-primary transition-all duration-300 ease-out"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              {results.length > 0 && (
                <p className="text-sm text-gray-600">
                  Found {results.length} matches so far...
                </p>
              )}
            </>
          )}
        </div>
      )}

      {!isSearching && !isProcessingResults && hasSearched && query && (
        <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', borderColor: 'rgba(139, 92, 246, 0.3)', borderWidth: '1px', borderStyle: 'solid' }}>
          <div className="flex items-center justify-between">
            <p className="text-primary font-semibold">
              {results.length > 0 
                ? `✓ Found ${results.length} matches`
                : '✗ No contacts found matching your search criteria'}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setQuery('')
                setHasSearched(false)
                onReset?.()
              }}
            >
              Reset
            </Button>
          </div>
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