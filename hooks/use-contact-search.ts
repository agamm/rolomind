"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import type { Contact } from "@/types/contact"

interface AIMatch {
  contactId: string
  reason: string
}

interface SearchState {
  query: string
  results: Contact[]
  matches: AIMatch[]
  isActive: boolean
}

export function useContactSearch(contacts: Contact[], debugLog?: (type: "raw" | "parsed" | "error" | "state", data: unknown, source?: string) => void) {
  const [aiSearchState, setAiSearchState] = useState<SearchState>({
    query: "",
    results: [],
    matches: [],
    isActive: false,
  })
  const [isSearching, setIsSearching] = useState(false)
  const [displayedMatches, setDisplayedMatches] = useState<string[]>([])

  // Ref to track abort controller for fetch request
  const abortControllerRef = useRef<AbortController | null>(null)

  // Simple AI search - no chunking
  const handleAiSearch = useCallback(
    async (query: string) => {
      debugLog?.("state", `Starting AI search for: "${query}"`, "handleAiSearch")

      // Cancel any ongoing search
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        abortControllerRef.current.abort()
      }

      setIsSearching(true)
      setDisplayedMatches([])

      setAiSearchState({
        query,
        isActive: true,
        results: [],
        matches: [],
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

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const rawChunk = decoder.decode(value, { stream: true })
          buffer += rawChunk
          const messages = buffer.split("\n\n")
          buffer = messages.pop() || ""

          for (const message of messages) {
            if (message.startsWith("data: ")) {
              const rawData = message.slice(6)
              debugLog?.("raw", `SSE message: ${rawData}`, "search")

              try {
                const data = JSON.parse(rawData)
                debugLog?.("parsed", data, "search")

                if (data.type === "matches" && data.matches) {
                  // Add new matches
                  data.matches.forEach((match: AIMatch) => {
                    if (!allMatches.some((m) => m.contactId === match.contactId)) {
                      allMatches.push(match)
                    }
                  })

                  // Find matching contacts
                  const matchingContacts = contacts.filter((contact) =>
                    allMatches.some((match) => match.contactId === contact.id),
                  )

                  // Update state
                  setAiSearchState((prev) => ({
                    ...prev,
                    results: matchingContacts,
                    matches: allMatches,
                  }))

                  // Update displayed matches for streaming effect
                  setDisplayedMatches(allMatches.map(m => m.contactId))
                }
              } catch (e) {
                debugLog?.("error", `Error parsing SSE message: ${e}`, "search")
              }
            }
          }
        }

        debugLog?.("state", `Search completed with ${allMatches.length} total matches`, "search")
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          debugLog?.("state", "Search aborted", "search")
          return
        }
        debugLog?.("error", error, "search")

        setAiSearchState({
          query,
          results: [],
          matches: [],
          isActive: true,
        })
      } finally {
        setIsSearching(false)
      }
    },
    [contacts, debugLog],
  )

  // Handle reset
  const handleReset = useCallback(() => {
    debugLog?.("state", "Resetting search", "handleReset")

    // Cancel any ongoing search
    if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
      abortControllerRef.current.abort()
    }

    setAiSearchState({
      query: "",
      results: [],
      matches: [],
      isActive: false,
    })

    setDisplayedMatches([])
    setIsSearching(false)
  }, [debugLog])

  // Clear AI search only
  const handleClearAiSearch = useCallback(() => {
    debugLog?.("state", "Clearing AI search", "handleClearAiSearch")

    // Cancel any ongoing search
    if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
      abortControllerRef.current.abort()
    }

    setAiSearchState({
      query: "",
      results: [],
      matches: [],
      isActive: false,
    })
    setDisplayedMatches([])
    setIsSearching(false)
  }, [debugLog])

  // Get AI reason for a contact
  const getAiReason = useCallback(
    (contactId: string) => {
      if (!aiSearchState.isActive) return undefined
      const match = aiSearchState.matches.find((m) => m.contactId === contactId)
      return match?.reason
    },
    [aiSearchState.isActive, aiSearchState.matches],
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Get filtered contacts based on AI search
  const aiFilteredContacts = aiSearchState.isActive
    ? contacts.filter((contact) => displayedMatches.includes(contact.id))
    : contacts

  return {
    aiSearchState,
    isSearching,
    isProcessingChunks: false, // No longer used but keeping for compatibility
    displayedMatches,
    aiFilteredContacts,
    handleAiSearch,
    handleReset,
    handleClearAiSearch,
    getAiReason,
  }
}
