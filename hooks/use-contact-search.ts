"use client"

import { useState, useCallback, useEffect } from "react"
import { experimental_useObject as useObject } from "@ai-sdk/react"
import { z } from "zod"
import type { Contact } from "@/types/contact"

interface AIMatch {
  contactId: string
  reason: string
}

interface SearchState {
  query: string
  matches: AIMatch[]
  isActive: boolean
  finalSummary: string | null
}

// Schema for the streaming response
const searchResponseSchema = z.object({
  matches: z.array(z.object({
    contactId: z.string(),
    reason: z.string(),
  })),
})

export function useContactSearch(contacts: Contact[], debugLog?: (type: "raw" | "parsed" | "error" | "state", data: unknown, source?: string) => void) {
  const [searchState, setSearchState] = useState<SearchState>({
    query: "",
    matches: [],
    isActive: false,
    finalSummary: null,
  })
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)

  // Use useObject for cleaner streaming
  const { object, submit, isLoading, stop } = useObject({
    api: "/api/query-contacts",
    schema: searchResponseSchema,
    onFinish: async ({ object: finalObject, error }) => {
      if (error) {
        console.error("Schema validation error:", error)
        debugLog?.("error", error, "schema-validation")
        return
      }

      if (finalObject && finalObject.matches && finalObject.matches.length > 0) {
        // Generate summary after all contacts are loaded
        setIsGeneratingSummary(true)
        try {
          const foundContacts = contacts.filter(contact => 
            finalObject.matches.some(match => 
              match.contactId.toLowerCase() === contact.id.toLowerCase()
            )
          )

          const response = await fetch("/api/generate-summary", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              query: searchState.query,
              foundContacts 
            }),
          })

          if (response.ok) {
            const { summary } = await response.json()
            setSearchState(prev => ({
              ...prev,
              finalSummary: summary,
            }))
          }
        } catch (error) {
          console.error("Error generating summary:", error)
          debugLog?.("error", error, "summary-generation")
        } finally {
          setIsGeneratingSummary(false)
        }
      }
    },
    onError: (error) => {
      console.error("Search error:", error)
      debugLog?.("error", error, "search")
    },
  })

  // Update search state when object changes
  useEffect(() => {
    if (searchState.isActive && object?.matches) {
      const validMatches = object.matches
        .filter((match): match is AIMatch => 
          match !== undefined && 
          typeof match.contactId === 'string' && 
          typeof match.reason === 'string'
        )
      
      if (validMatches.length !== searchState.matches.length) {
        setSearchState(prev => ({
          ...prev,
          matches: validMatches,
        }))
      }
    }
  }, [object?.matches, searchState.isActive, searchState.matches.length])

  // Get filtered contacts based on current matches
  const getFilteredContacts = useCallback(() => {
    if (!searchState.isActive) {
      return contacts
    }
    
    if (searchState.matches.length === 0) {
      return []
    }

    return contacts.filter(contact => 
      searchState.matches.some(match => 
        match.contactId.toLowerCase() === contact.id.toLowerCase()
      )
    )
  }, [contacts, searchState.isActive, searchState.matches])

  // Handle AI search
  const handleAiSearch = useCallback(
    async (query: string) => {
      setSearchState({
        query,
        isActive: true,
        matches: [],
        finalSummary: null,
      })

      // Submit the search with contacts
      submit({ query, contacts })
    },
    [contacts, submit],
  )

  // Handle reset
  const handleReset = useCallback(() => {
    stop()
    setSearchState({
      query: "",
      matches: [],
      isActive: false,
      finalSummary: null,
    })
  }, [stop])

  // Get AI reason for a contact
  const getAiReason = useCallback(
    (contactId: string) => {
      const match = searchState.matches.find(m => 
        m.contactId.toLowerCase() === contactId.toLowerCase()
      )
      return match?.reason
    },
    [searchState.matches],
  )

  return {
    searchState,
    isSearching: isLoading || isGeneratingSummary,
    filteredContacts: getFilteredContacts(),
    handleAiSearch,
    handleReset,
    handleClearAiSearch: handleReset,
    getAiReason,
    getFinalSummary: () => searchState.finalSummary,
    hasSummary: () => searchState.isActive && searchState.finalSummary !== null,
  }
}
