"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import type { Contact } from "@/types/contact"

interface AIMatch {
  contactId: string
  reason: string
}

interface SearchState {
  query: string
  matches: AIMatch[]
  isActive: boolean
  summaries: string[]
  finalSummary: string | null
}

export function useContactSearch(contacts: Contact[], debugLog?: (type: "raw" | "parsed" | "error" | "state", data: unknown, source?: string) => void) {
  const [searchState, setSearchState] = useState<SearchState>({
    query: "",
    matches: [],
    isActive: false,
    summaries: [],
    finalSummary: null,
  })
  const [isSearching, setIsSearching] = useState(false)

  // Ref to track abort controller for fetch request
  const abortControllerRef = useRef<AbortController | null>(null)

  // Get filtered contacts based on current matches
  const getFilteredContacts = useCallback(() => {
    if (!searchState.isActive) {
      return contacts
    }
    
    if (searchState.matches.length === 0) {
      return []
    }

    // Debug: Check if contacts is empty
    if (contacts.length === 0) {
      console.error("getFilteredContacts: No contacts available to filter!")
      return []
    }

    const filtered = contacts.filter(contact => 
      searchState.matches.some(match => 
        match.contactId.toLowerCase() === contact.id.toLowerCase()
      )
    )

    // Temporary debug logging
    if (searchState.matches.length > 0 && filtered.length === 0) {
      console.log("DEBUG: No contacts matched!")
      console.log("Sample match ID:", searchState.matches[0]?.contactId)
      console.log("Sample contact ID:", contacts[0]?.id)
      console.log("Total matches:", searchState.matches.length)
      console.log("Total contacts:", contacts.length)
    }

    return filtered
  }, [contacts, searchState.isActive, searchState.matches])

  // Handle AI search
  const handleAiSearch = useCallback(
    async (query: string) => {
      // Cancel any ongoing search
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      setIsSearching(true)
      setSearchState({
        query,
        isActive: true,
        matches: [],
        summaries: [],
        finalSummary: null,
      })

      try {
        const controller = new AbortController()
        abortControllerRef.current = controller

        const response = await fetch("/api/query-contacts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, contacts }),
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        if (!response.body) {
          throw new Error("Response body is null")
        }

        // Process the stream
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ""
        const allMatches: AIMatch[] = []
        const allSummaries: string[] = []

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const messages = buffer.split("\n\n")
          buffer = messages.pop() || ""

          for (const message of messages) {
            if (!message.startsWith("data: ")) continue
            
            // Log raw SSE message
            debugLog?.("raw", message, "server")
            
            try {
              const data = JSON.parse(message.slice(6))
              
              if (data.type === "matches" && data.matches) {
                // Add new matches
                data.matches.forEach((match: AIMatch) => {
                  if (!allMatches.some(m => m.contactId === match.contactId)) {
                    allMatches.push(match)
                    console.log("Added match:", match.contactId, "Reason:", match.reason)
                  }
                })

                // Update state with new matches
                setSearchState(prev => {
                  console.log("Updating search state with", allMatches.length, "matches")
                  return {
                    ...prev,
                    matches: [...allMatches],
                  }
                })
              }

              if (data.type === "summary" && data.summary) {
                allSummaries.push(data.summary)
                setSearchState(prev => ({
                  ...prev,
                  summaries: [...allSummaries],
                }))
              }
            } catch (e) {
              console.error("Error parsing message:", e)
            }
          }
        }

        // Merge summaries if we have any
        if (allSummaries.length > 0) {
          try {
            const mergeResponse = await fetch("/api/merge-summaries", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ query, summaries: allSummaries }),
            })
            
            if (mergeResponse.ok) {
              const result = await mergeResponse.json()
              if (result.success && result.summary) {
                setSearchState(prev => ({
                  ...prev,
                  finalSummary: result.summary,
                }))
              }
            }
          } catch (error) {
            console.error("Error merging summaries:", error)
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Search error:", error)
        }
      } finally {
        setIsSearching(false)
      }
    },
    [contacts, debugLog],
  )

  // Handle reset
  const handleReset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    setSearchState({
      query: "",
      matches: [],
      isActive: false,
      summaries: [],
      finalSummary: null,
    })
    setIsSearching(false)
  }, [])

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    searchState,
    isSearching,
    filteredContacts: getFilteredContacts(),
    handleAiSearch,
    handleReset,
    handleClearAiSearch: handleReset,
    getAiReason,
    getFinalSummary: () => searchState.finalSummary,
    hasSummary: () => searchState.isActive && (searchState.summaries.length > 0 || searchState.finalSummary !== null),
  }
}
