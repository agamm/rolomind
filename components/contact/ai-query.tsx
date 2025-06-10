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
              placeholder="e.g., 'CEOs in Israel', 'software engineers at startups'"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isSearching}
              className="flex-1 soft-input"
            />
            {query.trim() && (
              <button 
                type="submit" 
                disabled={isSearching || contacts.length === 0}
                className="warm-button whitespace-nowrap px-6 h-[50px] flex items-center justify-center"
              >
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Searching
                </>
              ) : (
                'Search'
              )}
              </button>
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
          
          {contacts.length === 0 && (
            <p className="text-sm text-white/80">
              Import contacts to use AI search.
            </p>
          )}
        </form>
      </div>

      {error && error.message !== 'Search aborted' && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4">
          <p className="text-destructive">{error.message}</p>
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

      {!isSearching && !isProcessingResults && results.length > 0 && (
        <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', borderColor: 'rgba(139, 92, 246, 0.3)', borderWidth: '1px', borderStyle: 'solid' }}>
          <p className="text-primary font-semibold">
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