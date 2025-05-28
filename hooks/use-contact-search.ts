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
  const [isStreamComplete, setIsStreamComplete] = useState(true)
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
      setIsStreamComplete(false)
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

        debugLog?.("state", `Sending ${contacts.length} contacts to API`, "handleAiSearch")

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
        let chunksReceived = 0

        debugLog?.("state", "Starting to read stream...", "search")

        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            debugLog?.("state", "Stream reading complete", "search")
            setIsStreamComplete(true)
            break
          }

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

                if (data.type === "error") {
                  debugLog?.("error", `Server error: ${data.error}`, "search")
                  console.error(`AI Search Error: ${data.error}`)
                  
                  // Continue processing other chunks even if one fails
                  continue
                }

                if (data.type === "matches" && data.matches) {
                  chunksReceived++
                  debugLog?.("state", `Received chunk ${data.chunkIndex + 1}/${data.totalChunks} with ${data.matches.length} matches`, "search")

                  // Add new matches
                  data.matches.forEach((match: AIMatch) => {
                    if (!allMatches.some((m) => m.contactId === match.contactId)) {
                      allMatches.push(match)
                    }
                  })

                  // Find matching contacts - use case-insensitive comparison
                  const matchingContacts = contacts.filter((contact) =>
                    allMatches.some((match) => match.contactId.toLowerCase() === contact.id.toLowerCase()),
                  )

                  debugLog?.("state", `Total unique matches so far: ${allMatches.length}`, "search")
                  
                  // Debug: Log sample IDs to check for mismatches
                  if (allMatches.length > 0 && matchingContacts.length === 0) {
                    debugLog?.("error", `No contacts found for matches! Sample match ID: ${allMatches[0].contactId}, Sample contact ID: ${contacts[0]?.id}`, "search")
                  }

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

        debugLog?.("state", `Search completed with ${allMatches.length} total matches from ${chunksReceived} chunks`, "search")
        setIsStreamComplete(true)
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          debugLog?.("state", "Search aborted", "search")
          setIsStreamComplete(true)
          return
        }
        debugLog?.("error", error, "search")

        setAiSearchState({
          query,
          results: [],
          matches: [],
          isActive: true,
        })
        setIsStreamComplete(true)
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
    setIsStreamComplete(true)
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
    setIsStreamComplete(true)
  }, [debugLog])

  // Get AI reason for a contact
  const getAiReason = useCallback(
    (contactId: string) => {
      if (!aiSearchState.isActive) return undefined
      const match = aiSearchState.matches.find((m) => m.contactId.toLowerCase() === contactId.toLowerCase())
      const reason = match?.reason
      
      return reason
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

  // Get filtered contacts based on AI search - use case-insensitive comparison
  const aiFilteredContacts = aiSearchState.isActive
    ? contacts.filter((contact) => displayedMatches.some(matchId => matchId.toLowerCase() === contact.id.toLowerCase()))
    : contacts

  return {
    aiSearchState,
    isSearching: isSearching || !isStreamComplete,
    isProcessingChunks: false, // No longer used but keeping for compatibility
    displayedMatches,
    aiFilteredContacts,
    handleAiSearch,
    handleReset,
    handleClearAiSearch,
    getAiReason,
  }
}
