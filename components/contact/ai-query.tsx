"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ContactCard } from "./card"
import { Contact } from "@/types/contact"
import { Loader2, Sparkles } from "lucide-react"
import { useJsonStream } from "@/hooks/use-json-stream"

interface ContactMatch {
  id: string
  reason: string
}

interface AIQueryProps {
  contacts: Contact[]
  onResults?: (results: Array<{ contact: Contact; reason: string }>) => void
}

export function AIQuery({ contacts, onResults }: AIQueryProps) {
  const [query, setQuery] = useState("")
  
  const { data: matches, isLoading, error, start, reset } = useJsonStream<ContactMatch>()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim() && contacts.length > 0) {
      // Clear previous results when starting new search
      onResults?.([])
      start('/api/query-contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query.trim(), contacts })
      })
    }
  }

  const matchedContacts = matches.map(match => {
    const contact = contacts.find(c => c.id === match.id)
    return contact ? { contact, reason: match.reason } : null
  }).filter(Boolean)

  // Call onResults whenever matches change
  React.useEffect(() => {
    if (matches.length > 0) {
      const results = matches.map(match => {
        const contact = contacts.find(c => c.id === match.id)
        return contact ? { contact, reason: match.reason } : null
      }).filter(Boolean)
      
      if (results.length > 0) {
        onResults?.(results)
      }
    }
  }, [matches, contacts, onResults])

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
              placeholder="e.g., 'CEOs in Israel', 'software engineers at startups', 'VCs in fintech'"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              type="submit" 
              disabled={isLoading || !query.trim() || contacts.length === 0}
              className="min-w-[100px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Searching...
                </>
              ) : (
                'Search'
              )}
            </Button>
          </div>
          
          {contacts.length === 0 && (
            <p className="text-sm text-gray-500">
              No contacts available. Import some contacts first to use AI search.
            </p>
          )}
          
          {contacts.length > 500 && (
            <p className="text-sm text-amber-600">
              Note: Only the first 500 contacts will be searched to stay within AI limits.
            </p>
          )}
        </form>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error.message}</p>
        </div>
      )}

      {isLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            <div>
              <p className="font-medium text-blue-900">AI is analyzing your contacts...</p>
              <p className="text-sm text-blue-700">Results will stream in as they're found</p>
            </div>
          </div>
        </div>
      )}

      {matchedContacts.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <p className="font-medium text-blue-900">
              Found {matchedContacts.length} AI matches - results shown in contact list below
            </p>
          </div>
        </div>
      )}
    </div>
  )
}