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
}

export function AIQuery({ contacts }: AIQueryProps) {
  const [query, setQuery] = useState("")
  
  const { data: matches, isLoading, error, start, reset } = useJsonStream<ContactMatch>()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim() && contacts.length > 0) {
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
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            AI Search Results ({matchedContacts.length} matches)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {matchedContacts.map(({ contact, reason }, index) => (
              <div 
                key={contact.id} 
                className="animate-fade-in opacity-0"
                style={{
                  animation: `fadeIn 0.5s ease-in-out ${index * 0.1}s forwards`
                }}
              >
                <div className="relative">
                  <ContactCard contact={contact} />
                  <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-800 border border-blue-200">
                    <span className="font-medium">AI Match:</span> {reason}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}