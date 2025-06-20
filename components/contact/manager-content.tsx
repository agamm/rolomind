"use client"

import React from "react"
import { ContactList } from "./list"
import { AIQuery } from "./ai-query"
import { useContacts } from "@/hooks/use-local-contacts"
import { Contact } from "@/types/contact"

export function ContactManagerContent() {
  const [searchQuery, setSearchQuery] = React.useState('')
  const { data: contacts = [], isLoading, error } = useContacts(searchQuery)
  const [aiResults, setAiResults] = React.useState<Array<{ contact: Contact; reason: string }> | undefined>()
  const [isAISearching, setIsAISearching] = React.useState(false)
  const [isProcessing, setIsProcessing] = React.useState(false)

  const handleAiResults = React.useCallback((results: Array<{ contact: Contact; reason: string }>) => {
    setAiResults(results)
  }, [])

  if (error) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-red-600 mb-2">Error loading contacts</h1>
        <p className="text-gray-600">{error instanceof Error ? error.message : "Unknown error"}</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg text-gray-600">Loading contacts...</div>
      </div>
    )
  }

  return (
    <>
      <AIQuery 
        contacts={contacts} 
        onResults={handleAiResults}
        onSearchingChange={setIsAISearching}
        onProcessingChange={setIsProcessing}
        onReset={() => setAiResults(undefined)}
      />
      <ContactList
        contacts={contacts}
        aiResults={aiResults}
        isAISearching={isAISearching || isProcessing}
        onSearch={setSearchQuery}
        onResetAISearch={() => setAiResults(undefined)}
      />
    </>
  )
}