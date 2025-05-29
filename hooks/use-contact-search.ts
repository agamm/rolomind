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
  })

  const { object, submit, isLoading, stop } = useObject({
    api: "/api/query-contacts",
    schema: searchResponseSchema,
    onFinish: ({ object: finalObject, error }) => {
      if (error) {
        console.error("useObject error:", error)
        debugLog?.("error", error, "useObject")
        return
      }
      
      if (finalObject?.matches) {
        setSearchState(prev => ({
          ...prev,
          matches: finalObject.matches,
          isActive: false,
        }))
      }
    },
    onError: (error) => {
      console.error("useObject error:", error)
      debugLog?.("error", error, "useObject")
      setSearchState(prev => ({ ...prev, isActive: false }))
    },
  })

  // Handle reset
  const handleReset = useCallback(() => {
    stop()
    setSearchState({
      query: "",
      matches: [],
      isActive: false,
    })
  }, [stop])

  // Update search state when object changes
  useEffect(() => {
    if (object?.matches) {
      const validMatches = object.matches.filter((match): match is AIMatch => 
        Boolean(match?.contactId && match?.reason)
      )
      
      setSearchState(prev => ({
        ...prev,
        matches: validMatches,
      }))
    }
  }, [object])

  // Get filtered contacts based on current matches
  const getFilteredContacts = useCallback(() => {
    if (!searchState.isActive || searchState.matches.length === 0) {
      return []
    }

    return contacts.filter(contact => 
      searchState.matches.some(match => 
        match.contactId.toLowerCase() === contact.id.toLowerCase()
      )
    )
  }, [contacts, searchState.isActive, searchState.matches])

  // Handle AI search (first 500 contacts only)
  const handleAiSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      handleReset()
      return
    }
    
    setSearchState({
      query,
      matches: [],
      isActive: true,
    })

    try {
      const contactsToSearch = contacts.slice(0, 500)
      await submit({ query, contacts: contactsToSearch })
    } catch (error) {
      console.error("Search error:", error)
      debugLog?.("error", error, "search")
      setSearchState(prev => ({ ...prev, isActive: false }))
    }
  }, [contacts, submit, debugLog, handleReset])

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
    isSearching: isLoading || searchState.isActive,
    filteredContacts: getFilteredContacts(),
    handleAiSearch,
    handleReset,
    handleClearAiSearch: handleReset,
    getAiReason,
    getFinalSummary: () => null, // Removed summary functionality
    hasSummary: () => false, // Removed summary functionality
  }
}
