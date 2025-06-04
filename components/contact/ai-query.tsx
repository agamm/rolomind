"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Contact } from "@/types/contact"
import { Loader2, Sparkles } from "lucide-react"
import { useSummaryGeneration } from "@/hooks/use-summary-generation"
import { useAIQuery } from "@/hooks/use-ai-query"
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


export function AIQuery({ contacts, onResults }: AIQueryProps) {
  const [query, setQuery] = useState("")
  const [enableSummary, setEnableSummary] = useState(false)
  const { summary, isGenerating, error: summaryError, generateSummary, reset: resetSummary } = useSummaryGeneration()
  
  const {
    searchContacts,
    isSearching,
    error,
    results,
    progress,
    reset: resetQuery
  } = useAIQuery({ 
    contacts, 
    onResults: (results) => {
      onResults?.(results)
      if (results.length > 0 && enableSummary) {
        generateSummary(results, query)
      }
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    resetSummary()
    searchContacts(query)
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

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error.message}</p>
        </div>
      )}

      {isSearching && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-700" />
              <span className="text-sm font-medium text-blue-900">
                Querying contacts in batches...
              </span>
            </div>
            <span className="text-sm text-blue-700">
              {progress.percent}% ({progress.completed} of {progress.total} complete)
            </span>
          </div>
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
        </div>
      )}

      {!isSearching && results.length > 0 && (
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